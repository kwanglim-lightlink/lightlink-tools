"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  FileIcon,
  Link2,
  LoaderCircle,
  LockKeyhole,
  QrCode,
  RefreshCw,
  Send,
  ShieldCheck,
  TriangleAlert,
  UploadCloud,
  Wifi,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useFileTransfer, type TransferPhase } from "../hooks/use-file-transfer";
import type { CreatedRoom, FileMetadata, RoomCredential } from "../types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;
  return `${value >= 100 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function useCountdown(expiresAt: number) {
  const [seconds, setSeconds] = useState(() =>
    Math.max(0, expiresAt - Math.floor(Date.now() / 1000)),
  );

  useEffect(() => {
    const update = () =>
      setSeconds(Math.max(0, expiresAt - Math.floor(Date.now() / 1000)));
    update();
    const timer = setInterval(update, 1_000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return {
    seconds,
    label: `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`,
  };
}

function ToolHeader({ receiver = false }: { receiver?: boolean }) {
  return (
    <div className="mb-8">
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-7">
        <Link href="/">
          <ArrowLeft className="size-4" />
          도구 모음
        </Link>
      </Button>

      <p className="mb-2 text-xs font-bold tracking-[0.14em] text-primary">
        LIGHTLINK TOOLS
      </p>
      <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
        파일 바로건네기
      </h1>
      <p className="mt-3 text-sm text-muted-foreground sm:text-base">
        {receiver
          ? "파일을 서버에 저장하지 않고 보내는 사람에게서 바로 받아요."
          : "Drive에 올리지 말고, 지금 바로 건네세요."}
      </p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#e9f2ff] px-3 py-1.5 text-xs text-[#286bc9]">
        <LockKeyhole className="size-3.5" />
        파일은 서버에 업로드되거나 저장되지 않습니다
      </div>
    </div>
  );
}

function FeatureNotes() {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <div className="file-transfer-note">
        <ShieldCheck className="size-4 text-primary" />
        <span>서버 저장 없음</span>
      </div>
      <div className="file-transfer-note">
        <Wifi className="size-4 text-primary" />
        <span>브라우저끼리 직접 전송</span>
      </div>
      <div className="file-transfer-note">
        <Clock3 className="size-4 text-primary" />
        <span>10분 후 자동 만료</span>
      </div>
    </div>
  );
}

function FileSummary({ metadata }: { metadata: FileMetadata }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eaf2ff] text-primary">
        <FileIcon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {metadata.name}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatBytes(metadata.size)}
        </p>
      </div>
    </div>
  );
}

function StatusLine({ phase, receiver = false }: { phase: TransferPhase; receiver?: boolean }) {
  const label: Record<TransferPhase, string> = {
    connecting: "보안 연결을 여는 중...",
    waiting: receiver
      ? "보내는 사람이 연결되기를 기다리는 중..."
      : "누군가 링크를 열기를 기다리는 중...",
    negotiating: "브라우저끼리 직접 연결하는 중...",
    ready: receiver
      ? "연결됐어요. 보내는 사람이 전송을 시작할 거예요."
      : "상대방이 준비됐어요.",
    transferring: receiver ? "파일을 직접 받는 중..." : "파일을 직접 보내는 중...",
    confirming: "상대방의 도착 확인을 기다리는 중...",
    complete: receiver ? "파일을 모두 받았어요." : "파일을 안전하게 건넸어요.",
    unavailable: "이 전송은 더 이상 사용할 수 없습니다.",
    expired: "10분이 지나 링크가 만료됐습니다.",
    error: "연결에 문제가 생겼습니다.",
  };
  const isLive = ["connecting", "waiting", "negotiating"].includes(phase);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
      {isLive ? (
        <LoaderCircle className="size-4 animate-spin text-primary" />
      ) : phase === "complete" ? (
        <CheckCircle2 className="size-4 text-[#278367]" />
      ) : phase === "error" || phase === "expired" || phase === "unavailable" ? (
        <TriangleAlert className="size-4 text-[#b86c23]" />
      ) : (
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#2d9b75] opacity-35" />
          <span className="relative inline-flex size-2.5 rounded-full bg-[#2d9b75]" />
        </span>
      )}
      <span>{label[phase]}</span>
    </div>
  );
}

function TransferProgress({ progress, metadata }: { progress: number; metadata: FileMetadata }) {
  const transferred = Math.min(metadata.size, (metadata.size * progress) / 100);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
        <span className="text-muted-foreground">
          {formatBytes(transferred)} / {formatBytes(metadata.size)}
        </span>
      </div>
      <Progress value={progress} className="h-2.5 bg-primary/10" />
    </div>
  );
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

function SenderSession({
  file,
  room,
  onReset,
}: {
  file: File;
  room: CreatedRoom;
  onReset: () => void;
}) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const countdown = useCountdown(room.expiresAt);
  const credential = useMemo<RoomCredential>(
    () => ({
      roomId: room.roomId,
      expiresAt: room.expiresAt,
      signature: room.senderSignature,
    }),
    [room.expiresAt, room.roomId, room.senderSignature],
  );
  const transfer = useFileTransfer({ credential, role: "sender", file });
  const metadata = transfer.metadata ?? {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  };
  const terminal = ["complete", "expired", "error"].includes(transfer.phase);

  const handleCopy = async () => {
    try {
      await copyText(room.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1_800);
    } catch {
      // The visible URL remains available for manual copying.
    }
  };

  return (
    <div className="file-transfer-panel">
      <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] px-5 py-5 sm:px-7">
        <FileSummary metadata={metadata} />
        <div
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
            countdown.seconds > 60
              ? "bg-[#f1f0eb] text-[#686670]"
              : "bg-[#fff0de] text-[#a45d1d]",
          )}
          aria-label={`링크 만료까지 ${countdown.label}`}
        >
          <Clock3 className="size-3.5" />
          {countdown.label}
        </div>
      </div>

      <div className="space-y-5 px-5 py-6 sm:px-7">
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">공유 링크</p>
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-black/[0.07] bg-[#fafaf8] p-2 pl-3">
            <Link2 className="size-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate text-xs text-foreground sm:text-sm">
              {room.shareUrl}
            </span>
            <Button type="button" size="sm" onClick={handleCopy} className="min-w-22">
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "복사됨" : "링크 복사"}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => setShowQr((current) => !current)}
              aria-label="QR 코드 보기"
            >
              {showQr ? <X className="size-4" /> : <QrCode className="size-4" />}
            </Button>
          </div>
        </div>

        {showQr && (
          <div className="flex flex-col items-center rounded-2xl bg-[#f7f6f2] px-5 py-6 text-center">
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              <QRCodeSVG value={room.shareUrl} size={164} level="M" marginSize={1} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              받을 기기의 카메라로 스캔하세요
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5">
          <StatusLine phase={transfer.phase} />

          {transfer.error && (
            <p className="mt-3 rounded-lg bg-[#fff5e9] px-3 py-2 text-xs leading-5 text-[#98571d]">
              {transfer.error}
            </p>
          )}

          {["transferring", "confirming", "complete"].includes(transfer.phase) && (
            <div className="mt-5">
              <TransferProgress progress={transfer.progress} metadata={metadata} />
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {transfer.canSend && (
              <Button type="button" size="lg" onClick={() => void transfer.sendFile()}>
                <Send className="size-4" />
                Send
              </Button>
            )}
            {terminal && (
              <Button type="button" size="lg" variant="outline" onClick={onReset}>
                <RefreshCw className="size-4" />
                새 파일 건네기
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs leading-5 text-muted-foreground">
          이 탭을 닫으면 파일도 사라집니다. 전송이 끝날 때까지 열어 두세요.
        </p>
      </div>
    </div>
  );
}

export function FileTransferSender() {
  const [file, setFile] = useState<File | null>(null);
  const [room, setRoom] = useState<CreatedRoom | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prepareFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setRoom(null);
    setError(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/file-transfer/rooms", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as CreatedRoom & { message?: string };
      if (!response.ok) throw new Error(payload.message || "공유 링크를 만들 수 없습니다.");
      setRoom(payload);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "공유 링크를 만들 수 없습니다.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const dropzone = useDropzone({
    multiple: false,
    maxFiles: 1,
    disabled: isCreating || !!room,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) void prepareFile(acceptedFiles[0]);
    },
  });

  const reset = () => {
    setRoom(null);
    setFile(null);
    setError(null);
  };

  return (
    <main className="file-transfer-page min-h-screen">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <ToolHeader />

        {file && room ? (
          <SenderSession key={room.roomId} file={file} room={room} onReset={reset} />
        ) : (
          <div>
            <div
              {...dropzone.getRootProps()}
              className={cn(
                "file-transfer-dropzone group",
                dropzone.isDragActive && "file-transfer-dropzone--active",
                isCreating && "cursor-wait",
              )}
            >
              <input {...dropzone.getInputProps()} />
              <span className="file-transfer-dropzone__icon">
                {isCreating ? (
                  <LoaderCircle className="size-7 animate-spin" />
                ) : (
                  <UploadCloud className="size-7" />
                )}
              </span>
              <h2>
                {isCreating
                  ? "10분짜리 링크를 만드는 중..."
                  : dropzone.isDragActive
                    ? "여기에 놓아주세요"
                    : "건넬 파일을 선택하세요"}
              </h2>
              <p>
                {file && isCreating
                  ? `${file.name} · ${formatBytes(file.size)}`
                  : "클릭하거나 파일을 이곳으로 끌어오세요"}
              </p>
              <span className="file-transfer-dropzone__promise">
                No upload. No account. Just pass it.
              </span>
            </div>

            {error && (
              <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-[#f1d3b5] bg-[#fff8ef] p-4 text-sm text-[#92551f]">
                <span className="flex items-start gap-2">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  {error}
                </span>
                {file && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void prepareFile(file)}
                  >
                    다시 시도
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <FeatureNotes />

        <div className="mt-8 rounded-2xl border border-black/[0.06] bg-white/65 px-5 py-4 text-xs leading-5 text-muted-foreground">
          <strong className="font-semibold text-foreground">알아두세요.</strong>{" "}
          보내는 사람의 탭과 네트워크가 계속 연결되어 있어야 합니다. 일부 학교·회사
          네트워크에서는 직접 연결이 차단될 수 있으며, 이 경우 다른 네트워크에서 다시
          시도해 주세요.
        </div>
      </div>
    </main>
  );
}

export function FileTransferReceiver({ credential }: { credential: RoomCredential }) {
  const countdown = useCountdown(credential.expiresAt);
  const transfer = useFileTransfer({ credential, role: "receiver" });
  const showProgress =
    !!transfer.metadata && ["transferring", "complete"].includes(transfer.phase);

  return (
    <main className="file-transfer-page min-h-screen">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <ToolHeader receiver />

        <div className="file-transfer-panel">
          <div className="flex items-center justify-between gap-4 border-b border-black/[0.06] px-5 py-4 sm:px-7">
            <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
              ROOM {credential.roomId}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                countdown.seconds > 60
                  ? "bg-[#f1f0eb] text-[#686670]"
                  : "bg-[#fff0de] text-[#a45d1d]",
              )}
            >
              <Clock3 className="size-3.5" />
              {countdown.label}
            </span>
          </div>

          <div className="space-y-5 px-5 py-6 sm:px-7">
            {transfer.metadata ? (
              <div className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5">
                <FileSummary metadata={transfer.metadata} />
                {showProgress && (
                  <div className="mt-5">
                    <TransferProgress
                      progress={transfer.progress}
                      metadata={transfer.metadata}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed border-black/[0.08] bg-[#fafaf8] text-center">
                <div>
                  <span className="mx-auto grid size-10 place-items-center rounded-xl bg-[#eaf2ff] text-primary">
                    <FileIcon className="size-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold">파일 정보를 기다리는 중</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-black/[0.06] bg-white p-4 sm:p-5">
              <StatusLine phase={transfer.phase} receiver />
              {transfer.error && (
                <p className="mt-3 rounded-lg bg-[#fff5e9] px-3 py-2 text-xs leading-5 text-[#98571d]">
                  {transfer.error}
                </p>
              )}

              {transfer.canDownload && (
                <Button type="button" size="lg" className="mt-5" onClick={transfer.download}>
                  <Download className="size-4" />
                  {transfer.metadata?.name ?? "파일"} 다운로드
                </Button>
              )}
            </div>

            <p className="text-center text-xs leading-5 text-muted-foreground">
              전송이 끝날 때까지 이 탭을 열어 두세요.
            </p>
          </div>
        </div>

        <FeatureNotes />
      </div>
    </main>
  );
}

export function InvalidFileTransfer({ expired }: { expired: boolean }) {
  return (
    <main className="file-transfer-page grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-black/[0.06] bg-white p-7 text-center shadow-[0_20px_70px_rgba(36,60,90,0.08)] sm:p-9">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#fff1e3] text-[#ad6421]">
          <TriangleAlert className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          {expired ? "링크가 만료됐어요" : "유효하지 않은 링크예요"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {expired
            ? "공유 링크는 만든 뒤 10분 동안만 사용할 수 있습니다."
            : "링크가 잘못 복사되었거나 서명을 확인할 수 없습니다."}
          <br />
          보내는 사람에게 새 링크를 요청해 주세요.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/tools/file-transfer">파일 바로건네기 열기</Link>
        </Button>
      </div>
    </main>
  );
}
