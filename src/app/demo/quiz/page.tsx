import { PageIntro } from "@/components/demo/PageIntro";
import { Quiz } from "@/components/demo/Quiz";

export default function QuizPage() {
  return (
    <>
      <PageIntro
        eyebrow="QUICK CHECK"
        title="방금 배운 내용을 짧게 확인해 볼까요?"
        description="틀려도 괜찮아요. 실제 코드 근거와 함께 이유를 알려드려요."
      />
      <Quiz />
    </>
  );
}
