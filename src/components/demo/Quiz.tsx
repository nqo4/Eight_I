"use client";

import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/PrimaryButton";
import { CodeExcerpt, ErrorBox, Loading, refLabel, secondaryBtn, seededOrder } from "@/components/demo/ui";
import { useFeatureResource, useSession } from "@/components/session/Session";
import { saveQuizAttempt } from "@/lib/records";
import type { CodeReference, Lesson, Quiz as QuizData } from "@/server/types";

const overlaps = (a: CodeReference, b: CodeReference) =>
  a.path === b.path && a.start_line <= b.end_line && b.start_line <= a.end_line;

const keys = "ABCDEF";

export function Quiz() {
  const router = useRouter();
  const { analysis, feature, record, progress, loadError, startDemo } = useSession();
  const { data, error, retry, slow } = useFeatureResource<{ quiz: QuizData }>("quiz");
  const lesson = useFeatureResource<{ lesson: Lesson }>("lesson");
  const picked = progress.quizView?.picked ?? {};
  const checked = progress.quizView?.checked ?? {};
  const setQuiz = (nextPicked: Record<string, number>, nextChecked: Record<string, boolean>, extra?: (p: typeof progress) => typeof progress) =>
    record((p) => {
      const base = { ...p, quizView: { picked: nextPicked, checked: nextChecked } };
      return extra ? extra(base) : base;
    });
  const relatedConcept = (refs: CodeReference[]) => {
    const concepts = lesson.data?.lesson.concepts ?? [];
    const i = concepts.findIndex((c) => c.references.some((r) => refs.some((q) => overlaps(r, q))));
    const j = i >= 0 ? i : concepts.findIndex((c) => c.references.some((r) => refs.some((q) => q.path === r.path)));
    return j >= 0 ? { index: j, name: concepts[j].name } : null;
  };

  if (error) return <ErrorBox error={error} onRetry={loadError ? undefined : retry} onDemo={loadError ? startDemo : undefined} />;
  if (!data) return <Loading slow={slow} />;
  const q = data.quiz;
  const allDone = q.questions.every((item) => checked[item.id]);

  return (
    <div className="flex w-full max-w-[860px] flex-col gap-5">
      {q.questions.map((item, qi) => {
        const done = checked[item.id];
        const correct = picked[item.id] === item.answer_index;
        const check = () => {
          const nextChecked = { ...checked, [item.id]: true };
          // 문항별 첫 시도만 내 학습 기록(서버)에 남긴다. 화면의 정답 표시와 같은 기준이다.
          if (!(item.id in progress.quiz) && analysis && feature) {
            saveQuizAttempt(analysis.id, feature.id, item.id, picked[item.id]);
          }
          setQuiz(picked, nextChecked, (p) => ({
            ...p,
            quiz: item.id in p.quiz ? p.quiz : { ...p.quiz, [item.id]: picked[item.id] === item.answer_index },
            steps: q.questions.every((x) => nextChecked[x.id]) ? { ...p.steps, quiz: true } : p.steps,
          }));
        };
        const related = done && !correct ? relatedConcept(item.references) : null;
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
                      onChange={() => setQuiz({ ...picked, [item.id]: ci }, checked)}
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
                    <p className="text-sm">방금 본 정답을 외워 다시 맞히기보다, 관련 개념 설명을 먼저 읽어 보는 걸 추천해요.</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={secondaryBtn}
                        onClick={() => {
                          const nextPicked = { ...picked };
                          delete nextPicked[item.id];
                          setQuiz(nextPicked, { ...checked, [item.id]: false });
                        }}
                      >
                        다시 풀기
                      </button>
                      <button
                        type="button"
                        className={secondaryBtn}
                        onClick={() => router.push(related ? `/demo/concept#concept-${related.index}` : "/demo/concept")}
                      >
                        {related ? `관련 개념 다시 보기: ${related.name}` : "개념 설명 다시 보기"}
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
