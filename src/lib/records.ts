"use client";

// 내 학습 기록(FR-13)을 서버에 남기고 읽는다.
import { api } from "@/components/session/Session";
import type { LearningRecord } from "@/server/history";
import type { MissionGrade } from "@/server/service";

export type { LearningRecord, MissionGrade };

const base = (analysisId: string, featureId: string) =>
  `/api/analyses/${encodeURIComponent(analysisId)}/features/${encodeURIComponent(featureId)}`;

export function saveQuizAttempt(analysisId: string, featureId: string, questionId: string, chosenIndex: number) {
  return api<{ is_correct: boolean; answer_index: number; saved: true }>(`${base(analysisId, featureId)}/quiz/attempts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question_id: questionId, chosen_index: chosenIndex }),
  });
}

// 수정 미션 AI 채점(FR-08 개정). 로그인해야 하고, 점수는 서버가 '내 학습 기록'에 남긴다.
export function gradeMission(analysisId: string, featureId: string, code: string) {
  return api<{ grade: MissionGrade; saved: boolean }>(`${base(analysisId, featureId)}/exercise/grade`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code }),
  });
}
