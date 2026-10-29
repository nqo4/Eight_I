import { expect, test } from "@playwright/test"
import { analyzeSample, loginAsLearner } from "../flows"

const AI_WAIT = { timeout: 90_000 }

test("S7 학습자가 바꾸고 싶은 동작을 문장으로 넣어 고칠 위치를 찾는다", async ({ page }) => {
  await loginAsLearner(page)
  await analyzeSample(page)
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
    if (!label) return
    await expect(row).toContainText(/화면|서버|DB/)
    // 그곳을 고치면 되는 이유
    await expect(row.getByTestId("locate-reason")).toHaveText(/\S.{9,}/)
    // 수정된 코드는 보이지 않는다: 위치마다 코드 블록은 원래 코드 발췌 하나뿐이다
    await expect(row.locator("pre")).toHaveCount(1)
    await expect(row.locator("textarea, [contenteditable=true]")).toHaveCount(0)

    // 원래 코드 발췌가 보이고, 하이라이트된 줄은 위에 적힌 라인 범위 안의 줄이다.
    const excerpt = row.getByTestId("code-excerpt")
    await expect(excerpt).toBeVisible()
    await expect(excerpt).toHaveCount(1)
    await expect(excerpt).toHaveJSProperty("tagName", "PRE")
    const marked = excerpt.locator("[data-highlight]")
    expect(await marked.count()).toBeGreaterThanOrEqual(1)
    const [start, end] = [Number(label[1]), Number(label[2])]
    expect(start).toBeGreaterThan(0)
    expect(end).toBeGreaterThanOrEqual(start)
    const lineNumbers = await excerpt.locator(":scope > div > span:first-child").allInnerTexts()
    expect(lineNumbers.length).toBeGreaterThan(0)
    expect(lineNumbers.map(Number)).toEqual(lineNumbers.map((_, index) => Number(lineNumbers[0]) + index))
    expect(await marked.locator(":scope > span:last-child").allInnerTexts()).toEqual(
      expect.arrayContaining([expect.stringMatching(/\S/)]),
    )
    for (const lineNo of await marked.locator(":scope > span:first-child").allInnerTexts()) {
      expect(Number(lineNo)).toBeGreaterThanOrEqual(start)
      expect(Number(lineNo)).toBeLessThanOrEqual(end)
    }
  }
})
