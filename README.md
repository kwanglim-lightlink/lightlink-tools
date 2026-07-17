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
