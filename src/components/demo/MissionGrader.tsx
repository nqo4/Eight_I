"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ErrorBox, Loading } from "@/components/demo/ui";
import type { ApiError } from "@/components/session/Session";
import { gradeMission, type MissionGrade } from "@/lib/records";

const label = "font-manrope text-xs font-bold tracking-wider text-brand-purple-ink";

// 점수 구간별 색: 모두 통과(초록) · 절반 이상(보라) · 그 아래(빨강)
function scoreTone(g: MissionGrade) {
  if (g.passed) return { text: "text-status-green-ink", bar: "bg-status-green", badge: "bg-status-green/10 text-status-green-ink" };
  if (g.score >= 50) return { text: "text-brand-purple-ink", bar: "bg-brand-purple", badge: "bg-brand-purple-soft text-brand-purple-ink" };
  return { text: "text-status-red", bar: "bg-status-red", badge: "bg-status-red-soft text-status-red" };
}

function ScoreCard({ grade }: { grade: MissionGrade }) {
  const tone = scoreTone(grade);
  const met = grade.checks.filter((c) => c.met).length;
  return (
    <div data-testid="mission-grade" className="flex w-full flex-col gap-4 rounded-12 border border-line bg-surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold text-text-muted">AI 추정 점수</p>
          <p className={`font-manrope text-5xl leading-none font-extrabold ${tone.text}`}>
            <span data-testid="mission-score">{grade.score}</span>
            <span className="ml-1 text-xl">점</span>
          </p>
        </div>
        <span className={`rounded-8 px-3 py-1.5 text-sm font-bold ${tone.badge}`}>
          {grade.passed ? "모든 조건 통과" : `조건 ${met}/${grade.checks.length} 충족`}
        </span>
      </div>
      <div
        role="meter"
        aria-label="수정 미션 점수"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={grade.score}
        className="h-2.5 w-full overflow-hidden rounded-8 bg-paper"
      >
        <div className={`h-full rounded-8 ${tone.bar}`} style={{ width: `${grade.score}%` }} />
      </div>

      <ul className="flex flex-col divide-y divide-line">
        {grade.checks.map((c, i) => (
          <li key={i} className="flex items-start gap-3 py-2.5">
            <span
              aria-hidden
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-surface ${
                c.met ? "bg-status-green" : "bg-status-red"
              }`}
            >
              {c.met ? "✓" : "✕"}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-bold text-text-primary">
                <span className="sr-only">{c.met ? "충족: " : "미충족: "}</span>
                {c.condition}
              </span>
              <span className="text-sm leading-6 text-text-muted">{c.reason}</span>
            </span>
          </li>
        ))}
      </ul>

      {grade.feedback && <p className="text-sm leading-6 text-pretty text-text-primary">{grade.feedback}</p>}
      {grade.hint && (
        <p className="rounded-8 bg-paper px-4 py-3 text-sm leading-6">
          <span className="font-bold">다음 힌트:</span> {grade.hint}
        </p>
      )}
      <p className="text-xs text-text-muted">{grade.disclaimer}</p>
    </div>
  );
}

// 고친 코드를 붙여 넣으면 AI가 성공 조건마다 판단해 0~100점을 매긴다(실행하지 않음). 점수는 '내 학습 기록'에 남는다.
export function MissionGrader({ analysisId, featureId }: { analysisId: string; featureId: string }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [grade, setGrade] = useState<MissionGrade | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      setGrade((await gradeMission(analysisId, featureId, code)).grade);
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
        rows={7}
        spellCheck={false}
        placeholder="고친 코드를 여기에 붙여 넣으세요 (API 키 같은 비밀값은 빼 주세요)"
        className="w-full resize-y rounded-8 border border-line bg-paper px-4 py-3 font-mono text-sm leading-6 text-text-primary outline-none placeholder:text-text-muted focus:border-brand-purple"
      />
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton label={grade ? "다시 채점하기" : "채점하기"} disabled={busy || !code.trim()} onClick={submit} />
        {!code.trim() && <span className="text-sm text-text-muted">코드를 붙여 넣으면 채점할 수 있어요</span>}
      </div>
      {busy && <Loading slow />}
      {error && <ErrorBox error={error} onRetry={submit} />}
      {grade && !busy && <ScoreCard grade={grade} />}
    </section>
  );
}
