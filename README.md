# Lightlink Tools

광림교회 청년부의 사역을 돕는 웹 도구 모음입니다. Next.js App Router,
TypeScript, Tailwind CSS, shadcn/ui로 만들어졌습니다.

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어 확인할 수 있습니다.

## 도구 추가하기

1. `app/tools/<tool-id>/page.tsx`에 도구의 진입 페이지를 만듭니다.
2. 도구 전용 컴포넌트와 로직은 `features/<tool-id>`에 둡니다.
3. `lib/tools.ts`의 목록에 도구 정보를 등록합니다.

공용 UI는 `components/ui`의 shadcn/ui 컴포넌트를 사용하고, 여러 도구에서
공유하는 조합 컴포넌트는 `components`에 둡니다.

## 이름표 생성기

이름표 생성기는 `features/nametag-generator`에 독립된 기능 모듈로 구성되어
있습니다. 명단은 엑셀 파일을 올리거나 웹에서 직접 입력해 준비할 수 있고,
시간표 엑셀 파일을 추가하면 이름표 뒷면용 시간표 카드도 같은 크기로
만들어집니다. 엑셀 분석, Canvas 이미지 생성, A4 배치, ZIP 압축은 모두
사용자의 브라우저에서 실행되며 업로드한 파일은 서버로 전송되지 않습니다.

## 파일 바로건네기

파일 바로건네기는 10분 동안 유효한 서명 링크를 만들고, 두 브라우저가
WebRTC DataChannel로 파일을 직접 주고받는 일회용 전송 도구입니다. Vercel
Function은 WebSocket 시그널링만 담당하며 파일 데이터는 Function이나 별도
스토리지를 거치지 않습니다.

배포 환경에는 충분히 긴 무작위 값으로 다음 환경변수를 설정해야 합니다.

```bash
ROOM_SIGNING_SECRET=replace-with-a-long-random-secret
```

Vercel WebSocket 공개 베타는 Fluid Compute가 필요하며 `vercel.json`에서
활성화되어 있습니다. WebSocket 업그레이드는 일반 `next dev`에서 동작하지
않으므로 실시간 전송을 로컬에서 확인할 때는 Vercel CLI로 실행합니다.

```bash
vercel dev
```

시그널링 room은 Function 인스턴스 메모리에만 존재합니다. DB나 Redis 없이
운영하는 의도적인 MVP 제약이므로 여러 Function 인스턴스로 분산된 두 연결은
서로를 찾지 못할 수 있습니다. 파일을 보존하거나 우회 전송하는 fallback은
제공하지 않습니다.
