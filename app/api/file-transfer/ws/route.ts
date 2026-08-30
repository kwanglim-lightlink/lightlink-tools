import {
  experimental_upgradeWebSocket,
  type WebSocketData,
} from "@vercel/functions";
import type { WebSocket } from "ws";
import { verifyRoom } from "@/features/file-transfer/lib/room-token";
import type {
  ClientSignalMessage,
  ServerSignalMessage,
  TransferRole,
} from "@/features/file-transfer/types";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

type RoomSockets = Partial<Record<TransferRole, WebSocket>>;
type SignalHub = { rooms: Map<string, RoomSockets> };

const globalForSignalHub = globalThis as typeof globalThis & {
  __lightlinkFileTransferHub?: SignalHub;
};

const hub =
  globalForSignalHub.__lightlinkFileTransferHub ??
  (globalForSignalHub.__lightlinkFileTransferHub = { rooms: new Map() });

function send(socket: WebSocket | undefined, message: ServerSignalMessage) {
  if (!socket || socket.readyState !== 1) return;

  try {
    socket.send(JSON.stringify(message));
  } catch {
    // The close handler owns cleanup for broken connections.
  }
}

function otherRole(role: TransferRole): TransferRole {
  return role === "sender" ? "receiver" : "sender";
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const roomId = url.searchParams.get("room") ?? "";
  const expiresAt = Number(url.searchParams.get("exp"));
  const signature = url.searchParams.get("sig") ?? "";
  const role = url.searchParams.get("role");

  if (
    (role !== "sender" && role !== "receiver") ||
    !verifyRoom(roomId, expiresAt, signature, role)
  ) {
    return new Response("Invalid or expired transfer link", { status: 401 });
  }

  return experimental_upgradeWebSocket((socket) => {
    const room = hub.rooms.get(roomId) ?? {};
    const occupied = room[role];

    if (occupied && occupied.readyState === 1) {
      send(socket, {
        type: "error",
        code: "role-occupied",
        message: "이 전송 역할은 이미 다른 창에서 사용 중입니다.",
      });
      socket.close(4409, "Role already occupied");
      return;
    }

    room[role] = socket;
    hub.rooms.set(roomId, room);
    send(socket, { type: "connected", role });

    const peer = room[otherRole(role)];
    if (peer?.readyState === 1) {
      send(socket, { type: "peer-ready" });
      send(peer, { type: "peer-ready" });
    }

    socket.on("message", (data: WebSocketData) => {
      const raw = data.toString();
      if (raw.length > 64_000) {
        socket.close(4400, "Message too large");
        return;
      }

      let message: ClientSignalMessage;
      try {
        message = JSON.parse(raw) as ClientSignalMessage;
      } catch {
        return;
      }

      if (message.type === "ping") {
        send(socket, { type: "pong" });
        return;
      }

      if (message.type === "signal" && message.payload) {
        send(room[otherRole(role)], {
          type: "signal",
          payload: message.payload,
        });
      }
    });

    const expiresIn = Math.max(0, expiresAt * 1000 - Date.now());
    const expirationTimer = setTimeout(() => {
      send(socket, {
        type: "error",
        code: "expired",
        message: "공유 링크가 만료되었습니다.",
      });
      socket.close(4401, "Transfer expired");
    }, expiresIn);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      clearTimeout(expirationTimer);

      const currentRoom = hub.rooms.get(roomId);
      if (!currentRoom || currentRoom[role] !== socket) return;

      delete currentRoom[role];
      send(currentRoom[otherRole(role)], { type: "peer-left" });

      if (!currentRoom.sender && !currentRoom.receiver) {
        hub.rooms.delete(roomId);
      }
    };

    socket.on("close", cleanup);
    socket.on("error", cleanup);
  });
}
