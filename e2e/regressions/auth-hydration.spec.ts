import { expect, test } from "@playwright/test"

for (const mode of ["login", "signup"] as const) {
  test(`${mode} preserves input entered before hydration`, async ({ page }) => {
    let releaseScripts!: () => void
    const scriptsReady = new Promise<void>((resolve) => { releaseScripts = resolve })
    await page.route("**/*.js*", async (route) => {
      await scriptsReady
      await route.continue()
    })
    await page.route(`**/api/auth/${mode}`, (route) =>
      route.fulfill({ status: 401, json: { error: { message: "Hydration regression response" } } }),
    )
    await page.route("**/api/auth/me", (route) => route.fulfill({ json: { user: null } }))
    const authChecked = page.waitForResponse((response) => response.url().endsWith("/api/auth/me"))

    await page.goto(`/${mode}`, { waitUntil: "commit" })
    try {
      if (mode === "signup") await page.getByLabel("이름", { exact: true }).fill("Fast Learner")
      await page.getByLabel("이메일").fill("fast@example.com")
      await page.getByLabel("비밀번호", { exact: true }).fill("early-password")
    } finally {
      releaseScripts()
    }
    await page.waitForLoadState("load")
    await authChecked

    // A React-handled state change must not reset the pre-hydration input.
    await page.getByRole("button", { name: "보기", exact: true }).click()
    await expect(page.getByLabel("비밀번호", { exact: true })).toHaveAttribute("type", "text")
    await expect(page.getByLabel("이메일")).toHaveValue("fast@example.com")
    await expect(page.getByLabel("비밀번호", { exact: true })).toHaveValue("early-password")
    const request = page.waitForRequest((request) =>
      request.url().endsWith(`/api/auth/${mode}`) && request.method() === "POST",
    )
    await page.getByRole("button", { name: mode === "login" ? "로그인" : "회원가입", exact: true }).click()
    expect((await request).postDataJSON()).toEqual({
      ...(mode === "signup" ? { name: "Fast Learner" } : {}),
      email: "fast@example.com",
      password: "early-password",
    })
    await expect(page.locator("form").getByRole("alert")).toHaveText("Hydration regression response")
  })
}
