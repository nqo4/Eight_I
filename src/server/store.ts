// 분석 결과 저장소. DATABASE_URL이 있으면 Postgres, 없으면 메모리(서버를 끄면 사라짐)에 둔다.
// 같은 저장소·같은 commit을 다시 분석하면 저장된 결과를 써서 AI 비용을 아낀다.
import { Pool } from "pg";
import { config } from "./config";
import { SCHEMA } from "./schema";
import type { Analysis, Repository, Snapshot } from "./types";

export type StoredAnalysis = { analysis: Analysis; snapshot: Snapshot };

export interface AnalysisStore {
  // 저장소 종류. 번들(라우트·instrumentation)마다 클래스 사본이 따로 있어 instanceof로는 판별할 수 없다.
  readonly kind: "postgres" | "memory";
  // 저장소의 최신 commit·최종 수정 날짜를 기록한다(분석할 때마다 갱신).
  saveRepository(repo: Repository): Promise<void>;
  saveAnalysis(entry: StoredAnalysis): Promise<void>;
  getAnalysis(id: string): Promise<StoredAnalysis | null>;
  findByCommit(repoId: string, commitSha: string): Promise<StoredAnalysis | null>;
  // 기능별 흐름·학습·퀴즈·미션 결과 캐시
  getArtifact<T>(analysisId: string, key: string): Promise<T | null>;
  saveArtifact(analysisId: string, key: string, payload: unknown): Promise<void>;
}

class MemoryStore implements AnalysisStore {
  readonly kind = "memory";
  private analyses = new Map<string, StoredAnalysis>();
  private artifacts = new Map<string, unknown>();
  private repositories = new Map<string, Repository>();

  async saveRepository(repo: Repository) {
    this.repositories.set(repo.id.toLowerCase(), repo);
  }
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

class PostgresStore implements AnalysisStore {
  readonly kind = "postgres";
  private pool: Pool;
  private ready: Promise<void>;

  constructor(url: string) {
    this.pool = new Pool({ connectionString: url, max: 5 });
    this.ready = this.pool.query(SCHEMA).then(() => undefined);
  }

  // 표가 준비된 뒤 SQL을 실행한다. users.ts처럼 다른 표를 다루는 모듈도 이 함수를 쓴다.
  async q<R>(text: string, values: unknown[]): Promise<R[]> {
    await this.ready;
    const res = await this.pool.query(text, values);
    return res.rows as R[];
  }

  async saveRepository(repo: Repository) {
    await this.q(
      `INSERT INTO repositories (id, url, owner, name, default_branch, last_commit_sha, last_commit_at, checked_at)
       VALUES (lower($1), $2, $3, $4, $5, $6, $7, now())
       ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, default_branch = EXCLUDED.default_branch,
         last_commit_sha = EXCLUDED.last_commit_sha, last_commit_at = EXCLUDED.last_commit_at, checked_at = now()`,
      [repo.id, repo.url, repo.owner, repo.name, repo.default_branch, repo.commit_sha, repo.last_commit_at],
    );
  }
  async saveAnalysis({ analysis, snapshot }: StoredAnalysis) {
    const r = analysis.repository;
    await this.q(
      `INSERT INTO analyses (id, repo_id, commit_sha, commit_at, analysis, snapshot) VALUES ($1, lower($2), $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET analysis = EXCLUDED.analysis, snapshot = EXCLUDED.snapshot`,
      [analysis.id, r.id, r.commit_sha, r.last_commit_at, analysis, snapshot],
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

// Postgres일 때만 SQL 실행 함수를 돌려준다(메모리 저장소면 null).
export function getSql(): PostgresStore["q"] | null {
  const store = getStore();
  return store.kind === "postgres" ? (store as PostgresStore).q.bind(store) : null;
}

export async function checkStore(): Promise<"postgres" | "memory"> {
  const store = getStore();
  if (store.kind === "postgres") await store.getAnalysis("__ping__");
  return store.kind;
}
