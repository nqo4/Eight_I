"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PageIntro } from "@/components/demo/PageIntro";
import { CodeBlock, ErrorBox, Loading, useLoad } from "@/components/learn/states";
import { getQuiz } from "@/lib/api";

const KEYS = ["A", "B", "C", "D", "E"];

// 이해도 퀴즈(F7). 보기를 고르고 '정답 확인'을 누르면 정답·해설·근거 코드를 보여 준다.
export default function QuizPage() {
  const { analysisId, featureId } = useParams<{ analysisId: string; featureId: string }>();
  const { data: quiz, error, reload } = useLoad(`quiz:${analysisId}:${featureId}`, () => getQuiz(analysisId, featureId));
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (!quiz) return <Loading message="내 코드로 문제를 만들고 있어요" />;
  if (quiz.questions.length === 0) {
    return <p className="text-[12px] text-text-muted">이 기능의 코드로 낼 수 있는 문제를 찾지 못했어요.</p>;
  }

  const q = quiz.questions[index];
  const correct = chosen === q.answer_index;
  const next = () => {
    setIndex(index + 1);
    setChosen(null);
    setChecked(false);
  };

  return (
    <>
      <PageIntro eyebrow="QUICK CHECK" title="방금 배운 내용을 짧게 확인해 볼까요?" description="틀려도 괜찮아요. 실제 코드 근거와 함께 이유를 알려드려요." />

      <section aria-label="퀴즈" className="flex w-[780px] max-w-full flex-col gap-[16px] rounded-16 border border-line bg-surface px-[42px] py-[34px]">
        <p className="font-manrope text-[10px] font-bold text-brand-purple">
          QUIZ · {index + 1} / {quiz.questions.length}
        </p>
        <h2 className="text-[20px] leading-[32px] font-bold text-text-primary">{q.question}</h2>

        <div role="radiogroup" aria-label="보기" className="flex flex-col gap-[8px]">
          {q.choices.map((choice, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={chosen === i}
              disabled={checked}
              onClick={() => setChosen(i)}
              className={`flex min-h-[50px] items-center gap-[12px] rounded-8 border px-[14px] py-[8px] text-left transition-colors ${
                chosen === i ? "border-brand-purple bg-brand-purple-soft" : "border-line bg-surface hover:border-brand-purple/50"
              }`}
            >
              <span
                className={`rounded-12 px-[10px] py-[6px] text-[9px] font-bold ${
                  chosen === i ? "bg-brand-purple text-surface" : "bg-brand-purple-soft text-brand-purple"
                }`}
              >
                {KEYS[i]}
              </span>
              <span className="text-[11px] leading-[18px] text-text-primary">{choice}</span>
            </button>
          ))}
        </div>

        {!checked ? (
          <PrimaryButton label="정답 확인" disabled={chosen === null} onClick={() => setChecked(true)} />
        ) : (
          <div role="status" className="flex flex-col gap-[10px] rounded-8 bg-brand-purple-soft px-[16px] py-[14px]">
            <p className="text-[12px] leading-[18px] font-bold text-text-primary">
              {correct ? "✓ 정답이에요!" : `! 오답이에요. 정답은 ${KEYS[q.answer_index]}예요.`}
            </p>
            <p className="text-[11px] leading-[20px] text-text-primary">{q.explanation}</p>
            {q.references.map((r) => (
              <CodeBlock key={`${r.path}:${r.start_line}`} path={r.path} start={r.start_line} snippet={r.snippet} />
            ))}
            {index < quiz.questions.length - 1 ? (
              <PrimaryButton label="다음 문제" onClick={next} />
            ) : (
              <PrimaryButton href={`/learn/${analysisId}/${featureId}/mission`} label="이제 네가 직접 바꿔봐" />
            )}
          </div>
        )}
        <p className="text-[9px] leading-[14px] text-text-muted">{quiz.disclaimer}</p>
      </section>
    </>
  );
}
