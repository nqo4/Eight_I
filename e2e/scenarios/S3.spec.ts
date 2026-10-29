import { expect, test } from "@playwright/test"

const AI_WAIT = { timeout: 90_000 }

test("S3 학습자가 고른 기능의 동작 흐름을 실제 코드 위치까지 따라간다", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "샘플로 체험하기" }).click()
  await page.getByRole("region", { name: "기능 목록" }).getByTestId("feature-card").first().click()
  await page.getByRole("button", { name: "이 기능 어떻게 동작해?" }).click()
  const steps = page.getByRole("region", { name: "동작 흐름" }).getByTestId("flow-step")
  await steps.first().click(AI_WAIT)
  await page.getByRole("button", { name: "다음 단계" }).click()

  await expect(steps.nth(1)).toHaveAttribute("aria-expanded", "true")
  await expect(steps.nth(1)).toContainText(/\S+ \(\d+–\d+행\)/)
  const excerpt = page.getByTestId("code-excerpt")
  await expect(excerpt).toHaveCount(1)
  await expect(excerpt).toHaveClass(/ring-yellow/)
  await expect(excerpt.locator("figcaption")).toHaveText(/\S+ \(\d+–\d+행\)/)
})
