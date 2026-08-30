"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DataChannelControlMessage,
  FileMetadata,
  PeerSignal,
  RoomCredential,
  ServerSignalMessage,
  TransferRole,
} from "../types";

const CHUNK_SIZE = 64 * 1024;
const MAX_BUFFERED_BYTES = 4 * 1024 * 1024;
const BUFFER_LOW_BYTES = 1024 * 1024;

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export type TransferPhase =
  | "connecting"
  | "waiting"
  | "negotiating"
  | "ready"
  | "transferring"
  | "confirming"
  | "complete"
  | "unavailable"
  | "expired"
  | "error";

type UseFileTransferOptions = {
  credential: RoomCredential;
  role: TransferRole;
  file?: File;
};

function toMetadata(file: File): FileMetadata {
  return {
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    lastModified: file.lastModified,
  };
}

function parseControlMessage(value: string): DataChannelControlMessage | null {
  try {
    const parsed = JSON.parse(value) as DataChannelControlMessage;
    return parsed && typeof parsed === "object" && "type" in parsed
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function waitForBuffer(channel: RTCDataChannel): Promise<void> {
  if (channel.bufferedAmount <= MAX_BUFFERED_BYTES) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const onLow = () => {
      cleanup();
      resolve();
    };
    const onClose = () => {
      cleanup();
      reject(new Error("직접 연결이 끊어졌습니다."));
    };
    const cleanup = () => {
      channel.removeEventListener("bufferedamountlow", onLow);
      channel.removeEventListener("close", onClose);
    };

    channel.addEventListener("bufferedamountlow", onLow, { once: true });
    channel.addEventListener("close", onClose, { once: true });
  });
}

