"use client";

import { useParams } from "next/navigation";
import { Fragment, useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PageIntro } from "@/components/demo/PageIntro";
import { CodeBlock, ErrorBox, Loading, useLoad } from "@/components/learn/states";
import { getFlow } from "@/lib/api";
import type { FlowStep } from "@/server/types";

const LAYER: Record<FlowStep["layer"], string> = {
  ui: "화면",
  state_logic: "상태·로직",
  api: "API",
  data: "데이터",
  config: "설정",
  other: "기타",
};

// 기능의 동작 흐름(F5). '추정' 연결은 점선 화살표로 구분한다(확정 화살표로 그리지 않음).
export default function FlowPage() {
  const { analysisId, featureId } = useParams<{ analysisId: string; featureId: string }>();
  const { data: flow, error, reload } = useLoad(`flow:${analysisId}:${featureId}`, () => getFlow(analysisId, featureId));
  const [selected, setSelected] = useState<number | null>(null);

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!flow) return <Loading message="코드가 움직이는 길을 정리하고 있어요" />;
  if (flow.steps.length === 0) {
    return <p className="text-[12px] text-text-muted">코드에서 확인할 수 있는 흐름을 찾지 못했어요.</p>;
  }

  const step = selected === null ? null : flow.steps[selected];
  const linkTo = (order: number) => flow.links.find((l) => l.to === order);

  return (
    <>
      <PageIntro grouped eyebrow="HOW IT WORKS" title="코드는 이렇게 움직여요" description="화면의 동작이 실제 코드에서 어떤 길을 따라가는지 단계별로 확인해 보세요." />

      <ol aria-label="동작 흐름" className="flex w-full flex-wrap items-center gap-[10px]">
        {flow.steps.map((s, i) => {
          const link = linkTo(s.order);
          const verified = link?.confidence === "verified";
          return (
            <Fragment key={s.order}>
              {link && (
                <li
                  aria-hidden
                  title={verified ? "import로 확인된 연결" : "AI가 추정한 연결"}
                  className={`font-manrope text-[14px] font-bold ${verified ? "text-brand-purple" : "text-text-muted"}`}
                >
                  {verified ? "→" : "⇢"}
                </li>
              )}
              <li>
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-pressed={selected === i}
                  className={`flex w-[200px] flex-col items-start gap-[6px] rounded-12 border bg-surface px-[16px] py-[14px] text-left transition-colors ${
                    selected === i ? "border-brand-purple" : "border-line hover:border-brand-purple/50"
                  }`}
                >
                  <span className="text-[9px] leading-[13px] font-bold text-brand-purple">
                    {String(s.order).padStart(2, "0")} · {LAYER[s.layer]}
                  </span>
                  <span className="text-[11px] leading-[16px] font-bold text-text-primary">{s.title}</span>
                  <span className="font-mono text-[8px] leading-[12px] text-text-muted">
                    {s.reference.path.split("/").pop()} · {s.reference.start_line}
                  </span>
                </button>
              </li>
            </Fragment>
          );
        })}
      </ol>
      <p className="text-[10px] leading-[16px] text-text-muted">→ 실제 import로 확인된 연결 · ⇢ AI가 추정한 연결</p>

      {step && selected !== null ? (
        <section aria-label="선택한 단계" className="flex w-full items-stretch gap-[18px]">
          <div className="min-w-0 flex-1">
            <CodeBlock path={step.reference.path} start={step.reference.start_line} snippet={step.reference.snippet} commit={step.reference.commit_sha} />
          </div>
          <div className="flex w-[360px] shrink-0 flex-col gap-[14px] rounded-12 border border-line bg-surface p-[24px]">
            <p className="font-manrope text-[9px] font-bold text-brand-purple">
              {selected + 1} / {flow.steps.length} 단계
            </p>
            <p className="text-[18px] leading-[28px] font-bold text-text-primary">{step.title}</p>
            <p className="text-[11px] leading-[20px] text-text-muted">{step.description}</p>
            {selected < flow.steps.length - 1 ? (
              <PrimaryButton label="다음 단계" onClick={() => setSelected(selected + 1)} />
            ) : (
              <PrimaryButton href={`/learn/${analysisId}/${featureId}/concept`} label="이 코드 배우기" />
            )}
          </div>
        </section>
      ) : (
        <p className="text-[11px] leading-[18px] text-text-muted">위의 파일 카드를 누르면 그 단계의 실제 코드가 보여요.</p>
      )}
    </>
  );
}
