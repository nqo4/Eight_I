"use client";

import { useParams } from "next/navigation";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PageIntro } from "@/components/demo/PageIntro";
import { CodeBlock, ErrorBox, Loading, useLoad } from "@/components/learn/states";
import { getFeature } from "@/lib/api";

// 기능 하나의 요약과 근거 코드. 여기서 흐름·개념·퀴즈·미션으로 간다(S2~S6).
export default function FeaturePage() {
  const { analysisId, featureId } = useParams<{ analysisId: string; featureId: string }>();
  const { data, error, reload } = useLoad(`feature:${analysisId}:${featureId}`, () => getFeature(analysisId, featureId));

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!data) return <Loading message="기능 정보를 불러오고 있어요" />;

  const f = data.feature;
  const base = `/learn/${analysisId}/${featureId}`;
  const first = f.code_references[0];
  return (
    <>
      <PageIntro grouped eyebrow="SELECTED FEATURE" title={f.title} description={f.summary} />

      <section aria-label="근거 파일" className="flex w-full flex-col gap-[10px]">
        <h2 className="text-[13px] leading-[20px] font-bold text-text-primary">이 기능을 만든 코드 ({f.code_references.length}곳)</h2>
        <ul className="flex flex-wrap gap-[6px]">
          {f.code_references.map((r) => (
            <li key={`${r.path}:${r.start_line}`} className="rounded-8 bg-brand-purple-soft px-[8px] py-[5px] font-mono text-[10px] leading-[14px] text-brand-purple">
              {r.path} · {r.start_line}–{r.end_line}
            </li>
          ))}
        </ul>
        {first && <CodeBlock path={first.path} start={first.start_line} snippet={first.snippet} commit={first.commit_sha} />}
      </section>

      <nav aria-label="학습하기" className="flex flex-wrap gap-[10px]">
        <PrimaryButton href={`${base}/flow`} label="이 기능 어떻게 동작해?" />
        <PrimaryButton href={`${base}/concept`} label="이 코드 배우기" />
        <PrimaryButton href={`${base}/quiz`} label="이해도 확인" tone="ink" />
        <PrimaryButton href={`${base}/mission`} label="이제 네가 직접 바꿔봐" tone="ink" />
      </nav>
    </>
  );
}
