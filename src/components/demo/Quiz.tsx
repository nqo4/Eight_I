"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { CodeExcerpt, ErrorBox, Loading, refLabel, secondaryBtn, seededOrder } from "@/components/demo/ui";
import { useFeatureResource, useSession } from "@/components/session/Session";
import type { Quiz as QuizData } from "@/server/types";

const keys = "ABCDEF";

export function Quiz() {
  const router = useRouter();
  const { record } = useSession();
  const { data, error, retry, slow } = useFeatureResource<{ quiz: QuizData }>("quiz");
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  if (error) return <ErrorBox error={error} onRetry={retry} />;
  if (!data) return <Loading slow={slow} />;
  const q = data.quiz;
  const allDone = q.questions.every((item) => checked[item.id]);

  return (
    <div className="flex w-full max-w-[860px] flex-col gap-5">
      {q.questions.map((item, qi) => {
        const done = checked[item.id];
        const correct = picked[item.id] === item.answer_index;
        const check = () => {
          setChecked((c) => ({ ...c, [item.id]: true }));
          record((p) => (item.id in p.quiz ? p : { ...p, quiz: { ...p.quiz, [item.id]: picked[item.id] === item.answer_index } }));
        };
        return (
          <fieldset
            key={item.id}
            data-testid="quiz-question"
            aria-labelledby={`quiz-q-${item.id}`}
            className="flex min-w-0 flex-col items-start gap-4 rounded-16 border border-line bg-surface px-10 pt-8 pb-7"
          >
            <p className="font-manrope text-xs font-bold tracking-wider text-brand-purple-ink">
              QUIZ · {qi + 1} / {q.questions.length}
            </p>
            <h2 id={`quiz-q-${item.id}`} className="text-[22px] leading-8 font-bold text-balance text-text-primary">
              {item.question}
            </h2>
            <div role="radiogroup" aria-labelledby={`quiz-q-${item.id}`} className="flex w-full flex-col gap-2.5">
              {seededOrder(item.choices.length, item.id + item.question).map((ci, pos) => {
                const active = picked[item.id] === ci;
                return (
                  <label
                    key={ci}
                    className={`flex min-h-[50px] w-full items-center gap-3 rounded-8 border px-3.5 py-2.5 transition-colors ${
                      active ? "border-brand-purple bg-brand-purple-soft" : "border-line bg-surface"
                    } ${done ? "" : "cursor-pointer hover:border-brand-purple/50"}`}
                  >
                    <input
                      type="radio"
                      name={item.id}
                      disabled={done}
                      checked={active}
                      onChange={() => setPicked((p) => ({ ...p, [item.id]: ci }))}
                      className="size-5 shrink-0 accent-brand-purple"
                    />
                    <span
                      aria-hidden="true"
                      className={`rounded-12 px-2.5 py-1 text-xs font-bold ${active ? "bg-brand-purple text-surface" : "bg-brand-purple-soft text-brand-purple-ink"}`}
                    >
                      {keys[pos]}
                    </span>
                    <span className="text-sm text-text-primary">{item.choices[ci]}</span>
                  </label>
                );
              })}
            </div>
            {!done && (
              <div className="flex items-center gap-3">
                <PrimaryButton label="정답 확인" disabled={picked[item.id] === undefined} onClick={check} />
                {picked[item.id] === undefined && <span className="text-sm text-text-muted">보기를 하나 고르면 확인할 수 있어요</span>}
              </div>
            )}
            {done && (
              <div data-testid="quiz-result" className="flex w-full flex-col gap-3 rounded-8 bg-brand-purple-soft p-4">
                <p className={`font-bold ${correct ? "text-status-green-ink" : "text-status-red"}`}>
                  {correct ? "✓ 정답이에요" : `! 오답이에요 (정답: ${item.choices[item.answer_index]})`}
                </p>
                <p className="text-sm leading-6 text-pretty">{item.explanation}</p>
                <ul data-testid="quiz-refs" className="font-mono text-sm text-text-muted">
                  {item.references.map((r) => (
                    <li key={`${r.path}:${r.start_line}`}>참고: {refLabel(r)}</li>
                  ))}
                </ul>
                {!correct && (
                  <>
                    {item.references.map((r) => (
                      <CodeExcerpt key={`${r.path}:${r.start_line}`} r={r} />
                    ))}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={secondaryBtn}
                        onClick={() => {
                          setChecked((c) => ({ ...c, [item.id]: false }));
                          setPicked((p) => {
                            const next = { ...p };
                            delete next[item.id];
                            return next;
                          });
                        }}
                      >
                        다시 풀기
                      </button>
                      <button type="button" className={secondaryBtn} onClick={() => router.push("/demo/concept")}>
                        개념 설명 다시 보기
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </fieldset>
        );
      })}
      <p className="text-sm text-text-muted">{q.disclaimer}</p>
      {allDone && (
        <div className="flex justify-end">
          <PrimaryButton label="다음: 직접 바꿔 보기" onClick={() => router.push("/demo/mission")} />
        </div>
      )}
    </div>
  );
}
