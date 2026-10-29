// 분석 결과 저장소. DATABASE_URL이 있으면 Postgres, 없으면 메모리(서버를 끄면 사라짐)에 둔다.
// 같은 저장소·같은 commit을 다시 분석하면 저장된 결과를 써서 AI 비용을 아낀다.
import { Pool } from "pg";
import { config } from "./config";
import type { Analysis, Snapshot } from "./types";

export type StoredAnalysis = { analysis: Analysis; snapshot: Snapshot };

export interface AnalysisStore {
  saveAnalysis(entry: StoredAnalysis): Promise<void>;
  getAnalysis(id: string): Promise<StoredAnalysis | null>;
  findByCommit(repoId: string, commitSha: string): Promise<StoredAnalysis | null>;
  // 기능별 흐름·학습·퀴즈·미션 결과 캐시
  getArtifact<T>(analysisId: string, key: string): Promise<T | null>;
  saveArtifact(analysisId: string, key: string, payload: unknown): Promise<void>;
}

class MemoryStore implements AnalysisStore {
  private analyses = new Map<string, StoredAnalysis>();
  private artifacts = new Map<string, unknown>();

  async saveAnalysis(entry: StoredAnalysis) {
    this.analyses.set(entry.analysis.id, entry);
  }
  async getAnalysis(id: string) {
    return this.analyses.get(id) ?? null;
  }
  async findByCommit(repoId: string, commitSha: string) {
    for (const e of this.analyses.values()) {
      const r = e.analysis.repository;
      if (r.id.toLowerCase() === repoId.toLowerCase() && r.commit_sha === commitSha) return e;
    }
    return null;
  }
  async getArtifact<T>(analysisId: string, key: string) {
    return (this.artifacts.get(`${analysisId}:${key}`) as T) ?? null;
  }
  async saveArtifact(analysisId: string, key: string, payload: unknown) {
    this.artifacts.set(`${analysisId}:${key}`, payload);
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  repo_id TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  analysis JSONB NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analyses_repo_commit ON analyses (lower(repo_id), commit_sha);
CREATE TABLE IF NOT EXISTS analysis_artifacts (
  analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (analysis_id, key)
);`;

class PostgresStore implements AnalysisStore {
  private pool: Pool;
  private ready: Promise<void>;

  constructor(url: string) {
    this.pool = new Pool({ connectionString: url, max: 5 });
    this.ready = this.pool.query(SCHEMA).then(() => undefined);
  }

  private async q<R>(text: string, values: unknown[]): Promise<R[]> {
    await this.ready;
    const res = await this.pool.query(text, values);
    return res.rows as R[];
  }

  async saveAnalysis({ analysis, snapshot }: StoredAnalysis) {
    await this.q(
      `INSERT INTO analyses (id, repo_id, commit_sha, analysis, snapshot) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET analysis = EXCLUDED.analysis, snapshot = EXCLUDED.snapshot`,
      [analysis.id, analysis.repository.id, analysis.repository.commit_sha, analysis, snapshot],
    );
  }
  async getAnalysis(id: string) {
    const rows = await this.q<StoredAnalysis>(`SELECT analysis, snapshot FROM analyses WHERE id = $1`, [id]);
    return rows[0] ?? null;
  }
  async findByCommit(repoId: string, commitSha: string) {
    const rows = await this.q<StoredAnalysis>(
      `SELECT analysis, snapshot FROM analyses WHERE lower(repo_id) = lower($1) AND commit_sha = $2
       ORDER BY created_at DESC LIMIT 1`,
      [repoId, commitSha],
    );
    return rows[0] ?? null;
  }
  async getArtifact<T>(analysisId: string, key: string) {
    const rows = await this.q<{ payload: T }>(
      `SELECT payload FROM analysis_artifacts WHERE analysis_id = $1 AND key = $2`,
      [analysisId, key],
    );
    return rows[0]?.payload ?? null;
  }
  async saveArtifact(analysisId: string, key: string, payload: unknown) {
    await this.q(
      `INSERT INTO analysis_artifacts (analysis_id, key, payload) VALUES ($1, $2, $3)
       ON CONFLICT (analysis_id, key) DO UPDATE SET payload = EXCLUDED.payload`,
      [analysisId, key, JSON.stringify(payload)],
    );
  }
}

const globalStore = globalThis as unknown as { __codebackStore?: AnalysisStore };

export function getStore(): AnalysisStore {
  if (!globalStore.__codebackStore) {
    globalStore.__codebackStore = config.databaseUrl ? new PostgresStore(config.databaseUrl) : new MemoryStore();
  }
  return globalStore.__codebackStore;
}

export async function checkStore(): Promise<"postgres" | "memory"> {
  const store = getStore();
  if (store instanceof PostgresStore) {
    await store.getAnalysis("__ping__");
    return "postgres";
  }
  return "memory";
}
