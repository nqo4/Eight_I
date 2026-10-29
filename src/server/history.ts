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
  userId: string;
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
  if (!sql) throw new AppError("auth_unavailable", "지금은 기록을 저장할 수 없어요(DB 연결 없음).");
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
      WHERE user_id = $1 AND analysis_id = $2 AND feature_id = $3 AND kind = 'quiz' ORDER BY created_at ASC, id ASC`,
    [userId, analysisId, featureId],
  );
}

export type FeatureRecord = {
  id: string;
  title: string;
  quiz_correct: number;
  quiz_total: number;
  // AI 채점(FR-08 개정) 결과. 채점한 적이 없으면 null·0.
  mission_best_score: number | null;
  mission_last_score: number | null;
  mission_graded: number;
};

export type LearningRecord = {
  repo_id: string;
  url: string;
  analysis_id: string;
  commit_sha: string;
  analyzed_at: string;
  last_viewed_at: string;
  quiz_correct: number;
  quiz_total: number;
  mission_avg_score: number | null; // 채점한 기능들의 최고 점수 평균
  features: FeatureRecord[];
};

// 내 학습 기록(FR-13): 내가 분석한 저장소마다 분석 날짜·commit, 기능별 퀴즈 결과(문항별 첫 시도)와 미션 채점 점수.
export async function listLearningRecords(userId: string): Promise<LearningRecord[]> {
  const sql = getSql();
  if (!sql) return [];
  const [repos, attempts, scores] = await Promise.all([
    sql<Omit<LearningRecord, "quiz_correct" | "quiz_total" | "mission_avg_score" | "features"> & { features: { id: string; title: string }[] }>(
      `SELECT ur.repo_id, r.url, a.id AS analysis_id, a.commit_sha, ur.last_viewed_at AS analyzed_at, ur.last_viewed_at,
              COALESCE((SELECT json_agg(json_build_object('id', f->>'id', 'title', f->>'title'))
                          FROM jsonb_array_elements(a.analysis->'features') f), '[]'::json) AS features
         FROM user_repositories ur
         JOIN repositories r ON r.id = ur.repo_id
         JOIN analyses a ON a.id = ur.analysis_id
        WHERE ur.user_id = $1
        ORDER BY ur.last_viewed_at DESC`,
      [userId],
    ),
    sql<{ analysis_id: string; feature_id: string; is_correct: boolean }>(
      `SELECT DISTINCT ON (analysis_id, feature_id, question_id) analysis_id, feature_id, is_correct
         FROM quiz_attempts WHERE user_id = $1 AND kind = 'quiz'
        ORDER BY analysis_id, feature_id, question_id, created_at ASC, id ASC`,
      [userId],
    ),
    sql<{ analysis_id: string; feature_id: string; best: number; last: number; graded: number }>(
      `SELECT analysis_id, feature_id, max(score)::int AS best,
              (array_agg(score ORDER BY created_at DESC, id DESC))[1]::int AS last, count(*)::int AS graded
         FROM quiz_attempts WHERE user_id = $1 AND kind = 'mission' AND score IS NOT NULL
        GROUP BY analysis_id, feature_id`,
      [userId],
    ),
  ]);
  const key = (a: string, f: string) => `${a}\u0000${f}`;
  const graded = new Map(scores.map((g) => [key(g.analysis_id, g.feature_id), g]));
  return repos.map((r) => {
    const features = r.features.map((f) => {
      const mine = attempts.filter((t) => t.analysis_id === r.analysis_id && t.feature_id === f.id);
      return {
        id: f.id,
        title: f.title,
        quiz_correct: mine.filter((t) => t.is_correct).length,
        quiz_total: mine.length,
        mission_best_score: graded.get(key(r.analysis_id, f.id))?.best ?? null,
        mission_last_score: graded.get(key(r.analysis_id, f.id))?.last ?? null,
        mission_graded: graded.get(key(r.analysis_id, f.id))?.graded ?? 0,
      };
    });
    const best = features.flatMap((f) => (f.mission_best_score === null ? [] : [f.mission_best_score]));
    return {
      ...r,
      quiz_correct: features.reduce((n, f) => n + f.quiz_correct, 0),
      quiz_total: features.reduce((n, f) => n + f.quiz_total, 0),
      mission_avg_score: best.length ? Math.round(best.reduce((n, x) => n + x, 0) / best.length) : null,
      features,
    };
  });
}

// FR-08(개정): 수정 미션 점수. 퀴즈 답과 같은 표에 kind='mission'으로 남긴다(제출할 때마다 한 줄).
export async function recordMissionScore(input: {
  userId: string;
  analysisId: string;
  featureId: string;
  score: number;
  passed: boolean;
}): Promise<{ saved: boolean }> {
  const sql = getSql();
  if (!sql) throw new AppError("auth_unavailable", "지금은 기록을 저장할 수 없어요(DB 연결 없음).");
  await sql(
    `INSERT INTO quiz_attempts (user_id, analysis_id, feature_id, question_id, chosen_index, is_correct, kind, score)
     VALUES ($1, $2, $3, 'mission', NULL, $4, 'mission', $5)`,
    [input.userId, input.analysisId, input.featureId, input.passed, input.score],
  );
  return { saved: true };
}
