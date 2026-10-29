"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FeatureCard } from "@/components/FeatureCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PageIntro } from "@/components/demo/PageIntro";
import { ErrorBox, Loading, refLabel, secondaryBtn } from "@/components/demo/ui";
import { api, useSession, type ApiError } from "@/components/session/Session";
import type { CodeReference, Layer, LocateResult, Overview } from "@/server/types";

const layerTag: Record<Layer, string> = { ui: "화면", server: "서버", db: "DB", config: "설정", other: "기타" };
const locateTag = { ui: "화면", server: "서버", db: "DB" } as const;

type TechView = { name: string; role: string | null; concept: string | null; references: CodeReference[] };

function techViews(o: Overview): TechView[] {
  if (o.technologies && o.technologies.length > 0) return o.technologies;
  return o.stack.map((s) => ({
    name: s.name,
    role: s.note,
    concept: null,
    references: s.status === "confirmed" && s.evidence ? [s.evidence] : [],
  }));
}

export default function OverviewPage() {
  const router = useRouter();
  const { analysis, feature, selectFeature, ensure, loadError, startDemo } = useSession();
  const detailRef = useRef<HTMLElement>(null);
  const [picked, setPicked] = useState(0);
  const [techName, setTechName] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [located, setLocated] = useState<LocateResult | null>(null);
  const [locateError, setLocateError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (picked) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [picked]);

  useEffect(() => {
    if (!analysis) ensure();
  }, [analysis, ensure]);

  if (loadError) return <ErrorBox error={loadError} onDemo={startDemo} />;
  if (!analysis) return <Loading />;

  const repo = analysis.repository;
  const stats = analysis.stats;
  const skipped = stats.total_files - stats.included_files;
  const techs = techViews(analysis.overview);
  const tech = techs.find((t) => t.name === techName) ?? null;

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
              {repo.commit_sha}
            </dd>
          </div>
          <a href={`/api/analyses/${encodeURIComponent(analysis.id)}/note`} download className={`${secondaryBtn} ml-auto`}>
            학습 노트 내려받기 (PDF)
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
            ) : (
              (analysis.overview.intro_sources ?? []).map((p) => (
                <span key={p} className="rounded-8 bg-surface px-2 py-1 font-mono text-xs break-all text-brand-purple-ink">
                  {p}
                </span>
              ))
            )}
          </div>
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
                  aria-pressed={tech?.name === t.name}
                  onClick={() => setTechName(t.name)}
                  className={`flex flex-col items-start gap-0.5 rounded-8 border bg-surface px-3 py-1.5 text-left hover:border-brand-purple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple ${tech?.name === t.name ? "border-brand-purple ring-1 ring-brand-purple" : "border-line"}`}
                >
                  <span className="text-sm font-bold text-brand-purple-ink">{t.name}</span>
                  <span className="font-mono text-xs break-all text-text-muted">{t.references[0]?.path ?? "확인 불가"}</span>
                  {t.role && <span className="text-xs text-text-muted">{t.role}</span>}
                </button>
              </li>
            ))}
          </ul>
          {tech && (
            <div data-testid="tech-detail" className="flex flex-col gap-2 rounded-8 bg-surface px-4 py-3">
              <h3 className="text-base font-bold text-text-primary">{tech.name}</h3>
              <div className="flex flex-col gap-0.5">
                <h4 className="text-xs font-bold text-text-muted">이 프로젝트에서 맡은 역할</h4>
                <p className="text-sm leading-6">{tech.role ?? "확인 불가"}</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <h4 className="text-xs font-bold text-text-muted">핵심 개념</h4>
                <p className="text-sm leading-6">{tech.concept ?? "확인 불가"}</p>
              </div>
              <ul className="flex flex-col gap-1 font-mono text-sm text-brand-purple-ink">
                {tech.references.map((r) => (
                  <li key={`${r.path}:${r.start_line}`}>{refLabel(r)}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
        <section aria-label="주요 폴더" className="flex flex-col gap-2">
          <h2 className="text-xs font-bold text-text-muted">주요 폴더</h2>
          {analysis.overview.directories.length === 0 ? (
            <p className="text-sm text-text-muted">확인된 주요 폴더가 없어요.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {analysis.overview.directories.map((d) => (
                <li key={d.path} data-testid="directory" className="flex min-w-0 items-baseline gap-2 text-sm">
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

      <section aria-label="어디를 고쳐야 해?" className="flex w-full flex-col gap-3 rounded-12 border border-line bg-surface px-6 py-5">
        <h2 className="text-lg font-bold text-text-primary">어디를 고쳐야 해?</h2>
        <div className="flex w-full items-center gap-3">
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
        {locating && <Loading slow={analysis.mode !== "demo"} />}
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
                        {l.excerpt.lines.map((line, j) => {
                          const n = l.excerpt!.start_line + j;
                          const mark = n >= l.reference.start_line && n <= l.reference.end_line;
                          return (
                            <div
                              key={n}
                              data-highlight={mark || undefined}
                              className={`flex gap-4 px-4 ${mark ? "bg-yellow-mark/25 font-bold text-surface" : "text-surface/70"}`}
                            >
                              <span className="w-8 shrink-0 text-right text-surface/50 select-none">{n}</span>
                              <span className="whitespace-pre">{line || " "}</span>
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
                        onClick={() => {
                          selectFeature(f);
                          setPicked((n) => n + 1);
                        }}
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

      <section aria-label="기능" className="grid w-full grid-cols-2 gap-3">
        {analysis.features.length === 0 && (
          <p role="note" className="col-span-2 text-sm text-text-muted">
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
