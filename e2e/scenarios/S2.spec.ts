import { expect, test } from "@playwright/test"
import { analyzeSample, loginAsLearner } from "../flows"

test("S2 학습자가 내 저장소에 쓰인 기술을 골라 그 역할과 쓰인 코드를 배운다", async ({ page }) => {
  await loginAsLearner(page)
  await analyzeSample(page)
  const first = page.getByRole("region", { name: "사용한 기술" }).getByRole("button").first()
  const name = (await first.locator("span").first().innerText()).trim()
  await first.click()

  const detail = page.getByTestId("tech-detail")
  await expect(page.getByRole("heading", { level: 1 })).toContainText(name)
  await expect(detail).toContainText("이 프로젝트에서 맡은 역할")
  await expect(detail).toContainText("핵심 개념")
  await expect(detail.getByTestId("tech-refs").getByRole("listitem").first()).toHaveText(/\S+\.\w+ \(\d+–\d+행\)/)
  await expect(detail.getByTestId("code-excerpt").first()).toBeVisible()
})
