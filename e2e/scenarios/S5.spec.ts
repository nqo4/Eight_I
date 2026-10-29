import { expect, test } from "@playwright/test"
import { analyzeSample, loginAsLearner } from "../flows"

const AI_WAIT = { timeout: 90_000 }

test("S5 학습자가 배운 기능의 이해도를 퀴즈로 확인한다", async ({ page }) => {
  await loginAsLearner(page)
  await analyzeSample(page)
  await page.getByRole("region", { name: "기능" }).getByTestId("feature-card").first().click()
  await page.getByRole("button", { name: "이해도 확인" }).click()
  const first = page.getByTestId("quiz-question").first()
  await first.getByRole("radio").first().check(AI_WAIT)
  await first.getByRole("button", { name: "정답 확인" }).click()

  const result = first.getByTestId("quiz-result")
  await expect(result).toContainText(/정답이에요|오답이에요/)
  // A reason must add information rather than repeat the question or one choice.
  const explanation = result.getByTestId("quiz-explanation")
  await expect(explanation).toBeVisible()
  const reason = (await explanation.innerText()).trim()
  expect(reason.match(/[\p{L}\p{N}_]+/gu)?.length ?? 0).toBeGreaterThanOrEqual(3)
  expect(reason).not.toBe((await first.getByRole("heading").innerText()).trim())
  for (const choice of await first.locator("label span:last-child").allInnerTexts()) {
    expect(reason).not.toBe(choice.trim())
  }
  const refs = result.getByTestId("quiz-refs").getByRole("listitem")
  expect(await refs.count()).toBeGreaterThan(0)
  for (const reference of await refs.allInnerTexts()) {
    const location = reference.match(/^참고: (\S+\.\w+) \((\d+)–(\d+)행\)$/)
    expect(location).not.toBeNull()
    if (!location) return
    expect(Number(location[2])).toBeGreaterThan(0)
    expect(Number(location[3])).toBeGreaterThanOrEqual(Number(location[2]))
  }
})
