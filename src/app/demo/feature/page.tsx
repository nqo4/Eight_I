"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PageIntro } from "@/components/demo/PageIntro";
import { ErrorBox, Loading, refLabel, secondaryBtn } from "@/components/demo/ui";
import { useSession } from "@/components/session/Session";

// FR-15 기능 상세: 고른 기능의 제목·한 줄 설명·근거 파일과 FR-05~FR-08로 가는 네 버튼.
export default function FeaturePage() {
  const router = useRouter();
  const { analysis, feature, ensure, loadError } = useSession();

  useEffect(() => {
    if (!analysis || !feature) ensure();
  }, [analysis, feature, ensure]);

  if (loadError) return <ErrorBox error={loadError} home />;
  if (!analysis) return <Loading />;
  if (!feature) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-text-muted">프로젝트 개요의 &lsquo;기능&rsquo;에서 알아볼 기능을 골라 주세요.</p>
        <Link href="/demo/overview" className={secondaryBtn}>
          프로젝트 개요로
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageIntro eyebrow="SELECTED FEATURE" title={feature.title} description={feature.summary} />
      <section aria-label="선택한 기능" className="flex w-full max-w-[960px] flex-col gap-4 rounded-12 border border-brand-purple bg-surface px-5 py-5 sm:px-7 sm:py-6">
        <h2 data-testid="feature-title" className="text-2xl font-bold text-text-primary">
          {feature.title}
        </h2>
        <p data-testid="feature-summary" className="text-base text-text-muted">
          {feature.summary}
        </p>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs font-bold text-text-muted">근거 파일</h3>
          <ul data-testid="feature-files" className="flex flex-col gap-1 font-mono text-sm break-all text-brand-purple-ink">
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
    </>
  );
}
