/**
 * 주최 측 실행·CI·로컬이 같은 이름으로 넘기는 값. 기본값은 docker-compose.yml 템플릿의 시드 계정과 같다.
 * 주최 측 실행은 docker-compose.yml의 SEED_USER_EMAIL·SEED_USER_PASSWORD를 E2E_USER_EMAIL·E2E_USER_PASSWORD로 넘긴다.
 * 역할이 더 있으면(예: 조교) compose에 같은 방식의 로컬 시드 계정을 더 두고 여기에 기본값으로 적는다.
 */
export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000"
export const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL ?? "student@example.com"
export const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? "loopthon-2026"
export const E2E_TA_EMAIL = process.env.E2E_TA_EMAIL ?? "ta@example.com"
export const E2E_TA_PASSWORD = process.env.E2E_TA_PASSWORD ?? "loopthon-2026"
