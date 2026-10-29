import { defineConfig } from "@playwright/test";

// This endpoint belongs to the container recorded in task-2.md, not a shared DB.
process.env.DATABASE_URL ??= "postgres://promises:promises@127.0.0.1:63027/codeback_promises_0850";
process.env.OPENROUTER_API_KEY = "backend-promises-fixture-not-a-secret";
delete process.env.AI_GATEWAY_API_KEY;
delete process.env.VERCEL_OIDC_TOKEN;

export default defineConfig({
  testDir: "./backend-promises",
  workers: 1,
  retries: 0,
  tsconfig: "../tsconfig.json",
  reporter: "list",
  outputDir: process.env.BACKEND_PROMISES_OUTPUT_DIR ?? "../.next/backend-promises-results",
});
