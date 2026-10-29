// 사용자별 기록: 내가 분석한 저장소 목록, 내가 고른 퀴즈 답. Postgres에서만 저장한다.
// 메모리 저장소(DATABASE_URL 없음)거나 로그인하지 않은 경우에는 기록하지 않고 넘어간다.
import { AppError } from "./errors";
import { getSql } from "./store";
import type { Quiz } from "./types";

export type UserRepository = {
  repo_id: string;
  url: string;
  last_commit_sha: string;
  last_commit_at: string | null;
  analysis_id: string;
  summary: string | null;
  first_added_at: string;
  last_viewed_at: string;
};

export type QuizAttempt = {
  question_id: string;
  chosen_index: number;
  is_correct: boolean;
  created_at: string;
};

export async function linkUserRepository(userId: string, repoId: string, analysisId: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql(
    `INSERT INTO user_repositories (user_id, repo_id, analysis_id) VALUES ($1, lower($2), $3)
     ON CONFLICT (user_id, repo_id) DO UPDATE SET analysis_id = EXCLUDED.analysis_id, last_viewed_at = now()`,
    [userId, repoId, analysisId],
  );
}

export async function listUserRepositories(userId: string): Promise<UserRepository[]> {
  const sql = getSql();
  if (!sql) return [];
  return sql<UserRepository>(
    `SELECT ur.repo_id, r.url, r.last_commit_sha, r.last_commit_at, ur.analysis_id,
            a.analysis->'overview'->>'summary' AS summary, ur.first_added_at, ur.last_viewed_at
       FROM user_repositories ur
       JOIN repositories r ON r.id = ur.repo_id
       JOIN analyses a ON a.id = ur.analysis_id
      WHERE ur.user_id = $1
      ORDER BY ur.last_viewed_at DESC`,
    [userId],
  );
}

// 정답 여부는 화면이 보낸 값이 아니라 서버에 저장된 퀴즈로 판정한다.
export async function recordQuizAttempt(input: {
  userId: string | null;
  analysisId: string;
  quiz: Quiz;
  questionId: string;
  chosenIndex: number;
}): Promise<{ is_correct: boolean; answer_index: number; saved: boolean }> {
  const q = input.quiz.questions.find((x) => x.id === input.questionId);
  if (!q) throw new AppError("invalid_request", "해당 문제를 찾을 수 없어요.");
  if (!Number.isInteger(input.chosenIndex) || input.chosenIndex < 0 || input.chosenIndex >= q.choices.length) {
    throw new AppError("invalid_request", "고른 보기 번호가 올바르지 않아요.");
  }
  const is_correct = input.chosenIndex === q.answer_index;
  const sql = getSql();
  // 데모(analysisId "demo")는 DB의 분석 결과가 아니라서 기록하지 않는다.
  if (!sql || !input.userId || input.analysisId === "demo") return { is_correct, answer_index: q.answer_index, saved: false };
  await sql(
    `INSERT INTO quiz_attempts (user_id, analysis_id, feature_id, question_id, chosen_index, is_correct)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [input.userId, input.analysisId, input.quiz.feature_id, q.id, input.chosenIndex, is_correct],
  );
  return { is_correct, answer_index: q.answer_index, saved: true };
}

export async function listQuizAttempts(userId: string, analysisId: string, featureId: string): Promise<QuizAttempt[]> {
  const sql = getSql();
  if (!sql) return [];
  return sql<QuizAttempt>(
    `SELECT question_id, chosen_index, is_correct, created_at FROM quiz_attempts
      WHERE user_id = $1 AND analysis_id = $2 AND feature_id = $3 ORDER BY created_at`,
    [userId, analysisId, featureId],
  );
}
