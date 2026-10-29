import { expect, test } from "@playwright/test"
import {
  attemptOutput, attemptURL, currentUser, login, logout, openHistory, openQuiz, question, register,
  submittedAttempt, verifyFirstHistory,
} from "./flows"

test("preserves A's first wrong answer after a correct retry and B's independent first answer", async ({ page }) => {
  // Given: A and B use the same browser storage, repository, commit and feature.
  await page.goto("/")
  const accountA = await register(page)
  const quiz = await openQuiz(page)
  const wrongChoice = quiz.choices[(quiz.answer_index + 1) % quiz.choices.length]
  const correctChoice = quiz.choices[quiz.answer_index]
  expect(wrongChoice).toBeDefined()
  expect(correctChoice).toBeDefined()
  if (wrongChoice === undefined || correctChoice === undefined) return
  const first = question(page)
  await first.locator("label").filter({ has: page.getByText(wrongChoice, { exact: true }) }).getByRole("radio").check()
  const firstSave = page.waitForResponse((response) => submittedAttempt(response.request()), { timeout: 10_000 })
  await first.getByRole("button", { name: "정답 확인", exact: true }).click()
  expect(attemptOutput.parse(await (await firstSave).json())).toMatchObject({ saved: true, is_correct: false })
  await expect(first.getByTestId("quiz-result")).toBeVisible()

  // When: A retries correctly, B submits independently, then A signs back in.
  await first.getByRole("button", { name: "다시 풀기", exact: true }).click()
  await first.locator("label").filter({ has: page.getByText(correctChoice, { exact: true }) }).getByRole("radio").check()
  await first.getByRole("button", { name: "정답 확인", exact: true }).click()
  await expect(first.getByTestId("quiz-result")).toBeVisible()
  await verifyFirstHistory(page, false)
  await logout(page)
  const accountB = await register(page)
  await openQuiz(page)
  await expect(first.getByTestId("quiz-result")).toHaveCount(0)
  await expect(first.getByRole("radio").first()).toBeEnabled()
  await first.getByRole("radio").first().check()
  const bSave = page.waitForResponse((response) => submittedAttempt(response.request()), { timeout: 10_000 })
  await first.getByRole("button", { name: "정답 확인", exact: true }).click()
  const bResult = attemptOutput.parse(await (await bSave).json())
  expect(bResult.saved).toBe(true)
  await expect(first.getByTestId("quiz-result")).toBeVisible()
  await verifyFirstHistory(page, bResult.is_correct)
  await logout(page)
  await login(page, accountA)
  await openHistory(page)

  // Then: A's first wrong attempt survives retry, account switching and reload.
  await expect(currentUser(page)).toContainText(accountA)
  await expect(currentUser(page)).not.toContainText(accountB)
  await expect(page.getByRole("main").getByTestId("record-feature").first()).toContainText(/퀴즈 0\/1 정답/)
  await page.reload()
  await expect(page.getByRole("main").getByTestId("record-feature").first()).toContainText(/퀴즈 0\/1 정답/)
})

test("ignores A's delayed storage completion after switching to B", async ({ page }) => {
  // Given: hold A's real successful response after its real DB write.
  await page.goto("/")
  const accountA = await register(page)
  await openQuiz(page)
  let release = () => {}
  let captured = () => {}
  const held = new Promise<void>((resolve) => { release = resolve })
  const fetched = new Promise<void>((resolve) => { captured = resolve })
  await page.route(attemptURL, async (route) => {
    const response = await route.fetch()
    captured()
    await held
    await route.fulfill({ response })
  }, { times: 1 })
  const first = question(page)
  await first.getByRole("radio").first().check()
  const started = page.waitForRequest(submittedAttempt, { timeout: 10_000 })
  try {
    await first.getByRole("button", { name: "정답 확인", exact: true }).click()
    const request = await started
    await test.step("wait for the real DB response to be captured", async () => {
      await fetched
    }, { timeout: 10_000 })
    await expect(first.getByRole("button", { name: "정답 확인", exact: true })).toBeDisabled()

    // When: B opens the same quiz before A's completion reaches the client.
    await logout(page)
    const accountB = await register(page)
    await openQuiz(page)
    await expect(first.getByTestId("quiz-result")).toHaveCount(0)
    const finished = page.waitForEvent("requestfinished", { predicate: (done) => done === request, timeout: 10_000 })
    release()
    await finished

    // Then: B remains unanswered and can persist an independent first attempt.
    await expect(currentUser(page)).toContainText(accountB)
    await expect(first.getByTestId("quiz-result")).toHaveCount(0)
    await expect(first.getByRole("radio").first()).toBeEnabled()
    await first.getByRole("radio").first().check()
    const bSave = page.waitForResponse((response) => submittedAttempt(response.request()), { timeout: 10_000 })
    await first.getByRole("button", { name: "정답 확인", exact: true }).click()
    const bResult = attemptOutput.parse(await (await bSave).json())
    expect(bResult.saved).toBe(true)
    await expect(first.getByTestId("quiz-result")).toBeVisible()
    await verifyFirstHistory(page, bResult.is_correct)
    await logout(page)
    await login(page, accountA)
    await openHistory(page)
    await expect(page.getByRole("main").getByTestId("record-feature").first()).toContainText(/퀴즈 [01]\/1 정답/)
  } finally {
    release()
  }
})
