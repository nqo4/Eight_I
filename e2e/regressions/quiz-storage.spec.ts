import { expect, test } from "@playwright/test"
import {
  attemptInput, attemptOutput, attemptURL, openHistory, openQuiz, question, register,
  submittedAttempt, verifyFirstHistory,
} from "./flows"

for (const failure of ["http", "unsaved"] as const) {
  for (const navigation of ["remount", "reload"] as const) {
    test(`retries the original choice after ${failure} failure and ${navigation}`, async ({ page }) => {
      // Given: real account, analysis, quiz and DB; only the failed transport is substituted.
      await page.goto("/")
      await register(page)
      const quiz = await openQuiz(page)
      const first = question(page)
      await first.getByRole("radio").first().check()
      const originalChoice = await first.getByRole("radio").first().getAttribute("name")
      await page.route(attemptURL, async (route) => {
        const input = attemptInput.parse(route.request().postDataJSON())
        expect(input.question_id).toBe(originalChoice)
        if (failure === "http") {
          await route.fulfill({ status: 503, json: { error: { code: "unavailable", message: "Storage unavailable", retryable: true } } })
          return
        }
        // A contract-valid no-storage response. Do not write a row and then pretend it failed.
        await route.fulfill({ json: {
          saved: false, is_correct: input.chosen_index === quiz.answer_index, answer_index: quiz.answer_index,
        } })
      }, { times: 1 })

      // When: the first save fails and the quiz component is reconstructed.
      const failedRequest = page.waitForRequest(submittedAttempt, { timeout: 10_000 })
      await first.getByRole("button", { name: "정답 확인", exact: true }).click()
      const originalInput = attemptInput.parse((await failedRequest).postDataJSON())
      await expect(first.getByTestId("quiz-save-error")).toBeVisible()
      await expect(first.getByTestId("quiz-result")).toHaveCount(0)
      if (navigation === "reload") {
        await page.reload()
      } else {
        await openHistory(page)
        const overview = page.waitForURL((url) => url.pathname === "/demo/overview", { timeout: 10_000 })
        await page.getByRole("button", { name: "분석 결과 보기" }).click()
        await overview
        await page.getByRole("region", { name: "기능" }).getByTestId("feature-card").first().click()
        const quizPage = page.waitForURL((url) => url.pathname === "/demo/quiz", { timeout: 10_000 })
        await page.getByRole("button", { name: "이해도 확인" }).click()
        await quizPage
      }

      // Then: the original answer remains locked; retry really reaches the DB.
      await expect(first.getByRole("radio").first()).toBeChecked()
      for (const radio of await first.getByRole("radio").all()) await expect(radio).toBeDisabled()
      await expect(first.getByTestId("quiz-result")).toHaveCount(0)
      const retryResponse = page.waitForResponse(
        (response) => submittedAttempt(response.request()), { timeout: 10_000 },
      )
      await first.getByRole("button", { name: "정답 확인", exact: true }).click()
      const response = await retryResponse
      expect(attemptInput.parse(response.request().postDataJSON())).toEqual(originalInput)
      expect(response.ok()).toBe(true)
      const saved = attemptOutput.parse(await response.json())
      expect(saved.saved).toBe(true)
      await expect(first.getByTestId("quiz-result")).toBeVisible()
      await verifyFirstHistory(page, saved.is_correct)
      await page.reload()
      await expect(page.getByRole("main").getByTestId("record-feature").first()).toContainText(
        new RegExp(`퀴즈 ${saved.is_correct ? 1 : 0}/1 정답`),
      )
    })
  }
}

test("allows only one submission while the original storage request is pending", async ({ page }) => {
  // Given: hold one real storage response, without replacing its body or DB write.
  await page.goto("/")
  await register(page)
  await openQuiz(page)
  let release = () => {}
  const held = new Promise<void>((resolve) => { release = resolve })
  let requests = 0
  page.on("request", (request) => { if (submittedAttempt(request)) requests += 1 })
  await page.route(attemptURL, async (route) => {
    const response = await route.fetch()
    await held
    await route.fulfill({ response })
  }, { times: 1 })
  const first = question(page)
  await first.getByRole("radio").first().check()
  const started = page.waitForRequest(submittedAttempt, { timeout: 10_000 })
  try {
    // When: two click events occur in the same task, before React can re-render.
    await first.getByRole("button", { name: "정답 확인", exact: true }).evaluate((button) => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })
    await started
    await expect(first.getByRole("button", { name: "정답 확인", exact: true })).toBeDisabled()
    await expect(first.getByTestId("quiz-result")).toHaveCount(0)
    const completed = page.waitForResponse(
      (response) => submittedAttempt(response.request()), { timeout: 10_000 },
    )
    release()
    const saved = attemptOutput.parse(await (await completed).json())
    expect(saved.saved).toBe(true)
    // Then: one request and one first-attempt history entry exist.
    await expect(first.getByTestId("quiz-result")).toBeVisible()
    expect(requests).toBe(1)
    await verifyFirstHistory(page, saved.is_correct)
  } finally {
    release()
  }
})
