# Eight_I — CodeBack

SUMTECH 2026 루프톤 8팀 에잇아이의 서비스 저장소입니다.

CodeBack은 AI로 만든 공개 GitHub 프로젝트를 넣으면 쓰인 기술과 기능을 찾아 주고, 기능 하나가 화면·서버·DB의 어느 파일에서 동작하는지 따라가며 배우게 하는 학습 서비스입니다. 코드를 대신 고쳐 주지 않고, 퀴즈와 작은 수정 미션으로 이해했는지 확인합니다.

- 배포: https://eight-i-nu.vercel.app
- 로그인해야 쓰는 서비스입니다. 처음이면 회원가입, 확인용으로는 아래 시드 계정을 씁니다.

## 문서

| 파일 | 내용 |
| --- | --- |
| `docs/problem.yaml` | 문제정의 캔버스와 기능 명세(F1~F15) |
| `docs/scenarios.yaml` | 핵심 흐름 S1~S8(desktop). 버튼 이름의 기준 |
| `docs/sources.md` | 문서에 쓴 수치의 출처와 확인일 |
| `docs/api.md` | API 명세, DB 표, 서버 설정 |
| `progress.md` | 대회 진행 체크리스트 |

## 실행

Next.js(TypeScript) 앱입니다. 개발 서버:

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npm run build
```

주최 측 실행과 같은 조건(빈 DB, docker)으로 띄우기:

```bash
docker compose down -v
docker compose up -d --build
curl http://localhost:3000/__health
```

- `GET /__health`는 로그인 없이 `{"releaseId": "<배포 commit>"}`를 돌려줍니다. docker에서는 `RELEASE_ID`, Vercel에서는 `VERCEL_GIT_COMMIT_SHA`를 읽습니다.
- 앱이 뜰 때 DB 표와 시드 계정을 만듭니다(`src/instrumentation.ts`).

## 시드 계정

`docker-compose.yml`에 적혀 있고, 채점기 E2E도 이 계정으로 로그인합니다.

| 이메일 | 비밀번호 | 역할 |
| --- | --- | --- |
| `student@example.com` | `loopthon-2026` | 학습자 |

## E2E

`docs/scenarios.yaml`의 흐름마다 `e2e/scenarios/<id>.spec.ts`가 하나씩 있습니다. docker로 앱을 띄운 뒤:

```bash
cd e2e
npm install
npx playwright install chromium
npx playwright test
```

샘플 저장소 `nextjs/saas-starter`의 같은 commit은 `data/demo/demo.json`에 미리 분석해 둔 결과를 씁니다. 로그인하지 않은 GitHub 요청은 IP당 시간당 60번까지라, 같은 PC에서 E2E를 여러 번 돌리면 '요청 한도' 오류가 날 수 있습니다.

## 환경변수

값은 커밋하지 않습니다. `.env.example`에는 이름만 있습니다. 용도와 기본값은 `docs/api.md`의 「서버 설정」을 기준으로 합니다.

| 이름 | 용도 | 설정 위치 |
| --- | --- | --- |
| `AI_GATEWAY_API_KEY` | 서비스 AI 기능(분석·설명·퀴즈·미션) | 로컬 `.env.local`, 배포 환경, GitHub Secrets |
| `AI_MODEL` | Gateway 모델(기본 `anthropic/claude-haiku-5.5`) | 필요할 때만 |
| `DATABASE_URL` | Postgres 주소(없으면 메모리 저장) | docker-compose.yml, 배포 환경 |
| `SEED_USER_EMAIL` · `SEED_USER_PASSWORD` · `SEED_USER_NAME` | 시드 계정 | docker-compose.yml |
| `RELEASE_ID` | `/__health`가 알려 주는 배포 commit | docker 빌드 인자(CI·주최 측 실행이 넣음) |
| `GITHUB_TOKEN` | 있으면 GitHub 요청 한도가 늘어남(읽기 전용) | 필요할 때만 |
