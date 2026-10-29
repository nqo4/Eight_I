"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PageIntro } from "@/components/demo/PageIntro";
import { ErrorBox, Loading, useLoad } from "@/components/learn/states";
import { getExercise } from "@/lib/api";

// 직접 수정 미션(FR-08). 서비스가 코드를 고치지 않고, 완료 체크는 자기 보고다.
export default function MissionPage() {
  const { analysisId, featureId } = useParams<{ analysisId: string; featureId: string }>();
  const { data: ex, error, reload } = useLoad(`exercise:${analysisId}:${featureId}`, () => getExercise(analysisId, featureId));
  const [hints, setHints] = useState(0);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!ex) return <Loading message="직접 해 볼 미션을 준비하고 있어요" />;

  const allChecked = ex.acceptance_checks.length > 0 && ex.acceptance_checks.every((_, i) => checked[i]);
  const toggle = (i: number) => setChecked((prev) => ex.acceptance_checks.map((_, j) => (j === i ? !prev[j] : Boolean(prev[j]))));

  return (
    <>
      <PageIntro eyebrow="YOUR TURN" title="이제, 당신이 직접 바꿔볼 차례예요." description="AI가 대신 수정하지 않아요. 힌트를 따라 내 개발 환경에서 직접 시도해 보세요." />

      <div className="flex w-full items-start gap-[18px]">
        <section aria-label="수정 미션" className="flex min-w-0 flex-1 flex-col gap-[16px] rounded-12 border border-line bg-surface px-[30px] py-[28px]">
          <p className="font-manrope text-[9px] font-bold text-brand-purple">{ex.kind === "modify" ? "작은 수정 미션" : "관찰 미션"}</p>
          <h2 className="text-[20px] leading-[32px] font-bold text-text-primary">{ex.instruction}</h2>
          <div className="flex flex-col gap-[6px] rounded-8 bg-brand-purple-soft px-[16px] py-[12px]">
            <p className="text-[9px] text-text-muted">수정 예상 위치</p>
            {ex.target_references.map((r) => (
              <p key={`${r.path}:${r.start_line}`} className="font-mono text-[10px] text-brand-purple">
                {r.path} · {r.start_line}–{r.end_line}
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-[8px]">
            {ex.hints.slice(0, hints).map((h) => (
              <p key={h.level} className="rounded-8 bg-brand-purple-soft px-[16px] py-[10px] text-[11px] leading-[18px] text-text-primary">
                💡 {h.text}
              </p>
            ))}
            {hints < ex.hints.length && (
              <button
                type="button"
                onClick={() => setHints(hints + 1)}
                className="self-start rounded-8 border border-line px-[14px] py-[8px] text-[11px] font-bold text-text-primary"
              >
                {hints === 0 ? "막혔나요? 첫 번째 힌트 보기" : "다음 힌트 보기"}
              </button>
            )}
          </div>
        </section>

        <aside aria-label="성공 조건" className="flex w-[420px] shrink-0 flex-col gap-[14px] rounded-12 border border-line bg-surface px-[26px] py-[28px]">
          <p className="font-manrope text-[9px] font-bold text-brand-purple">완료 체크</p>
          <p className="text-[18px] leading-[26px] font-bold text-text-primary">직접 실행해 확인해요</p>
          {ex.acceptance_checks.map((label, i) => (
            <label key={label} className="flex cursor-pointer items-center gap-[12px] border-b border-line py-[12px] pl-[4px]">
              <input type="checkbox" checked={Boolean(checked[i])} disabled={done} onChange={() => toggle(i)} className="size-[18px] accent-[var(--brand-purple)]" />
              <span className="text-[11px] leading-[18px] text-text-primary">{label}</span>
            </label>
          ))}
          {done ? (
            <p role="status" className="rounded-8 bg-brand-purple-soft px-[12px] py-[10px] text-[12px] font-bold text-text-primary">
              ✓ 완료로 표시했어요 <span className="font-normal text-text-muted">({ex.disclaimer})</span>
            </p>
          ) : (
            <>
              <PrimaryButton label="완료로 표시" disabled={!allChecked} onClick={() => setDone(true)} />
              <p className="text-[9px] leading-[14px] text-text-muted">{ex.disclaimer}</p>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
