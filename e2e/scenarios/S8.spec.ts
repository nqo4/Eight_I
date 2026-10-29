import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"

test("S8 학습자가 다음에 다시 볼 수 있도록 프로젝트 학습 노트를 내려받는다", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "샘플로 체험하기" }).click()
  const repo = (await page.getByTestId("repo-name").innerText()).trim()
  const shownSha = (await page.getByTestId("repo-commit").innerText()).trim()
  const intro = (await page.getByTestId("project-summary").innerText()).trim()
  const techPath = (await page.getByRole("region", { name: "사용한 기술" }).getByRole("button").first().innerText()).match(/\S+\.\w+/)?.[0] ?? ""
  const featurePath = (await page.getByRole("region", { name: "기능" }).getByTestId("feature-card").first().innerText()).match(/\S+\.\w+/)?.[0] ?? ""

  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "학습 노트 내려받기" }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^codeback-.+-[0-9a-f]{7}\.md$/)
  const text = readFileSync(await download.path(), "utf8")

  expect(text).toContain(repo)
  expect(text).toContain(shownSha)
  expect(text).toContain(intro)
  expect(techPath).not.toBe("")
  expect(text).toContain(techPath)
  expect(featurePath).not.toBe("")
  expect(text).toContain(featurePath)
})
