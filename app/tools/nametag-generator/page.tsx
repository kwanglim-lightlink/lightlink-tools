import type { Metadata } from "next";
import { NametagGenerator } from "@/features/nametag-generator/components/nametag-generator";

export const metadata: Metadata = {
  title: "국내선교 이름표 생성기 | Lightlink Tools",
  description: "엑셀 명단으로 인쇄용 이름표를 만드는 도구입니다.",
};

export default function NametagGeneratorPage() {
  return <NametagGenerator />;
}
