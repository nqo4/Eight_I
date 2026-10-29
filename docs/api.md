# CodeBack 백엔드 API

프런트엔드가 목업 데이터를 만들 때 기준으로 쓰는 문서입니다. 응답 모양의 정확한 정의는 [`src/server/types.ts`](../src/server/types.ts)에 있습니다(이 파일을 프런트에 그대로 복사해 타입으로 써도 됩니다).

- 모든 응답은 JSON이고 `Cache-Control: no-store`입니다.
- 로그인은 없습니다.
- 주소는 상대 경로(`/api/...`)로 호출합니다.
- 코드 위치(`CodeReference`)는 서버가 실제 GitHub 파일과 대조한 것만 내려갑니다. `snippet`은 실제 파일에서 잘라 온 해당 라인입니다(AI가 쓴 글이 아님).

## 흐름과 API

| 화면 동작 (docs/scenarios.yaml) | API |
| --- | --- |
| '깃허브 프로젝트 분석하기' → URL 입력 → '분석 시작' (S1) | `POST /api/repositories/analyze` |
| '샘플로 체험하기' (S2~S8) | `GET /api/demo` → 이후 `analysisId`는 `"demo"` |
| 기능 카드 누르기 (S2) | `GET /api/analyses/{analysisId}/features/{featureId}` |
| '이 기능 어떻게 동작해?' (S3) | `GET .../features/{featureId}/flow` |
| '이 코드 배우기' (S4) | `GET .../features/{featureId}/lesson` |
| '이해도 확인' (S5) | `POST` 또는 `GET .../features/{featureId}/quiz` |
| '이제 네가 직접 바꿔봐' (S6) | `GET .../features/{featureId}/exercise` |
| '어디를 고쳐야 해?' → '위치 찾기' (S7) | `POST .../locate` |
| 처음 화면에서 사용 가능 여부 확인 | `GET /api/status` |

`...`는 `/api/analyses/{analysisId}`입니다. 흐름·학습·퀴즈·미션은 처음 요청할 때 AI로 만들기 때문에 **수 초~수십 초** 걸릴 수 있습니다. 한 번 만든 결과는 저장해 두고, 다음 요청부터는 바로 돌려줍니다. 로딩 표시가 필요합니다.

## 엔드포인트

### `POST /api/repositories/analyze`

요청 `{ "url": "https://github.com/owner/repo" }`

응답 `201`(새로 분석) 또는 `200`(같은 commit을 현재 형식으로 이미 분석해 둔 결과) `{ "analysis": Analysis, "cached": boolean }`

캐시는 저장소 ID가 대소문자 구분 없이 일치하고, `locate_examples`와 새 소개·기술 필드가 있는 현재 형식일 때만 재사용합니다. 이전 형식이나 다른 저장소 ID가 남은 캐시는 다시 분석해 저장합니다.

- `analysis.repository`: 저장소 이름, 기본 브랜치, 분석 기준 commit SHA, 최종 수정 날짜(`last_commit_at`)
- `analysis.overview`: 한 줄 소개(`summary`), 목적, 기술 스택(`stack[].status`: `confirmed`는 package.json으로 확인됨, `unconfirmed`는 확인 불가), 주요 폴더
- `analysis.overview.intro_sources`: 소개(`summary`·`purpose`)의 근거로 사용한 파일 경로 배열. 분석 snapshot에 실제로 있는 파일만 반환합니다.
- `analysis.overview.intro_inferred`: 검증된 `intro_sources`에 README 계열 파일이 없으면 `true`입니다. 이때 소개 옆에 'AI 추정'을 표시합니다.
- `analysis.overview.technologies[]`: '사용한 기술' 목록. `name`(기술 이름), `role`(이 프로젝트에서 맡은 역할), `concept`(초보자를 위한 짧은 핵심 개념 설명), `references`(검증된 `CodeReference` 1~3개)를 반환합니다. package.json의 의존성 라인과 실제 사용 코드 라인을 근거로 요청하며, 유효하지 않은 참조와 검증된 참조가 하나도 없는 기술은 제외합니다. 기술을 선택하면 역할·개념·파일 경로·라인을 보여 줍니다.
- 위 소개 근거·추정 여부·기술 목록은 이전에 캐시한 분석에는 없을 수 있는 선택 필드입니다. 기존 `stack`, `directories`, `locate_examples`는 계속 제공합니다.
- `analysis.features`: 기능 카드. 최대 5개이고 각 카드에 근거 코드가 1개 이상 있습니다.
- `analysis.overview.directories[]`: `path`, `role`, `layer`(`ui`·`server`·`db`·`config`·`other`). 실제 분석 파일이 있는 폴더만 표시합니다.
- `analysis.stats.skipped_sensitive`: `.env*`·비밀키·인증서 등 민감 파일 제외 수. `skipped_by_filter`에 포함됩니다.
- `analysis.locate_examples`: 고칠 위치 찾기용 짧은 한국어 변경 요청 2~3개. 데모에서는 각 문장의 결과가 미리 저장되어 있습니다.
- `analysis.features_notice`: 기능을 못 찾았을 때만 이유 문장이 들어가고, 아니면 `null`
- `analysis.overview.support.status`: React/Next.js가 아니면 `limited`이고, `reason`에 안내 문장이 들어갑니다.

