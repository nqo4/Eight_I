import { PageIntro } from "@/components/demo/PageIntro";
import { Quiz } from "@/components/demo/Quiz";

export default function QuizPage() {
  return (
    <>
      <PageIntro
        eyebrow="QUICK CHECK"
        title="방금 배운 내용을 짧게 확인해 볼까요?"
        description="성적 평가가 아닌 연습이에요. 틀리면 실제 코드 근거와 함께 이유를 알려 드려요. 첫 시도 결과는 내 설명 카드에만 표시돼요."
      />
      <Quiz />
    </>
  );
}
