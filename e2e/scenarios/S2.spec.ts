import { expect, test } from "@playwright/test"

const AI_WAIT = { timeout: 90_000 }

test("S2 학습자가 샘플 프로젝트에서 배우고 싶은 기능을 고른다", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "샘플로 체험하기" }).click()
  await page.getByRole("region", { name: "기능 목록" }).getByTestId("feature-card").first().click()

  const detail = page.getByRole("region", { name: "선택한 기능" })
  await expect(detail.getByTestId("feature-title")).not.toBeEmpty()
  await expect(detail.getByTestId("feature-summary")).not.toBeEmpty()
  await expect(detail.getByTestId("feature-files").getByRole("listitem").first()).toContainText(/\S+\.\w+ \(\d+–\d+행\)/)
  await expect(page.getByRole("button", { name: "이 기능 어떻게 동작해?" })).toBeVisible()
})
