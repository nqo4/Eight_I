import { expect, test } from "@playwright/test"
import { analyzeSample } from "../flows"

test("S1 처음 온 학습자가 회원가입하고 첫 저장소를 분석해 프로젝트 소개와 사용한 기술·기능 목록을 받는다", async ({ page }) => {
  test.setTimeout(150_000)
  await page.goto("/")
  await page.getByRole("link", { name: "로그인" }).click()
  await page.getByRole("link", { name: /회원가입/ }).click()
  await page.getByLabel("이름").fill("테스트 학습자")
  await page.getByLabel("이메일").fill(`s1-${Date.now()}@example.com`)
  await page.getByLabel("비밀번호", { exact: true }).fill("loopthon-s1-pass")
  await page.getByRole("button", { name: "회원가입", exact: true }).click()

  await expect(page.getByTestId("current-user")).toHaveText("테스트 학습자님")
  await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible()
  await analyzeSample(page)

  await expect(page.getByTestId("repo-branch")).not.toBeEmpty()
  await expect(page.getByTestId("repo-commit")).toHaveText(/^[0-9a-f]{7,40}$/)
  await expect(page.getByTestId("project-summary")).not.toBeEmpty()
  await expect(page.getByTestId("stack-summary")).toContainText(/기술 스택 · \S+/)
  await expect(page.getByTestId("directory").first()).toContainText(/화면|서버|DB|설정|확인 불가/)
  const techs = page.getByRole("region", { name: "사용한 기술" }).getByRole("button")
  await expect(techs.first()).toBeVisible()
  await expect(techs.first()).toContainText(/\S+\.\w+/)
  const cards = page.getByRole("region", { name: "기능" }).getByTestId("feature-card")
  await expect(cards.nth(1)).toBeVisible()
  await expect(cards.first()).toContainText(/\S+\.\w+/)
})
