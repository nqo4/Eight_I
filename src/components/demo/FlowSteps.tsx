"use client";

import { Fragment, useState } from "react";

const flowSteps = [
  { label: "01 · 화면", title: "담기 버튼을 클릭해요", location: "CartButton.tsx · 29" },
  { label: "02 · 이벤트", title: "addToCart가 실행돼요", location: "CartButton.tsx · 23–27" },
  { label: "03 · 상태", title: "장바구니가 업데이트돼요", location: "cart-store.ts · 18–26" },
  { label: "04 · 결과", title: "상품 수량이 다시 그려져요", location: "CartBadge.tsx · 12–17" },
];

export function FlowSteps() {
  const [selected, setSelected] = useState(1);

  return (
    <div className="flex w-full items-center gap-[10px] whitespace-nowrap">
      {flowSteps.map((step, index) => (
        <Fragment key={step.label}>
          {index > 0 && <span className="font-manrope text-[14px] leading-[18px] font-bold text-brand-purple">→</span>}
          <button
            type="button"
            onClick={() => setSelected(index)}
            aria-pressed={selected === index}
            className={`flex h-[96px] w-[245px] shrink-0 flex-col items-start gap-[6px] rounded-12 border bg-surface px-[16px] py-[14px] text-left transition-colors ${
              selected === index ? "border-brand-purple" : "border-line hover:border-brand-purple/50"
            }`}
          >
            <span className="text-[8px] leading-[13px] font-bold text-brand-purple">{step.label}</span>
            <span className="text-[10px] leading-[16px] font-bold text-text-primary">{step.title}</span>
            <span className="font-mono text-[7px] leading-[12px] text-text-muted">{step.location}</span>
          </button>
        </Fragment>
      ))}
    </div>
  );
}
