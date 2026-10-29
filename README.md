# Eight_I

SUMTECH 2026 루프톤 팀 서비스 저장소입니다.

## 문서

- 문제정의·기능 명세: `docs/problem.yaml` (작성 예정)
- 사용자 핵심 흐름: `docs/scenarios.yaml` (작성 예정)
- 백엔드 API 명세(프런트 목업 기준): `docs/api.md`

## 설치·실행

Next.js(TypeScript) 앱입니다. 기술 개발은 `dev` 브랜치에서 하고, `main`에는 문서를 먼저 올립니다.

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npm run build
```

docker로 주최 측 실행과 같은 조건으로 띄우기 (명령은 한 줄씩 실행):

```bash
docker compose down -v
docker compose up -d --build
curl http://localhost:3000/__health
```

- `GET /__health`: `{"releaseId": "<배포 commit>"}`를 `Cache-Control: no-store`로 돌려줍니다. docker에서는 `RELEASE_ID`, Vercel에서는 `VERCEL_GIT_COMMIT_SHA`를 읽습니다.
- E2E: `e2e/` 폴더에서 `npm install`, `npx playwright install chromium`, `npx playwright test`.

## 환경변수

| 이름 | 용도 | 설정 위치 |
| ---- | ---- | --------- |
| `AI_GATEWAY_API_KEY` | 서비스 AI 기능 (필요할 때만) | 로컬 `.env`, 배포 환경, GitHub Secrets |
| `RELEASE_ID` | `/__health`가 알려 주는 배포 commit | docker 빌드 인자 (CI·주최 측 실행이 넣음) |
