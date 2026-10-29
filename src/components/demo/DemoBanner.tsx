"use client";

import { useSession } from "@/components/session/Session";

export function DemoBanner() {
  const { analysis } = useSession();
  if (analysis && analysis.mode !== "demo") return null;
  return (
    <div className="flex w-full items-center gap-2.5 rounded-8 bg-brand-purple-soft px-3.5 py-2.5">
      <span className="rounded-12 bg-brand-purple px-2.5 py-1 text-xs font-bold text-surface">DEMO</span>
      <p className="text-sm text-text-muted">
        준비된 공개 샘플 프로젝트{analysis ? `(${analysis.repository.id})` : ""}를 보고 있어요. 내 저장소를 분석한 결과가 아니에요.
      </p>
    </div>
  );
}
