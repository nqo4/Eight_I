"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { CodeExcerpt, ErrorBox, Loading, refLabel, secondaryBtn, seededOrder, stripNumber } from "@/components/demo/ui";
import { useFeatureResource, useSession } from "@/components/session/Session";
import type { Flow } from "@/server/types";

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
  const { feature, record, remember, progress, loadError, startDemo } = useSession();
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

  if (error) return <ErrorBox error={error} onRetry={loadError ? undefined : retry} onDemo={loadError ? startDemo : undefined} />;
  if (!data || !feature) return <Loading slow={slow} />;

  const steps = [...data.flow.steps].sort((a, b) => a.order - b.order).map((s) => ({ ...s, title: stripNumber(s.title) }));
  const step = steps[open];
  const isLast = open === steps.length - 1;
  const finished = revealed >= steps.length;
  const inferred = (order: number) => data.flow.links.find((l) => l.to === order)?.confidence !== "verified";

  const goNext = () => setView(open + 1, Math.max(revealed, open + 2), steps.length);
  const setOpen = (i: number) => setView(i, revealed, steps.length);

  // 보류(기획 검토): 문서에 없는 기능 — 기획검토-보류목록.md A1 (다음 단계 먼저 맞혀 보기)
  const next = steps[open + 1];
  const canPredict = next && open + 1 >= revealed && progress.flow[open + 1] === undefined;
  const options = next
    ? (() => {
        const others = [...new Set(steps.filter((_, j) => j !== open + 1 && j !== open).map((s) => s.title))];
        const pool = [next.title, ...seededOrder(others.length, feature.id + open).slice(0, 2).map((k) => others[k])];
        return seededOrder(pool.length, `${feature.id}o${open}`).map((k) => pool[k]);
      })()
    : [];
  const guessed = progress.flow[open];

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
                <span className="text-sm font-bold text-text-primary">{shown ? s.title : "다음에 무슨 일이?"}</span>
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
          {guessed !== undefined && (
            <p data-testid="prediction-result" className={`text-sm font-bold ${guessed ? "text-status-green-ink" : "text-status-red"}`}>
              {guessed ? "맞혔어요!" : "아쉬워요. 실제로는 이 단계예요."}
            </p>
          )}
          <p className="text-xl leading-8 font-bold text-text-primary">{step.title}</p>
          <p className="text-sm leading-6 text-text-muted">{step.description}</p>

          {canPredict && (
            <div role="group" aria-label="다음에 일어날 일 예측" className="flex w-full flex-col gap-2 rounded-8 bg-brand-purple-soft p-3.5">
              <p className="text-sm font-bold text-text-primary">다음에 무슨 일이 일어날까요? 먼저 맞혀 보세요(선택).</p>
              {options.map((o) => (
                <button
                  key={o}
                  type="button"
                  className="rounded-8 border border-line bg-surface px-3 py-2 text-left text-sm hover:border-brand-purple"
                  onClick={() => {
                    record((p) => ({
                      ...p,
                      flow: { ...p.flow, [open + 1]: o === next.title },
                      flowView: { open: open + 1, revealed: Math.max(revealed, open + 2) },
                      steps: Math.max(revealed, open + 2) >= steps.length ? { ...p.steps, flow: true } : p.steps,
                    }));
                  }}
                >
                  {o}
                </button>
              ))}
            </div>
          )}

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
