import { DemoHeader } from "@/components/demo/DemoHeader";
import { LearningSidebar } from "@/components/demo/LearningSidebar";

export default function DemoLayout({ children }: LayoutProps<"/demo">) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-paper">
      <DemoHeader />
      <div className="flex w-full flex-1 flex-col xl:flex-row xl:items-stretch">
        <LearningSidebar />
        <main className="flex min-w-0 flex-1 flex-col items-start gap-[22px] bg-paper px-4 pt-5 pb-10 sm:px-8 xl:px-[42px] xl:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
