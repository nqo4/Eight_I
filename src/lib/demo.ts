// 학습 화면 왼쪽 LEARNING MAP의 단계 이름과 경로. 실제 내용은 API에서 받는다.
export const learningSteps = [
  { key: "overview", number: "01", title: "프로젝트 개요", caption: "전체를 먼저 살펴봐요", href: "/demo/overview" },
  { key: "flow", number: "02", title: "코드 흐름", caption: "다음 단계를 먼저 맞혀 봐요", href: "/demo/flow" },
  { key: "concept", number: "03", title: "개념 학습", caption: "내 코드로 이해해요", href: "/demo/concept" },
  { key: "quiz", number: "04", title: "이해도 확인", caption: "연습 문제로 확인해요", href: "/demo/quiz" },
  { key: "mission", number: "05", title: "직접 수정", caption: "이제 내가 바꿔요", href: "/demo/mission" },
  // 보류(기획 검토): 문서에 없는 기능 — 기획검토-보류목록.md A2
  { key: "card", number: "06", title: "내 설명 카드", caption: "복사하면 완료로 기록돼요", href: "/demo/card" },
] as const;
