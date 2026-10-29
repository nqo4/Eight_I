"use client";

import { PageIntro } from "@/components/demo/PageIntro";
import { FlowSteps } from "@/components/demo/FlowSteps";
import { useSession } from "@/components/session/Session";

export default function FlowPage() {
  const { feature } = useSession();
  return (
    <>
      <PageIntro
        eyebrow="HOW IT WORKS"
        title={`${feature?.title ?? "이 기능"}, 코드는 이렇게 움직여요`}
        description="첫 단계부터 보여 드려요. ‘다음 단계’를 누르기 전에 다음에 무슨 일이 일어날지 먼저 맞혀 볼 수 있어요."
      />
      <FlowSteps />
    </>
  );
}
