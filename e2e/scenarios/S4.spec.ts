import { expect, test } from "@playwright/test"
import { analyzeSample, loginAsLearner } from "../flows"

const AI_WAIT = { timeout: 60_000 } // 주최 측 실행은 테스트당 90초 제한, 서버 AI 요청도 60초 제한

test("S4 학습자가 고른 기능을 개념까지 배우고 왜 이렇게 구현됐는지 이해한다", async ({ page }) => {
  await loginAsLearner(page)
  await analyzeSample(page)
  await page.getByRole("region", { name: "기능" }).getByTestId("feature-card").first().click()
  await page.getByRole("button", { name: "이 코드 배우기" }).click()
  await page.getByRole("button", { name: "쉬운 설명 펼치기" }).first().click(AI_WAIT)

  for (const name of ["기능 설명", "파일 역할", "중요한 코드", "핵심 개념", "왜 이렇게 만들었나"]) {
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
