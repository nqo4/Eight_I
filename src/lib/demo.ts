// 데모 모드에서 사용하는 준비된 예시 데이터

export const learningSteps = [
  { number: "01", title: "프로젝트 개요", caption: "전체를 먼저 살펴봐요", href: "/demo/overview", progress: 20 },
  { number: "02", title: "코드 흐름", caption: "기능이 움직이는 길", href: "/demo/flow", progress: 40 },
  { number: "03", title: "개념 학습", caption: "내 코드로 이해해요", href: "/demo/concept", progress: 60 },
  { number: "04", title: "이해도 확인", caption: "짧게 확인해 봐요", href: "/demo/quiz", progress: 80 },
  { number: "05", title: "직접 수정", caption: "이제 내가 바꿔요", href: "/demo/mission", progress: 100 },
] as const;

export const cartButtonCode = [
  "21  const [count, setCount] = useState(0)",
  "22",
  "23  function addToCart() {",
  "24    if (count < 10) {",
  "25      setCount(count + 1)",
  "26    }",
  "27  }",
  "28",
  "29  return <Button onClick={addToCart} />",
];

export const features = [
  {
    number: "01",
    title: "장바구니에 상품 담기",
    description: "버튼을 누르면 선택한 상품이 장바구니 상태에 추가돼요.",
    files: ["CartButton.tsx", "cart-store.ts"],
  },
  {
    number: "02",
    title: "상품 검색하기",
    description: "입력한 검색어와 상품 이름을 비교해 결과를 좁혀요.",
    files: ["SearchBar.tsx", "products.ts"],
  },
  {
    number: "03",
    title: "카테고리 필터",
    description: "선택한 카테고리에 맞는 상품 목록만 보여줘요.",
    files: ["FilterTabs.tsx", "page.tsx"],
  },
  {
    number: "04",
    title: "장바구니 합계 계산",
    description: "담긴 상품의 가격과 수량으로 전체 금액을 계산해요.",
    files: ["CartSummary.tsx", "cart-store.ts"],
  },
];
