import { expect, test } from "@playwright/test"

const AI_WAIT = { timeout: 90_000 }

test("S1 학습자가 공개 GitHub 프로젝트를 연결해 프로젝트 개요와 기능 카드를 받는다", async ({ page }) => {
  test.setTimeout(150_000)
  await page.goto("/")
  await page.getByRole("button", { name: "내 프로젝트 분석하기" }).click()
  await page.getByLabel("GitHub 저장소 URL").fill("https://github.com/nextjs/saas-starter")
  await page.getByRole("button", { name: "분석 시작" }).click()

  await expect(page.getByTestId("repo-name")).toHaveText("nextjs/saas-starter", AI_WAIT)
  await expect(page.getByTestId("repo-branch")).not.toBeEmpty()
  await expect(page.getByTestId("repo-commit")).toHaveText(/^[0-9a-f]{7,40}$/)
  await expect(page.getByTestId("project-summary")).not.toBeEmpty()
  await expect(page.getByRole("region", { name: "기술 스택" }).getByRole("listitem").first()).toBeVisible()
  await expect(page.getByRole("region", { name: "기능 목록" }).getByTestId("feature-card").first()).toBeVisible()
})
