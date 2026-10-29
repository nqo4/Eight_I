"use client";

import { useState } from "react";

const quizCode = [
  "23  function addToCart() {",
  "24    if (count < 10) {",
  "25      setCount(count + 1)",
  "26    }",
  "27  }",
];

const options = [
  { key: "A", code: "count + 1" },
  { key: "B", code: "setCount(count + 1)" },
  { key: "C", code: "if (count < 10)" },
];

const answer = "B";

export function Quiz() {
  const [selected, setSelected] = useState<string | null>(answer);
  const isCorrect = selected === answer;

  return (
    <section className="flex h-[610px] w-[780px] shrink-0 flex-col items-start gap-[20px] overflow-clip rounded-16 border border-line bg-surface px-[42px] pt-[34px] pb-[30px]">
      <p className="font-manrope text-[10px] leading-[16px] font-bold whitespace-nowrap text-brand-purple">QUIZ · 1 / 2</p>
      <h2 className="w-[696px] text-[23px] leading-[34px] font-bold text-text-primary">
        버튼을 눌렀을 때 장바구니 수량을
        <br />
        바꾸는 코드는 무엇일까요?
      </h2>

      <div className="flex h-[148px] w-[696px] shrink-0 flex-col items-start rounded-8 bg-text-primary pt-[20px] pl-[24px]">
        <pre className="font-mono text-[11px] leading-[22px] text-surface">{quizCode.join("\n")}</pre>
      </div>

      {options.map((option) => {
        const active = selected === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => setSelected(option.key)}
            aria-pressed={active}
            className={`flex h-[50px] w-[696px] shrink-0 items-center gap-[12px] rounded-8 border pl-[14px] text-left transition-colors ${
              active ? "border-brand-purple bg-brand-purple-soft" : "border-line bg-surface hover:border-brand-purple/50"
            }`}
          >
            <span
              className={`rounded-12 px-[10px] py-[6px] text-[9px] leading-[14px] font-bold whitespace-nowrap ${
                active ? "bg-brand-purple text-surface" : "bg-brand-purple-soft text-brand-purple"
              }`}
            >
              {option.key}
            </span>
            <span className="font-mono text-[10px] leading-[16px] whitespace-nowrap text-text-primary">{option.code}</span>
          </button>
        );
      })}

      {selected && (
        <div className="flex h-[51px] w-[696px] shrink-0 items-center gap-[12px] rounded-8 bg-brand-purple-soft px-[16px]">
          <span
            className={`rounded-12 px-[10px] py-[6px] text-[9px] leading-[14px] font-bold whitespace-nowrap text-surface ${
              isCorrect ? "bg-status-green" : "bg-text-muted"
            }`}
          >
            {isCorrect ? "✓" : "!"}
          </span>
          <p className="w-[610px] text-[10px] leading-[17px] font-bold text-text-primary">
            {isCorrect
              ? "맞아요! setCount가 기억한 값을 바꾸고 화면을 다시 그리게 해요."
              : "다시 생각해 볼까요? 화면이 기억한 값을 실제로 바꾸는 건 상태 변경 함수예요."}
          </p>
        </div>
      )}
    </section>
  );
}
