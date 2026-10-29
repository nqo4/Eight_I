import { DemoBanner } from "@/components/demo/DemoBanner";
import { DemoHeader } from "@/components/demo/DemoHeader";
import { LearningSidebar } from "@/components/demo/LearningSidebar";

export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-paper">
      <DemoHeader />
      <div className="flex w-full flex-1 items-stretch">
        <LearningSidebar />
        <main className="flex min-w-0 flex-1 flex-col items-start gap-[22px] bg-paper px-[42px] pt-6 pb-10">
          <DemoBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
