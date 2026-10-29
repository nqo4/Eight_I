"use client";

// 내 학습 기록(F13)을 서버에 남기고 읽는다. 로그인 전이면 서버가 저장하지 않고 넘어간다(saved: false).
import { api } from "@/components/session/Session";
import type { LearningRecord } from "@/server/history";
import type { MissionGrade } from "@/server/service";

export type { LearningRecord, MissionGrade };

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

// 수정 미션 AI 채점(F8 개정). 로그인해야 하고, 점수는 서버가 '내 학습 기록'에 남긴다.
export function gradeMission(analysisId: string, featureId: string, code: string) {
  return api<{ grade: MissionGrade; saved: boolean }>(`${base(analysisId, featureId)}/exercise/grade`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code }),
  });
}
