// FR-01: 공개 GitHub 저장소의 기본 브랜치 파일을 읽는다. 코드는 읽기만 하고 실행하지 않는다.
import { config } from "./config";
import { AppError } from "./errors";
import { looksBinary, priority, redactSecrets, skipReason } from "./filter";
import type { Repository, Snapshot, SnapshotFile } from "./types";

const API = "https://api.github.com";
const RAW = "https://raw.githubusercontent.com";

const SEGMENT = /^[A-Za-z0-9_.-]+$/;

export function parseRepoUrl(input: string): { owner: string; repo: string } {
  const trimmed = input.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw invalidUrl();
  }
  if (!/^(www\.)?github\.com$/i.test(url.hostname)) throw invalidUrl();
  const [owner, rawRepo] = url.pathname.split("/").filter(Boolean);
  const repo = rawRepo?.replace(/\.git$/i, "");
  if (!owner || !repo || !SEGMENT.test(owner) || !SEGMENT.test(repo)) throw invalidUrl();
  return { owner, repo };
}

function invalidUrl() {
  return new AppError(
    "invalid_url",
    "GitHub 저장소 주소 형식이 아니에요. https://github.com/소유자/저장소 형태로 입력해 주세요.",
  );
}

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "codeback-analyzer",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (config.githubToken) h.Authorization = `Bearer ${config.githubToken}`;
  return h;
}

async function request(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      headers: { ...headers(), ...init?.headers },
      signal: AbortSignal.timeout(config.githubTimeoutMs),
      cache: "no-store",
    });
  } catch {
    throw new AppError("github_unavailable", "GitHub에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}

function checkStatus(res: Response) {
  if (res.ok) return;
  const remaining = res.headers.get("x-ratelimit-remaining");
  if (res.status === 429 || (res.status === 403 && remaining === "0")) {
    const reset = Number(res.headers.get("x-ratelimit-reset"));
    throw new AppError(
      "github_rate_limited",
      "GitHub 요청 한도를 넘었어요. 잠시 후 다시 시도해 주세요.",
      Number.isFinite(reset) && reset > 0 ? { reset_at: new Date(reset * 1000).toISOString() } : undefined,
    );
  }
  if (res.status === 404) {
    // 토큰 없이 비공개 저장소를 요청해도 GitHub는 404를 준다.
    throw new AppError(
      "repo_not_found",
      "저장소를 찾을 수 없어요. 주소가 맞는지, 공개(public) 저장소인지 확인해 주세요.",
    );
  }
  if (res.status === 409) {
    throw new AppError("repo_empty", "저장소에 아직 커밋이 없어요.");
  }
  throw new AppError("github_unavailable", `GitHub 응답 오류(${res.status})가 났어요. 잠시 후 다시 시도해 주세요.`);
}

async function getJson<T>(url: string): Promise<T> {
  const res = await request(url);
  checkStatus(res);
  return (await res.json()) as T;
}

type RepoResponse = {
  full_name: string;
  name: string;
  owner: { login: string };
  html_url: string;
  default_branch: string;
  private: boolean;
  description: string | null;
};
type CommitResponse = {
  sha: string;
  commit?: { committer?: { date?: string }; author?: { date?: string } };
};
type TreeResponse = {
  truncated: boolean;
  tree: { path: string; type: string; size?: number }[];
};

// 저장소 정보와 기본 브랜치의 최신 commit·최종 수정 날짜만 확인한다(GitHub 요청 2번, 파일은 받지 않음).
// 이 commit을 이미 분석했다면 파일을 다시 받지도, AI를 다시 부르지도 않는다.
export async function fetchRepositoryHead(input: string): Promise<Repository> {
  const { owner, repo } = parseRepoUrl(input);
  const base = `${API}/repos/${owner}/${repo}`;

  const info = await getJson<RepoResponse>(base);
  if (info.private) {
    throw new AppError("repo_private", "비공개 저장소는 분석할 수 없어요. 공개 저장소만 지원해요.");
  }
  const commit = await getJson<CommitResponse>(`${base}/commits/${encodeURIComponent(info.default_branch)}`);
  const [canonicalOwner, canonicalName] = info.full_name.split("/");
  return {
    id: info.full_name,
    url: info.html_url,
    name: canonicalName,
    owner: canonicalOwner,
    default_branch: info.default_branch,
    commit_sha: commit.sha,
    last_commit_at: commit.commit?.committer?.date ?? commit.commit?.author?.date ?? null,
    description: info.description,
  };
}

// 분석할 파일을 고르고 내용을 받는다(FR-02).
export async function fetchSnapshot(repository: Repository): Promise<Snapshot> {
  const { owner, name: repo, commit_sha } = repository;
  const base = `${API}/repos/${owner}/${repo}`;
  const commit = { sha: commit_sha };
  const tree = await getJson<TreeResponse>(`${base}/git/trees/${commit.sha}?recursive=1`);

  const blobs = tree.tree.filter((e) => e.type === "blob");
  let skippedByFilter = 0;
  let skippedSensitive = 0;
  const candidates = blobs
    .filter((e) => {
      const reason = skipReason(e.path);
      if (reason === "sensitive") skippedSensitive++;
      if (reason || (e.size ?? 0) > config.maxFileBytes) {
        skippedByFilter++;
        return false;
      }
      return true;
    })
    .sort((a, b) => priority(a.path) - priority(b.path) || a.path.localeCompare(b.path));

  // 우선순위 순서로 파일 수·총 크기 한도까지만 고른다.
  const chosen: typeof candidates = [];
  let total = 0;
  for (const e of candidates) {
    if (chosen.length >= config.maxFiles) break;
    if (total + (e.size ?? 0) > config.maxTotalBytes) continue;
    chosen.push(e);
    total += e.size ?? 0;
  }

  const files = (await mapLimit(chosen, 8, (e) => fetchRaw(owner, repo, commit.sha, e.path))).filter(
    (f): f is SnapshotFile => f !== null,
  );

  return {
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
    stats: {
      total_files: blobs.length,
      included_files: files.length,
      skipped_by_filter: skippedByFilter + (chosen.length - files.length),
      skipped_sensitive: skippedSensitive,
      skipped_by_limit: candidates.length - chosen.length,
      truncated_tree: tree.truncated,
    },
  };
}

async function fetchRaw(owner: string, repo: string, sha: string, path: string): Promise<SnapshotFile | null> {
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const res = await request(`${RAW}/${owner}/${repo}/${sha}/${encoded}`, {
    headers: { Accept: "text/plain" },
  });
  if (!res.ok) return null;
  const text = await res.text();
  if (looksBinary(text)) return null;
  const { content } = redactSecrets(text.replace(/\r\n/g, "\n"));
  return { path, content, size: text.length };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
