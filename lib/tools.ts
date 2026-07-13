export type ToolIcon = "nametag" | "people" | "calendar" | "document";
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
