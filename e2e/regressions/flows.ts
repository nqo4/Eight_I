import { randomUUID } from "node:crypto"
import { expect, type Page, type Request } from "@playwright/test"
import { z } from "zod"
import { analyzeSample } from "../flows"

export const attemptURL = /\/api\/analyses\/[^/]+\/features\/[^/]+\/quiz\/attempts$/
export const attemptInput = z.object({ question_id: z.string(), chosen_index: z.number().int() })
export const attemptOutput = z.object({
  saved: z.boolean(),
  is_correct: z.boolean(),
  answer_index: z.number().int(),
})
export const password = "regression-local-2026"
const quizQuestion = z.object({
  id: z.string(), answer_index: z.number().int(), choices: z.array(z.string()).min(2),
})

export async function register(page: Page) {
  const email = `regression-${randomUUID()}@example.com`
  const loginPage = page.waitForURL((url) => url.pathname === "/login", { timeout: 10_000 })
  await page.getByRole("banner").getByRole("link", { name: "로그인", exact: true }).click()
  await loginPage
  const signup = page.waitForURL((url) => url.pathname === "/signup", { timeout: 10_000 })
  await page.getByRole("link", { name: /회원가입/ }).click()
  await signup
  await page.getByLabel("이름").fill(email)
  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호", { exact: true }).fill(password)
  const home = page.waitForURL((url) => url.pathname === "/", { timeout: 10_000 })
  await page.getByRole("button", { name: "회원가입", exact: true }).click()
  await home
  await expect(currentUser(page)).toContainText(email)
  return email
}

export async function login(page: Page, email: string) {
  const loginPage = page.waitForURL((url) => url.pathname === "/login", { timeout: 10_000 })
  await page.getByRole("banner").getByRole("link", { name: "로그인", exact: true }).click()
  await loginPage
  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호", { exact: true }).fill(password)
  const home = page.waitForURL((url) => url.pathname === "/", { timeout: 10_000 })
  await page.getByRole("button", { name: "로그인", exact: true }).click()
  await home
  await expect(currentUser(page)).toContainText(email)
}

export async function logout(page: Page) {
  const home = page.waitForURL((url) => url.pathname === "/", { timeout: 10_000 })
  await page.getByRole("banner").getByRole("button", { name: "로그아웃" }).click()
  await home
  await expect(page.getByRole("banner").getByRole("link", { name: "로그인", exact: true })).toBeVisible()
}

export async function openQuiz(page: Page) {
  const quizResponse = page.waitForResponse(
    (response) => response.request().method() === "GET" && /\/features\/[^/]+\/quiz$/.test(response.url()),
    { timeout: 90_000 },
  )
  await analyzeSample(page)
  await page.getByRole("region", { name: "기능" }).getByTestId("feature-card").first().click()
  const quizPage = page.waitForURL((url) => url.pathname === "/demo/quiz", { timeout: 10_000 })
  await page.getByRole("button", { name: "이해도 확인" }).click()
  await quizPage
  await expect(question(page).getByRole("radio").first()).toBeVisible({ timeout: 90_000 })
  return z.object({
    quiz: z.object({ questions: z.tuple([quizQuestion]).rest(quizQuestion) }),
  }).parse(await (await quizResponse).json()).quiz.questions[0]
}

export function question(page: Page) {
  return page.getByRole("main").getByTestId("quiz-question").first()
}

export function currentUser(page: Page) {
  return page.getByRole("banner").getByTestId("current-user")
}

export async function openHistory(page: Page) {
  const history = page.waitForURL((url) => url.pathname === "/mypage", { timeout: 10_000 })
  await page.getByRole("banner").getByRole("link", { name: "내 학습 기록" }).click()
  await history
  await expect(page.getByRole("main").getByRole("heading", { name: "내 학습 기록", exact: true })).toBeVisible()
}

export function submittedAttempt(request: Request) {
  return request.method() === "POST" && attemptURL.test(request.url())
}

export async function verifyFirstHistory(page: Page, correct: boolean) {
  await openHistory(page)
  const feature = page.getByRole("main").getByTestId("learning-record").getByTestId("record-feature").first()
  // Machine-formatted counters, not explanatory prose.
  await expect(feature).toContainText(new RegExp(`퀴즈 ${correct ? 1 : 0}/1 정답`))
}
