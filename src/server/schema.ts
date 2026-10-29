// DB 표 구조. 앱이 처음 DB에 연결할 때 이 SQL을 실행한다(이미 있는 표·칸은 건드리지 않음).
// 표를 바꿀 때는 기존 DB도 맞도록 CREATE ... IF NOT EXISTS / ALTER ... ADD COLUMN IF NOT EXISTS로 쓴다.
//
//  users ─┬─ sessions            로그인 유지
//         ├─ user_repositories ── repositories   내가 분석한 저장소 목록
//         └─ quiz_attempts ────── analyses       내가 고른 퀴즈 답·수정 미션 점수
//  repositories ── analyses ── analysis_artifacts (흐름·학습·퀴즈·미션 결과)
export const SCHEMA = `
-- 사용자. 비밀번호 원문은 저장하지 않고 해시만 둔다.
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (lower(username));

-- 로그인 세션. 브라우저 쿠키에는 원래 토큰을, DB에는 그 해시만 둔다.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id);

-- GitHub 저장소. 마지막으로 확인한 최신 commit과 그 시각(최종 수정 날짜)을 둔다.
CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,                -- "owner/repo" 소문자
  url TEXT NOT NULL,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  default_branch TEXT NOT NULL,
  last_commit_sha TEXT NOT NULL,
  last_commit_at TIMESTAMPTZ,         -- GitHub 기본 브랜치의 최종 수정 날짜
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 분석 결과(개요·기능 카드)와 분석에 쓴 파일 내용. 저장소 + commit 하나당 하나.
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  repo_id TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  analysis JSONB NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS commit_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS analyses_repo_commit ON analyses (lower(repo_id), commit_sha);

-- 기능별 결과: key = "F1:flow" | "F1:lesson"(코드 정리 내용) | "F1:quiz"(문제와 정답) | "F1:exercise"
CREATE TABLE IF NOT EXISTS analysis_artifacts (
  analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (analysis_id, key)
);

-- 사용자가 분석한 저장소 목록. 같은 저장소를 다시 분석하면 마지막 분석 결과로 바꾼다.
CREATE TABLE IF NOT EXISTS user_repositories (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_id TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  first_added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, repo_id)
);

-- 사용자가 고른 퀴즈 답. 같은 문제를 여러 번 풀면 모두 남긴다.
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  chosen_index INT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quiz_attempts_user ON quiz_attempts (user_id, analysis_id, feature_id);
-- FR-07·FR-08(개정): 퀴즈와 수정 미션 점수를 한 표에서 관리한다. kind = 'quiz' | 'mission'.
-- 미션은 question_id = 'mission', chosen_index 없음, score(0~100, AI 추정 채점), is_correct = 성공 조건을 모두 채움.
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'quiz';
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS score INT;
ALTER TABLE quiz_attempts ALTER COLUMN chosen_index DROP NOT NULL;

`;
