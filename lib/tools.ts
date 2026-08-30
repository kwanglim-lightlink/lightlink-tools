export type ToolIcon =
  | "nametag"
  | "people"
  | "calendar"
  | "document"
  | "send";
export type ToolAccent = "brand" | "mint" | "yellow" | "blue";

type ToolBase = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: ToolIcon;
  accent: ToolAccent;
};

export type AvailableTool = ToolBase & {
  status: "available";
  href: string;
};

export type ComingSoonTool = ToolBase & {
  status: "coming-soon";
  href?: never;
};

export type ToolDefinition = AvailableTool | ComingSoonTool;

/**
 * The hub is rendered entirely from this registry.
 *
 * Each tool owns its implementation under `app/tools/<id>`. Keeping a stable
 * internal href here means a tool can be migrated or rewritten without
 * changing links on the hub.
 */
export const tools = [
  {
    id: "file-transfer",
    title: "파일 바로건네기",
    description:
      "업로드나 계정 없이, 10분 동안 브라우저끼리 파일을 직접 건네요.",
    category: "파일 · 전송",
    icon: "send",
    href: "/tools/file-transfer",
    status: "available",
    accent: "mint",
  },
  {
    id: "nametag-generator",
    title: "국내선교 이름표 생성기",
    description:
      "엑셀 명단과 이름표 이미지를 업로드해 인쇄용 이름표를 간편하게 만들어요.",
    category: "디자인 · 출력",
    icon: "nametag",
    href: "/tools/nametag-generator",
    status: "available",
    accent: "brand",
  },
] as const satisfies readonly ToolDefinition[];
