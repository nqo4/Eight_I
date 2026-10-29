import { expect, test } from "@playwright/test"
import { analyzeSample, loginAsLearner } from "../flows"

const AI_WAIT = { timeout: 60_000 } // 주최 측 실행은 테스트당 90초 제한, 서버 AI 요청도 60초 제한

test("S6 학습자가 수정 미션을 채점받고 내 학습 기록에서 저장된 점수를 확인한다", async ({ page }) => {
  await loginAsLearner(page)
  await analyzeSample(page)
  const sha = (await page.getByTestId("repo-commit").innerText()).trim()
  const firstCard = page.getByRole("region", { name: "기능" }).getByTestId("feature-card").first()
  const featureTitle = (await firstCard.locator("p").first().innerText()).trim()
  await firstCard.click()
  await page.getByRole("button", { name: "이제 네가 직접 바꿔봐" }).click()
  const section = page.getByRole("region", { name: "직접 바꿔보기" })
  const code = section.getByLabel("고친 코드", { exact: true })
  await code.waitFor(AI_WAIT)
  // 화면에 보이는 '현재 코드'를 그대로 붙여 넣어도 채점은 된다(점수 값은 AI 추정이라 숫자 형식만 확인)
  await code.fill(await section.locator("pre").first().innerText())
  await section.getByRole("button", { name: "채점하기" }).click()
  const score = section.getByTestId("mission-score")
  await expect(score).toHaveText(/^\d{1,3}$/, AI_WAIT)
  await expect(section.getByTestId("exercise-disclaimer")).toBeVisible()
  await page.getByRole("link", { name: "내 학습 기록" }).click()

  const record = page.getByTestId("learning-record").filter({ hasText: "nextjs/saas-starter" })
  await expect(record).toHaveCount(1)
  await expect(record.getByTestId("record-analyzed-at")).not.toBeEmpty()
  await expect(record.getByTestId("record-commit")).toHaveText(sha.slice(0, 7))
  const first = record.getByTestId("record-feature").first()
  await expect(first).toContainText(featureTitle)
  await expect(first.getByTestId("mission-status")).toHaveText(/^미션 \d{1,3}점$/)
})