### `GET /api/demo`

`{ "analysis": Analysis }`이고 `analysis.mode`는 `"demo"`, `analysis.id`는 `"demo"`입니다. 화면에 '데모 모드' 표시가 필요합니다. 미리 만든 결과라 GitHub·AI를 호출하지 않습니다.

### `GET /api/analyses/{analysisId}`

`{ "analysis": Analysis }`

### `POST /api/analyses/{analysisId}/locate`

요청 `{ "query": "팀원 초대 성공 메시지를 바꾸고 싶어요" }`. `query`는 공백만으로 구성되지 않은 1~200자 문자열입니다.

응답 `200` `{ "result": LocateResult }`:
- `query`: 유니코드 NFC·앞뒤 공백 제거·연속 공백을 한 칸으로 정규화한 요청
- `locations[]`: `reference`(실제 snapshot으로 검증한 파일·라인·원본 발췌), `layer`(`ui`·`server`·`db`), `reason`
- `notice`: 찾았으면 `null`; 없으면 `"찾지 못했습니다. 기능 카드에서 흐름을 확인해 보세요."`이고 `locations`는 빈 배열

분석 ID와 정규화한 요청별로 결과를 캐시합니다. 수정된 코드나 붙여 넣을 코드를 반환하지 않습니다. 데모 예시 문장은 GitHub·AI 없이 동작합니다. 데모에서 저장되지 않은 문장을 입력하고 AI 설정도 없으면 `400 demo_example_only`, `"데모에서는 예시 문장으로 체험할 수 있어요"`를 반환합니다. AI가 설정되어 있으면 같은 snapshot으로 새 위치를 찾을 수 있습니다.

### `GET /api/analyses/{analysisId}/features/{featureId}`

`{ "analysis_id": string, "feature": Feature }`

### `GET .../features/{featureId}/flow`

`{ "flow": Flow }`

- `steps[]`: `order`, `layer`(`ui`·`state_logic`·`api`·`data`·`config`·`other`), `title`, `description`, `reference`
- `links[]`: `from`·`to`(단계 번호), `confidence`
  - `verified`: 앞 파일이 뒤 파일을 실제로 import합니다. 실선 화살표로 그려도 됩니다.
  - `inferred`: AI 추정입니다. **확정 화살표로 그리지 않습니다**(점선, '추정' 표시 등).

### `GET .../features/{featureId}/lesson`

`{ "lesson": Lesson }`이고 4개 섹션으로 나뉩니다.
- `overview`: 기능 설명
- `walkthrough`: 행동 전후의 화면 변화(`action`, `before`, `after`)와 관련 코드 한 줄(`key_line`, 최대 3줄). 코드 위치를 검증하지 못하면 `key_line`은 `null`입니다. 화면 변화 → 코드 한 줄 → 개념 순서로 보여 줍니다.
- `design_reasons`: 구현 방식을 쓴 이유 1~3개(`reason`, `reference`, `inferred`). 코드로 확인할 수 없거나 참조가 유효하지 않으면 `reference: null`, `inferred: true`로 AI 추정을 표시합니다.
- `file_roles`: 파일 역할
- `code_explanations`: 중요한 코드
- `concepts`: 핵심 개념. `concepts[].easy_explanation`은 '쉬운 설명 펼치기'에 씁니다.

