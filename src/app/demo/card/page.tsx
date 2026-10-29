"use client";

// 보류(기획 검토): 문서에 없는 기능 — 기획검토-보류목록.md A2 (내 설명 카드)
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PageIntro } from "@/components/demo/PageIntro";
import { Loading, refLabel, secondaryBtn, stripNumber } from "@/components/demo/ui";
import { useSession } from "@/components/session/Session";

const label = "font-manrope text-xs font-bold tracking-wider text-brand-purple-ink";

export default function CardPage() {
  const router = useRouter();
  const { analysis, feature, progress, cache, ensure } = useSession();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!analysis || !feature) ensure();
  }, [analysis, feature, ensure]);

  if (!analysis || !feature) return <Loading />;

  const steps = cache.flow ? [...cache.flow.steps].sort((a, b) => a.order - b.order) : [];
  const ranges = new Map<string, Set<string>>();
  for (const r of [...feature.code_references, ...steps.map((s) => s.reference)]) {
    const set = ranges.get(r.path) ?? new Set<string>();
    set.add(`${r.start_line}–${r.end_line}`);
    ranges.set(r.path, set);
  }
  const files = [...ranges].map(([path, set]) => `${path} (${[...set].join(", ")}행)`);
  const count = (rec: Record<string | number, boolean>) => {
    const tried = Object.keys(rec).length;
    return tried ? `${Object.values(rec).filter(Boolean).length}/${tried} 맞힘` : "하지 않음";
  };
  const flowLine = count(progress.flow);
  const quizLine = count(progress.quiz);
  const change = cache.exercise
    ? `${cache.exercise.instruction} (${progress.done ? "완료로 표시함 — 자기 보고, 실행 결과는 확인되지 않음" : "아직 하지 않음"})`
    : "아직 미션을 열지 않음";
  const repo = analysis.repository.id;
  const markdown = [
    `# 내 설명 카드: ${feature.title}`,
    `프로젝트: ${repo}`,
    "",
    "## 한 줄 설명",
    feature.summary,
    "",
    "## 동작 순서",
    ...(steps.length ? steps.map((s) => `${s.order}. ${stripNumber(s.title)} — ${refLabel(s.reference)}`) : ["(흐름을 아직 보지 않음)"]),
    "",
    "## 핵심 파일",
    ...files.map((f) => `- ${f}`),
    "",
    "## 내가 해 본 것",
    `- 흐름 예측: ${flowLine}`,
    `- 연습 문제(첫 시도): ${quizLine}`,
    `- 바꾼 내용: ${change}`,
  ].join("\n");

  return (
    <>
      <PageIntro
        eyebrow="EXPLAIN CARD"
        title="내 설명 카드"
        description="발표 준비나 팀원에게 설명할 때 쓰세요. 수정 성공은 자기 보고라서 CodeBack이 확인해 주지 않아요."
      />
      <article data-testid="explain-card" className="flex w-full max-w-[860px] flex-col gap-5 rounded-16 border border-line bg-surface px-10 py-8">
        <header className="flex flex-col gap-1 border-b border-line pb-4">
          <h2 className="text-2xl font-bold text-balance">{feature.title}</h2>
          <p className="text-sm text-text-muted">프로젝트: {repo}</p>
        </header>
        <section className="flex flex-col gap-1.5">
          <h3 className={label}>한 줄 설명</h3>
          <p className="text-base">{feature.summary}</p>
        </section>
        <section className="flex flex-col gap-1.5">
          <h3 className={label}>동작 순서</h3>
          {steps.length ? (
            <ol className="flex flex-col gap-1.5">
              {steps.map((s) => (
                <li key={s.order} className="flex gap-3 text-sm leading-6">
                  <span className="w-5 shrink-0 font-mono text-brand-purple-ink">{s.order}</span>
                  <span>
                    {stripNumber(s.title)}
                    <span className="ml-2 font-mono text-text-muted">{refLabel(s.reference)}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-text-muted">(흐름을 아직 보지 않음)</p>
          )}
        </section>
        <section className="flex flex-col gap-1.5">
          <h3 className={label}>핵심 파일</h3>
          <ul className="flex flex-wrap gap-1.5">
            {files.map((f) => (
              <li key={f} className="rounded-8 bg-brand-purple-soft px-2.5 py-1 font-mono text-xs text-brand-purple-ink">
                {f}
              </li>
            ))}
          </ul>
        </section>
        <section className="flex flex-col gap-1.5">
          <h3 className={label}>내가 해 본 것</h3>
          <ul className="flex flex-col gap-1 text-sm leading-6">
            <li>흐름 예측: {flowLine}</li>
            <li>연습 문제(첫 시도): {quizLine}</li>
            <li>바꾼 내용: {change}</li>
          </ul>
        </section>
      </article>
      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton
          label="카드 복사하기"
          onClick={async () => {
            await navigator.clipboard.writeText(markdown);
            setCopied(true);
          }}
        />
        <button type="button" className={secondaryBtn} onClick={() => router.push("/demo/overview")}>
          다른 기능도 배우기
        </button>
        {copied && (
          <span role="status" className="text-sm font-bold text-status-green-ink">
            복사했어요
          </span>
        )}
      </div>
    </>
  );
}
