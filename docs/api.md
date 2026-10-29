# CodeBack 백엔드 API

프런트엔드가 목업 데이터를 만들 때 기준으로 쓰는 문서입니다. 응답 모양의 정확한 정의는 [`server/types.ts`](../server/types.ts)에 있습니다(이 파일을 프런트에 그대로 복사해 타입으로 써도 됩니다).

- 모든 응답은 JSON이고 `Cache-Control: no-store`입니다.
- 로그인은 없습니다.
- 주소는 상대 경로(`/api/...`)로 호출합니다.
- 코드 위치(`CodeReference`)는 서버가 실제 GitHub 파일과 대조한 것만 내려갑니다. `snippet`은 실제 파일에서 잘라 온 해당 라인입니다(AI가 쓴 글이 아님).

## 흐름과 API

| 화면 동작 (docs/scenarios.yaml) | API |
| --- | --- |
| '내 프로젝트 분석하기' → URL 입력 → '분석 시작' (S1) | `POST /api/repositories/analyze` |
| '샘플로 체험하기' (S2~S6, S8) | `GET /api/demo` → 이후 `analysisId`는 `"demo"` |
| 기능 카드 누르기 (S2) | `GET /api/analyses/{analysisId}/features/{featureId}` |
| '이 기능 어떻게 동작해?' (S3) | `GET .../features/{featureId}/flow` |
| '이 코드 배우기' (S4) | `GET .../features/{featureId}/lesson` |
| '이해도 확인' (S5) | `POST` 또는 `GET .../features/{featureId}/quiz` |
| '이제 네가 직접 바꿔봐' (S6) | `GET .../features/{featureId}/exercise` |
| 처음 화면에서 사용 가능 여부 확인 | `GET /api/status` |

`...`는 `/api/analyses/{analysisId}`입니다. 흐름·학습·퀴즈·미션은 처음 요청할 때 AI로 만들기 때문에 **수 초~수십 초** 걸릴 수 있습니다. 한 번 만든 결과는 저장해 두고, 다음 요청부터는 바로 돌려줍니다. 로딩 표시가 필요합니다.

## 엔드포인트

### `POST /api/repositories/analyze`

요청 `{ "url": "https://github.com/owner/repo" }`

응답 `201`(새로 분석) 또는 `200`(같은 commit을 이미 분석해 둔 결과) `{ "analysis": Analysis, "cached": boolean }`

- `analysis.repository`: 저장소 이름, 기본 브랜치, 분석 기준 commit SHA
- `analysis.overview`: 한 줄 소개(`summary`), 목적, 기술 스택(`stack[].status`: `confirmed`는 package.json으로 확인됨, `unconfirmed`는 확인 불가), 주요 폴더
- `analysis.features`: 기능 카드. 최대 5개이고 각 카드에 근거 코드가 1개 이상 있습니다.
- `analysis.features_notice`: 기능을 못 찾았을 때만 이유 문장이 들어가고, 아니면 `null`
- `analysis.overview.support.status`: React/Next.js가 아니면 `limited`이고, `reason`에 안내 문장이 들어갑니다.

### `GET /api/demo`

`{ "analysis": Analysis }`이고 `analysis.mode`는 `"demo"`, `analysis.id`는 `"demo"`입니다. 화면에 '데모 모드' 표시가 필요합니다. 미리 만든 결과라 GitHub·AI를 호출하지 않습니다.

### `GET /api/analyses/{analysisId}`

`{ "analysis": Analysis }`

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
| `internal_error` | 500 | 그 밖의 서버 오류 |

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
server/        ← 백엔드 본체. Next.js를 import하지 않는다(다른 서버로 옮길 때 그대로 사용)
  service.ts   기능 함수(analyzeRepository, getFlow, getLesson, getQuiz, getExercise …)
  github.ts    공개 저장소 읽기(FR-01)
  filter.ts    제외·민감 파일 거르기, 비밀값 가리기(FR-02)
  evidence.ts  파일·라인 검증, import 관계 확인, package.json 기술 스택 확인
  ai.ts        AI Gateway 호출과 오류 변환
  prompts.ts   AI 결과 스키마와 요청 문장
  store.ts     Postgres / 메모리 저장소
  demo.ts      샘플 데이터(data/demo/demo.json) 읽기
  http.ts      웹 표준 Request/Response 도우미
app/api/**     Next.js 라우트. server/의 함수를 부르기만 한다
scripts/build-demo.ts  실제 샘플 저장소를 분석해 data/demo/demo.json 생성
```

다른 프레임워크(Express, Hono 등)로 옮길 때는 `app/api/**`의 라우트만 새로 쓰고 `server/`는 그대로 씁니다.
