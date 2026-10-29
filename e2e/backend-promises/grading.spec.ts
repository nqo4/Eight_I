import { expect, test } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import type { StoredAnalysis } from "../../src/server/store";

test("original service rejects incomplete judgments and repairs cached flow confidence", async () => {
  const result = await promisify(execFile)(process.execPath, ["--import", "tsx", "-e", `(${proof.toString()})().catch(error => { console.error(error); process.exitCode = 1; })`], {
    cwd: path.resolve(__dirname, "../.."),
    timeout: 20_000,
  });
  expect(result.stdout).toContain("service proof passed");
});

async function proof() {
  const assert = require("node:assert/strict");
  const { randomUUID } = require("node:crypto");
  const previous = { ...process.env };
  const fetch = globalThis.fetch;
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.POSTGRES_PRISMA_URL;
  process.env.OPENROUTER_API_KEY = "fixture-only";
  let payload: unknown;
  let calls = 0;
  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith("https://openrouter.ai/api/v1/")) throw new Error(`Unexpected network: ${url}`);
    calls++;
    return Response.json({id:"fixture", object:"chat.completion", created:0, model:"fixture", choices:[{index:0, message:{role:"assistant", content:JSON.stringify(payload)}, finish_reason:"stop"}], usage:{prompt_tokens:1, completion_tokens:1, total_tokens:2}});
  };
  try {
    const { getStore } = require("./src/server/store.ts");
    const { gradeMission, getExercise, getFlow } = require("./src/server/service.ts");
    const store = getStore();
    assert.equal(store.kind, "memory");
    const id = randomUUID();
    const ref = {path:"a.ts", start_line:1, end_line:1, snippet:"export {}", commit_sha:"sha"};
    await store.saveAnalysis({
      analysis:{id, repository:{commit_sha:"sha"}, features:[{id:"F1", title:"fixture", summary:"fixture", code_references:[ref]}]},
      snapshot:{files:[{path:"a.ts", content:"// import x from './b'", size:20}, {path:"b.ts", content:"export {}", size:9}]},
    } as StoredAnalysis);
    const exercise = {feature_id:"F1", kind:"modify", instruction:"fixture", target_references:[ref], hints:[], acceptance_checks:["first","second"], disclaimer:"fixture"};
    await store.saveArtifact(id, "F1:exercise", exercise);
    for (const count of [0, 1, 3]) {
      payload = {checks:Array.from({length:count}, () => ({met:true,reason:"fixture"})), feedback:"fixture", hint:null};
      await assert.rejects(gradeMission(id, "F1", "const x = 1"), {code:"ai_failed", status:502});
    }
    for (const met of [[false,false], [true,false], [true,true]]) {
      payload = {checks:met.map(value => ({met:value,reason:"fixture"})), feedback:"fixture", hint:null};
      assert.equal((await gradeMission(id, "F1", "const x = 1")).score, met.filter(Boolean).length * 50);
    }
    payload = {checks:[{met:"true", reason:"fixture"},{met:true, reason:"fixture"}], feedback:"fixture", hint:null};
    await assert.rejects(gradeMission(id, "F1", "const x = 1"), {code:"ai_failed"});
    for (const acceptance_checks of [[], [" "], ["first", ""]]) {
      await store.saveArtifact(id, "F1:exercise", {...exercise, acceptance_checks});
      const before = calls;
      await assert.rejects(gradeMission(id, "F1", "const x = 1"), {code:"internal_error", retryable:false});
      assert.equal(calls, before);
    }
    await store.saveArtifact(id, "F1:flow", {feature_id:"F1", steps:[{order:1, reference:ref}, {order:2, reference:{...ref,path:"b.ts"}}, {order:3, reference:{...ref,path:"b.ts"}}], links:[{from:1,to:2,confidence:"verified"},{from:2,to:3,confidence:"verified"}]});
    const before = calls;
    assert.deepEqual((await getFlow(id, "F1")).links.map((link: {confidence: string}) => link.confidence), ["inferred","inferred"]);
    assert.equal(calls, before);
    for (const acceptance_checks of [[], [" "]]) {
      await store.saveArtifact(id, "F1:exercise", null);
      payload = {kind:"modify", instruction:"fixture", targets:[ref], hints:{minimal:"a",concept:"b",code:"c"}, acceptance_checks};
      await assert.rejects(getExercise(id, "F1"), {code:"ai_failed"});
      assert.equal(await store.getArtifact(id, "F1:exercise"), null);
    }
  } finally {
    globalThis.fetch = fetch;
    process.env = previous;
    delete (globalThis as {__codebackStore?: unknown}).__codebackStore;
  }
  console.log("service proof passed");
}
