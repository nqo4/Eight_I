"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthNav } from "@/components/auth/AuthNav";
import { Brand } from "@/components/Brand";
import { PrimaryButton } from "@/components/PrimaryButton";
import { api, useSession, type ApiError } from "@/components/session/Session";
import { useCurrentUser, type User } from "@/lib/auth";
import type { LearningRecord } from "@/lib/records";
import type { Analysis } from "@/server/types";

const dateFmt = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" });
const secondaryBtn =
  "rounded-8 border border-line bg-surface px-4 py-2.5 text-sm font-bold text-text-primary hover:border-brand-purple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple disabled:opacity-60";

function Header() {
  return (
    <header className="flex h-16 w-full shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:h-[76px] sm:px-9">
      <Brand />
      <AuthNav />
    </header>
  );
}

function Stat({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-12 border border-line bg-surface px-5 py-4 sm:px-6 sm:py-5">
      <p className="text-xs font-bold text-text-muted">{label}</p>
      <p className="font-manrope text-2xl font-extrabold text-text-primary sm:text-3xl">{value}</p>
      {caption && <p className="text-xs text-text-muted">{caption}</p>}
    </div>
  );
}

// 미션은 AI 채점 최고 점수만 보여 준다(통과·실패 표시 없음).
function missionLabel(f: LearningRecord["features"][number]) {
  return f.mission_best_score === null ? "미션 전" : `미션 ${f.mission_best_score}점`;
}

