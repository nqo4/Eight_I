import { expect, test } from "@playwright/test"

const AI_WAIT = { timeout: 90_000 }

test("S2 학습자가 저장소 없이 데모 모드로 들어가 배우고 싶은 기능을 고른다", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "샘플로 체험하기" }).click()
  await page.getByRole("region", { name: "기능 목록" }).getByTestId("feature-card").first().click()

  await expect(page.getByText("데모 모드", { exact: true })).toBeVisible()
  await expect(page.getByTestId("repo-name")).not.toBeEmpty()
  await expect(page.getByText("내 저장소 분석 결과")).toHaveCount(0)
  const detail = page.getByRole("region", { name: "선택한 기능" })
  await expect(detail.getByTestId("feature-title")).not.toBeEmpty()
  await expect(detail.getByTestId("feature-summary")).not.toBeEmpty()
  await expect(detail.getByTestId("feature-files").getByRole("listitem").first()).toContainText(/\S+\.\w+ \(\d+–\d+행\)/)
})
