"use client";

// 내 학습 기록(FR-13)을 서버에 남기고 읽는다. 로그인 전이면 서버가 저장하지 않고 넘어간다(saved: false).
import type { LearningRecord } from "@/server/history";

export type { LearningRecord };

const base = (analysisId: string, featureId: string) =>
  `/api/analyses/${encodeURIComponent(analysisId)}/features/${encodeURIComponent(featureId)}`;

// 기록 저장이 실패해도 학습 화면은 계속 쓸 수 있어야 하므로 오류는 삼킨다.
function post(path: string, body?: unknown) {
  fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => undefined);
}

export function saveQuizAttempt(analysisId: string, featureId: string, questionId: string, chosenIndex: number) {
  post(`${base(analysisId, featureId)}/quiz/attempts`, { question_id: questionId, chosen_index: chosenIndex });
}

export function saveMissionDone(analysisId: string, featureId: string) {
  post(`${base(analysisId, featureId)}/exercise/complete`);
}
