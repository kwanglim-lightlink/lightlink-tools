import { NextResponse } from "next/server";
import {
  createRoomId,
  signRoom,
} from "@/features/file-transfer/lib/room-token";
import { ROOM_TTL_SECONDS, type CreatedRoom } from "@/features/file-transfer/types";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  try {
    const roomId = createRoomId();
    const expiresAt = Math.floor(Date.now() / 1000) + ROOM_TTL_SECONDS;
    const signature = signRoom(roomId, expiresAt, "receiver");
    const senderSignature = signRoom(roomId, expiresAt, "sender");
    const origin = new URL(request.url).origin;
    const params = new URLSearchParams({
      exp: String(expiresAt),
      sig: signature,
    });

    const room: CreatedRoom = {
      roomId,
      expiresAt,
      signature,
      senderSignature,
      shareUrl: `${origin}/tools/file-transfer/r/${roomId}?${params}`,
    };

    return NextResponse.json(room, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[file-transfer] room creation failed", error);
    return NextResponse.json(
      { message: "공유 링크를 만들 수 없습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