### `POST|GET .../features/{featureId}/quiz`

`{ "quiz": Quiz }`

- `questions[]`: `id`, `question`, `choices[]`, `answer_index`, `explanation`, `references[]`
- 정답 맞추기('정답 확인')는 프런트에서 `answer_index`와 비교합니다.
- `disclaimer` 문구를 함께 보여 줍니다.

### `GET .../features/{featureId}/exercise`

`{ "exercise": Exercise }`

- `kind`: `modify`(코드 수정 미션) 또는 `observe`(근거가 부족해 관찰 미션으로 바꾼 경우)
- `instruction`: 변경 목표
- `target_references`: 예상 수정 위치
- `hints[]`: `minimal` → `concept` → `code` 순서로 하나씩 보여 줍니다.
- `acceptance_checks[]`: 성공 조건 체크박스
- `disclaimer`: "완료 체크는 자기 보고이며 실행 결과를 보증하지 않음". 완료 표시 옆에 보여 줍니다.

### 내 학습 기록 (FR-13)

| 주소 | 로그인 | 하는 일 |
| --- | --- | --- |
| `POST .../features/{featureId}/quiz/attempts` `{ question_id, chosen_index }` | 선택 | 서버가 저장된 퀴즈로 정답을 판정해 돌려주고, 로그인했으면 기록에 남겨요(`saved`) |
| `POST .../features/{featureId}/exercise/complete` | 선택 | '완료로 표시'(자기 보고)를 기록에 남겨요. 로그인 전이면 `saved: false` |
| `GET /api/me/records` | 필요 | 내가 분석한 저장소마다 퀴즈 맞힌 수·전체 수, 완료한 미션 수, 기능별 진행 상황 |

`POST /api/repositories/analyze`를 로그인한 상태로 부르면 그 저장소가 기록에 자동으로 남아요. 로그인이 필요한 주소를 로그인 없이 부르면 `login_required`(401)예요.

### `GET /api/status`

`{ "ai": { "configured": boolean, "model": string }, "store": "postgres" | "memory", "demo_ready": boolean }`

### `GET /__health`

배포 상태 확인용입니다. `{ "releaseId": "<commit SHA>" }`

## 오류

모든 오류는 같은 모양입니다.

```json
{ "error": { "code": "repo_not_found", "message": "화면에 그대로 보여 줄 수 있는 한국어 문장", "retryable": false } }
```

`retryable: true`면 '다시 시도' 버튼을 보여 주면 됩니다.

| code | HTTP | 언제 |
| --- | --- | --- |
| `invalid_request` | 400 | 요청 JSON이 없거나 `url`이 비었을 때 |
| `invalid_url` | 400 | GitHub 저장소 주소 형식이 아닐 때 |
| `repo_not_found` | 404 | 저장소가 없거나 비공개일 때(GitHub는 둘을 구분해 주지 않음) |
| `repo_private` | 403 | 비공개 저장소로 확인됐을 때 |
| `repo_empty` | 422 | 커밋이나 분석할 소스 파일이 없을 때 |
| `github_rate_limited` | 429 | GitHub 요청 한도 초과. `details.reset_at`이 있을 수 있음 |
| `github_unavailable` | 502 | GitHub 연결 실패 |
| `ai_not_configured` | 503 | 서버에 AI 키가 없을 때. '샘플로 체험하기'를 안내 |
| `ai_access_denied` | 503 | 키 비활성·모델 권한·예산 소진 |
| `ai_timeout` | 504 | AI 응답 지연 |
| `ai_failed` | 502 | AI 응답 실패 |
| `analysis_not_found` | 404 | 없는 `analysisId` |
| `feature_not_found` | 404 | 없는 `featureId` |
| `demo_not_ready` | 503 | 샘플 데이터가 아직 준비되지 않았을 때 |
| `demo_example_only` | 400 | AI 설정 없이 데모의 저장되지 않은 위치 찾기 문장을 요청했을 때 |
| `internal_error` | 500 | 그 밖의 서버 오류 |

## DB 구조

표 정의는 [`src/server/schema.ts`](../src/server/schema.ts)에 있어요. 앱이 처음 DB에 연결할 때 표를 스스로 만들어요.

