import { Suspense } from "react";
import { LearnHeader, LearnSidebar } from "@/components/learn/LearnChrome";

// 실제 분석 결과로 보는 학습 화면.
// 주소 값(useParams)을 읽는 화면은 요청 때 그려지므로 Suspense 안에 둔다(Cache Components 규칙).
export default function LearnLayout({ children }: LayoutProps<"/learn/[analysisId]">) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-paper">
      <Suspense fallback={<div className="h-[76px] w-full border-b border-line bg-surface" />}>
        <LearnHeader />
      </Suspense>
      <div className="flex w-full flex-1 items-stretch">
        <Suspense fallback={<div className="w-[260px] shrink-0 bg-brand-purple-soft" />}>
          <LearnSidebar />
        </Suspense>
        <main className="flex min-w-0 flex-1 flex-col items-start gap-[22px] bg-paper px-[42px] pt-[24px] pb-[40px]">
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
