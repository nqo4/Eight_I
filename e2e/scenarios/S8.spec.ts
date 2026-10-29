import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"
import { analyzeSample, loginAsLearner } from "../flows"

// PDF 안의 글자를 꺼낸다. 줄바꿈 위치는 화면과 다르므로 비교할 때는 공백을 모두 뺀다.
async function pdfText(path: string): Promise<string> {
  const doc = await getDocument({ data: new Uint8Array(readFileSync(path)) }).promise
  let text = ""
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent()
    text += content.items.map((item) => ("str" in item ? item.str : "")).join("") + "\n"
  }
  return text
}
const squash = (s: string) => s.replace(/\s+/g, "")

test("S8 학습자가 다음에 다시 볼 수 있도록 프로젝트 학습 노트를 내려받는다", async ({ page }) => {
  await loginAsLearner(page)
  await analyzeSample(page)
  const repo = (await page.getByTestId("repo-name").innerText()).trim()
  const shownSha = (await page.getByTestId("repo-commit").innerText()).trim()
  const intro = (await page.getByTestId("project-summary").innerText()).trim()
  const techPath = (await page.getByRole("region", { name: "사용한 기술" }).getByRole("button").first().innerText()).match(/\S+\.\w+/)?.[0] ?? ""
  const featurePath = (await page.getByRole("region", { name: "기능" }).getByTestId("feature-card").first().innerText()).match(/\S+\.\w+/)?.[0] ?? ""

  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("link", { name: "학습 노트 내려받기 (PDF)" }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^codeback-note-.+-[0-9a-f]{7}\.pdf$/)
  const text = squash(await pdfText(await download.path()))

  expect(text).toContain(squash(repo))
  expect(text).toContain(shownSha)
  expect(text).toContain(squash(intro))
  expect(techPath).not.toBe("")
  expect(text).toContain(techPath)
  expect(featurePath).not.toBe("")
  expect(text).toContain(featurePath)
})
