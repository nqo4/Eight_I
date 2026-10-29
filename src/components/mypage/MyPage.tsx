"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthNav } from "@/components/auth/AuthNav";
import { Brand } from "@/components/Brand";
import { PrimaryButton } from "@/components/PrimaryButton";
import { api, readHistory, useSession, type HistoryEntry, type Progress, type StepKey } from "@/components/session/Session";
import { useCurrentUser, type User } from "@/lib/auth";
import type { Analysis } from "@/server/types";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "overview", label: "개요" },
  { key: "flow", label: "흐름" },
  { key: "concept", label: "개념" },
  { key: "quiz", label: "퀴즈" },
  { key: "mission", label: "미션" },
];

const dateFmt = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

type StudyRecord = ReturnType<typeof readHistory>[number];

function summarize(records: StudyRecord[]) {
  let steps = 0;
  let quizTotal = 0;
  let quizCorrect = 0;
  let missions = 0;
  for (const { progress } of records) {
    for (const p of Object.values(progress)) {
      steps += STEPS.filter((s) => p.steps?.[s.key]).length;
      const answers = Object.values(p.quiz ?? {});
      quizTotal += answers.length;
      quizCorrect += answers.filter(Boolean).length;
      if (p.done) missions += 1;
    }
  }
  return { steps, quizTotal, quizCorrect, missions };
}

function Header() {
  return (
    <header className="flex h-[76px] w-full shrink-0 items-center justify-between border-b border-line bg-surface px-9">
      <Brand />
      <AuthNav />
    </header>
  );
}

function Stat({ label, value, caption }: { label: string; value: string; caption?: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-12 border border-line bg-surface px-6 py-5">
      <p className="text-xs font-bold text-text-muted">{label}</p>
      <p className="font-manrope text-3xl font-extrabold text-text-primary">{value}</p>
      {caption && <p className="text-xs text-text-muted">{caption}</p>}
    </div>
  );
}

function FeatureRow({ title, progress }: { title: string; progress?: Progress }) {
  const answers = Object.values(progress?.quiz ?? {});
  const started = progress && STEPS.some((s) => progress.steps?.[s.key]);
  return (
    <li className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
      <span className="min-w-0 flex-1 text-sm font-bold text-text-primary">{title}</span>
      <ol aria-label={`${title} 진행 단계`} className="flex items-center gap-1.5">
        {STEPS.map((s) => {
          const done = Boolean(progress?.steps?.[s.key]);
          return (
            <li
              key={s.key}
              className={`rounded-8 px-2 py-1 text-xs font-bold ${done ? "bg-brand-purple text-surface" : "bg-paper text-text-muted"}`}
            >
              {s.label}
              <span className="sr-only">{done ? " 완료" : " 미완료"}</span>
            </li>
          );
        })}
      </ol>
      <span className="w-24 text-right text-xs text-text-muted">
        {answers.length ? `퀴즈 ${answers.filter(Boolean).length}/${answers.length} 정답` : started ? "퀴즈 전" : "시작 전"}
      </span>
      <span
        className={`w-20 rounded-8 px-2 py-1 text-center text-xs font-bold ${
          progress?.done ? "bg-brand-purple-soft text-brand-purple-ink" : "text-text-muted"
        }`}
      >
        {progress?.done ? "미션 완료" : "미션 전"}
      </span>
    </li>
  );
}

function RecordCard({ record }: { record: StudyRecord }) {
  const { entry, progress } = record;
  const { setAnalysis, selectFeature } = useSession();
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이어서 학습하기: 분석 결과를 다시 불러와 마지막으로 보던 기능부터 연다.
  const resume = async (entry: HistoryEntry) => {
    setOpening(true);
    setError(null);
    try {
      const path = entry.mode === "demo" ? "/api/demo" : `/api/analyses/${encodeURIComponent(entry.analysis_id)}`;
      const { analysis } = await api<{ analysis: Analysis }>(path);
      setAnalysis(analysis);
      const recent = entry.features.find((f) => progress[f.id]) ?? entry.features[0];
      const feature = analysis.features.find((f) => f.id === recent?.id) ?? analysis.features[0];
      if (feature) selectFeature(feature);
      router.push("/demo/overview");
    } catch {
      setError("이 분석 결과를 다시 불러오지 못했어요. 홈에서 저장소를 다시 분석해 주세요.");
      setOpening(false);
    }
  };

  return (
    <article className="flex w-full flex-col gap-3 rounded-12 border border-line bg-surface px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h3 className="font-mono text-base font-bold break-all text-text-primary">{entry.repo}</h3>
          <span
            className={`rounded-8 px-2 py-1 text-xs font-bold ${
              entry.mode === "demo" ? "bg-paper text-status-green-ink" : "bg-brand-purple-soft text-brand-purple-ink"
            }`}
          >
            {entry.mode === "demo" ? "샘플 프로젝트" : "내 저장소"}
          </span>
          <span className="font-mono text-xs text-text-muted">commit {entry.commit_sha.slice(0, 7)}</span>
          <span className="text-xs text-text-muted">마지막 학습 {dateTimeFmt.format(new Date(entry.updated_at))}</span>
        </div>
        <PrimaryButton label={opening ? "불러오는 중" : "이어서 학습하기"} disabled={opening} onClick={() => resume(entry)} />
      </div>
      {error && (
        <p role="alert" className="text-sm font-bold text-status-red">
          {error}
        </p>
      )}
      <ul className="flex flex-col divide-y divide-line">
        {entry.features.map((f) => (
          <FeatureRow key={f.id} title={f.title} progress={progress[f.id]} />
        ))}
      </ul>
    </article>
  );
}

