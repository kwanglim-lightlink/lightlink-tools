import { ArrowUpRight } from "lucide-react";
import { Brand } from "./brand";

export function SiteFooter() {
  return (
    <footer>
      <Brand compact />
      <a
        className="footer-contact"
        href="https://contact.lightlink.kr"
        target="_blank"
        rel="noreferrer"
      >
        새 도구 아이디어 제안하기
        <ArrowUpRight size={13} aria-hidden="true" />
      </a>
      <span>© {new Date().getFullYear()} Lightlink</span>
    </footer>
  );
}
