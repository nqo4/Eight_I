"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { AuthNav } from "@/components/auth/AuthNav";
import { Brand } from "@/components/Brand";
import { getAnalysis } from "@/lib/api";
import { useLoad } from "./states";

type Params = { analysisId: string; featureId?: string };

export function LearnHeader() {
  const { analysisId } = useParams<Params>();
  const { data } = useLoad(`analysis:${analysisId}`, () => getAnalysis(analysisId));
  const demo = analysisId === "demo";
  return (
    <header className="flex h-[76px] w-full shrink-0 items-center justify-between border-b border-line bg-surface px-[36px]">
      <Brand />
      <div className="flex items-center gap-[16px] font-bold whitespace-pre">
        <span className="text-[11px] leading-[18px] text-text-primary">
          {`현재 프로젝트  ·  ${data ? data.repository.id : "불러오는 중"}`}
        </span>
        <span className="text-[10px] leading-[16px] text-status-green">{demo ? "●  데모 모드" : "●  실제 저장소 분석"}</span>
        <span aria-hidden className="h-5 w-px bg-line" />
        <AuthNav />
      </div>
    </header>
  );
}

const STEPS = [
  { key: "", number: "01", title: "프로젝트 개요", caption: "전체를 먼저 살펴봐요" },
  { key: "feature", number: "02", title: "기능 선택", caption: "알아볼 기능을 골라요" },
  { key: "flow", number: "03", title: "코드 흐름", caption: "기능이 움직이는 길" },
  { key: "concept", number: "04", title: "개념 학습", caption: "내 코드로 이해해요" },
  { key: "quiz", number: "05", title: "이해도 확인", caption: "짧게 확인해 봐요" },
  { key: "mission", number: "06", title: "직접 수정", caption: "이제 내가 바꿔요" },
] as const;

export function LearnSidebar() {
  const { analysisId, featureId } = useParams<Params>();
  const pathname = usePathname();
  const base = `/learn/${analysisId}`;
  const last = pathname.split("/").pop();
  const currentKey = !featureId ? "" : STEPS.some((s) => s.key === last) ? last : "feature";

  return (
    <aside aria-label="학습 단계" className="flex w-[260px] shrink-0 flex-col items-start gap-[10px] bg-brand-purple-soft px-[20px] pt-[30px] pb-[22px]">
      <p className="font-manrope text-[9px] leading-[14px] font-bold whitespace-nowrap text-brand-purple">LEARNING MAP</p>
      {STEPS.map((step) => {
        const href = step.key === "" ? base : featureId ? `${base}/${featureId}${step.key === "feature" ? "" : `/${step.key}`}` : null;
        const active = step.key === currentKey;
        const body = (
          <>
            <span className="font-mono text-[9px] leading-[14px] whitespace-nowrap text-brand-purple">{step.number}</span>
            <span className="flex flex-col items-start gap-[2px] whitespace-nowrap">
              <span className="text-[11px] leading-[16px] font-bold text-text-primary">{step.title}</span>
              <span className="text-[8px] leading-[12px] text-text-muted">{step.caption}</span>
            </span>
          </>
        );
        const cls = `flex h-[58px] w-[218px] shrink-0 items-center gap-[10px] rounded-8 bg-surface px-[14px] py-[11px] ${active ? "" : "opacity-55"}`;
        return href ? (
          <Link key={step.number} href={href} aria-current={active ? "step" : undefined} className={`${cls} transition-opacity hover:opacity-100`}>
            {body}
          </Link>
        ) : (
          <div key={step.number} className={cls} title="먼저 기능을 골라 주세요">
            {body}
          </div>
        );
      })}
    </aside>
  );
}
