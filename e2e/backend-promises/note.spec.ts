import { expect, test } from "@playwright/test"
import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"
import type { Analysis } from "../../src/server/types"

const sha = "c4d72daf91d65cd0792a77fa5b08ebfa2ec72a56"
const reference = { path: "src/technology.ts", start_line: 12, end_line: 18, commit_sha: sha, snippet: "export const technology = true" }
const analysis: Analysis = {
  id: "pdf-contract", mode: "repository", created_at: "2026-10-29T00:00:00Z",
  repository: { id: "fixture/pdf", url: "https://github.com/fixture/pdf", name: "pdf", owner: "fixture", default_branch: "main", commit_sha: sha, last_commit_at: null, description: null },
  overview: {
    summary: "기술 목록 검증", purpose: "", stack: [], directories: [],
    support: { status: "supported", reason: null },
    technologies: [{ name: "OnlyTechnology", role: "화면 상태 관리", concept: "단방향 데이터 흐름", references: [reference] }],
  },
  features: [{ id: "F1", title: "기능", summary: "근거 보존", code_references: [{ ...reference, path: "src/feature.ts" }] }],
  features_notice: null, locate_examples: [],
  stats: { total_files: 2, included_files: 2, skipped_by_filter: 0, skipped_by_limit: 0, truncated_tree: false, skipped_sensitive: 0 },
}
const squash = (s: string) => s.replace(/\s+/g, "")

async function render(input: Analysis, evidence = false) {
  const { renderLearningNote } = await import("../../src/server/note")
  const originalFetch = globalThis.fetch
  let externalCalls = 0
  globalThis.fetch = async () => { externalCalls++; throw new Error("PDF must not fetch") }
  try {
    const bytes = await renderLearningNote({ analysis: input, lessons: {} })
    const document = await getDocument({ data: bytes.slice() }).promise
    try {
      let text = ""
      for (let i = 1; i <= document.numPages; i++) {
        const page = await document.getPage(i)
        text += (await page.getTextContent()).items.map((item) => "str" in item ? item.str : "").join("") + "\n"
      }
      if (evidence && process.env.NOTE_EVIDENCE_DIR) {
        const dir = process.env.NOTE_EVIDENCE_DIR
        mkdirSync(dir, { recursive: true })
        writeFileSync(resolve(dir, "task-7.pdf"), bytes)
        writeFileSync(resolve(dir, "task-7-note.txt"), text)
        for (let i = 1; i <= document.numPages; i++) {
          const page = await document.getPage(i)
          const viewport = page.getViewport({ scale: 1.5 })
          const canvas = document.canvasFactory.create(viewport.width, viewport.height)
          try {
            await page.render({ canvasContext: canvas.context, viewport }).promise
            writeFileSync(resolve(dir, `task-7-page-${i}.png`), canvas.canvas.toBuffer("image/png"))
          } finally { document.canvasFactory.destroy(canvas) }
        }
      }
      expect(externalCalls).toBe(0)
      return squash(text)
    } finally { await document.destroy() }
  } finally { globalThis.fetch = originalFetch }
}

test.beforeAll(() => { process.chdir(resolve(__dirname, "../..")) })

test("화면 기술과 PDF 일치", async () => {
  const text = await render(analysis, true)
  for (const value of ["OnlyTechnology", "화면 상태 관리", "단방향 데이터 흐름", "src/technology.ts:12–18", "fixture/pdf", sha, "src/feature.ts"]) {
    expect(text).toContain(squash(value))
  }
  const staleStack = structuredClone(analysis)
  staleStack.overview.stack = [{ name: "StaleStack", status: "confirmed", note: "stale", evidence: reference }]
  expect(await render(staleStack)).not.toContain("StaleStack")
})

test("이전 자료 fallback", async () => {
  const legacy = structuredClone(analysis)
  delete legacy.overview.technologies
  legacy.overview.stack = [
    { name: "LegacyTechnology", status: "confirmed", note: "이전 역할", evidence: reference },
    { name: "UnknownTechnology", status: "unconfirmed", note: null, evidence: { ...reference, path: "must-not-appear.ts" } },
  ]
  const text = await render(legacy)
  for (const value of ["LegacyTechnology", "이전 역할", "src/technology.ts:12–18", "UnknownTechnology"]) expect(text).toContain(squash(value))
  expect(text).not.toContain("must-not-appear.ts")
  legacy.overview.technologies = []
  expect(await render(legacy)).toBe(text)
})
