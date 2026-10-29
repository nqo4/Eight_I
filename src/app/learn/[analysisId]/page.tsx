"use client";

import { useParams } from "next/navigation";
import { FeatureCard } from "@/components/FeatureCard";
import { PageIntro } from "@/components/demo/PageIntro";
import { ErrorBox, Loading, useLoad } from "@/components/learn/states";
import { getAnalysis } from "@/lib/api";

// 프로젝트 개요와 기능 카드(FR-03·FR-04). 흐름 S1의 결과 화면, S2~S7의 시작 화면.
export default function LearnOverviewPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const { data: a, error, reload } = useLoad(`analysis:${analysisId}`, () => getAnalysis(analysisId));

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!a) return <Loading message="분석 결과를 불러오고 있어요" />;

  const repo = a.repository;

  return (
    <>
      <PageIntro grouped eyebrow="PROJECT OVERVIEW" title="먼저, 이 프로젝트를 한눈에 볼까요?" description="코드 전체가 아니라 내가 아는 기능에서 시작하면 훨씬 쉬워요." />

      <section aria-label="저장소 정보" className="flex w-full flex-col gap-[12px] rounded-12 bg-brand-purple-soft px-[24px] py-[20px]">
        <div className="flex flex-wrap items-baseline gap-x-[12px] gap-y-[4px]">
          <h2 className="text-[17px] leading-[24px] font-bold text-text-primary">{repo.name}</h2>
          <span className="font-mono text-[10px] text-text-muted">
            {repo.owner}/{repo.name}
          </span>
        </div>
        <p className="text-[12px] leading-[20px] text-text-primary">{a.overview.summary}</p>
        <p className="text-[11px] leading-[18px] text-text-muted">{a.overview.purpose}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-[14px] gap-y-[4px] text-[10px] leading-[16px]">
          <dt className="text-text-muted">기본 브랜치</dt>
          <dd className="font-mono text-text-primary">{repo.default_branch}</dd>
          <dt className="text-text-muted">분석 기준 commit</dt>
          <dd className="font-mono text-text-primary" title={repo.commit_sha}>
            {repo.commit_sha.slice(0, 7)}
          </dd>
          {repo.last_commit_at && (
            <>
              <dt className="text-text-muted">최종 수정</dt>
              <dd className="text-text-primary">{new Date(repo.last_commit_at).toLocaleString("ko-KR")}</dd>
            </>
          )}
        </dl>
        <ul aria-label="기술 스택" className="flex flex-wrap gap-[6px]">
          {a.overview.stack.map((s) => (
            <li
              key={s.name}
              title={s.note ?? undefined}
              className={`rounded-8 px-[8px] py-[4px] text-[10px] leading-[14px] font-bold ${
                s.status === "confirmed" ? "bg-surface text-brand-purple" : "border border-dashed border-line text-text-muted"
              }`}
            >
              {s.name}
              {s.status === "unconfirmed" ? " · 확인 불가" : ""}
            </li>
          ))}
        </ul>
        {a.overview.support.status === "limited" && <p className="text-[10px] leading-[16px] text-text-muted">{a.overview.support.reason}</p>}
      </section>

      <div className="flex w-full items-start justify-between">
        <h2 className="text-[18px] leading-[26px] font-bold text-text-primary">어떤 기능부터 알아볼까요?</h2>
        <span className="rounded-12 bg-brand-purple-soft px-[10px] py-[6px] text-[9px] leading-[14px] font-bold text-brand-purple">
          {a.features.length}개 기능 발견
        </span>
      </div>

      {a.features.length === 0 ? (
        <p className="w-full rounded-12 border border-line bg-surface px-[24px] py-[20px] text-[12px] leading-[20px] text-text-muted">{a.features_notice}</p>
      ) : (
        <div className="grid w-full grid-cols-2 gap-[12px]">
          {a.features.map((f, i) => (
            <FeatureCard
              key={f.id}
              number={String(i + 1).padStart(2, "0")}
              title={f.title}
              description={f.summary}
              files={[...new Set(f.code_references.map((r) => r.path.split("/").pop() ?? r.path))]}
              evidenceCount={f.code_references.length}
              href={`/learn/${a.id}/${f.id}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
