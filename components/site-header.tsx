import { Brand } from "./brand";

export function SiteHeader() {
  return (
    <header className="nav">
      <Brand />
      <span className="header-label">광림교회 청년부</span>
    </header>
  );
}
