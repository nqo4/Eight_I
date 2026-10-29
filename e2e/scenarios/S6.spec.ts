import { expect, test } from "@playwright/test"

const AI_WAIT = { timeout: 90_000 }

test("S6 학습자가 수정 미션을 받아 자기 개발 환경에서 직접 고치고 완료를 표시한다", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "샘플로 체험하기" }).click()
  await page.getByRole("region", { name: "기능" }).getByTestId("feature-card").first().click()
  await page.getByRole("button", { name: "이제 네가 직접 바꿔봐" }).click()
  const section = page.getByRole("region", { name: "직접 바꿔보기" })
  const boxes = section.getByRole("checkbox")
  await boxes.first().waitFor(AI_WAIT)
  const n = await boxes.count()
  for (let i = 0; i < n; i++) await boxes.nth(i).check()
  await page.getByRole("button", { name: "완료로 표시" }).click()

  await expect(section.getByTestId("exercise-goal")).not.toBeEmpty()
  await expect(section.getByTestId("exercise-targets").getByRole("listitem").first()).toHaveText(/\S+ \(\d+–\d+행\)/)
  await expect(section.getByTestId("exercise-hints").getByRole("listitem").first()).toBeVisible()
  await expect(section.getByTestId("exercise-done")).toHaveText("완료로 표시했어요")
  await expect(section.getByTestId("exercise-disclaimer")).toHaveText("자기 보고이며 실행 결과를 보증하지 않음")
})
