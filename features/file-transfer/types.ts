export const ROOM_TTL_SECONDS = 10 * 60;

export type TransferRole = "sender" | "receiver";

export type RoomCredential = {
  roomId: string;
  expiresAt: number;
  signature: string;
};

export type CreatedRoom = RoomCredential & {
  senderSignature: string;
  shareUrl: string;
};

export type FileMetadata = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
};

export type PeerSignal =
  | { kind: "offer"; description: RTCSessionDescriptionInit }
  | { kind: "answer"; description: RTCSessionDescriptionInit }
  | { kind: "ice-candidate"; candidate: RTCIceCandidateInit };

export type ClientSignalMessage =
  | { type: "signal"; payload: PeerSignal }
  | { type: "ping" };

export type ServerSignalMessage =
  | { type: "connected"; role: TransferRole }
  | { type: "peer-ready" }
  | { type: "peer-left" }
  | { type: "signal"; payload: PeerSignal }
  | { type: "pong" }
  | { type: "error"; code: string; message: string };

export type DataChannelControlMessage =
  | { type: "meta"; file: FileMetadata }
  | { type: "complete" }
  | { type: "received" }
  | { type: "cancel"; message?: string };
