import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ToolCard } from "@/components/tool-card";
import { ToolIdeaCard } from "@/components/tool-idea-card";
import { tools } from "@/lib/tools";

export default function Home() {
  const availableCount = tools.filter(
    (tool) => tool.status === "available",
  ).length;

  return (
    <main>
      <SiteHeader />

      <section className="tools-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">LIGHTLINK TOOLS</p>
            <h1>도구 모음</h1>
            <p className="section-description">
              사용할 도구를 선택해 주세요.
            </p>
          </div>
          <p className="tool-count">
            <strong>{availableCount}개</strong> 사용 가능
          </p>
        </div>

        <div className="tools-grid">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
          <ToolIdeaCard />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
