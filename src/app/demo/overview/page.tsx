"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FeatureCard } from "@/components/FeatureCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PageIntro } from "@/components/demo/PageIntro";
import { ErrorBox, Loading, refLabel, secondaryBtn } from "@/components/demo/ui";
import { useSession } from "@/components/session/Session";

const fileName = (path: string) => path.split("/").pop() ?? path;

export default function OverviewPage() {
  const router = useRouter();
  const { analysis, feature, selectFeature, ensure, loadError, startDemo } = useSession();
  const detailRef = useRef<HTMLElement>(null);
  const [picked, setPicked] = useState(0);

  useEffect(() => {
    if (picked) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [picked]);

  useEffect(() => {
    if (!analysis) ensure();
  }, [analysis, ensure]);

  if (loadError) return <ErrorBox error={loadError} onDemo={startDemo} />;
  if (!analysis) return <Loading />;

  const repo = analysis.repository;
  const confirmed = analysis.overview.stack.filter((s) => s.status === "confirmed");
  const unconfirmed = analysis.overview.stack.filter((s) => s.status === "unconfirmed");

  return (
    <>
      <PageIntro
        eyebrow="PROJECT OVERVIEW"
        title="먼저, 이 프로젝트를 한눈에 볼까요?"
        description="코드 전체가 아니라 내가 아는 기능에서 시작하면 훨씬 쉬워요. 아래 기능 카드 중 하나를 골라 보세요."
      />

      <div className="flex w-full flex-col gap-4 rounded-12 bg-brand-purple-soft px-6 py-5">
        <dl className="flex flex-wrap items-end gap-x-10 gap-y-3">
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-bold text-text-muted">저장소</dt>
            <dd data-testid="repo-name" className="text-xl font-bold text-text-primary">
              {repo.id}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-bold text-text-muted">기본 브랜치</dt>
            <dd data-testid="repo-branch" className="font-mono text-sm">
              {repo.default_branch}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-bold text-text-muted">분석 기준 commit</dt>
            <dd data-testid="repo-commit" className="font-mono text-sm">
              {repo.commit_sha.slice(0, 12)}
            </dd>
          </div>
        </dl>
        <p data-testid="project-summary" className="text-lg font-bold text-pretty text-text-primary">
          {analysis.overview.summary}
        </p>
        <p className="text-sm leading-6 text-pretty text-text-muted">{analysis.overview.purpose}</p>
        <section aria-label="기술 스택" className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-text-muted">기술 스택</h2>
          <ul className="flex flex-wrap gap-1.5">
            {confirmed.map((s) => (
              <li key={s.name} className="rounded-8 bg-surface px-2.5 py-1 text-xs font-bold text-brand-purple-ink" title={s.note ?? undefined}>
                {s.name}
              </li>
            ))}
            {unconfirmed.map((s) => (
              <li key={s.name} className="rounded-8 border border-dashed border-text-muted/40 px-2.5 py-1 text-xs text-text-muted" title={s.note ?? undefined}>
                {s.name} · 확인 불가
              </li>
            ))}
          </ul>
        </section>
        {analysis.overview.support.status === "limited" && analysis.overview.support.reason && (
          <p role="note" className="text-sm text-text-muted">
            {analysis.overview.support.reason}
          </p>
        )}
      </div>

      <div className="flex w-full items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">어떤 기능부터 알아볼까요?</h2>
        <span className="rounded-12 bg-brand-purple-soft px-2.5 py-1 text-xs font-bold text-brand-purple-ink">
          {analysis.features.length}개 기능 발견
        </span>
      </div>

      <section aria-label="기능 목록" className="grid w-full grid-cols-2 gap-3">
        {analysis.features.length === 0 && (
          <p role="note" className="col-span-2 text-sm text-text-muted">
            {analysis.features_notice ?? "코드 근거가 있는 기능을 찾지 못했어요."}
          </p>
        )}
        {analysis.features.map((f, i) => (
          <FeatureCard
            key={f.id}
            number={String(i + 1).padStart(2, "0")}
            title={f.title}
            description={f.summary}
            files={[...new Set(f.code_references.map((r) => fileName(r.path)))]}
            evidenceCount={f.code_references.length}
            selected={feature?.id === f.id}
            onSelect={() => {
              selectFeature(f);
              setPicked((n) => n + 1);
            }}
          />
        ))}
      </section>

      {feature && (
        <section
          ref={detailRef}
          aria-label="선택한 기능"
          className="flex w-full scroll-mt-6 flex-col gap-4 rounded-12 border border-brand-purple bg-surface px-7 py-6"
        >
          <p className="font-manrope text-xs font-bold tracking-wider text-brand-purple-ink">선택한 기능</p>
          <h2 data-testid="feature-title" className="text-2xl font-bold text-text-primary">
            {feature.title}
          </h2>
          <p data-testid="feature-summary" className="text-base text-text-muted">
            {feature.summary}
          </p>
          <div className="flex flex-col gap-1.5">
            <h3 className="text-xs font-bold text-text-muted">근거 파일</h3>
            <ul data-testid="feature-files" className="flex flex-col gap-1 font-mono text-sm text-brand-purple-ink">
              {feature.code_references.map((r) => (
                <li key={`${r.path}:${r.start_line}`}>{refLabel(r)}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-start gap-1.5 border-t border-line pt-4">
            <PrimaryButton label="이 기능 어떻게 동작해?" onClick={() => router.push("/demo/flow")} />
            <p className="text-sm text-text-muted">처음이라면 여기서 시작하세요. 왼쪽 순서대로 진행돼요.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
            <span>바로 가기:</span>
            <button type="button" className={secondaryBtn} onClick={() => router.push("/demo/concept")}>
              이 코드 배우기
            </button>
            <button type="button" className={secondaryBtn} onClick={() => router.push("/demo/quiz")}>
              이해도 확인
            </button>
            <button type="button" className={secondaryBtn} onClick={() => router.push("/demo/mission")}>
              이제 네가 직접 바꿔봐
            </button>
          </div>
        </section>
      )}
    </>
  );
}
