import { expect, test } from "@playwright/test"
import { analyzeSample, loginAsLearner } from "../flows"

const AI_WAIT = { timeout: 90_000 }

test("S6 학습자가 수정 미션을 채점받고 내 학습 기록에서 저장된 점수를 확인한다", async ({ page }) => {
  await loginAsLearner(page)
  await analyzeSample(page)
  const sha = (await page.getByTestId("repo-commit").innerText()).trim()
  const firstCard = page.getByRole("region", { name: "기능" }).getByTestId("feature-card").first()
  const featureTitle = (await firstCard.locator("p").first().innerText()).trim()
  // Observe the existing record without changing the scenario's main-page action order.
  const history = await page.context().newPage()
  await history.goto("/mypage")
  const previousRecord = history.getByTestId("learning-record").filter({ hasText: "nextjs/saas-starter" })
  await expect(previousRecord).toHaveCount(1)
  const previousStatus = previousRecord.getByTestId("record-feature").first().getByTestId("mission-status")
  await expect(previousStatus).toHaveText(/^(미션 전|미션 \d{1,3}점)$/)
  const previousBest = Number((await previousStatus.innerText()).match(/\d+/)?.[0] ?? 0)
  expect(previousBest).toBeGreaterThanOrEqual(0)
  expect(previousBest).toBeLessThanOrEqual(100)
  await history.close()
  await firstCard.click()
  await page.getByRole("button", { name: "이제 네가 직접 바꿔봐" }).click()
  const section = page.getByRole("region", { name: "직접 바꿔보기" })
  const code = section.getByLabel("고친 코드", { exact: true })
  await code.waitFor(AI_WAIT)
  // The original code is accepted for grading; the AI score must still be 0..100.
  await code.fill(await section.locator("pre").first().innerText())
  await section.getByRole("button", { name: "채점하기" }).click()
  const score = section.getByTestId("mission-score")
  await expect(score).toHaveText(/^\d{1,3}$/, AI_WAIT)
  const shownScore = Number((await score.innerText()).trim())
  expect(shownScore).toBeGreaterThanOrEqual(0)
  expect(shownScore).toBeLessThanOrEqual(100)
  await expect(section.getByTestId("exercise-disclaimer")).toBeVisible()
  await page.getByRole("link", { name: "내 학습 기록" }).click()

  const record = page.getByTestId("learning-record").filter({ hasText: "nextjs/saas-starter" })
  await expect(record).toHaveCount(1)
  await expect(record.getByTestId("record-analyzed-at")).not.toBeEmpty()
  await expect(record.getByTestId("record-commit")).toHaveText(sha.slice(0, 7))
  const first = record.getByTestId("record-feature").first()
  await expect(first).toContainText(featureTitle)
  // A stale or unrelated higher score must not satisfy this assertion.
  const status = first.getByTestId("mission-status")
  await expect(status).toHaveText(/^미션 \d{1,3}점$/)
  await expect(status).toHaveText(`미션 ${Math.max(previousBest, shownScore)}점`)
})
