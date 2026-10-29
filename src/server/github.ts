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
  } catch (err) {
    const name = (err as { name?: string })?.name ?? "Error";
    let path = url;
    try {
      path = new URL(url).pathname;
    } catch {}
    // 응답을 받기 전에 끊긴 경우(네트워크 장애·시간 초과). 한도 초과·저장소 없음과 구분된다.
    console.error(`[github] github_unavailable network=${name} path=${path} token=${config.githubToken ? "yes" : "no"}`);
    throw new AppError("github_unavailable", "GitHub에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}

// GitHub 실패 원인을 나중에 구분할 수 있게 서버 로그에 남긴다(B1).
// 원본 상태·남은 한도·reset 시각·요청 ID·토큰 사용 여부만 남기고, 토큰 값이나 응답 본문은 남기지 않는다.
function logGithubFailure(res: Response, code: string) {
  const h = res.headers;
  let path = res.url;
  try {
    path = new URL(res.url).pathname;
  } catch {}
  console.error(
    `[github] ${code} status=${res.status} path=${path} remaining=${h.get("x-ratelimit-remaining") ?? "-"}`
      + ` reset=${h.get("x-ratelimit-reset") ?? "-"} retry_after=${h.get("retry-after") ?? "-"}`
      + ` request_id=${h.get("x-github-request-id") ?? "-"} token=${config.githubToken ? "yes" : "no"}`,
  );
}

function checkStatus(res: Response) {
  if (res.ok) return;
  const remaining = res.headers.get("x-ratelimit-remaining");
  // 기본 한도 소진(remaining=0)과 짧은 시간에 몰린 요청 제한(403 + retry-after) 모두 한도 초과로 본다.
  if (res.status === 429 || (res.status === 403 && (remaining === "0" || res.headers.has("retry-after")))) {
    logGithubFailure(res, "github_rate_limited");
    const reset = Number(res.headers.get("x-ratelimit-reset"));
    const retryAfter = Number(res.headers.get("retry-after"));
    const resetAt = Number.isFinite(reset) && reset > 0
      ? new Date(reset * 1000)
      : Number.isFinite(retryAfter) && retryAfter > 0 ? new Date(Date.now() + retryAfter * 1000) : null;
    throw new AppError(
      "github_rate_limited",
      "GitHub 요청 한도를 넘었어요. 잠시 후 다시 시도해 주세요.",
      resetAt ? { reset_at: resetAt.toISOString() } : undefined,
    );
  }
  if (res.status === 401) {
    // 서버에 넣은 GITHUB_TOKEN이 틀렸거나 만료됐다. 사용자 탓이 아니므로 운영자 확인을 안내한다.
    logGithubFailure(res, "github_auth_failed");
    throw new AppError("github_auth_failed", "서버의 GitHub 연결 설정에 문제가 있어요. 운영진이나 팀에 알려 주세요.");
  }
  if (res.status !== 404 && res.status !== 409) logGithubFailure(res, "github_unavailable");
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
  // 404만 '받을 파일이 없음'으로 보고 뺀다. 429·5xx 등 일시 장애는 분석 전체를 실패시킨다(#6).
  // 빠진 파일로 분석이 성공하면 그 결과가 이 commit의 캐시로 남아 다음 요청에서도 계속 누락되기 때문이다.
  if (res.status === 404) {
    console.warn(`[github] raw_not_found status=404 path=/${owner}/${repo}/${sha.slice(0, 7)}/${encoded}`);
    return null;
  }
  checkStatus(res);
  let text: string;
  try {
    text = await res.text();
  } catch {
    // 응답 본문을 받다가 끊긴 경우. 일부만 받은 파일로 분석하지 않는다.
    console.error(`[github] github_unavailable body_interrupted path=/${owner}/${repo}/${sha.slice(0, 7)}/${encoded}`);
    throw new AppError("github_unavailable", "GitHub에서 파일을 받다가 연결이 끊겼어요. 잠시 후 다시 시도해 주세요.");
  }
  if (looksBinary(text)) return null;
  const { content } = redactSecrets(text.replace(/\r\n/g, "\n"));
  return { path, content, size: text.length };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  let failed = false;
  async function worker() {
    while (!failed && next < items.length) {
      const i = next++;
      try {
        out[i] = await fn(items[i]);
      } catch (err) {
        failed = true; // 하나라도 실패하면 남은 파일은 더 요청하지 않는다
        throw err;
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
