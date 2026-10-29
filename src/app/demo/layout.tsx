import { DemoHeader } from "@/components/demo/DemoHeader";
import { LearningSidebar } from "@/components/demo/LearningSidebar";

export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-paper">
      <DemoHeader />
      <div className="flex min-h-[948px] w-full flex-1 items-stretch">
        <LearningSidebar />
        <main className="flex min-w-0 flex-1 flex-col items-start gap-[22px] bg-paper px-[42px] pt-[24px] pb-[40px]">
          <div className="flex w-full items-start gap-[10px] rounded-8 bg-brand-purple-soft px-[14px] py-[10px]">
            <span className="rounded-12 bg-brand-purple px-[10px] py-[6px] text-[9px] leading-[14px] font-bold whitespace-nowrap text-surface">
              DEMO
            </span>
            <p className="text-[10px] leading-[16px] whitespace-nowrap text-text-muted">
              준비된 예시 데이터를 보고 있어요. 실제 저장소 분석 결과와 구분됩니다.
            </p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
