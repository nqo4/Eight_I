"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PageIntro } from "@/components/demo/PageIntro";
import { CodeExcerpt, ErrorBox, Loading, refLabel, secondaryBtn, techViews } from "@/components/demo/ui";
import { useSession } from "@/components/session/Session";

const panel = "flex w-full flex-col gap-3 rounded-12 border border-line bg-surface px-5 py-5 sm:px-7 sm:py-6";
const label = "font-manrope text-xs font-bold tracking-wider text-brand-purple-ink";

// FR-14 기술 상세: '사용한 기술'에서 고른 기술의 역할·핵심 개념·쓰인 위치(파일 경로·라인과 코드 발췌).
export default function TechPage() {
  const { analysis, techName, ensure, loadError } = useSession();

  useEffect(() => {
    if (!analysis) ensure();
  }, [analysis, ensure]);

  if (loadError) return <ErrorBox error={loadError} home />;
  if (!analysis) return <Loading />;

  const tech = techViews(analysis.overview).find((t) => t.name === techName);
  if (!tech) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-text-muted">프로젝트 개요의 &lsquo;사용한 기술&rsquo;에서 알아볼 기술을 골라 주세요.</p>
        <Link href="/demo/overview" className={secondaryBtn}>
          프로젝트 개요로
        </Link>
      </div>
    );
  }
  const inferred = tech.references.length === 0;

  return (
    <>
      <PageIntro
        eyebrow="TECH IN YOUR PROJECT"
        title={`${tech.name}, 이 프로젝트에서는 이렇게 쓰여요`}
        description="기술 이름보다 먼저, 내 코드의 어디에서 무슨 일을 하는지 봐요."
      />
      <div data-testid="tech-detail" className="flex w-full max-w-[960px] flex-col gap-[18px]">
        <section aria-label="이 프로젝트에서 맡은 역할" className={panel}>
          <h2 className={label}>이 프로젝트에서 맡은 역할</h2>
          <p className="text-base leading-7 text-pretty">{tech.role ?? "확인 불가"}</p>
          {inferred && (
            <p>
              <span className="rounded-8 bg-brand-purple-soft px-2 py-1 text-xs font-bold text-brand-purple-ink">AI 추정</span>
            </p>
          )}
        </section>
        <section aria-label="핵심 개념" className={panel}>
          <h2 className={label}>핵심 개념</h2>
          <p className="text-base leading-7 text-pretty">{tech.concept ?? "확인 불가"}</p>
        </section>
        <section aria-label="쓰인 위치" className={panel}>
          <h2 className={label}>쓰인 위치</h2>
          {inferred ? (
            <p className="text-sm text-text-muted">이 기술이 쓰인 코드 위치를 확인하지 못했어요.</p>
          ) : (
            <>
              <ul data-testid="tech-refs" className="flex flex-col gap-1 font-mono text-sm break-all text-brand-purple-ink">
                {tech.references.map((r) => (
                  <li key={`${r.path}:${r.start_line}`}>{refLabel(r)}</li>
                ))}
              </ul>
              {tech.references.map((r) => (
                <CodeExcerpt key={`${r.path}:${r.start_line}:code`} r={r} />
              ))}
            </>
          )}
        </section>
        <div>
          <Link href="/demo/overview" className={secondaryBtn}>
            다른 기술·기능 보기
          </Link>
        </div>
      </div>
    </>
  );
}
