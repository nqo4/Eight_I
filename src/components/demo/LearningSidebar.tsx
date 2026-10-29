"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { learningSteps } from "@/lib/demo";

export function LearningSidebar() {
  const pathname = usePathname();
  const current = learningSteps.find((step) => step.href === pathname) ?? learningSteps[0];

  return (
    <aside className="flex w-[260px] shrink-0 flex-col items-start gap-[10px] bg-brand-purple-soft px-[20px] pt-[30px] pb-[22px]">
      <p className="font-manrope text-[9px] leading-[14px] font-bold whitespace-nowrap text-brand-purple">LEARNING MAP</p>

      {learningSteps.map((step) => (
        // Figma: CB / Sidebar Step — 학습 단계 탐색용 사이드바 항목.
        <Link
          key={step.href}
          href={step.href}
          aria-current={step.href === current.href ? "step" : undefined}
          className={`flex h-[58px] w-[218px] shrink-0 items-center justify-center gap-[10px] rounded-8 bg-surface px-[14px] py-[11px] transition-opacity hover:opacity-100 ${
            step.href === current.href ? "" : "opacity-55"
          }`}
        >
          <span className="font-mono text-[9px] leading-[14px] whitespace-nowrap text-brand-purple">{step.number}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/figma/step-dot.svg" alt="" width={7} height={7} className="block shrink-0" />
          <span className="flex flex-col items-start gap-[2px] whitespace-nowrap">
            <span className="text-[11px] leading-[16px] font-bold text-text-primary">{step.title}</span>
            <span className="text-[8px] leading-[12px] text-text-muted">{step.caption}</span>
          </span>
        </Link>
      ))}

      <div className="h-[270px] w-px shrink-0" />

      <div className="flex h-[92px] w-[220px] shrink-0 flex-col items-start gap-[8px] rounded-12 bg-surface px-[15px] py-[14px] whitespace-nowrap">
        <p className="text-[9px] leading-[14px] font-bold text-text-muted">오늘의 학습</p>
        <p className="font-manrope text-[20px] leading-[26px] font-extrabold text-brand-purple">{current.progress}% 완료</p>
      </div>
    </aside>
  );
}
