import { expect, test, getStore } from "./fixtures"
import { fetchSnapshot } from "../../src/server/github"
import { analyzeRepository } from "../../src/server/service"
import type { Repository } from "../../src/server/types"

const repository: Repository = {
  id: "collection-fixture/repo",
  owner: "collection-fixture",
  name: "repo",
  url: "https://github.com/collection-fixture/repo",
  default_branch: "main",
  commit_sha: "collection-fixture-sha",
  last_commit_at: null,
  description: null,
}

test.beforeEach(async ({ ownedId }) => {
  repository.id = `${ownedId}/repo`
  repository.owner = ownedId
  repository.url = `https://github.com/${repository.id}`
})

async function withFetch(
  paths: string[],
  raw: (path: string) => Response,
  check: () => Promise<void>,
) {
  const original = globalThis.fetch
  let aiCalls = 0
  globalThis.fetch = async (input) => {
    const url = String(input)
    if (url.startsWith("https://api.github.com/")) {
      if (url.includes("/commits/")) return Response.json({ sha: repository.commit_sha })
      if (!url.includes("/git/trees/")) return Response.json({
        full_name: repository.id,
        name: repository.name,
        owner: { login: repository.owner },
        html_url: repository.url,
        default_branch: repository.default_branch,
        private: false,
        description: null,
      })
      return Response.json({
        truncated: false,
        tree: paths.map((path) => ({ path, type: "blob", size: 32 })),
      })
    }
    if (url.startsWith("https://raw.githubusercontent.com/")) return raw(url.split("/").pop()!)
    if (url.startsWith("https://openrouter.ai/")) aiCalls++
    throw new Error(`Unexpected external request: ${url}`)
  }
  try {
    await check()
    expect(aiCalls).toBe(0)
  } finally {
    globalThis.fetch = original
  }
}

for (const [status, remaining, code] of [
  [500, null, "github_unavailable"],
  [404, null, "github_unavailable"],
  [409, null, "github_unavailable"],
  [403, null, "github_unavailable"],
  [429, null, "github_rate_limited"],
  [403, "0", "github_rate_limited"],
] as const) {
  test(`선택 파일 실패 ${status} remaining=${remaining}`, async () => {
    await withFetch(["good.ts", "failed.ts"], (path) => new Response("export const good = 1", {
      status: path === "failed.ts" ? status : 200,
      headers: remaining === null ? {} : { "x-ratelimit-remaining": remaining },
    }), async () => {
      await expect(fetchSnapshot(repository)).rejects.toMatchObject({ code })
      await expect(analyzeRepository(repository.url)).rejects.toMatchObject({ code })
      expect(await getStore().findByCommit(repository.id, repository.commit_sha)).toBeNull()
    })
  })
}

test("선택 파일 실패 body 읽기와 전체 파일 실패", async () => {
  await withFetch(["good.ts", "failed.ts"], (path) => path === "good.ts"
    ? new Response("export const good = 1")
    : new Response(new ReadableStream({
      start(controller) { controller.error(new Error("body interrupted")) },
    })), async () => {
    await expect(fetchSnapshot(repository)).rejects.toMatchObject({ code: "github_unavailable" })
    await expect(analyzeRepository(repository.url)).rejects.toMatchObject({ code: "github_unavailable" })
    expect(await getStore().findByCommit(repository.id, repository.commit_sha)).toBeNull()
  })
  await withFetch(["failed.ts"], () => new Response("", { status: 404 }), async () => {
    await expect(fetchSnapshot(repository)).rejects.toMatchObject({ code: "github_unavailable" })
    await expect(analyzeRepository(repository.url)).rejects.toMatchObject({ code: "github_unavailable" })
    expect(await getStore().findByCommit(repository.id, repository.commit_sha)).toBeNull()
  })
})

test("정상 수집과 기존 제외", async () => {
  const requested: string[] = []
  await withFetch(["good.ts", "binary.ts", ".env", "node_modules/ignored.ts"], (path) => {
    requested.push(path)
    return new Response(path === "binary.ts" ? "\0binary" : "export const good = 1\r\n")
  }, async () => {
    const snapshot = await fetchSnapshot(repository)
    expect(snapshot.files).toEqual([{ path: "good.ts", content: "export const good = 1\n", size: 23 }])
    expect(snapshot.stats).toMatchObject({
      included_files: 1,
      skipped_by_filter: 3,
      skipped_sensitive: 1,
    })
    expect(requested.sort()).toEqual(["binary.ts", "good.ts"])
  })
})

test("정상 수집과 기존 제외 캐시 hit는 raw와 AI를 호출하지 않음", async ({ store, ownedId }) => {
  await withFetch(["good.ts"], () => new Response("export const good = 1"), async () => {
    const snapshot = await fetchSnapshot(repository)
    const analysis = {
      id: ownedId,
      mode: "repository" as const,
      created_at: "2026-10-01T00:00:00Z",
      repository: { ...repository },
      overview: {
        summary: "fixture", purpose: "fixture", stack: [], directories: [],
        support: { status: "supported" as const, reason: null },
        intro_sources: [], intro_inferred: false, technologies: [],
      },
      features: [], features_notice: null, stats: snapshot.stats, locate_examples: [],
    }
    await store.saveRepository(repository)
    await store.saveAnalysis({ analysis, snapshot })
    await withFetch([], () => { throw new Error("Cache hit fetched raw source") }, async () => {
      const result = await analyzeRepository(repository.url)
      expect(result.cached).toBe(true)
      expect(result.analysis.id).toBe(ownedId)
    })
  })
})
