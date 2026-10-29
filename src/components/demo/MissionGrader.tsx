"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ErrorBox, Loading } from "@/components/demo/ui";
import type { ApiError } from "@/components/session/Session";
import { gradeMission, type MissionGrade } from "@/lib/records";

// FR-08 수정 미션 채점: 고친 코드를 붙여 넣고 '채점하기' → 0~100점 AI 추정 점수와 피드백(통과·실패, 조건별 결과는 보여 주지 않음).
const label = "font-manrope text-xs font-bold tracking-wider text-brand-purple-ink";

// 점수만 보여 준다(통과·실패, 조건별 충족 여부는 표시하지 않음).
function ScoreCard({ grade }: { grade: MissionGrade }) {
  return (
    <div data-testid="mission-grade" className="flex w-full flex-col gap-4 rounded-12 border border-line bg-surface p-5">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold text-text-muted">AI 추정 점수</p>
        <p className="font-manrope text-5xl leading-none font-extrabold text-brand-purple-ink">
          <span data-testid="mission-score">{grade.score}</span>
          <span className="ml-1 text-xl">점</span>
          <span className="ml-1 text-base font-bold text-text-muted">/ 100</span>
        </p>
      </div>
      <div
        role="meter"
        aria-label="수정 미션 점수"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={grade.score}
        className="h-2.5 w-full overflow-hidden rounded-8 bg-paper"
      >
        <div className="h-full rounded-8 bg-brand-purple" style={{ width: `${grade.score}%` }} />
      </div>

      {grade.feedback && <p className="text-sm leading-6 text-pretty text-text-primary">{grade.feedback}</p>}
      {grade.hint && (
        <p className="rounded-8 bg-paper px-4 py-3 text-sm leading-6">
          <span className="font-bold">다음 힌트:</span> {grade.hint}
        </p>
      )}
      <p data-testid="exercise-disclaimer" className="text-xs text-text-muted">
        {grade.disclaimer}
      </p>
    </div>
  );
}

// 고친 코드를 붙여 넣으면 AI가 성공 조건마다 판단해 0~100점을 매긴다(실행하지 않음). 점수는 '내 학습 기록'에 남는다.
export function MissionGrader({ analysisId, featureId, onGraded }: { analysisId: string; featureId: string; onGraded?: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [grade, setGrade] = useState<MissionGrade | null>(null);
  const [graded, setGraded] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // 새로 제출하면 화면의 이전 점수를 먼저 지운다. 재채점이 실패해도 이전 점수가 지금 코드의 점수처럼 보이지 않게 한다(#10).
  // 서버에 남은 최고 점수는 그대로 두고, 입력한 코드도 지우지 않는다.
  const submit = async () => {
    setBusy(true);
    setError(null);
    setGrade(null);
    try {
      setGrade((await gradeMission(analysisId, featureId, code)).grade);
      setGraded(true);
      onGraded?.();
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="mission-grade-title" className="flex w-full flex-col gap-3 border-t border-line pt-5">
      <p className={label}>점수 받기</p>
      <h2 id="mission-grade-title" className="text-lg font-bold text-text-primary">
        고친 코드로 점수 받기
      </h2>
      <p className="text-sm leading-6 text-text-muted">
        내 개발 환경에서 고친 부분을 붙여 넣으면 AI가 성공 조건마다 확인해 0~100점으로 알려 줘요. 코드는 실행하지 않아요.
      </p>
      <label htmlFor="mission-code" className="sr-only">
        고친 코드
      </label>
      <textarea
        id="mission-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        // 채점 중에는 고치지 못하게 잠가서, 돌아온 점수가 제출한 코드의 점수임을 분명히 한다.
        readOnly={busy}
        aria-busy={busy}
        rows={7}
        spellCheck={false}
        placeholder="고친 코드를 여기에 붙여 넣으세요 (API 키 같은 비밀값은 빼 주세요)"
        className="w-full resize-y rounded-8 border border-line bg-paper px-4 py-3 font-mono text-sm leading-6 text-text-primary outline-none placeholder:text-text-muted focus:border-brand-purple"
      />
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton label={graded ? "다시 채점하기" : "채점하기"} disabled={busy || !code.trim()} onClick={submit} />
        {!code.trim() && <span className="text-sm text-text-muted">코드를 붙여 넣으면 채점할 수 있어요</span>}
      </div>
      {busy && <Loading slow />}
      {error && <ErrorBox error={error} onRetry={submit} />}
      {grade && !busy && <ScoreCard grade={grade} />}
    </section>
  );
}
