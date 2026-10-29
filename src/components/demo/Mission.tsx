"use client";

import { useEffect, useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { MissionGrader } from "@/components/demo/MissionGrader";
import { ErrorBox, Loading, refLabel, secondaryBtn } from "@/components/demo/ui";
import { useFeatureResource, useSession } from "@/components/session/Session";
import { saveMissionDone } from "@/lib/records";
import type { Exercise } from "@/server/types";

const hintName = { minimal: "최소 힌트", concept: "개념 힌트", code: "코드 힌트" } as const;
const label = "font-manrope text-xs font-bold tracking-wider text-brand-purple-ink";

export function Mission() {
  const { analysis, feature, record, remember, progress, loadError } = useSession();
  const { data, error, retry, slow } = useFeatureResource<{ exercise: Exercise }>("exercise");
  const checks = progress.missionChecks ?? {};
  const [hints, setHints] = useState(1);
  const done = progress.done;

  useEffect(() => {
    if (data) remember({ exercise: data.exercise });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (error) return <ErrorBox error={error} onRetry={loadError ? undefined : retry} home={Boolean(loadError)} />;
  if (!data) return <Loading slow={slow} />;
  const ex = data.exercise;
  const all = ex.acceptance_checks.every((_, i) => checks[i]);

  return (
    <section aria-label="직접 바꿔보기" className="grid w-full grid-cols-[minmax(0,1fr)_400px] items-start gap-[18px]">
      <div className="flex min-w-0 flex-col items-start gap-[18px] rounded-12 border border-line bg-surface px-[30px] py-7">
        <p className={label}>{ex.kind === "observe" ? "관찰 미션" : "작은 수정 미션"}</p>
        <p data-testid="exercise-goal" className="text-[22px] leading-9 font-bold text-balance text-text-primary">
          {ex.instruction}
        </p>
        <div className="flex w-full flex-col gap-1.5 rounded-8 bg-brand-purple-soft px-4 py-3">
          <p className="text-xs font-bold text-text-muted">수정 예상 위치</p>
          <ul data-testid="exercise-targets" className="flex flex-col gap-1 font-mono text-sm break-all text-brand-purple-ink">
            {ex.target_references.map((r) => (
              <li key={`${r.path}:${r.start_line}`}>{refLabel(r)}</li>
            ))}
          </ul>
        </div>
        {ex.target_references[0] && (
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-3">
            <div className="flex min-w-0 flex-col gap-1.5 rounded-8 bg-text-primary px-4 py-3 text-surface">
              <p className="text-xs font-bold text-surface/70">현재 코드</p>
              <pre className="overflow-auto font-mono text-sm leading-6">{ex.target_references[0].snippet.split("\n").slice(0, 3).join("\n")}</pre>
              <p className="font-mono text-xs break-all text-surface/70">{refLabel(ex.target_references[0])}</p>
            </div>
            <span aria-hidden className="self-center text-sm font-bold text-brand-purple-ink">→</span>
            <div className="flex min-w-0 flex-col gap-1.5 rounded-8 bg-brand-purple-soft px-4 py-3">
              <p className="text-xs font-bold text-text-muted">목표</p>
              <p className="text-sm leading-6 text-pretty">{ex.instruction}</p>
            </div>
          </div>
        )}
        <div className="flex w-full flex-col gap-2">
          <p className="text-sm font-bold text-text-primary">막혔나요? 힌트를 하나씩 열어 보세요</p>
          <ol data-testid="exercise-hints" className="flex flex-col gap-2">
            {ex.hints.slice(0, hints).map((h, i) => (
              <li key={i} className="rounded-8 bg-paper px-4 py-3 text-sm leading-6">
                <span className="font-bold">{hintName[h.level] ?? h.level}:</span> {h.text}
              </li>
            ))}
          </ol>
          {hints < ex.hints.length && (
            <div>
              <button type="button" className={secondaryBtn} onClick={() => setHints((n) => n + 1)}>
                다음 힌트 보기 ({hints}/{ex.hints.length})
              </button>
            </div>
          )}
        </div>
        {analysis && feature && <MissionGrader analysisId={analysis.id} featureId={feature.id} />}
      </div>

      <fieldset aria-labelledby="mission-checks" className="flex min-w-0 flex-col items-start gap-3 rounded-12 border border-line bg-surface px-[26px] py-7">
        <p className={label}>완료 체크</p>
        <h2 id="mission-checks" className="text-lg font-bold text-text-primary">
          직접 실행해 확인해요
        </h2>
        <p className="text-sm leading-6 text-text-muted">
          내 개발 환경에서 직접 고치고 앱을 실행해 확인한 뒤 체크하세요. CodeBack은 코드를 대신 고치거나 push하지 않아요.
        </p>
        <div className="flex w-full flex-col divide-y divide-line">
          {ex.acceptance_checks.map((c, i) => (
            <label key={i} className={`flex min-h-12 items-center gap-3 py-2.5 text-sm leading-6 ${done ? "" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                checked={!!checks[i]}
                disabled={done}
                onChange={() => record((p) => ({ ...p, missionChecks: { ...p.missionChecks, [i]: !p.missionChecks?.[i] } }))}
                className="size-5 shrink-0 accent-brand-purple"
              />
              {c}
            </label>
          ))}
        </div>
        <div className="flex w-full flex-col items-start gap-3 border-t border-line pt-4">
          {done ? (
            <span data-testid="exercise-done" className="font-bold text-status-green-ink">
              완료로 표시했어요
            </span>
          ) : (
            <>
              <PrimaryButton
                label="완료로 표시"
                disabled={!all}
                onClick={() => {
                  record((p) => ({ ...p, done: true, steps: { ...p.steps, mission: true } }));
                  if (analysis && feature) saveMissionDone(analysis.id, feature.id);
                }}
              />
              {!all && <span className="text-sm text-text-muted">성공 조건을 모두 체크하면 완료할 수 있어요</span>}
            </>
          )}
          <span data-testid="exercise-disclaimer" className="text-xs text-text-muted">
            자기 보고이며 실행 결과를 보증하지 않음
          </span>
        </div>
      </fieldset>
    </section>
  );
}
