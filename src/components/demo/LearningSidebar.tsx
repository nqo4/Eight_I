"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/session/Session";
import { learningSteps } from "@/lib/demo";

export function LearningSidebar() {
  const pathname = usePathname();
  const { progress } = useSession();
  const currentIndex = learningSteps.findIndex((step) => step.href === pathname);
  const doneCount = learningSteps.filter((step) => progress.steps[step.key]).length;

  return (
    <aside className="flex w-full flex-col items-start gap-2 bg-brand-purple-soft px-4 py-3 sm:px-8 xl:w-[260px] xl:shrink-0 xl:gap-2.5 xl:px-5 xl:pt-8 xl:pb-6">
      <p className="font-manrope text-xs font-bold tracking-wider text-brand-purple-ink">LEARNING MAP</p>
      <nav aria-label="학습 단계" className="flex w-full gap-2 overflow-x-auto pb-1 xl:flex-col xl:gap-2.5 xl:overflow-visible xl:pb-0">
        {learningSteps.map((step, index) => {
          const current = index === currentIndex;
          const done = Boolean(progress.steps[step.key]);
          return (
            // Figma: CB / Sidebar Step — 학습 단계 탐색용 사이드바 항목.
            <Link
              key={step.href}
              href={step.href}
              aria-current={current ? "step" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-8 px-3 py-2 xl:w-full xl:shrink xl:gap-2.5 xl:px-3.5 xl:py-3 transition-colors hover:bg-surface ${
                current ? "bg-surface ring-1 ring-brand-purple" : "bg-surface/60"
              }`}
            >
              <span className={`w-6 shrink-0 font-mono text-xs ${done ? "text-status-green-ink" : "text-brand-purple-ink"}`}>
                {done ? "✓" : step.number}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className={`text-sm font-bold whitespace-nowrap xl:whitespace-normal ${current ? "text-text-primary" : "text-text-muted"}`}>
                  {step.title}
                  {done && <span className="sr-only"> (완료)</span>}
                </span>
                <span className="hidden text-xs text-text-muted xl:inline">{current ? "지금 보는 단계" : step.caption}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 hidden w-full flex-col items-start gap-1.5 rounded-12 bg-surface px-4 py-3.5 xl:flex">
        <p className="text-xs font-bold text-text-muted">이 기능에서 끝낸 단계</p>
        <p className="font-manrope text-xl font-extrabold text-brand-purple-ink">
          {doneCount} / {learningSteps.length}
        </p>
        <p className="text-xs text-text-muted">화면을 열기만 하면 완료로 세지 않아요.</p>
      </div>
    </aside>
  );
}
