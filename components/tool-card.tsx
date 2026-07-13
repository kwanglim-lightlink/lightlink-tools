import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  FileText,
  IdCard,
  UsersRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ToolDefinition, ToolIcon } from "@/lib/tools";

const icons: Record<ToolIcon, typeof IdCard> = {
  nametag: IdCard,
  people: UsersRound,
  calendar: CalendarDays,
  document: FileText,
};

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  const Icon = icons[tool.icon];
  const isAvailable = tool.status === "available";
  const isExternal = isAvailable && tool.href.startsWith("http");

  const card = (
    <Card
      className={`tool-card gap-0${isAvailable ? "" : " tool-card--disabled"}`}
    >
      <div className={`tool-icon tool-icon--${tool.accent}`} aria-hidden="true">
        <Icon size={27} strokeWidth={1.8} />
      </div>
      <CardContent className="tool-card__body p-0">
        <div className="tool-card__meta">
          <span>{tool.category}</span>
          <Badge
            variant="secondary"
            className={`status${isAvailable ? " status--available" : ""}`}
          >
            {isAvailable ? "사용 가능" : "준비 중"}
          </Badge>
        </div>
        <h2>{tool.title}</h2>
        <p>{tool.description}</p>
      </CardContent>
      <CardFooter className="tool-card__footer p-0">
        <span>{isAvailable ? "도구 사용하기" : "조금만 기다려 주세요"}</span>
        {isAvailable &&
          (isExternal ? (
            <ArrowUpRight size={19} aria-hidden="true" />
          ) : (
            <ArrowRight size={19} aria-hidden="true" />
          ))}
      </CardFooter>
    </Card>
  );

  if (!isAvailable) {
    return <article>{card}</article>;
  }

  return (
    <Link
      className="tool-card-link"
      href={tool.href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      aria-label={`${tool.title} 열기${isExternal ? " (새 창)" : ""}`}
    >
      {card}
    </Link>
  );
}
