"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PageIntro } from "@/components/demo/PageIntro";
import { highlightLines, LanguageTag, Tokens } from "@/components/demo/syntax";
import { CodeExcerpt, ErrorBox, Loading, refLabel, secondaryBtn } from "@/components/demo/ui";
import { useFeatureResource, useSession } from "@/components/session/Session";
import type { Lesson } from "@/server/types";

const panel = "flex w-full flex-col gap-3 rounded-12 border border-line bg-surface px-7 py-6";
const label = "font-manrope text-xs font-bold tracking-wider text-brand-purple-ink";

export default function ConceptPage() {
  const router = useRouter();
  const { feature, record, loadError } = useSession();
  const { data, error, retry, slow } = useFeatureResource<{ lesson: Lesson }>("lesson");
  const [easy, setEasy] = useState<Record<number, boolean>>({});
  const [allFiles, setAllFiles] = useState(false);
  const [allCode, setAllCode] = useState(false);
  const toQuiz = () => {
    record((p) => ({ ...p, steps: { ...p.steps, concept: true } }));
    router.push("/demo/quiz");
  };

  useEffect(() => {
    if (data && window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView({ block: "start" });
  }, [data]);

  return (
    <>
      <PageIntro
        eyebrow="LEARN FROM YOUR CODE"
        title={`${feature?.title ?? "이 기능"}, 내 코드로 이해해요`}
        description="문법보다 먼저, 이 코드가 내 서비스에서 하는 일을 이해해 봐요. 기능 → 파일 역할 → 코드 → 개념 순서예요."
      />
      {error && <ErrorBox error={error} onRetry={loadError ? undefined : retry} home={Boolean(loadError)} />}
      {!error && !data && <Loading slow={slow} />}
      {data && (
        <div className="grid w-full grid-cols-[minmax(0,1fr)_320px] items-start gap-[18px]">
          <div className="flex min-w-0 flex-col gap-[18px]">
            <section aria-label="기능 설명" className={panel}>
              <p className={label}>1 · 기능 설명</p>
              {data.lesson.walkthrough && (
                <div className="flex flex-col gap-3 rounded-12 bg-brand-purple-soft p-5">
                  <p className="text-sm leading-6">
                    <span className="font-bold">내가 하는 행동: </span>
                    {data.lesson.walkthrough.action}
                  </p>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-3">
                    <div className="flex flex-col gap-1 rounded-8 bg-surface p-4">
                      <p className="text-xs font-bold text-text-muted">바뀌기 전</p>
                      <p className="text-sm leading-6 text-pretty">{data.lesson.walkthrough.before}</p>
                    </div>
                    <span aria-hidden className="self-center text-sm font-bold text-brand-purple-ink">→</span>
                    <div className="flex flex-col gap-1 rounded-8 bg-surface p-4">
                      <p className="text-xs font-bold text-text-muted">바뀐 후</p>
                      <p className="text-sm leading-6 text-pretty">{data.lesson.walkthrough.after}</p>
                    </div>
                  </div>
                  {data.lesson.walkthrough.key_line && (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs font-bold text-text-muted">관련 코드 한 줄</p>
                      <div className="min-w-0 overflow-hidden rounded-8 bg-text-primary text-surface">
                        <pre className="overflow-auto px-4 py-3 font-mono text-sm leading-6">
                          {highlightLines(data.lesson.walkthrough.key_line.snippet, data.lesson.walkthrough.key_line.path).map((tokens, i) => (
                            <div key={i}>
                              <Tokens tokens={tokens} />
                            </div>
                          ))}
                        </pre>
                        <p className="flex items-center justify-between gap-3 border-t border-surface/10 px-4 py-2 font-mono text-xs break-all text-surface/70">
                          {refLabel(data.lesson.walkthrough.key_line)}
                          <LanguageTag path={data.lesson.walkthrough.key_line.path} />
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <p className="text-base leading-7 text-pretty">{data.lesson.overview}</p>
            </section>
            <section aria-label="파일 역할" className={panel}>
              <p className={label}>2 · 파일 역할</p>
              <ul className="flex flex-col divide-y divide-line">
                {(allFiles ? data.lesson.file_roles : data.lesson.file_roles.slice(0, 3)).map((f) => (
                  <li key={f.path} className="grid grid-cols-[minmax(0,16rem)_1fr] gap-4 py-2.5">
                    <span className="font-mono text-sm break-all text-brand-purple-ink">{f.path}</span>
                    <span className="text-sm leading-6">{f.role}</span>
                  </li>
                ))}
              </ul>
              {!allFiles && data.lesson.file_roles.length > 3 && (
                <div>
                  <button type="button" className={secondaryBtn} onClick={() => setAllFiles(true)}>
                    파일 더 보기 ({data.lesson.file_roles.length - 3}개)
                  </button>
                </div>
              )}
            </section>
            <section aria-label="중요한 코드" className={panel}>
              <p className={label}>3 · 중요한 코드</p>
              {(allCode ? data.lesson.code_explanations : data.lesson.code_explanations.slice(0, 2)).map((c, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <CodeExcerpt r={c.reference} />
                  <p className="text-sm leading-6 text-pretty">{c.explanation}</p>
                </div>
              ))}
              {!allCode && data.lesson.code_explanations.length > 2 && (
                <div>
                  <button type="button" className={secondaryBtn} onClick={() => setAllCode(true)}>
                    코드 더 보기 ({data.lesson.code_explanations.length - 2}개)
                  </button>
                </div>
              )}
            </section>
            <section aria-label="핵심 개념" className={panel}>
              <p className={label}>4 · 핵심 개념</p>
              <ul className="flex flex-col gap-3">
                {data.lesson.concepts.map((c, i) => (
                  <li key={c.name} id={`concept-${i}`} data-testid="concept" className="flex scroll-mt-6 flex-col gap-2 rounded-12 bg-paper p-5">
                    <h3 className="text-lg font-bold">{c.name}</h3>
                    <p className="text-sm leading-6 text-pretty">{c.explanation}</p>
                    <ul data-testid="concept-refs" className="font-mono text-sm text-text-muted">
                      {c.references.map((r) => (
                        <li key={`${r.path}:${r.start_line}`}>{refLabel(r)}</li>
                      ))}
                    </ul>
                    <div>
                      <button type="button" className={secondaryBtn} aria-expanded={!!easy[i]} onClick={() => setEasy((e) => ({ ...e, [i]: !e[i] }))}>
                        {easy[i] ? "쉬운 설명 접기" : "쉬운 설명 펼치기"}
                      </button>
                    </div>
                    {easy[i] && (
                      <div data-testid="easy-explanation" className="flex flex-col gap-2 rounded-8 bg-brand-purple-soft p-4 text-sm leading-6">
                        <p>
                          <span className="font-bold">용어 풀이: </span>
                          {c.easy_explanation}
                        </p>
                        <p>
                          <span className="font-bold">왜 필요한가: </span>
                          {c.why_needed}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="왜 이렇게 만들었나" className={panel}>
              <h2 className={label}>왜 이렇게 만들었나</h2>
              {(data.lesson.design_reasons ?? []).length === 0 ? (
                <p className="text-sm text-text-muted">이 기능에서 설명할 설계 이유를 찾지 못했어요.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-line">
                  {(data.lesson.design_reasons ?? []).map((d, i) => (
                    <li key={i} data-testid="design-reason" className="flex flex-col gap-1.5 py-3">
                      <p className="text-sm leading-6 text-pretty">{d.reason}</p>
                      {d.reference && !d.inferred ? (
                        <p className="font-mono text-sm break-all text-brand-purple-ink">{refLabel(d.reference)}</p>
                      ) : (
                        <p>
                          <span className="rounded-8 bg-brand-purple-soft px-2 py-1 text-xs font-bold text-brand-purple-ink">AI 추정</span>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <div className="flex justify-end">
              <PrimaryButton label="이해했어요, 확인해 볼게요" onClick={toQuiz} />
            </div>
          </div>

          <aside className="sticky top-6 flex flex-col gap-3 rounded-12 border border-line bg-surface px-5 py-6">
            <p className={label}>이 기능의 개념</p>
            {data.lesson.concepts.map((c, i) => (
              <a
                key={c.name}
                href={`#concept-${i}`}
                className="flex items-center gap-3 rounded-8 border border-line px-3 py-3 hover:border-brand-purple"
              >
                <span className="rounded-12 bg-brand-purple-soft px-2.5 py-1 text-xs font-bold text-brand-purple-ink">{i + 1}</span>
                <span className="text-sm font-bold text-text-primary">{c.name}</span>
              </a>
            ))}
            <button type="button" className={`${secondaryBtn} mt-2`} onClick={toQuiz}>
              연습 문제로 바로 가기
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
