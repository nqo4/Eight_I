import { expect, test } from "@playwright/test"

const AI_WAIT = { timeout: 90_000 }

test("S7 학습자가 저장소 없이 샘플로 체험하기(데모 모드)에 들어간다", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "샘플로 체험하기" }).click()

  await expect(page.getByText("데모 모드", { exact: true })).toBeVisible()
  await expect(page.getByTestId("repo-name")).not.toBeEmpty()
  expect(await page.getByRole("region", { name: "기능 목록" }).getByTestId("feature-card").count()).toBeGreaterThanOrEqual(2)
  await expect(page.getByText("내 저장소 분석 결과")).toHaveCount(0)
})
