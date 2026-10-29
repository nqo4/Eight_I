import { expect, test } from "@playwright/test"

test("S1 학습자가 공개 GitHub 프로젝트를 연결해 프로젝트 소개와 사용한 기술·기능 목록을 받는다", async ({ page }) => {
  test.setTimeout(150_000)
  await page.goto("/")
  await page.getByRole("button", { name: "내 프로젝트 분석하기" }).click()
  await page.getByLabel("GitHub 저장소 URL").fill("https://github.com/nextjs/saas-starter")
  await page.getByRole("button", { name: "분석 시작" }).click()

  await expect(page.getByTestId("repo-name")).toHaveText("nextjs/saas-starter", { timeout: 120_000 })
  await expect(page.getByTestId("repo-branch")).not.toBeEmpty()
  await expect(page.getByTestId("repo-commit")).toHaveText(/^[0-9a-f]{7,40}$/)
  await expect(page.getByTestId("project-summary")).not.toBeEmpty()
  const techs = page.getByRole("region", { name: "사용한 기술" }).getByRole("button")
  await expect(techs.first()).toBeVisible()
  await expect(techs.first()).toContainText(/\S+\.\w+/)
  const cards = page.getByRole("region", { name: "기능" }).getByTestId("feature-card")
  await expect(cards.nth(1)).toBeVisible()
  await expect(cards.first()).toContainText(/\S+\.\w+/)
})
