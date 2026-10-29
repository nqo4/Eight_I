"use client";

import { useEffect, useState } from "react";
import { MissionGrader } from "@/components/demo/MissionGrader";
import { highlightLines, LanguageTag, Tokens } from "@/components/demo/syntax";
import { ErrorBox, Loading, refLabel, secondaryBtn } from "@/components/demo/ui";
import { useFeatureResource, useSession } from "@/components/session/Session";
import type { Exercise } from "@/server/types";

const hintName = { minimal: "최소 힌트", concept: "개념 힌트", code: "코드 힌트" } as const;
const label = "font-manrope text-xs font-bold tracking-wider text-brand-purple-ink";

export function Mission() {
  const { analysis, feature, record, remember, loadError } = useSession();
  const { data, error, retry, slow } = useFeatureResource<{ exercise: Exercise }>("exercise");
  const [hints, setHints] = useState(1);

  useEffect(() => {
    if (data) remember({ exercise: data.exercise });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (error) return <ErrorBox error={error} onRetry={loadError ? undefined : retry} home={Boolean(loadError)} />;
  if (!data) return <Loading slow={slow} />;
  const ex = data.exercise;

  return (
    <section aria-label="직접 바꿔보기" className="grid w-full grid-cols-1 items-start gap-[18px] xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex min-w-0 flex-col items-start gap-[18px] rounded-12 border border-line bg-surface px-5 py-5 sm:px-[30px] sm:py-7">
        <p className={label}>{ex.kind === "observe" ? "관찰 미션" : "작은 수정 미션"}</p>
        <p data-testid="exercise-goal" className="text-lg leading-8 font-bold text-balance text-text-primary sm:text-[22px] sm:leading-9">
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
          <div className="grid w-full grid-cols-1 items-stretch gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-1.5 rounded-8 bg-text-primary px-4 py-3 text-surface">
              <p className="flex items-center justify-between gap-3 text-xs font-bold text-surface/70">
                현재 코드
                <LanguageTag path={ex.target_references[0].path} />
              </p>
              <pre className="overflow-auto font-mono text-sm leading-6">
                {highlightLines(ex.target_references[0].snippet, ex.target_references[0].path)
                  .slice(0, 3)
                  .map((tokens, i) => (
                    <div key={i}>
                      <Tokens tokens={tokens} />
                    </div>
                  ))}
              </pre>
              <p className="font-mono text-xs break-all text-surface/70">{refLabel(ex.target_references[0])}</p>
            </div>
            <span aria-hidden className="rotate-90 self-center justify-self-center text-sm font-bold text-brand-purple-ink sm:rotate-0">→</span>
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
        {analysis && feature && (
          <MissionGrader
            analysisId={analysis.id}
            featureId={feature.id}
            onGraded={() => record((p) => ({ ...p, steps: { ...p.steps, mission: true } }))}
          />
        )}
      </div>

      <aside aria-labelledby="mission-criteria" className="flex min-w-0 flex-col items-start gap-3 rounded-12 border border-line bg-surface px-5 py-5 sm:px-[26px] sm:py-7">
        <p className={label}>채점 기준</p>
        <h2 id="mission-criteria" className="text-lg font-bold text-text-primary">
          이 조건으로 점수를 매겨요
        </h2>
        <p className="text-sm leading-6 text-text-muted">
          내 개발 환경에서 직접 고친 뒤 코드를 붙여 넣으면, AI가 아래 조건을 얼마나 채웠는지 0~100점으로 알려 줘요. CodeBack은 코드를 대신 고치거나 push하지 않아요.
        </p>
        <ol data-testid="exercise-criteria" className="flex w-full list-decimal flex-col divide-y divide-line pl-5 marker:font-bold marker:text-brand-purple-ink">
          {ex.acceptance_checks.map((c, i) => (
            <li key={i} className="py-2.5 pl-1 text-sm leading-6">
              {c}
            </li>
          ))}
        </ol>
      </aside>
    </section>
  );
}
