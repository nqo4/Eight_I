import { expect, test } from "@playwright/test"

test("S2 학습자가 데모 모드에서 프로젝트에 쓰인 기술을 골라 그 역할과 쓰인 코드를 배운다", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "샘플로 체험하기" }).click()
  const first = page.getByRole("region", { name: "사용한 기술" }).getByRole("button").first()
  const name = (await first.locator("span").first().innerText()).trim()
  await first.click()

  await expect(page.getByText("데모 모드", { exact: true })).toBeVisible()
  await expect(page.getByTestId("repo-name")).not.toBeEmpty()
  await expect(page.getByText("내 저장소 분석 결과")).toHaveCount(0)
  const detail = page.getByTestId("tech-detail")
  await expect(detail).toContainText(name)
  await expect(detail).toContainText("이 프로젝트에서 맡은 역할")
  await expect(detail).toContainText("핵심 개념")
  await expect(detail.getByRole("listitem").first()).toContainText(/\S+\.\w+ \(\d+–\d+행\)/)
})
