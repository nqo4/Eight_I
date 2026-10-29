"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FeatureCard } from "@/components/FeatureCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PageIntro } from "@/components/demo/PageIntro";
import { highlightLines, LanguageTag, Tokens } from "@/components/demo/syntax";
import { ErrorBox, Loading, refLabel, secondaryBtn, techViews } from "@/components/demo/ui";
import { api, useSession, type ApiError } from "@/components/session/Session";
import type { Layer, LocateResult } from "@/server/types";

// F3: 폴더 역할은 화면·서버·DB·설정 중 하나. 판단 근거를 찾지 못한 폴더(other)는 '확인 불가'.
const layerTag: Record<Layer, string> = { ui: "화면", server: "서버", db: "DB", config: "설정", other: "확인 불가" };
const locateTag = { ui: "화면", server: "서버", db: "DB" } as const;

export default function OverviewPage() {
  const router = useRouter();
  const { analysis, feature, selectFeature, selectTech, ensure, loadError } = useSession();
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [located, setLocated] = useState<LocateResult | null>(null);
  const [locateError, setLocateError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!analysis) ensure();
  }, [analysis, ensure]);

  if (loadError) return <ErrorBox error={loadError} home />;
  if (!analysis) return <Loading />;

  const repo = analysis.repository;
  const stats = analysis.stats;
  const skipped = stats.total_files - stats.included_files;
  const techs = techViews(analysis.overview);
  const openFeature = (f: (typeof analysis.features)[number]) => {
    selectFeature(f);
    router.push("/demo/feature");
  };

  const locate = async () => {
    setLocating(true);
    setLocateError(null);
    try {
      const r = await api<{ result: LocateResult }>(`/api/analyses/${encodeURIComponent(analysis.id)}/locate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      setLocated(r.result);
    } catch (e) {
      setLocated(null);
      setLocateError(e as ApiError);
    } finally {
      setLocating(false);
    }
  };


  return (
    <>
      <PageIntro
        eyebrow="PROJECT OVERVIEW"
        title="먼저, 이 프로젝트의 구조를 볼까요?"
        description="코드 전체가 아니라 내가 아는 기술과 기능에서 시작하면 훨씬 쉬워요. 아래 '사용한 기술'이나 '기능' 목록에서 하나를 골라 보세요."
      />

      <div className="flex w-full flex-col gap-4 rounded-12 bg-brand-purple-soft px-4 py-4 sm:px-6 sm:py-5">
        <dl className="flex flex-wrap items-end gap-x-10 gap-y-3">
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-bold text-text-muted">저장소</dt>
            <dd data-testid="repo-name" className="text-xl font-bold break-all text-text-primary">
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
            <dd data-testid="repo-commit" className="font-mono text-sm break-all">
              {repo.commit_sha}
            </dd>
          </div>
          <a href={`/api/analyses/${encodeURIComponent(analysis.id)}/note`} download className={`${secondaryBtn} ml-auto`}>
            학습 노트 내려받기
          </a>
        </dl>
        <section aria-label="프로젝트 소개" className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-text-muted">프로젝트 소개</h2>
          <p data-testid="project-summary" className="text-lg font-bold text-pretty text-text-primary">
            {analysis.overview.summary}
          </p>
          <p className="text-sm leading-6 text-pretty text-text-muted">{analysis.overview.purpose}</p>
          <div data-testid="intro-sources" className="flex flex-wrap items-center gap-1.5">
            {analysis.overview.intro_inferred ? (
              <span className="rounded-8 bg-surface px-2 py-1 text-xs font-bold text-brand-purple-ink">AI 추정</span>
            ) : (analysis.overview.intro_sources ?? []).length === 0 ? (
              <span className="rounded-8 bg-surface px-2 py-1 text-xs font-bold text-text-muted">확인 불가</span>
            ) : (
              (analysis.overview.intro_sources ?? []).map((p) => (
                <span key={p} className="rounded-8 bg-surface px-2 py-1 font-mono text-xs break-all text-brand-purple-ink">
                  {p}
                </span>
              ))
            )}
          </div>
          <p data-testid="stack-summary" className="text-sm text-text-primary">
            <span className="font-bold text-text-muted">기술 스택 · </span>
            {techs.map((t) => t.name).join(" · ") || "확인 불가"}
          </p>
        </section>
        <p data-testid="analysis-stats" className="text-sm text-text-muted">
          분석에 쓴 파일 {stats.included_files}개 · 제외 {skipped}개 · 민감 파일 제외 {stats.skipped_sensitive ?? 0}개
        </p>
        <section aria-label="사용한 기술" className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-text-muted">사용한 기술</h2>
          <ul className="flex flex-wrap gap-2">
            {techs.map((t) => (
              <li key={t.name}>
                <button
                  type="button"
                  onClick={() => {
                    selectTech(t.name);
                    router.push("/demo/tech");
                  }}
                  className="flex flex-col items-start gap-0.5 rounded-8 border border-line bg-surface px-3 py-1.5 text-left hover:border-brand-purple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple"
                >
                  <span className="text-sm font-bold text-brand-purple-ink">{t.name}</span>
                  <span className="font-mono text-xs break-all text-text-muted">{t.references[0]?.path ?? "확인 불가"}</span>
                  {t.role && <span className="text-xs text-text-muted">{t.role}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section aria-label="주요 폴더" className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-text-muted">주요 폴더</h2>
          {analysis.overview.directories.length === 0 ? (
            <p className="text-sm text-text-muted">확인된 주요 폴더가 없어요.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {analysis.overview.directories.map((d) => (
                <li key={d.path} data-testid="directory" className="flex min-w-0 flex-wrap items-baseline gap-2 text-sm sm:flex-nowrap">
                  <span className="shrink-0 font-mono font-bold break-all text-text-primary">{d.path}</span>
                  <span className="shrink-0 rounded-8 bg-surface px-2 py-0.5 text-xs font-bold text-brand-purple-ink">{layerTag[d.layer ?? "other"]}</span>
                  <span className="min-w-0 text-text-muted">{d.role}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        {analysis.overview.support.status === "limited" && analysis.overview.support.reason && (
          <p role="note" className="text-sm text-text-muted">
            {analysis.overview.support.reason}
          </p>
        )}
      </div>

      <section aria-label="어디를 고쳐야 해?" className="flex w-full flex-col gap-3 rounded-12 border border-line bg-surface px-4 py-4 sm:px-6 sm:py-5">
        <h2 className="text-lg font-bold text-text-primary">어디를 고쳐야 해?</h2>
        <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            aria-label="어디를 고쳐야 해?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim() && !locating) locate();
            }}
            placeholder="바꾸고 싶은 동작을 문장으로 적어 보세요"
            className="min-h-11 min-w-0 flex-1 rounded-8 border border-line bg-surface px-4 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple"
          />
          <PrimaryButton label="위치 찾기" disabled={!query.trim() || locating} onClick={locate} />
        </div>
        {(analysis.locate_examples ?? []).length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {(analysis.locate_examples ?? []).map((ex) => (
              <li key={ex}>
                <button type="button" className={secondaryBtn} onClick={() => setQuery(ex)}>
                  {ex}
                </button>
              </li>
            ))}
          </ul>
        )}
        {locating && <Loading slow />}
        {locateError && <p role="alert" className="text-sm font-bold text-status-red">{locateError.message}</p>}
        {located && !locating && (
          <div className="flex flex-col gap-2">
            {located.locations.length > 0 && (
              <ul data-testid="locate-result" className="flex flex-col divide-y divide-line">
                {located.locations.map((l, i) => (
                  <li key={`${l.reference.path}:${l.reference.start_line}:${i}`} className="flex flex-col gap-1 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold break-all text-brand-purple-ink">{refLabel(l.reference)}</span>
                      <span className="rounded-8 bg-brand-purple-soft px-2 py-0.5 text-xs font-bold text-brand-purple-ink">{locateTag[l.layer]}</span>
                    </div>
                    <p className="text-sm leading-6 text-pretty">{l.reason}</p>
                    {l.excerpt && (
                      // 원래 코드만 보여 주고, 바꿔야 하는 줄만 하이라이트한다(고친 코드는 보여 주지 않음).
                      <pre data-testid="code-excerpt" className="mt-1 overflow-x-auto rounded-8 bg-text-primary py-3 font-mono text-xs leading-6 text-surface">
                        <div className="flex justify-end px-4 pb-2">
                          <LanguageTag path={l.reference.path} />
                        </div>
                        {highlightLines(l.excerpt.lines.join("\n"), l.reference.path).map((tokens, j) => {
                          const n = l.excerpt!.start_line + j;
                          const mark = n >= l.reference.start_line && n <= l.reference.end_line;
                          return (
                            <div
                              key={n}
                              data-highlight={mark || undefined}
                              className={`flex gap-4 px-4 ${mark ? "bg-yellow-mark/25 font-bold" : "opacity-70"}`}
                            >
                              <span className="w-8 shrink-0 text-right text-surface/50 select-none">{n}</span>
                              <span className="whitespace-pre">{tokens.length ? <Tokens tokens={tokens} as="code" /> : " "}</span>
                            </div>
                          );
                        })}
                      </pre>
                    )}
                    <p className="text-xs text-text-muted">노란 줄이 바꿔야 하는 부분이에요. 고치는 건 내 개발 환경에서 직접 해 보세요.</p>
                  </li>
                ))}
              </ul>
            )}
            {located.locations.length === 0 && (
              <div data-testid="locate-empty" className="flex flex-col gap-2">
                <p role="note" className="text-sm text-text-muted">
                  {located.notice ?? "입력한 문장과 맞는 위치를 찾지 못했어요."}
                </p>
                {analysis.features.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
                    <span>이 기능부터 살펴보세요:</span>
                    {analysis.features.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={secondaryBtn}
                        onClick={() => openFeature(f)}
                      >
                        {f.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="flex w-full items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary">기능</h2>
        <span className="rounded-12 bg-brand-purple-soft px-2.5 py-1 text-xs font-bold text-brand-purple-ink">
          {analysis.features.length}개 기능 발견
        </span>
      </div>

      <section aria-label="기능" className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
        {analysis.features.length === 0 && (
          <p role="note" className="text-sm md:col-span-2 text-text-muted">
            기능을 찾지 못했습니다. 기능 목록 대신 위의 사용한 기술부터 살펴보세요{analysis.features_notice ? ` — ${analysis.features_notice}` : ""}
          </p>
        )}
        {analysis.features.map((f, i) => (
          <FeatureCard
            key={f.id}
            number={String(i + 1).padStart(2, "0")}
            title={f.title}
            description={f.summary}
            files={[...new Set(f.code_references.map((r) => r.path))]}
            evidenceCount={f.code_references.length}
            selected={feature?.id === f.id}
            onSelect={() => openFeature(f)}
          />
        ))}
      </section>
    </>
  );
}
