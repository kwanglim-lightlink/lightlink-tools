import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ROOM_TTL_SECONDS, type TransferRole } from "../types";

const ROOM_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const ROOM_PATTERN = /^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
const DEVELOPMENT_SECRET = "lightlink-file-transfer-local-development-only";

function signingSecret(): string {
  const secret = process.env.ROOM_SIGNING_SECRET;

  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return DEVELOPMENT_SECRET;

  throw new Error("ROOM_SIGNING_SECRET 환경변수가 설정되지 않았습니다.");
}

function payload(roomId: string, expiresAt: number, role: TransferRole) {
  return `${roomId}.${expiresAt}.${role}`;
}

export function createRoomId(): string {
  const bytes = randomBytes(8);
  const code = Array.from(bytes, (byte) => ROOM_ALPHABET[byte % ROOM_ALPHABET.length]).join("");
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function signRoom(
  roomId: string,
  expiresAt: number,
  role: TransferRole,
): string {
  return createHmac("sha256", signingSecret())
    .update(payload(roomId, expiresAt, role))
    .digest("base64url");
}

export function verifyRoom(
  roomId: string,
  expiresAt: number,
  signature: string,
  role: TransferRole,
  now = Math.floor(Date.now() / 1000),
): boolean {
  if (!ROOM_PATTERN.test(roomId)) return false;
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) return false;
  if (expiresAt > now + ROOM_TTL_SECONDS + 60) return false;
  if (!signature || signature.length > 128) return false;

  try {
    const expected = Buffer.from(signRoom(roomId, expiresAt, role));
    const received = Buffer.from(signature);
    return expected.length === received.length && timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}
