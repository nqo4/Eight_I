import { randomUUID } from "node:crypto";
import { test as base, expect } from "@playwright/test";
import type { AnalysisStore } from "../../src/server/store";

export const DATABASE_URL = "postgres://promises:promises@127.0.0.1:63027/codeback_promises_0850";

export function assertDedicatedDatabase(value: string | undefined): string {
  if (!value) throw new Error("Dedicated backend-promises database URL required");
  const url = new URL(value);
  const owned = new URL(DATABASE_URL);
  if (
    url.protocol !== owned.protocol ||
    url.hostname !== owned.hostname ||
    url.port !== owned.port ||
    url.pathname !== owned.pathname ||
    url.username !== owned.username ||
    url.password !== owned.password ||
    url.search || url.hash
  ) throw new Error("Refusing non-owned backend-promises database");
  return value;
}

// Validate before importing source config or constructing its production pool.
process.env.DATABASE_URL = assertDedicatedDatabase(process.env.DATABASE_URL);
process.env.OPENROUTER_API_KEY = "backend-promises-fixture-not-a-secret";
export const { getStore, getSql } = require("../../src/server/store") as typeof import("../../src/server/store");

export type FetchHandler = (input: Parameters<typeof fetch>[0], init?: RequestInit) => Promise<Response> | Response;

export function installFetch(handler: FetchHandler): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = (async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (!["api.github.com", "raw.githubusercontent.com", "openrouter.ai"].includes(url.hostname)) {
      throw new Error(`Unexpected external request: ${url.origin}`);
    }
    return handler(input, init);
  }) as typeof fetch;
  return () => { globalThis.fetch = original; };
}

export function providerResponse(payload: unknown): Response {
  return Response.json({
    id: "backend-promises-response",
    object: "chat.completion",
    created: 1,
    model: "backend-promises-fixture",
    choices: [{ index: 0, message: { role: "assistant", content: JSON.stringify(payload) }, finish_reason: "stop" }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  });
}

type Sql = NonNullable<ReturnType<typeof getSql>>;
type Fixtures = { sql: Sql; store: AnalysisStore; ownedId: string; networkBoundary: void };

export const test = base.extend<Fixtures>({
  networkBoundary: [async ({}, use) => {
    const original = globalThis.fetch;
    const restore = installFetch(() => { throw new Error("Unconfigured fixture external request"); });
    try {
      await use();
    } finally {
      restore();
      expect(globalThis.fetch).toBe(original);
    }
  }, { auto: true }],
  sql: async ({}, use) => {
    const sql = getSql();
    if (!sql) throw new Error("Dedicated PostgreSQL source store required");
    await sql("SELECT 1", []);
    await use(sql);
  },
  store: async ({}, use) => { await use(getStore()); },
  ownedId: async ({ sql }, use) => {
    const id = `promises_${randomUUID().replaceAll("-", "")}`;
    try {
      await use(id);
    } finally {
      await sql("DELETE FROM quiz_attempts WHERE analysis_id LIKE $1", [`${id}%`]);
      await sql("DELETE FROM analyses WHERE id LIKE $1", [`${id}%`]);
      await sql("DELETE FROM repositories WHERE id LIKE $1", [`${id}%`]);
      await sql("DELETE FROM users WHERE username LIKE $1", [`${id}%`]);
    }
  },
});

export { expect };
