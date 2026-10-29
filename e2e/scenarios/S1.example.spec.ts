import { expect, test, type Page } from "@playwright/test"
import { E2E_USER_EMAIL, E2E_USER_PASSWORD } from "../env"

/**
 * scenarios.example.yaml의 S1을 옮긴 예시다. 팀 흐름에 맞게 고쳐 e2e/scenarios/S1.spec.ts로 저장한다.
 * 이 *.example.spec.ts는 실행되지 않는다. 라벨·버튼 문구는 실제 화면의 값으로 바꾼다.
 *
 * 주최 측 실행은 이 spec을 실행하며 동작마다 화면을 찍는다. 그래서 아래를 지킨다.
 * - steps를 같은 순서로 화면 조작(클릭·입력·선택·업로드)으로 옮긴다.
 * - page.goto는 창마다 처음 한 번만 쓴다(로그인 화면으로 가는 goto만 예외). 그 뒤로는 메뉴·버튼을 눌러 이동한다.
 * - 로그인 같은 도우미 함수는 아래처럼 test보다 위에 둔다. test 아래에 두면 그 안의 goto도 test 안의 goto로 센다.
 * - 마지막에 expected의 결과(저장된 값·바뀐 상태·계산 결과)를 expect로 확인한다. 화면이 열렸는지만 보지 않는다.
 * - test.skip·test.fixme·조건부 return, 실패를 삼키는 try/catch를 쓰지 않는다. 실패하면 실패로 둔다.
 * - page.route·route.fulfill·routeFromHAR·addInitScript로 가짜 응답이나 상태를 만들지 않는다. 실제 앱(실제 AI 호출 포함)으로 확인한다.
 * - 화면 크기(viewport)를 spec에서 바꾸지 않는다. 주최 측 실행이 platform에 맞춰 정한다.
 */

/**
 * 로그인은 steps에 쓰지 않지만 화면으로 한다. 시드 계정은 docker-compose.yml에 있다.
 * 첫 화면(서비스 소개가 보이는 /)에서 '로그인'을 눌러 들어간다.
 */
async function logIn(page: Page, email: string, password: string) {
  await page.goto("/")
  await page.getByRole("link", { name: "로그인" }).click()
  await page.getByLabel("이메일").fill(email)
  await page.getByLabel("비밀번호").fill(password)
  await page.getByRole("button", { name: "로그인" }).click()
  await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible()
}

test("S1 학생이 바뀐 과제 마감일을 확인한다", async ({ page }) => {
  await logIn(page, E2E_USER_EMAIL, E2E_USER_PASSWORD)

  // 1. 홈의 '이번 주 마감' 카드에서 '전체 보기'를 누른다
  await page
    .getByRole("region", { name: "이번 주 마감" })
    .getByRole("link", { name: "전체 보기" })
    .click()

  // 2. 목록에서 '자료구조 과제 3'을 연다 (앱이 처음 뜰 때 시드로 넣은 과제)
  await page.getByRole("link", { name: "자료구조 과제 3" }).click()

  // 3. 화면 위쪽의 '변경 이력' 탭을 누른다
  await page.getByRole("tab", { name: "변경 이력" }).click()

  // expected: 바뀐 마감일이 강조되어 보이고, 이전 마감일과 나란히 비교되며 누가 언제 바꿨는지 표시된다
  const latest = page.getByRole("listitem").filter({ hasText: "마감일 변경" }).first()
  await expect(latest.getByTestId("new-due")).toHaveText("11월 7일 (금) 23:59")
  await expect(latest.getByTestId("old-due")).toHaveText("11월 5일 (수) 23:59")
  await expect(latest).toContainText("김조교")
  await expect(latest.getByTestId("new-due")).toHaveClass(/highlight/)
})
