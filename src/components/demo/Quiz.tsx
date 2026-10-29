"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { CodeExcerpt, ErrorBox, Loading, refLabel, secondaryBtn, seededOrder } from "@/components/demo/ui";
import { useFeatureResource, useSession, type ApiError } from "@/components/session/Session";
import { readQuizAttempts, saveQuizAttempt } from "@/lib/records";
import type { CodeReference, Lesson, Quiz as QuizData } from "@/server/types";

// FR-07 이해도 퀴즈: 보기를 고르고 '정답 확인'을 누르면 정답 여부·이유·코드 위치를 보여 준다.
const overlaps = (a: CodeReference, b: CodeReference) =>
  a.path === b.path && a.start_line <= b.end_line && b.start_line <= a.end_line;

const keys = "ABCDEF";
const emptyAttempts: ReturnType<typeof readQuizAttempts> = Object.freeze({});

export function Quiz() {
  const { analysis, feature } = useSession();
  return <QuizContent key={`${analysis?.id}:${feature?.id}`} />;
}

function QuizContent() {
  const router = useRouter();
  const { analysis, feature, record, progress, loadError, isCurrent } = useSession();
  const { data, error, retry, slow } = useFeatureResource<{ quiz: QuizData }>("quiz");
  const lesson = useFeatureResource<{ lesson: Lesson }>("lesson");
  const scope = analysis && feature ? { analysisId: analysis.id, featureId: feature.id } : null;
  const firstAttempts = scope ? readQuizAttempts(scope) : emptyAttempts;
  const firstEntries = Object.entries(firstAttempts).filter(([id]) => !(id in progress.quiz));
  const picked = { ...progress.quizView?.picked, ...Object.fromEntries(firstEntries.map(([id, a]) => [id, a.chosenIndex])) };
  const checked = { ...progress.quizView?.checked, ...Object.fromEntries(firstEntries.filter(([, a]) => a.result).map(([id]) => [id, true])) };
  // 첫 답을 서버에 저장하는 중이거나 저장에 실패한 문항. 저장이 끝날 때까지 고른 보기를 바꾸지 못하고 결과도 보여 주지 않는다.
  const [saving, setSaving] = useState<Record<string, { busy: boolean; error: ApiError | null }>>({});
  const busy = useRef(new Set<string>());
  // 저장 응답 직후 새로고침한 경우에도 확인된 최초 결과를 진행 상태에 복원한다.
  useEffect(() => {
    const accepted = Object.entries(firstAttempts).flatMap(([id, a]) =>
      a.result && !(id in progress.quiz) ? [{ id, chosenIndex: a.chosenIndex, result: a.result }] : []);
    if (!data || !accepted.length) return;
    record((p) => {
      const nextChecked = { ...p.quizView?.checked, ...Object.fromEntries(accepted.map((a) => [a.id, true])) };
      return {
        ...p,
        quiz: { ...p.quiz, ...Object.fromEntries(accepted.map((a) => [a.id, a.result.is_correct])) },
        quizView: {
          picked: { ...p.quizView?.picked, ...Object.fromEntries(accepted.map((a) => [a.id, a.chosenIndex])) },
          checked: nextChecked,
        },
        steps: data.quiz.questions.every((x) => nextChecked[x.id]) ? { ...p.steps, quiz: true } : p.steps,
      };
    });
  }, [data, firstAttempts, progress.quiz, record]);
  const relatedConcept = (refs: CodeReference[]) => {
    const concepts = lesson.data?.lesson.concepts ?? [];
    const i = concepts.findIndex((c) => c.references.some((r) => refs.some((q) => overlaps(r, q))));
    const j = i >= 0 ? i : concepts.findIndex((c) => c.references.some((r) => refs.some((q) => q.path === r.path)));
    return j >= 0 ? { index: j, name: concepts[j].name } : null;
  };

  if (error) return <ErrorBox error={error} onRetry={loadError ? undefined : retry} home={Boolean(loadError)} />;
  if (!data) return <Loading slow={slow} />;
  const q = data.quiz;
  const allDone = q.questions.every((item) => checked[item.id]);

  return (
    <div className="flex w-full max-w-[860px] flex-col gap-5">
      {q.questions.map((item, qi) => {
        const done = checked[item.id];
        const correct = picked[item.id] === item.answer_index;
        const save = saving[item.id];
        const locked = Boolean(save || firstAttempts[item.id] && !(item.id in progress.quiz));
        const chosenIndex = picked[item.id];
        const reveal = (firstCorrect: boolean) => record((p) => {
          const nextChecked = { ...p.quizView?.checked, [item.id]: true };
          return {
            ...p,
            quizView: { picked: { ...p.quizView?.picked, [item.id]: chosenIndex }, checked: nextChecked },
            quiz: item.id in p.quiz ? p.quiz : { ...p.quiz, [item.id]: firstCorrect },
            steps: q.questions.every((x) => nextChecked[x.id]) ? { ...p.steps, quiz: true } : p.steps,
          };
        });
        const check = async () => {
          // 문항별 첫 시도만 내 학습 기록(서버)에 남긴다(FR-07·FR-13). 저장이 확인된 뒤에만 결과를 보여 준다.
          if (chosenIndex === undefined || busy.current.has(item.id) || !isCurrent()) return;
          if (item.id in progress.quiz) return reveal(progress.quiz[item.id]);
          if (!scope) return;
          busy.current.add(item.id);
          setSaving((s) => ({ ...s, [item.id]: { busy: true, error: null } }));
          try {
            const result = await saveQuizAttempt(scope, { questionId: item.id, chosenIndex });
            if (!isCurrent()) return;
            setSaving((s) => {
              const next = { ...s };
              delete next[item.id];
              return next;
            });
            reveal(result.is_correct);
          } catch (e) {
            if (!isCurrent()) return;
            setSaving((s) => ({ ...s, [item.id]: { busy: false, error: e as ApiError } }));
          } finally {
            busy.current.delete(item.id);
          }
        };
        const related = done && !correct ? relatedConcept(item.references) : null;
        return (
          <fieldset
            key={item.id}
            data-testid="quiz-question"
            aria-labelledby={`quiz-q-${item.id}`}
            className="flex min-w-0 flex-col items-start gap-4 rounded-16 border border-line bg-surface px-5 pt-6 pb-5 sm:px-10 sm:pt-8 sm:pb-7"
          >
            <p className="font-manrope text-xs font-bold tracking-wider text-brand-purple-ink">
              QUIZ · {qi + 1} / {q.questions.length}
            </p>
            <h2 id={`quiz-q-${item.id}`} className="text-lg leading-7 font-bold text-balance text-text-primary sm:text-[22px] sm:leading-8">
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
                      disabled={done || locked}
                      checked={active}
                      onChange={() => record((p) => ({
                        ...p,
                        quizView: { picked: { ...p.quizView?.picked, [item.id]: ci }, checked: p.quizView?.checked ?? {} },
                      }))}
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
              <div className="flex flex-wrap items-center gap-3">
                <PrimaryButton label="정답 확인" disabled={picked[item.id] === undefined || save?.busy} onClick={check} />
                {picked[item.id] === undefined && <span className="text-sm text-text-muted">보기를 하나 고르면 확인할 수 있어요</span>}
                {save?.busy && <span className="text-sm text-text-muted">내 학습 기록에 저장하는 중이에요</span>}
              </div>
            )}
            {!done && save?.error && (
              <p role="alert" data-testid="quiz-save-error" className="text-sm font-bold text-status-red">
                {save.error.message} 고른 답은 그대로 두고 &lsquo;정답 확인&rsquo;을 다시 누르면 첫 답으로 저장해요.
              </p>
            )}
            {done && (
              <div data-testid="quiz-result" className="flex w-full flex-col gap-3 rounded-8 bg-brand-purple-soft p-4">
                <p className={`font-bold ${correct ? "text-status-green-ink" : "text-status-red"}`}>
                  {correct ? "✓ 정답이에요" : `! 오답이에요 (정답: ${item.choices[item.answer_index]})`}
                </p>
                <p data-testid="quiz-explanation" className="text-sm leading-6 text-pretty">{item.explanation}</p>
                <ul data-testid="quiz-refs" className="font-mono text-sm break-all text-text-muted">
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
                          record((p) => {
                            const nextPicked = { ...p.quizView?.picked };
                            delete nextPicked[item.id];
                            return { ...p, quizView: { picked: nextPicked, checked: { ...p.quizView?.checked, [item.id]: false } } };
                          });
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
