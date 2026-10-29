import { PageIntro } from "@/components/demo/PageIntro";
import { Mission } from "@/components/demo/Mission";

export default function MissionPage() {
  return (
    <>
      <PageIntro
        eyebrow="YOUR TURN"
        title="이제, 당신이 직접 바꿔볼 차례예요."
        description="AI가 대신 수정하지 않아요. 힌트를 따라 내 개발 환경에서 직접 시도해 보세요."
      />
      <Mission />
    </>
  );
}
