"use client";

// 내 학습 기록(FR-13)을 서버에 남기고 읽는다. 로그인 전이면 서버가 저장하지 않고 넘어간다(saved: false).
import { api } from "@/components/session/Session";
import { getAuthEpoch, getCurrentUser } from "@/lib/auth";
import { z } from "zod";
import type { LearningRecord } from "@/server/history";
import type { MissionGrade } from "@/server/service";

export type { LearningRecord, MissionGrade };

const base = (analysisId: string, featureId: string) =>
  `/api/analyses/${encodeURIComponent(analysisId)}/features/${encodeURIComponent(featureId)}`;

const quizResultSchema = z.object({
  is_correct: z.boolean(),
  answer_index: z.number().int().nonnegative(),
  saved: z.literal(true),
});
export type QuizAttemptResult = z.infer<typeof quizResultSchema>;
const attemptsSchema = z.record(z.string(), z.object({
  chosenIndex: z.number().int().nonnegative(),
  result: quizResultSchema.optional(),
}));
type QuizScope = { readonly analysisId: string; readonly featureId: string };
const pendingRequests = new Map<string, Promise<QuizAttemptResult>>();
const attemptKey = (scope: QuizScope) =>
  `codeback:v1:quiz-attempts:${JSON.stringify([getCurrentUser()?.email, scope.analysisId, scope.featureId])}`;

export class QuizSaveError extends Error {
  readonly retryable = true;
  readonly code = "quiz_save_unacknowledged";
}

// 최초 답은 POST 전에 동기적으로 남긴다. 응답을 잃거나 화면을 다시 열어도 같은 답만 재전송한다.
export function readQuizAttempts(scope: QuizScope): z.infer<typeof attemptsSchema> {
  if (typeof window === "undefined" || !getCurrentUser()) return {};
  try {
    const parsed = attemptsSchema.safeParse(JSON.parse(window.localStorage.getItem(attemptKey(scope)) ?? "{}"));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

// FR-07·FR-13: 문항별 첫 답을 서버에 남긴다. HTTP 오류·연결 실패는 ApiError로 던져 화면이 다시 저장할 수 있게 한다.
// saved가 false면(로그인 전 등) 서버가 기록하지 않은 것이다.
export async function saveQuizAttempt(scope: QuizScope, answer: { readonly questionId: string; readonly chosenIndex: number }) {
  if (!getCurrentUser()) throw new QuizSaveError("로그인 후 첫 답을 저장해 주세요.");
  const epoch = getAuthEpoch();
  const key = attemptKey(scope);
  const requestKey = `${key}:${answer.questionId}`;
  const running = pendingRequests.get(requestKey);
  if (running) return running;
  const attempts = readQuizAttempts(scope);
  const first = attempts[answer.questionId] ?? { chosenIndex: answer.chosenIndex };
  if (first.result) return first.result;
  try {
    window.localStorage.setItem(key, JSON.stringify({ ...attempts, [answer.questionId]: first }));
  } catch {
    throw new QuizSaveError("첫 답을 브라우저에 보관하지 못했어요. 저장 공간 설정을 확인해 주세요.");
  }
  const pending = api<unknown>(`${base(scope.analysisId, scope.featureId)}/quiz/attempts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question_id: answer.questionId, chosen_index: first.chosenIndex }),
  }).then((body) => {
    if (epoch !== getAuthEpoch()) throw new QuizSaveError("계정이 바뀌어 저장 결과를 반영하지 않았어요.");
    const parsed = quizResultSchema.safeParse(body);
    if (!parsed.success) throw new QuizSaveError("내 학습 기록에 저장되지 않았어요. 다시 시도해 주세요.");
    // 다른 문항의 동시 저장 결과를 보존한다.
    const latest = readQuizAttempts(scope);
    try {
      window.localStorage.setItem(key, JSON.stringify({ ...latest, [answer.questionId]: { ...first, result: parsed.data } }));
    } catch {
      throw new QuizSaveError("저장 확인을 보관하지 못했어요. 같은 첫 답으로 다시 시도해 주세요.");
    }
    return parsed.data;
  }).finally(() => pendingRequests.delete(requestKey));
  pendingRequests.set(requestKey, pending);
  return pending;
}

// 수정 미션 AI 채점(FR-08). 로그인해야 하고, 점수는 서버가 '내 학습 기록'에 남긴다.
export function gradeMission(analysisId: string, featureId: string, code: string) {
  return api<{ grade: MissionGrade; saved: boolean }>(`${base(analysisId, featureId)}/exercise/grade`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code }),
  });
}
