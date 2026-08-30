import type { Metadata } from "next";
import { FileTransferSender } from "@/features/file-transfer/components/file-transfer";

export const metadata: Metadata = {
  title: "파일 바로건네기 | Lightlink Tools",
  description:
    "파일을 서버에 업로드하지 않고 10분 동안 브라우저끼리 직접 전달합니다.",
};

export default function FileTransferPage() {
  return <FileTransferSender />;
}
