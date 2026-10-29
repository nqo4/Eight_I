import { expect, test } from "@playwright/test"

const AI_WAIT = { timeout: 90_000 }

test("S4 학습자가 고른 기능을 기능→파일 역할→코드→개념 순서로 배운다", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "샘플로 체험하기" }).click()
  await page.getByRole("region", { name: "기능 목록" }).getByTestId("feature-card").first().click()
  await page.getByRole("button", { name: "이 코드 배우기" }).click()
  await page.getByRole("button", { name: "쉬운 설명 펼치기" }).first().click(AI_WAIT)

  for (const name of ["기능 설명", "파일 역할", "중요한 코드", "핵심 개념"]) {
    await expect(page.getByRole("region", { name })).toBeVisible()
  }
  const concepts = page.getByTestId("concept")
  const count = await concepts.count()
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    await expect(concepts.nth(i).getByTestId("concept-refs").getByRole("listitem").first()).toHaveText(/\S+ \(\d+–\d+행\)/)
  }
  const easy = concepts.first().getByTestId("easy-explanation")
  await expect(easy).toContainText("용어 풀이:")
  await expect(easy).toContainText("왜 필요한가:")
})
