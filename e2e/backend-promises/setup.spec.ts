import { test, expect, assertDedicatedDatabase, DATABASE_URL, installFetch, providerResponse } from "./fixtures";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

test("source PostgreSQL INSERT SELECT cleanup leaves zero owned rows", async ({ sql, store, ownedId }) => {
  expect(store.kind).toBe("postgres");
  const rows = await sql<{ id: string; username: string }>(
    "INSERT INTO users (name, username, password_hash) VALUES ($1, $2, $3) RETURNING id, username",
    ["Fixture", ownedId, "not-a-login-hash"],
  );
  try {
    expect(rows).toHaveLength(1);
    const selected = await sql<{ username: string }>("SELECT username FROM users WHERE id = $1", [rows[0].id]);
    expect(selected[0].username).toBe(ownedId);
  } finally {
    await sql("DELETE FROM users WHERE id = $1 AND username = $2", [rows[0].id, ownedId]);
  }
  expect(await sql("SELECT id FROM users WHERE username = $1", [ownedId])).toEqual([]);
});

test("shared production malformed and misleading database URLs are refused before mutation", async () => {
  expect(assertDedicatedDatabase(DATABASE_URL)).toBe(DATABASE_URL);
  for (const candidate of [
    undefined,
    "not-a-url",
    DATABASE_URL.replace("127.0.0.1", "production.example.com"),
    DATABASE_URL.replace("63027", "5432"),
    DATABASE_URL.replace("codeback_promises_0850", "production"),
    `${DATABASE_URL}?host=production.example.com`,
    DATABASE_URL.replace("promises:promises@", "promises:promises@production.example.com/"),
  ]) expect(() => assertDedicatedDatabase(candidate)).toThrow();
});

test("provider uses real source schema parsing and restores original fetch on failure", async () => {
  const result = await promisify(execFile)(process.execPath, [
    "--import", "tsx", "-e",
    `const installFetch = ${installFetch.toString()}; const providerResponse = ${providerResponse.toString()}; (${providerProof.toString()})(installFetch, providerResponse).catch(error => { console.error(error); process.exitCode = 1; });`,
  ], { cwd: path.resolve(__dirname, "../.."), timeout: 20_000 });
  expect(result.stdout).toContain("provider proof passed");
});

async function providerProof(
  installFetch: typeof import("./fixtures").installFetch,
  providerResponse: typeof import("./fixtures").providerResponse,
) {
  const assert = require("node:assert/strict");
  const original = globalThis.fetch;
  let requests = 0;
  const restore = installFetch((input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
    assert.ok(Array.isArray(JSON.parse(String(init?.body)).messages));
    requests++;
    return providerResponse({ answer: "fixture" });
  });
  try {
    const { generate } = require("./src/server/ai.ts");
    const { z } = require("zod");
    assert.deepEqual(await generate(z.object({ answer: z.string() }), "Return the fixture"), { answer: "fixture" });
    await assert.rejects(fetch("https://unapproved.example.com"), /Unexpected external request/);
    assert.equal(requests, 1);
  } finally {
    restore();
  }
  assert.equal(globalThis.fetch, original);
  console.log("provider proof passed");
}
