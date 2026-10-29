"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { learningSteps } from "@/lib/demo";

export function LearningSidebar() {
  const pathname = usePathname();
  const currentIndex = Math.max(
    learningSteps.findIndex((step) => step.href === pathname),
    0,
  );
  const progress = Math.round((currentIndex / (learningSteps.length - 1)) * 100);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col items-start gap-2.5 bg-brand-purple-soft px-5 pt-8 pb-6">
      <p className="font-manrope text-xs font-bold tracking-wider text-brand-purple-ink">LEARNING MAP</p>
      <nav aria-label="학습 단계" className="flex w-full flex-col gap-2.5">
        {learningSteps.map((step, index) => {
          const current = index === currentIndex;
          const done = index < currentIndex;
          return (
            // Figma: CB / Sidebar Step — 학습 단계 탐색용 사이드바 항목.
            <Link
              key={step.href}
              href={step.href}
              aria-current={current ? "step" : undefined}
              className={`flex w-full items-center gap-2.5 rounded-8 px-3.5 py-3 transition-colors hover:bg-surface ${
                current ? "bg-surface ring-1 ring-brand-purple" : "bg-surface/60"
              }`}
            >
              <span className={`w-6 shrink-0 font-mono text-xs ${done ? "text-status-green-ink" : "text-brand-purple-ink"}`}>
                {done ? "✓" : step.number}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className={`text-sm font-bold ${current ? "text-text-primary" : "text-text-muted"}`}>{step.title}</span>
                <span className="text-xs text-text-muted">{step.caption}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 flex w-full flex-col items-start gap-1.5 rounded-12 bg-surface px-4 py-3.5">
        <p className="text-xs font-bold text-text-muted">오늘의 학습</p>
        <p className="font-manrope text-xl font-extrabold text-brand-purple-ink">{progress}% 진행</p>
      </div>
    </aside>
  );
}