| 표 | 저장하는 것 |
| --- | --- |
| `users` | 이름(`name`), 이메일(`username` 칸에 소문자로 저장, 중복 금지), 비밀번호 해시(`password_hash`, 원문 저장 안 함), 가입·수정 시각 |
| `sessions` | 로그인 유지용 세션. 토큰의 해시, 사용자, 만료 시각(7일) |
| `repositories` | GitHub 주소, 기본 브랜치, 마지막으로 확인한 최신 commit, **최종 수정 날짜**(`last_commit_at`), 확인한 시각 |
| `analyses` | 저장소 + commit 하나당 분석 결과(개요·기능 카드)와 분석에 쓴 파일 내용 |
| `analysis_artifacts` | 기능별 결과: 동작 흐름, 개념 학습(**코드 정리 내용**), 퀴즈(**문제와 정답**), 수정 미션 |
| `user_repositories` | 사용자가 분석한 저장소 목록(처음 추가한 시각, 마지막으로 본 시각, 최신 분석 결과) |
| `quiz_attempts` | 사용자가 고른 퀴즈 답(고른 보기, 정답 여부, 시각). 정답 여부는 서버에 저장된 퀴즈로 판정 (FR-07·FR-13) |
| `mission_completions` | 사용자가 '완료로 표시'한 수정 미션(기능별 한 줄, 완료 시각) (FR-08·FR-13) |

**같은 저장소를 다시 분석할 때 (토큰 절약)**

1. GitHub에서 기본 브랜치의 최신 commit과 최종 수정 날짜만 먼저 확인해요(파일은 받지 않음).
2. 그 commit으로 분석한 결과가 이미 있으면(= 그 사이 GitHub에 변경이 없으면) 파일을 다시 받지 않고 AI도 부르지 않은 채 저장된 결과를 돌려줘요(`cached: true`).
3. 변경이 있을 때만 파일을 받아 새로 분석해요. 기능별 흐름·학습·퀴즈·미션도 처음 열 때 한 번만 만들어요.

회원가입·로그인(FR-10)은 `src/server/auth.ts`·`/api/auth/*`, 내 학습 기록(FR-13)은 `src/server/history.ts`·`/api/me/records`에 있어요.

## 서버 설정(환경변수)

| 이름 | 기본값 | 용도 |
| --- | --- | --- |
| `AI_GATEWAY_API_KEY` | (없음) | AI Gateway 키. 대시보드 자료 → API 키 |
| `AI_MODEL` | `anthropic/claude-haiku-5.5` | Gateway 모델 식별자 |
| `DATABASE_URL` | (없음 → 메모리) | Postgres 주소. 배포 환경에서는 필요 |
| `GITHUB_TOKEN` | (없음) | 있으면 GitHub 요청 한도가 늘어남(읽기 전용 토큰) |
| `ANALYZE_MAX_FILES` | 80 | 한 저장소에서 읽을 최대 파일 수 |
| `ANALYZE_MAX_TOTAL_BYTES` | 250000 | 한 저장소에서 읽을 최대 총 크기 |
| `ANALYZE_MAX_FILE_BYTES` | 40000 | 이보다 큰 파일은 건너뜀 |

## 구조 (Next.js 의존 최소화)

```
src/server/    ← 백엔드 본체. Next.js를 import하지 않는다(다른 서버로 옮길 때 그대로 사용)
  service.ts   기능 함수(analyzeRepository, getFlow, getLesson, getQuiz, getExercise …)
  github.ts    공개 저장소 읽기(FR-01)
  filter.ts    제외·민감 파일 거르기, 비밀값 가리기(FR-02)
  evidence.ts  파일·라인 검증, import 관계 확인, package.json 기술 스택 확인
  ai.ts        AI Gateway 호출과 오류 변환
  prompts.ts   AI 결과 스키마와 요청 문장
  store.ts     Postgres / 메모리 저장소
  demo.ts      샘플 데이터(data/demo/demo.json) 읽기
  http.ts      웹 표준 Request/Response 도우미
src/app/api/** Next.js 라우트. server/의 함수를 부르기만 한다
scripts/build-demo.ts  실제 샘플 저장소를 분석해 data/demo/demo.json 생성
```

다른 프레임워크(Express, Hono 등)로 옮길 때는 `src/app/api/**`의 라우트만 새로 쓰고 `src/server/`는 그대로 씁니다.
