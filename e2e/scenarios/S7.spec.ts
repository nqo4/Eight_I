import { expect, test } from "@playwright/test"

const AI_WAIT = { timeout: 90_000 }

test("S7 학습자가 바꾸고 싶은 동작을 문장으로 넣어 고칠 위치를 찾는다", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "샘플로 체험하기" }).click()
  const region = page.getByRole("region", { name: "어디를 고쳐야 해?" })
  await region.getByRole("listitem").getByRole("button").first().click()
  await region.getByRole("button", { name: "위치 찾기" }).click()

  const rows = region.getByTestId("locate-result").getByRole("listitem")
  await expect(rows.first()).toBeVisible(AI_WAIT)
  const n = await rows.count()
  for (let i = 0; i < n; i++) {
    await expect(rows.nth(i)).toContainText(/\S+\.\w+ \(\d+–\d+행\)/)
    await expect(rows.nth(i)).toContainText(/화면|서버|DB/)
  }
  await expect(region.getByTestId("code-excerpt")).toHaveCount(0)
  await expect(region.locator("pre")).toHaveCount(0)
})
