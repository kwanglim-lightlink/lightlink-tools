import type { Metadata } from "next";
import {
  FileTransferReceiver,
  InvalidFileTransfer,
} from "@/features/file-transfer/components/file-transfer";
import { verifyRoom } from "@/features/file-transfer/lib/room-token";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "파일 받기 | Lightlink Tools",
  description: "서버 저장 없이 브라우저에서 직접 파일을 받습니다.",
  robots: { index: false, follow: false },
};

type FileTransferRoomPageProps = {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ exp?: string | string[]; sig?: string | string[] }>;
};

export default async function FileTransferRoomPage({
  params,
  searchParams,
}: FileTransferRoomPageProps) {
  const { roomId } = await params;
  const query = await searchParams;
  const expiresAt = Number(Array.isArray(query.exp) ? query.exp[0] : query.exp);
  const signature = Array.isArray(query.sig) ? query.sig[0] : query.sig;
  const now = Math.floor(Date.now() / 1000);
  const expired = Number.isFinite(expiresAt) && expiresAt <= now;
  const valid = verifyRoom(
    roomId,
    expiresAt,
    signature ?? "",
    "receiver",
    now,
  );

  if (!valid) return <InvalidFileTransfer expired={expired} />;

  return (
    <FileTransferReceiver
      credential={{ roomId, expiresAt, signature: signature ?? "" }}
    />
  );
}
