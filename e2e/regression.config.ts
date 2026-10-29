import { defineConfig } from "@playwright/test"
import submitted from "./playwright.config"

// Local only: never discovered by the submitted S1..S8 config.
export default defineConfig({
  ...submitted,
  testDir: "./regressions",
  testMatch: /.*\.spec\.ts$/,
  outputDir: "./test-results-regression",
  reporter: [["list"], ["html", { outputFolder: "playwright-report-regression", open: "never" }]],
})