export function useFileTransfer({
  credential,
  role,
  file,
}: UseFileTransferOptions) {
  const [phase, setPhase] = useState<TransferPhase>("connecting");
  const [progress, setProgress] = useState(0);
  const [metadata, setMetadata] = useState<FileMetadata | null>(
    file ? toMetadata(file) : null,
  );
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const sendSignalRef = useRef<(signal: PeerSignal) => void>(() => {});
  const startOfferRef = useRef<() => Promise<void>>(async () => {});
  const metadataRef = useRef<FileMetadata | null>(metadata);
  const chunksRef = useRef<ArrayBuffer[]>([]);
  const receivedBytesRef = useRef(0);
  const lastProgressAtRef = useRef(0);
  const stoppedRef = useRef(false);
  const phaseRef = useRef<TransferPhase>(phase);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  const fail = useCallback((message: string) => {
    setError(message);
    setPhase("error");
  }, []);

  useEffect(() => {
    stoppedRef.current = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let expirationTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    let offerStarted = false;
    let pendingCandidates: RTCIceCandidateInit[] = [];

    const clearPeer = () => {
      channelRef.current?.close();
      peerRef.current?.close();
      channelRef.current = null;
      peerRef.current = null;
      offerStarted = false;
      pendingCandidates = [];
    };

    const sendSignal = (signal: PeerSignal) => {
      const socket = socketRef.current;
      if (socket?.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ type: "signal", payload: signal }));
    };
    sendSignalRef.current = sendSignal;

    const updateReceiveProgress = (received: number, total: number) => {
      const now = performance.now();
      if (now - lastProgressAtRef.current < 80 && received < total) return;
      lastProgressAtRef.current = now;
      setProgress(total > 0 ? Math.min(100, (received / total) * 100) : 100);
    };

    const handleControl = (channel: RTCDataChannel, raw: string) => {
      const message = parseControlMessage(raw);
      if (!message) return;

      switch (message.type) {
        case "meta":
          if (role !== "receiver") return;
          chunksRef.current = [];
          receivedBytesRef.current = 0;
          setProgress(0);
          setMetadata(message.file);
          metadataRef.current = message.file;
          setPhase("ready");
          break;
        case "complete": {
          if (role !== "receiver") return;
          const receivedFile = metadataRef.current;
          if (!receivedFile || receivedBytesRef.current !== receivedFile.size) {
            fail("파일 일부가 도착하지 않았습니다. 새 링크로 다시 시도해 주세요.");
            return;
          }

          const blob = new Blob(chunksRef.current, { type: receivedFile.type });
          chunksRef.current = [];
          setDownloadUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return URL.createObjectURL(blob);
          });
          setProgress(100);
          setPhase("complete");
          channel.send(JSON.stringify({ type: "received" } satisfies DataChannelControlMessage));
          setTimeout(() => socketRef.current?.close(1000, "Transfer complete"), 250);
          break;
        }
        case "received":
          if (role !== "sender") return;
          setProgress(100);
          setPhase("complete");
          stoppedRef.current = true;
          setTimeout(() => {
            socketRef.current?.close(1000, "Transfer complete");
            channel.close();
            peerRef.current?.close();
          }, 250);
          break;
        case "cancel":
          fail(message.message || "상대방이 전송을 취소했습니다.");
          break;
      }
    };

    const attachChannel = (channel: RTCDataChannel) => {
      channelRef.current = channel;
      channel.binaryType = "arraybuffer";
      channel.bufferedAmountLowThreshold = BUFFER_LOW_BYTES;

      channel.addEventListener("open", () => {
        setError(null);
        if (role === "sender" && file) {
          const fileMetadata = toMetadata(file);
          metadataRef.current = fileMetadata;
          setMetadata(fileMetadata);
          channel.send(
            JSON.stringify({
              type: "meta",
              file: fileMetadata,
            } satisfies DataChannelControlMessage),
          );
          setPhase("ready");
        } else {
          setPhase("negotiating");
        }
      });

      channel.addEventListener("message", (event) => {
        if (typeof event.data === "string") {
          handleControl(channel, event.data);
          return;
        }

        if (role !== "receiver") return;
        const chunk = event.data as ArrayBuffer;
        chunksRef.current.push(chunk);
        receivedBytesRef.current += chunk.byteLength;
        setPhase("transferring");
        updateReceiveProgress(
          receivedBytesRef.current,
          metadataRef.current?.size ?? 0,
        );
      });

      channel.addEventListener("close", () => {
        if (
          !stoppedRef.current &&
          phaseRef.current !== "complete" &&
          phaseRef.current !== "expired"
        ) {
          fail("직접 연결이 끊어졌습니다. 새 링크로 다시 시도해 주세요.");
        }
      });

      channel.addEventListener("error", () => {
        fail("파일 전송 연결에서 오류가 발생했습니다.");
      });
    };

    const createPeer = () => {
      clearPeer();
      const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerRef.current = peer;

      peer.addEventListener("icecandidate", (event) => {
        if (!event.candidate) return;
        sendSignal({
          kind: "ice-candidate",
          candidate: event.candidate.toJSON(),
        });
      });

      peer.addEventListener("connectionstatechange", () => {
        if (peer.connectionState === "failed") {
          fail("직접 연결에 실패했습니다. 다른 네트워크에서 다시 시도해 주세요.");
        }
      });

      if (role === "receiver") {
        peer.addEventListener("datachannel", (event) => attachChannel(event.channel));
      }

      return peer;
    };

    const flushCandidates = async (peer: RTCPeerConnection) => {
      const candidates = pendingCandidates;
      pendingCandidates = [];
      for (const candidate of candidates) {
        await peer.addIceCandidate(candidate);
      }
    };

    const startOffer = async () => {
      if (role !== "sender" || offerStarted) return;
      offerStarted = true;
      setPhase("negotiating");

      try {
        const peer = createPeer();
        offerStarted = true;
        const channel = peer.createDataChannel("lightlink-file", {
          ordered: true,
        });
        attachChannel(channel);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        sendSignal({ kind: "offer", description: offer });
      } catch {
        offerStarted = false;
        fail("직접 연결을 준비하지 못했습니다. 다시 시도해 주세요.");
      }
    };
    startOfferRef.current = startOffer;

    const handlePeerSignal = async (signal: PeerSignal) => {
      try {
        if (signal.kind === "offer" && role === "receiver") {
          setPhase("negotiating");
          const peer = createPeer();
          await peer.setRemoteDescription(signal.description);
          await flushCandidates(peer);
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          sendSignal({ kind: "answer", description: answer });
          return;
        }

        if (signal.kind === "answer" && role === "sender") {
          const peer = peerRef.current;
          if (!peer) return;
          await peer.setRemoteDescription(signal.description);
          await flushCandidates(peer);
          return;
        }

        if (signal.kind === "ice-candidate") {
          const peer = peerRef.current;
          if (!peer?.remoteDescription) {
            pendingCandidates.push(signal.candidate);
            return;
          }
          await peer.addIceCandidate(signal.candidate);
        }
      } catch {
        fail("브라우저 간 연결 협상에 실패했습니다.");
      }
    };

    const connect = () => {
      if (stoppedRef.current || Date.now() >= credential.expiresAt * 1000) {
        setPhase("expired");
        return;
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const params = new URLSearchParams({
        room: credential.roomId,
        exp: String(credential.expiresAt),
        sig: credential.signature,
        role,
      });
      const socket = new WebSocket(
        `${protocol}//${window.location.host}/api/file-transfer/ws?${params}`,
      );
      socketRef.current = socket;
      setPhase((current) =>
        current === "connecting" || current === "waiting" ? "connecting" : current,
      );

      socket.addEventListener("open", () => {
        reconnectAttempts = 0;
        setError(null);
        setPhase((current) =>
          current === "connecting" ? "waiting" : current,
        );
        heartbeatTimer = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, 20_000);
      });

      socket.addEventListener("message", (event) => {
        let message: ServerSignalMessage;
        try {
          message = JSON.parse(String(event.data)) as ServerSignalMessage;
        } catch {
          return;
        }

        switch (message.type) {
          case "peer-ready":
            if (role === "sender") void startOfferRef.current();
            else setPhase("negotiating");
            break;
          case "peer-left":
            if (channelRef.current?.readyState === "open") return;
            clearPeer();
            if (role === "sender") {
              setError(null);
              setPhase("waiting");
            } else {
              setPhase("unavailable");
            }
            break;
          case "signal":
            void handlePeerSignal(message.payload);
            break;
          case "error":
            setError(message.message);
            setPhase(message.code === "expired" ? "expired" : "error");
            break;
        }
      });

      socket.addEventListener("close", (event) => {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (socketRef.current === socket) socketRef.current = null;

        if (
          stoppedRef.current ||
          channelRef.current?.readyState === "open" ||
          phaseRef.current === "complete" ||
          phaseRef.current === "expired"
        ) {
          return;
        }
        if (event.code === 4401 || Date.now() >= credential.expiresAt * 1000) {
          setPhase("expired");
          return;
        }
        if (event.code === 4409) {
          fail("이 링크가 이미 다른 창에서 열려 있습니다.");
          return;
        }

        reconnectAttempts += 1;
        const delay = Math.min(8_000, 600 * 2 ** (reconnectAttempts - 1));
        reconnectTimer = setTimeout(connect, delay);
      });

      socket.addEventListener("error", () => {
        socket.close();
      });
    };

    const expiresIn = Math.max(0, credential.expiresAt * 1000 - Date.now());
    expirationTimer = setTimeout(() => {
      stoppedRef.current = true;
      setPhase("expired");
      socketRef.current?.close(4401, "Transfer expired");
      channelRef.current?.close();
      peerRef.current?.close();
    }, expiresIn);

    connect();

    return () => {
      stoppedRef.current = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (expirationTimer) clearTimeout(expirationTimer);
      socketRef.current?.close();
      socketRef.current = null;
      clearPeer();
      chunksRef.current = [];
    };
  }, [credential, fail, file, role]);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const sendFile = useCallback(async () => {
    const channel = channelRef.current;
    if (!file || channel?.readyState !== "open") {
      fail("상대방과 연결된 뒤 다시 시도해 주세요.");
      return;
    }

    const fileMetadata = toMetadata(file);
    setError(null);
    setProgress(0);
    setPhase("transferring");
    channel.send(
      JSON.stringify({
        type: "meta",
        file: fileMetadata,
      } satisfies DataChannelControlMessage),
    );

    try {
      let offset = 0;
      while (offset < file.size) {
        if (stoppedRef.current || channel.readyState !== "open") {
          throw new Error("직접 연결이 끊어졌습니다.");
        }
        await waitForBuffer(channel);
        const nextOffset = Math.min(offset + CHUNK_SIZE, file.size);
        const chunk = await file.slice(offset, nextOffset).arrayBuffer();
        channel.send(chunk);
        offset = nextOffset;
        setProgress(file.size > 0 ? (offset / file.size) * 100 : 100);
      }

      channel.send(JSON.stringify({ type: "complete" } satisfies DataChannelControlMessage));
      setPhase("confirming");
    } catch (caughtError) {
      if (Date.now() >= credential.expiresAt * 1000) {
        setPhase("expired");
        return;
      }
      fail(
        caughtError instanceof Error
          ? caughtError.message
          : "파일을 보내는 중 오류가 발생했습니다.",
      );
    }
  }, [credential.expiresAt, fail, file]);

  const download = useCallback(() => {
    if (!downloadUrl || !metadataRef.current) return;
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = metadataRef.current.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }, [downloadUrl]);

  const close = useCallback(() => {
    stoppedRef.current = true;
    socketRef.current?.close();
    channelRef.current?.close();
    peerRef.current?.close();
  }, []);

  return {
    phase,
    progress,
    metadata,
    error,
    canSend: role === "sender" && phase === "ready",
    canDownload: role === "receiver" && phase === "complete" && !!downloadUrl,
    sendFile,
    download,
    close,
  };
}
