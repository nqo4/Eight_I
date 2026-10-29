import { expect, type Page } from "@playwright/test"
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "./env"

// docs/scenarios.yaml 공통 단계. S2~S8은 시드 계정 역할 '학습자'로 로그인한 뒤 홈에서 공개 샘플 저장소를 새로 분석한다.
export const SAMPLE_REPO = "https://github.com/nextjs/saas-starter"

export async function loginAsLearner(page: Page) {
  await page.goto("/login")
  await page.getByLabel("이메일").fill(E2E_USER_EMAIL)
  await page.getByLabel("비밀번호", { exact: true }).fill(E2E_USER_PASSWORD)
  await page.getByRole("button", { name: "로그인", exact: true }).click()
  await expect(page.getByTestId("current-user")).toBeVisible()
}

export async function analyzeSample(page: Page) {
  await page.getByRole("button", { name: "깃허브 프로젝트 분석하기" }).click()
  await page.getByLabel("GitHub 저장소 URL").fill(SAMPLE_REPO)
  await page.getByRole("button", { name: "분석 시작" }).click()
  await expect(page.getByTestId("repo-name")).toHaveText("nextjs/saas-starter", { timeout: 120_000 })
}
