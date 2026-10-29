"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PageIntro } from "@/components/demo/PageIntro";
import { CodeBlock, ErrorBox, Loading, useLoad } from "@/components/learn/states";
import { getLesson } from "@/lib/api";

// Top-down 학습(FR-06): 기능 설명 → 파일 역할 → 중요한 코드 → 핵심 개념.
export default function ConceptPage() {
  const { analysisId, featureId } = useParams<{ analysisId: string; featureId: string }>();
  const { data: lesson, error, reload } = useLoad(`lesson:${analysisId}:${featureId}`, () => getLesson(analysisId, featureId));
  const [easy, setEasy] = useState(false);

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!lesson) return <Loading message="내 코드로 배울 내용을 정리하고 있어요" />;

  const box = "flex w-full flex-col gap-[12px] rounded-12 border border-line bg-surface px-[28px] py-[24px]";
  const h = "text-[15px] leading-[22px] font-bold text-text-primary";
  return (
    <>
      <PageIntro eyebrow="LEARN FROM YOUR CODE" title="내 코드로 개념을 배워요" description="문법보다 먼저, 이 코드가 내 서비스에서 하는 일을 이해해 봐요." />

      <section aria-label="기능 설명" className={box}>
        <h2 className={h}>1. 기능 설명</h2>
        <p className="text-[12px] leading-[22px] text-text-muted">{lesson.overview}</p>
      </section>

      <section aria-label="파일 역할" className={box}>
        <h2 className={h}>2. 파일 역할</h2>
        <ul className="flex flex-col gap-[8px]">
          {lesson.file_roles.map((r) => (
            <li key={r.path} className="flex gap-[12px] text-[11px] leading-[18px]">
              <span className="w-[260px] shrink-0 font-mono text-brand-purple">{r.path}</span>
              <span className="text-text-muted">{r.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="중요한 코드" className={box}>
        <h2 className={h}>3. 중요한 코드</h2>
        {lesson.code_explanations.map((c) => (
          <div key={`${c.reference.path}:${c.reference.start_line}`} className="flex flex-col gap-[8px]">
            <CodeBlock path={c.reference.path} start={c.reference.start_line} snippet={c.reference.snippet} />
            <p className="text-[11px] leading-[20px] text-text-muted">{c.explanation}</p>
          </div>
        ))}
      </section>

      <section aria-label="핵심 개념" className={box}>
        <div className="flex items-center justify-between">
          <h2 className={h}>4. 핵심 개념</h2>
          <button
            type="button"
            onClick={() => setEasy((v) => !v)}
            aria-expanded={easy}
            className="rounded-8 bg-brand-purple-soft px-[12px] py-[8px] text-[11px] font-bold text-brand-purple"
          >
            {easy ? "쉬운 설명 접기" : "쉬운 설명 펼치기"}
          </button>
        </div>
        {lesson.concepts.map((c) => (
          <article key={c.name} className="flex flex-col gap-[6px] border-t border-line pt-[12px]">
            <h3 className="text-[13px] leading-[20px] font-bold text-text-primary">{c.name}</h3>
            <p className="text-[11px] leading-[20px] text-text-primary">
              <b>왜 필요할까요?</b> {c.why_needed}
            </p>
            <p className="text-[11px] leading-[20px] text-text-muted">{c.explanation}</p>
            {easy && (
              <p className="rounded-8 bg-brand-purple-soft px-[12px] py-[10px] text-[11px] leading-[20px] text-text-primary">{c.easy_explanation}</p>
            )}
            <ul className="flex flex-wrap gap-[6px]">
              {c.references.map((r) => (
                <li key={`${r.path}:${r.start_line}`} className="rounded-8 bg-brand-purple-soft px-[8px] py-[4px] font-mono text-[9px] text-brand-purple">
                  {r.path} · {r.start_line}–{r.end_line}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <PrimaryButton href={`/learn/${analysisId}/${featureId}/quiz`} label="이해도 확인" />
    </>
  );
}