function RecordCard({ record }: { record: LearningRecord }) {
  const { setAnalysis, isCurrent } = useSession();
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // '분석 결과 보기'를 누르면 다시 분석하지 않고 그 commit 기준 분석 결과를 연다(FR-13).
  const open = async () => {
    setOpening(true);
    setError(null);
    try {
      const { analysis } = await api<{ analysis: Analysis }>(`/api/analyses/${encodeURIComponent(record.analysis_id)}`);
      if (!isCurrent()) return;
      setAnalysis(analysis);
      router.push("/demo/overview");
    } catch (e) {
      if (!isCurrent()) return;
      setError((e as ApiError).message ?? "분석 결과를 불러오지 못했어요.");
      setOpening(false);
    }
  };

  return (
    <article data-testid="learning-record" className="flex w-full flex-col gap-3 rounded-12 border border-line bg-surface px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={open}
            disabled={opening}
            data-testid="record-repo"
            className="rounded-8 font-mono text-base font-bold break-all text-text-primary hover:text-brand-purple-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple"
          >
            {record.repo_id}
          </button>
          <span className="text-sm text-text-muted">
            분석 날짜 <span data-testid="record-analyzed-at">{dateFmt.format(new Date(record.analyzed_at))}</span>
          </span>
          <span className="text-sm text-text-muted">
            commit{" "}
            <span data-testid="record-commit" className="font-mono text-text-primary">
              {record.commit_sha.slice(0, 7)}
            </span>
          </span>
          <span className="text-sm text-text-muted">
            퀴즈 {record.quiz_total ? `${record.quiz_correct}/${record.quiz_total} 정답` : "아직 안 풂"}
          </span>
        </div>
        <PrimaryButton label={opening ? "불러오는 중" : "분석 결과 보기"} disabled={opening} onClick={open} />
      </div>
      {error && (
        <p role="alert" className="text-sm font-bold text-status-red">
          {error}
        </p>
      )}
      <ul className="flex flex-col divide-y divide-line">
        {record.features.map((f) => (
          <li key={f.id} data-testid="record-feature" className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
            <span className="w-full min-w-0 text-sm font-bold text-text-primary sm:w-auto sm:flex-1">{f.title}</span>
            <span className="text-xs text-text-muted sm:w-28 sm:text-right">
              {f.quiz_total ? `퀴즈 ${f.quiz_correct}/${f.quiz_total} 정답` : "퀴즈 전"}
            </span>
            <span
              data-testid="mission-status"
              title={f.mission_graded ? `채점 ${f.mission_graded}번 · 최근 ${f.mission_last_score}점` : undefined}
              className={`w-36 rounded-8 px-2 py-1 text-center text-xs font-bold ${
                f.mission_best_score !== null ? "bg-brand-purple-soft text-brand-purple-ink" : "text-text-muted"
              }`}
            >
              {missionLabel(f)}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function SignedIn({ user }: { user: User }) {
  const [state, setState] = useState<{ records: LearningRecord[] | null; error: ApiError | null; attempt: number }>({
    records: null,
    error: null,
    attempt: 0,
  });

  useEffect(() => {
    let alive = true;
    api<{ records: LearningRecord[] }>("/api/me/records")
      .then((r) => alive && setState((s) => ({ ...s, records: r.records, error: null })))
      .catch((e) => alive && setState((s) => ({ ...s, error: e as ApiError })));
    return () => {
      alive = false;
    };
  }, [state.attempt]);

  const { records, error } = state;
  const quizTotal = records?.reduce((n, r) => n + r.quiz_total, 0) ?? 0;
  const quizCorrect = records?.reduce((n, r) => n + r.quiz_correct, 0) ?? 0;
  const bestScores = records?.flatMap((r) => r.features.flatMap((f) => (f.mission_best_score === null ? [] : [f.mission_best_score])));
  const avgScore = bestScores?.length ? Math.round(bestScores.reduce((n, x) => n + x, 0) / bestScores.length) : null;

  return (
    <>
      <section className="flex flex-col gap-2">
        <span className="font-manrope text-sm font-bold text-brand-purple-ink">MY LEARNING</span>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">내 학습 기록</h1>
        <p className="text-sm text-text-muted">{user.name}님이 분석한 저장소와 퀴즈 결과, 수정 미션 점수예요.</p>
      </section>

      <section aria-label="내 정보와 학습 요약" className="flex w-full flex-wrap gap-4">
        <div className="flex w-full flex-col gap-3 rounded-12 bg-brand-purple-soft px-5 py-4 sm:w-auto sm:min-w-[260px] sm:px-6 sm:py-5">
          <p className="text-xs font-bold text-text-muted">내 정보</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-text-muted">이름</dt>
            <dd className="font-bold text-text-primary">{user.name}</dd>
            <dt className="text-text-muted">이메일</dt>
            <dd className="font-mono break-all text-text-primary">{user.email}</dd>
          </dl>
        </div>
        <Stat label="분석한 저장소" value={records ? `${records.length}개` : "-"} />
        <Stat
          label="퀴즈 정답"
          value={quizTotal ? `${quizCorrect}/${quizTotal}` : "-"}
          caption={quizTotal ? "문항별 첫 시도 기준" : "아직 푼 퀴즈가 없어요"}
        />
        <Stat
          label="미션 점수"
          value={avgScore === null ? "-" : `${avgScore}점`}
          caption={avgScore === null ? "아직 채점한 미션이 없어요" : `채점한 기능 ${bestScores?.length}개의 최고 점수 평균`}
        />
      </section>

      <section aria-label="분석한 저장소" className="flex w-full flex-col gap-4">
        <h2 className="text-lg font-bold text-text-primary">분석한 저장소</h2>
        {error ? (
          <div className="flex flex-col items-start gap-3">
            <p role="alert" className="text-sm font-bold text-status-red">
              {error.message}
            </p>
            <button type="button" className={secondaryBtn} onClick={() => setState((s) => ({ ...s, error: null, attempt: s.attempt + 1 }))}>
              다시 불러오기
            </button>
          </div>
        ) : records === null ? (
          <p className="text-sm text-text-muted">학습 기록을 불러오는 중이에요.</p>
        ) : records.length === 0 ? (
          <div className="flex w-full flex-col items-start gap-3 rounded-12 border border-dashed border-line bg-surface px-6 py-8">
            <p className="text-sm font-bold text-text-primary">아직 분석한 저장소가 없어요.</p>
            <p className="text-sm text-text-muted">홈에서 내 프로젝트를 분석하면 여기에 기록이 쌓여요.</p>
            <PrimaryButton href="/" label="홈에서 시작하기" />
          </div>
        ) : (
          records.map((r) => <RecordCard key={r.analysis_id} record={r} />)
        )}
      </section>
    </>
  );
}

export function MyPage() {
  const user = useCurrentUser();

  return (
    <div className="flex min-h-screen w-full flex-col bg-paper">
      <Header />
      <main className="flex w-full flex-col items-start gap-6 px-4 py-8 sm:gap-8 sm:px-8 xl:px-[72px] xl:py-12">
        {user === undefined ? null : user ? (
          <SignedIn key={user.email} user={user} />
        ) : (
          <section className="flex w-full max-w-[560px] flex-col items-start gap-4 rounded-12 border border-line bg-surface px-5 py-6 sm:px-8 sm:py-8">
            <span className="font-manrope text-sm font-bold text-brand-purple-ink">MY LEARNING</span>
            <h1 className="text-2xl font-bold text-text-primary">로그인하면 내 학습 기록을 볼 수 있어요.</h1>
            <p className="text-sm text-text-muted">분석한 저장소와 퀴즈 결과, 수정 미션 점수를 한곳에서 확인하세요.</p>
            <PrimaryButton href="/login" label="로그인하러 가기" />
          </section>
        )}
      </main>
    </div>
  );
}
