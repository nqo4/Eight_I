import { expect, test } from "@playwright/test"

const AI_WAIT = { timeout: 90_000 }

test("S5 학습자가 배운 기능의 이해도를 퀴즈로 확인한다", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "샘플로 체험하기" }).click()
  await page.getByRole("region", { name: "기능 목록" }).getByTestId("feature-card").first().click()
  await page.getByRole("button", { name: "이해도 확인" }).click()
  const first = page.getByTestId("quiz-question").first()
  await first.getByRole("radio").first().check(AI_WAIT)
  await first.getByRole("button", { name: "정답 확인" }).click()

  const result = first.getByTestId("quiz-result")
  await expect(result).toContainText(/정답이에요|오답이에요/)
  await expect(result.getByTestId("quiz-refs").getByRole("listitem").first()).toHaveText(/참고: \S+ \(\d+–\d+행\)/)
})