function SignedIn({ user }: { user: User }) {
  // 로그인 상태는 브라우저에서만 알 수 있으므로 이 컴포넌트도 브라우저에서만 그려진다.
  const records = readHistory();
  const stats = summarize(records);

  return (
    <>
      <section className="flex flex-col gap-2">
        <span className="font-manrope text-sm font-bold text-brand-purple-ink">MY PAGE</span>
        <h1 className="text-3xl font-bold text-text-primary">{user.name}님의 학습 기록</h1>
        <p className="text-sm text-text-muted">이 브라우저에서 학습한 저장소와 진행 상황이에요.</p>
      </section>

      <section aria-label="내 정보와 학습 요약" className="flex w-full flex-wrap gap-4">
        <div className="flex min-w-[260px] flex-col gap-3 rounded-12 bg-brand-purple-soft px-6 py-5">
          <p className="text-xs font-bold text-text-muted">내 정보</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-text-muted">이름</dt>
            <dd className="font-bold text-text-primary">{user.name}</dd>
            <dt className="text-text-muted">이메일</dt>
            <dd className="font-mono break-all text-text-primary">{user.email}</dd>
            <dt className="text-text-muted">가입일</dt>
            <dd className="text-text-primary">{dateFmt.format(new Date(user.created_at))}</dd>
          </dl>
        </div>
        <Stat label="학습한 저장소" value={`${records.length}개`} />
        <Stat label="끝낸 학습 단계" value={`${stats.steps}개`} caption="개요·흐름·개념·퀴즈·미션 기준" />
        <Stat
          label="퀴즈 정답"
          value={stats.quizTotal ? `${stats.quizCorrect}/${stats.quizTotal}` : "-"}
          caption={stats.quizTotal ? "문제별 첫 시도 기준" : "아직 푼 퀴즈가 없어요"}
        />
        <Stat label="완료한 미션" value={`${stats.missions}개`} caption="자기 보고 기준" />
      </section>

      <section aria-label="학습한 저장소" className="flex w-full flex-col gap-4">
        <h2 className="text-lg font-bold text-text-primary">학습한 저장소</h2>
        {records.length === 0 ? (
          <div className="flex w-full flex-col items-start gap-3 rounded-12 border border-dashed border-line bg-surface px-6 py-8">
            <p className="text-sm font-bold text-text-primary">아직 학습 기록이 없어요.</p>
            <p className="text-sm text-text-muted">홈에서 내 저장소를 분석하거나 샘플로 체험해 보세요.</p>
            <PrimaryButton href="/" label="홈에서 시작하기" />
          </div>
        ) : (
          records.map((r) => <RecordCard key={r.entry.progress_key} record={r} />)
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
      <main className="flex w-full flex-col items-start gap-8 px-[72px] py-12">
        {user === undefined ? null : user ? (
          <SignedIn user={user} />
        ) : (
          <section className="flex w-full max-w-[560px] flex-col items-start gap-4 rounded-12 border border-line bg-surface px-8 py-8">
            <span className="font-manrope text-sm font-bold text-brand-purple-ink">MY PAGE</span>
            <h1 className="text-2xl font-bold text-text-primary">로그인하면 학습 기록을 볼 수 있어요.</h1>
            <p className="text-sm text-text-muted">분석한 저장소와 단계별 진행, 퀴즈 결과를 한곳에서 확인하세요.</p>
            <PrimaryButton href="/login" label="로그인하러 가기" />
          </section>
        )}
      </main>
    </div>
  );
}
