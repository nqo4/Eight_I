"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { CodeExcerpt, ErrorBox, Loading, refLabel, secondaryBtn, stripNumber } from "@/components/demo/ui";
import { useFeatureResource, useSession } from "@/components/session/Session";
import type { Flow } from "@/server/types";

// FR-05 기능 동작 흐름: 화면·상태/로직·서버/API·DB 요약, 단계별 파일 카드, '다음 단계'·'이전 단계', 확인 못 한 연결은 'AI 추정'.
const layerName: Record<string, string> = {
  ui: "화면",
  state_logic: "상태·로직",
  api: "서버·API",
  data: "DB",
  config: "설정/기타",
  other: "설정/기타",
};
const legendLayers = ["ui", "state_logic", "api", "data"] as const;

export function FlowSteps() {
  const router = useRouter();
  const { feature, record, remember, progress, loadError } = useSession();
  const { data, error, retry, slow } = useFeatureResource<{ flow: Flow }>("flow");
  const open = progress.flowView?.open ?? 0;
  const revealed = progress.flowView?.revealed ?? 1;
  const setView = (nextOpen: number, nextRevealed: number, total: number) =>
    record((p) => ({
      ...p,
      flowView: { open: nextOpen, revealed: nextRevealed },
      steps: nextRevealed >= total ? { ...p.steps, flow: true } : p.steps,
    }));

  useEffect(() => {
    if (data) remember({ flow: data.flow });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (error) return <ErrorBox error={error} onRetry={loadError ? undefined : retry} home={Boolean(loadError)} />;
  if (!data || !feature) return <Loading slow={slow} />;

  const steps = [...data.flow.steps].sort((a, b) => a.order - b.order).map((s) => ({ ...s, title: stripNumber(s.title) }));
  if (steps.length === 0) {
    return (
      <section aria-label="동작 흐름" className="flex w-full flex-col items-start gap-3">
        <p role="note" className="text-sm text-text-muted">이 기능의 동작 흐름을 코드에서 확인하지 못했어요. 개념 학습에서 관련 코드를 먼저 살펴보세요.</p>
        <PrimaryButton label="이 코드 배우기" onClick={() => router.push("/demo/concept")} />
      </section>
    );
  }
  const step = steps[Math.min(open, steps.length - 1)];
  const isLast = open === steps.length - 1;
  const finished = revealed >= steps.length;
  const inferred = (order: number) => data.flow.links.find((l) => l.to === order)?.confidence !== "verified";

  const goNext = () => setView(open + 1, Math.max(revealed, open + 2), steps.length);
  const setOpen = (i: number) => setView(i, revealed, steps.length);


  return (
    <section aria-label="동작 흐름" className="flex w-full flex-col gap-5">
      <ol aria-label="화면에서 DB까지" className="grid w-full grid-cols-4 gap-2.5">
        {legendLayers.map((l, i) => {
          const orders = steps.filter((s) => s.layer === l).map((s) => s.order);
          return (
            <li key={l} data-testid="flow-legend-slot" className="flex min-w-0 items-center gap-2 rounded-8 bg-brand-purple-soft px-4 py-2.5 text-sm">
              <span className="font-bold text-brand-purple-ink">{layerName[l]}</span>
              <span className={orders.length ? "text-text-primary" : "text-text-muted"}>
                {orders.length ? `${orders.map((o) => `${o}단계`).join(", ")}` : "이 저장소에서 확인되지 않음"}
              </span>
              {i < legendLayers.length - 1 && <span aria-hidden="true" className="ml-auto text-text-muted">→</span>}
            </li>
          );
        })}
      </ol>
      <ol className="grid w-full gap-2.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => {
          const shown = i < revealed;
          return (
            <li key={s.order} className="min-w-0">
              <button
                type="button"
                data-testid="flow-step"
                aria-expanded={open === i}
                disabled={!shown}
                onClick={() => setOpen(i)}
                className={`flex h-full w-full min-w-0 flex-col items-start gap-1.5 rounded-12 border bg-surface px-4 py-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:bg-paper ${
                  open === i ? "border-brand-purple ring-1 ring-brand-purple" : "border-line hover:border-brand-purple/50"
                }`}
              >
                <span className="text-xs font-bold text-brand-purple-ink">
                  {String(i + 1).padStart(2, "0")}
                  {shown ? ` · ${layerName[s.layer] ?? s.layer}` : ""}
                  {shown && i > 0 && inferred(s.order) ? " · AI 추정" : ""}
                </span>
                <span className="text-sm font-bold text-text-primary">{shown ? s.title : "아직 열리지 않았어요"}</span>
                {shown && <span className="font-mono text-xs break-all text-text-muted">{refLabel(s.reference)}</span>}
              </button>
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-text-muted">‘AI 추정’은 import로 확인하지 못하고 AI가 추측한 연결이에요.</p>

      <div className="grid w-full grid-cols-[minmax(0,1fr)_360px] items-stretch overflow-clip rounded-12 border border-line bg-surface">
        <div className="min-w-0 bg-text-primary p-4">
          <CodeExcerpt r={step.reference} highlight />
        </div>
        <div className="flex flex-col items-start gap-4 p-7">
          <p className="font-manrope text-xs font-bold text-brand-purple-ink">
            지금 보는 코드 · {open + 1}/{steps.length}단계
          </p>
          <p className="text-xl leading-8 font-bold text-text-primary">{step.title}</p>
          <p className="text-sm leading-6 text-text-muted">{step.description}</p>

          <div className="flex flex-wrap items-center gap-2.5">
            {open > 0 && (
              <button type="button" className={secondaryBtn} onClick={() => setOpen(open - 1)}>
                이전 단계
              </button>
            )}
            {!isLast &&
              (finished ? (
                <button type="button" className={secondaryBtn} onClick={goNext}>
                  다음 단계
                </button>
              ) : (
                <PrimaryButton label="다음 단계" onClick={goNext} />
              ))}
            {finished && <PrimaryButton label="이 코드의 개념 배우기" onClick={() => router.push("/demo/concept")} />}
          </div>
        </div>
      </div>
    </section>
  );
}
