import { expect, test } from "@playwright/test"
import { analyzeSample, loginAsLearner } from "../flows"

const AI_WAIT = { timeout: 90_000 }

test("S6 학습자가 수정 미션을 완료로 표시하고 내 학습 기록에서 저장된 진행 상황을 확인한다", async ({ page }) => {
  await loginAsLearner(page)
  await analyzeSample(page)
  const sha = (await page.getByTestId("repo-commit").innerText()).trim()
  const firstCard = page.getByRole("region", { name: "기능" }).getByTestId("feature-card").first()
  const featureTitle = (await firstCard.locator("p").first().innerText()).trim()
  await firstCard.click()
  await page.getByRole("button", { name: "이제 네가 직접 바꿔봐" }).click()
  const section = page.getByRole("region", { name: "직접 바꿔보기" })
  const boxes = section.getByRole("checkbox")
  await boxes.first().waitFor(AI_WAIT)
  const n = await boxes.count()
  for (let i = 0; i < n; i++) await boxes.nth(i).check()
  await page.getByRole("button", { name: "완료로 표시" }).click()
  await expect(section.getByTestId("exercise-done")).toHaveText("완료로 표시했어요")
  await page.getByRole("link", { name: "내 학습 기록" }).click()

  const record = page.getByTestId("learning-record").filter({ hasText: "nextjs/saas-starter" })
  await expect(record).toHaveCount(1)
  await expect(record.getByTestId("record-analyzed-at")).not.toBeEmpty()
  await expect(record.getByTestId("record-commit")).toHaveText(sha.slice(0, 7))
  const first = record.getByTestId("record-feature").first()
  await expect(first).toContainText(featureTitle)
  await expect(first.getByTestId("mission-status")).toHaveText("미션 완료")
})
