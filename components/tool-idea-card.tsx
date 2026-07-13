import { ArrowUpRight, MessageCirclePlus } from "lucide-react";

export function ToolIdeaCard() {
  return (
    <a
      className="idea-card"
      href="https://contact.lightlink.kr"
      target="_blank"
      rel="noreferrer"
      aria-label="새 도구 아이디어 제안하기 (새 창)"
    >
      <div className="idea-card__icon" aria-hidden="true">
        <MessageCirclePlus size={25} strokeWidth={1.8} />
      </div>
      <div>
        <span className="idea-card__label">새 도구 제안</span>
        <h2>필요한 도구가 없나요?</h2>
        <p>사역 중 반복되는 불편함을 알려주시면 다음 도구를 고민해 볼게요.</p>
      </div>
      <div className="idea-card__footer">
        <span>아이디어 보내기</span>
        <ArrowUpRight size={19} aria-hidden="true" />
      </div>
    </a>
  );
}
