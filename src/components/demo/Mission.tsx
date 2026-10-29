"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";

export function HintToggle() {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-expanded={open}
      className="flex min-h-[58px] w-[600px] shrink-0 flex-col justify-center gap-[6px] rounded-8 bg-brand-purple-soft py-[10px] pl-[16px] text-left"
    >
      <span className="flex items-center gap-[10px] whitespace-nowrap">
        <span className="text-[14px] leading-[18px] text-brand-purple">💡</span>
        <span className="text-[10px] leading-[16px] font-bold text-text-primary">막혔나요? 첫 번째 힌트 보기</span>
      </span>
      {open && (
        <span className="pl-[24px] text-[10px] leading-[16px] text-text-muted">
          24번째 줄의 조건문에서 수량을 비교하는 숫자를 찾아보세요.
        </span>
      )}
    </button>
  );
}

const checks = [
  "상품을 5번까지 담을 수 있어요.",
  "6번째 클릭부터 수량이 늘지 않아요.",
  "다른 상품은 각각 5개까지 담겨요.",
];

export function MissionChecklist() {
  const [checked, setChecked] = useState<boolean[]>(() => checks.map(() => false));

  return (
    <aside className="flex h-[600px] w-[420px] shrink-0 flex-col items-start gap-[16px] rounded-12 border border-line bg-surface px-[26px] py-[28px]">
      <p className="font-manrope text-[9px] leading-[14px] font-bold whitespace-nowrap text-brand-purple">완료 체크</p>
      <p className="text-[18px] leading-[26px] font-bold whitespace-nowrap text-text-primary">직접 실행해 확인해요</p>

      {checks.map((label, index) => (
        <label
          key={label}
          className="flex h-[54px] w-[368px] shrink-0 cursor-pointer items-center gap-[12px] border-b border-line pl-[10px]"
        >
          <input
            type="checkbox"
            checked={checked[index]}
            onChange={() => setChecked((prev) => prev.map((value, i) => (i === index ? !value : value)))}
            className="peer sr-only"
          />
          <span className="flex size-[20px] shrink-0 items-center justify-center rounded-8 border border-brand-purple bg-surface text-[11px] font-bold text-surface peer-checked:bg-brand-purple peer-focus-visible:ring-2 peer-focus-visible:ring-brand-purple/40">
            {checked[index] && "✓"}
          </span>
          <span className="text-[10px] leading-[16px] whitespace-nowrap text-text-primary">{label}</span>
        </label>
      ))}

      <div className="flex h-[70px] w-[368px] shrink-0 items-start rounded-8 bg-brand-purple-soft px-[12px] pt-[12px]">
        <p className="w-[330px] text-[8px] leading-[14px] text-text-muted">
          이 체크는 자기 보고예요. CodeBack이 코드를 실행하거나 성공을 보장하지 않습니다.
        </p>
      </div>

      <PrimaryButton href="/" label="학습 완료하기" />
    </aside>
  );
}
