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
    const row = rows.nth(i)
    const label = (await row.innerText()).match(/\S+\.\w+ \((\d+)–(\d+)행\)/)
    expect(label).not.toBeNull()
    await expect(row).toContainText(/화면|서버|DB/)

    // 원래 코드 발췌가 보이고, 하이라이트된 줄은 위에 적힌 라인 범위 안의 줄이다.
    const excerpt = row.getByTestId("code-excerpt")
    await expect(excerpt).toBeVisible()
    const marked = excerpt.locator("[data-highlight]")
    expect(await marked.count()).toBeGreaterThanOrEqual(1)
    const [start, end] = [Number(label![1]), Number(label![2])]
    for (const lineNo of await marked.locator("span:first-child").allInnerTexts()) {
      expect(Number(lineNo)).toBeGreaterThanOrEqual(start)
      expect(Number(lineNo)).toBeLessThanOrEqual(end)
    }
  }
})
