# CodeBack 백엔드 API

프런트엔드와 백엔드가 실제 요청·응답을 맞추는 문서입니다. 학습 자료 타입은 [`src/server/types.ts`](../src/server/types.ts), 학습 기록 타입은 [`src/server/history.ts`](../src/server/history.ts), 채점 결과 `MissionGrade`는 [`src/server/service.ts`](../src/server/service.ts)에 있습니다. 제품 요구사항은 [problem.yaml](./problem.yaml), 사용자 흐름은 [scenarios.yaml](./scenarios.yaml)을 기준으로 합니다.

- JSON 응답과 오류에는 `Cache-Control: no-store`가 붙습니다. **학습 노트 다운로드 성공 응답은 JSON이 아닌 `application/pdf`**이며 역시 `no-store`입니다.
- 로그인해야 쓰는 서비스입니다(FR-10). 공개 조회는 `/api/auth/me`, `/api/status`, `/__health`이며 회원가입·로그인·로그아웃은 `/api/auth/*`에서 처리합니다. 분석·학습·채점·기록 조회는 유효한 세션이 없으면 `401 login_required`를 반환합니다. 단, 현재 `quiz/attempts` 라우트의 인증 예외는 아래에 별도로 명시합니다.
- 주소는 상대 경로(`/api/...`)로 호출합니다.
- 코드 위치(`CodeReference`)는 분석 기준 commit의 저장된 snapshot에서 파일·라인 범위를 확인해 만듭니다. `snippet`은 snapshot에서 잘라 온 코드이며 민감값은 `[REDACTED]`로 치환됐을 수 있습니다. **파일·라인 존재 검증이 기술 설명·수정 이유의 의미적 정확성이나 실제 실행 결과까지 보장하지는 않습니다.**

## 흐름과 API

| 화면 동작 (docs/scenarios.yaml) | API |
| --- | --- |
| 'GitHub 프로젝트 분석하기' → URL 입력 → '분석 시작' (S1) | `POST /api/repositories/analyze` |
| '사용한 기술'에서 기술 누르기 (S2) | 별도 호출 없이 `analysis.overview.technologies` 사용. 이전 자료는 근거가 확인된 `stack`으로 대체 표시 |
| '기능' 목록에서 기능 누르기 (S3~S6) | 현재 화면은 `analysis.features`에서 선택. 단독 기능 조회용 `GET /api/analyses/{analysisId}/features/{featureId}`도 제공 |
| '이 기능 어떻게 동작해?' (S3) | `GET .../features/{featureId}/flow` |
| '이 코드 배우기' (S4) | `GET .../features/{featureId}/lesson` |
| '이해도 확인' (S5) | `POST` 또는 `GET .../features/{featureId}/quiz` |
| '이제 네가 직접 바꿔봐' (S6) | `GET .../features/{featureId}/exercise` |
| '어디를 고쳐야 해?' → '위치 찾기' (S7) | `POST .../locate` |
| '정답 확인' 결과 저장 (S5) | `POST .../features/{featureId}/quiz/attempts` |
| '채점하기' (S6) | `POST .../features/{featureId}/exercise/grade` |
| '내 학습 기록' (S6) | `GET /api/me/records` |
| '학습 노트 내려받기' (S8) | `GET .../note` |
| 운영 환경의 AI 설정·저장소 상태 조회 | `GET /api/status` |

`...`는 `/api/analyses/{analysisId}`입니다. 흐름·학습·퀴즈·미션은 저장된 결과가 없으면 AI로 생성하며, 사전 준비된 샘플 결과가 있으면 이를 재사용합니다. 저장된 결과는 다음 요청에서 재사용하지만 네트워크·DB 조회 시간과 실패 가능성은 남습니다. 화면은 로딩·실패·재시도를 구분해야 합니다. 수정 미션 **채점**은 미션 자료 조회와 달리 제출할 때마다 AI를 호출합니다.

## 엔드포인트

### `POST /api/repositories/analyze`

요청 `{ "url": "https://github.com/owner/repo" }`

응답 `201`(`cached: false`, 새 AI 분석) 또는 `200`(`cached: true`, 저장된 분석이나 사전 준비 결과 재사용) `{ "analysis": Analysis, "cached": boolean }`

분석한 사용자의 '내 학습 기록'에 저장소가 남습니다. 같은 저장소·같은 commit을 미리 분석해 둔 결과(`data/demo/demo.json`, `scripts/build-demo.ts`가 실제로 분석해 만든 것)가 있으면 AI를 부르지 않고 그 결과를 새 분석으로 저장해 돌려줍니다(`cached: true`).

캐시는 저장소 ID가 대소문자 구분 없이 일치하고, `locate_examples`와 새 소개·기술 필드가 있는 현재 형식일 때만 재사용합니다. 이전 형식이나 다른 저장소 ID가 남은 캐시는 다시 분석해 저장합니다.

- `analysis.repository`: 저장소 이름, 기본 브랜치, 분석 기준 commit SHA, 최종 수정 날짜(`last_commit_at`)
- `analysis.overview`: 한 줄 소개(`summary`), 목적, 기술 스택(`stack[].status`: `confirmed`는 package.json으로 확인됨, `unconfirmed`는 확인 불가), 주요 폴더
- `analysis.overview.intro_sources`: 소개(`summary`·`purpose`)의 근거로 사용한 파일 경로 배열. 분석 snapshot에 실제로 있는 파일만 반환합니다.
- `analysis.overview.intro_inferred`: 검증된 `intro_sources`에 README 계열 파일이 없으면 `true`입니다. 화면의 소개 근거 영역에서 'AI 추정'을 표시하는 데 사용합니다.
- `analysis.overview.technologies[]`: '사용한 기술' 목록. `name`(기술 이름), `role`(이 프로젝트에서 맡은 역할), `concept`(초보자를 위한 짧은 핵심 개념 설명), `references`(검증된 `CodeReference` 1~3개)를 반환합니다. package.json의 의존성 라인과 실제 사용 코드 라인을 근거로 요청하며, 유효하지 않은 참조와 검증된 참조가 하나도 없는 기술은 제외합니다. 기술을 선택하면 역할·개념·파일 경로·라인을 보여 줍니다.
- 위 소개 근거·추정 여부·기술 목록은 이전에 캐시한 분석에는 없을 수 있는 선택 필드입니다. 기존 `stack`, `directories`, `locate_examples`는 계속 제공합니다.
- `analysis.features`: '기능' 목록. 2~5개이고 기능마다 근거 코드가 1개 이상 있습니다. 근거가 확인된 기능이 2개보다 적으면 빈 배열이고 `features_notice`에 이유가 들어갑니다.
- `analysis.overview.directories[]`: `path`, `role`, `layer`(`ui`·`server`·`db`·`config`·`other`). 실제 분석 파일이 있는 폴더만 표시합니다.
- `analysis.stats.skipped_sensitive`: `.env*`·비밀키·인증서 등 민감 파일 제외 수. `skipped_by_filter`에 포함됩니다.
- `analysis.locate_examples`: 고칠 위치 찾기용 짧은 한국어 변경 요청 2~3개(이 저장소에 맞는 문장).
- `analysis.features_notice`: 기능을 못 찾았을 때만 이유 문장이 들어가고, 아니면 `null`
- `analysis.overview.support.status`: React/Next.js가 아니면 `limited`이고, `reason`에 안내 문장이 들어갑니다.

### `GET /api/analyses/{analysisId}`

`{ "analysis": Analysis }`

### `POST /api/analyses/{analysisId}/locate`

요청 `{ "query": "팀원 초대 성공 메시지를 바꾸고 싶어요" }`. `query`는 공백만으로 구성되지 않은 1~200자 문자열입니다.

응답 `200` `{ "result": LocateResult }`:
- `query`: 유니코드 NFC·앞뒤 공백 제거·연속 공백을 한 칸으로 정규화한 요청
- `locations[]`: `reference`(실제 snapshot으로 검증한 파일·라인·원본 발췌), `layer`(`ui`·`server`·`db`), `reason`
- `notice`: 찾았으면 `null`; 없으면 `"입력한 문장과 맞는 위치를 찾지 못했어요."`이고 `locations`는 빈 배열. 화면은 그 아래에 '이 기능부터 살펴보세요:'와 기능 버튼을 보여 줍니다(FR-11).

분석 ID와 정규화한 요청별로 찾은 결과를 캐시합니다(찾지 못한 결과는 저장하지 않아 다음에 다시 찾습니다). 수정된 코드나 붙여 넣을 코드를 반환하지 않습니다.

### `GET /api/analyses/{analysisId}/features/{featureId}`

`{ "analysis_id": string, "feature": Feature }`

### `GET .../features/{featureId}/flow`

`{ "flow": Flow }`

- `steps[]`: `order`, `layer`(`ui`·`state_logic`·`api`·`data`·`config`·`other`), `title`, `description`, `reference`
- `links[]`: `from`·`to`(단계 번호), `confidence`
  - `verified`: 두 단계가 같은 파일이거나, 정적 import 검사에서 앞 파일과 뒤 파일의 연결을 찾은 경우입니다. 실제 실행 순서·호출 성공까지 검증했다는 뜻은 아닙니다.
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
- 서버의 `quiz/attempts`가 저장된 퀴즈로 답을 판정하고 `is_correct`, `answer_index`, `saved`를 반환합니다. 현재 클라이언트는 최초 답을 보내기 전에 계정별로 보관하고, `saved: true` 응답을 확인한 뒤 결과를 공개합니다.
- 화면의 정오답 설명은 선택한 보기와 `quiz.answer_index`를 비교합니다. '다시 풀기'의 연습 결과는 달라질 수 있지만 '내 학습 기록'은 문항별 최초 결과를 유지합니다. 저장 실패를 정답 확인 완료로 처리하지 않으며, 같은 최초 답으로 재시도합니다.
- `disclaimer` 문구를 함께 보여 줍니다.

### `GET .../features/{featureId}/exercise`

`{ "exercise": Exercise }`

- `kind`: `modify`(코드 수정 미션) 또는 `observe`(근거가 부족해 관찰 미션으로 바꾼 경우)
- `instruction`: 변경 목표
- `target_references`: 예상 수정 위치
- `hints[]`: `minimal` → `concept` → `code` 순서로 하나씩 보여 줍니다.
- `acceptance_checks[]`: 성공 조건. 화면 오른쪽에 '채점 기준'으로 보여 주고, '채점하기'는 이 조건으로 점수를 매깁니다.
- `disclaimer`: "CodeBack은 코드를 대신 고치거나 push하지 않아요. 점수는 코드를 실행하지 않고 AI가 추정해요." 예전에 저장된 미션에도 이 문구로 돌려줍니다.

### 내 학습 기록 (FR-13)

| 주소 | 로그인 | 하는 일 |
| --- | --- | --- |
| `POST .../features/{featureId}/quiz/attempts` `{ question_id, chosen_index }` | 제품에서는 필요. 현재 라우트의 예외는 아래 참조 | `{ is_correct: boolean, answer_index: number, saved: boolean }` |
| `GET /api/me/records` | 필요 | `{ records: LearningRecord[] }`. 사용자별 저장소와 최초 퀴즈 결과·기능별 미션 점수 |

`POST /api/repositories/analyze`는 로그인해야 부를 수 있고, 분석한 저장소가 기록에 자동으로 남아요. 로그인이 필요한 주소를 로그인 없이 부르면 `login_required`(401)예요.

- `question_id`는 받은 퀴즈의 문항 ID, `chosen_index`는 원래 `choices` 배열의 0부터 시작하는 인덱스입니다. 화면에서 보기를 섞어도 원래 인덱스를 보냅니다.
- `quiz/attempts`의 현재 서버는 `requireUserId` 대신 `currentUserId`를 사용합니다. 유효한 분석·문항이면 미인증 상태에서도 `200`과 `saved: false`를 반환할 수 있습니다. **FR-10의 로그인 필수 정책과 다른 미해결 구현 차이이며, 익명 학습을 허용하는 제품 계약이 아닙니다.** 클라이언트는 `saved: false`를 저장 성공으로 처리하지 않습니다.
- 저장된 시도 중 사용자·분석·기능·문항별 첫 시도를 집계합니다. POST 자체는 호출마다 행을 추가하므로 서버의 중복 요청 방지 API로 해석하지 않습니다.
- `LearningRecord`에는 `repo_id`, `url`, `analysis_id`, `commit_sha`, `analyzed_at`, `last_viewed_at`, `quiz_correct`, `quiz_total`, `mission_avg_score`, `features`가 있습니다.
- `analyzed_at`은 해당 commit의 분석 생성 시각입니다. 단순 재열기나 채점 시각이 아닙니다. `quiz_total`은 전체 출제 문항 수가 아니라 첫 답이 기록된 문항 수입니다.
- `features[]`는 `id`, `title`, `quiz_correct`, `quiz_total`, `mission_best_score`, `mission_last_score`, `mission_graded`를 제공합니다. 미채점 점수는 `null`, 채점 횟수는 `0`입니다.
- `mission_avg_score`는 채점한 기능들의 최고 점수 평균을 반올림한 값이며, 채점한 기능이 없으면 `null`입니다. '완료한 미션 수'나 실제 코드 수정 성공률이 아닙니다.

### `POST .../features/{featureId}/exercise/grade` `{ code }` — 수정 미션 채점 (FR-08 개정, 로그인 필요)

사용자가 자기 개발 환경에서 고친 코드(바꾼 부분, 최대 8,000자)를 붙여 넣으면 AI가 성공 조건마다 채웠는지 판단해요. 코드는 실행하지 않아요(AI 추정).

`{ "grade": { feature_id, score, passed, checks: [{ condition, met, reason }], feedback, hint, inferred: true, disclaimer }, "saved": boolean }`

- `score`: 채운 조건의 비율(0~100), `passed`: 모든 조건을 채움
- `passed`와 `checks`는 응답 필드입니다. FR-08 화면은 점수·피드백·다음 힌트·AI 추정 안내를 보여 주며 통과/실패나 조건별 충족 여부는 표시하지 않습니다. `hint`는 `null`일 수 있습니다.
- 비밀값으로 보이는 문자열이 있으면 AI로 보내지 않고 `invalid_request`
- 점수는 `quiz_attempts`에 `kind = 'mission'`으로 남습니다. `saved`는 저장 여부이며 화면에 점수가 있다는 사실만으로 저장 성공을 대신하지 않습니다. 채점은 기존 기록의 분석 날짜·commit을 바꾸지 않습니다.
- 제출할 때마다 AI를 호출합니다. 비용은 모델·입력과 출력 토큰·제공자 요금에 따라 달라지며 요청당 고정 금액을 보장하지 않습니다.

### `GET /api/analyses/{analysisId}/note` — 학습 노트 PDF

로그인 필요. 성공 응답은 `200`, `Content-Type: application/pdf`, `Content-Disposition: attachment`, `Cache-Control: no-store`입니다. `response.json()`이 아니라 다운로드 또는 `response.blob()`으로 처리합니다. 실패하면 공통 JSON 오류를 반환합니다.

저장된 분석과 이미 생성된 학습 자료로 PDF를 만들며, 다운로드 요청 자체는 GitHub·AI를 호출하지 않습니다. 파일명은 `codeback-note-<저장소 이름>-<commit 앞 7자리>.pdf`입니다.

FR-12·S8은 화면과 같은 commit 및 기술·근거 내용을 요구합니다. **현재 `note.ts`는 `stack`을 순회하고 화면은 `technologies`를 우선하므로 기술 목록이 달라질 수 있는 미해결 결함이 있습니다.** 이를 허용되는 출력 차이로 취급하지 않습니다.

### 인증 API (FR-10)

`user`의 공개 필드는 `{ name: string, email: string }`입니다. 비밀번호·세션 토큰은 JSON에 반환하지 않습니다.

| 요청 | 성공 응답 | 동작 |
| --- | --- | --- |
| `POST /api/auth/signup` `{ name, email, password }` | `201 { user }` | 가입과 함께 세션 쿠키 발급 |
| `POST /api/auth/login` `{ email, password }` | `200 { user }` | 세션 쿠키 발급 |
| `GET /api/auth/me` | `200 { user: User \| null }` | 현재 사용자 조회. 확인된 미인증은 `user: null` |
| `POST /api/auth/logout` | `200 { ok: true }` | 세션 삭제와 쿠키 만료 |

쿠키 없는 정상 로그아웃 요청도 `200`입니다. 연결 실패·HTTP 오류는 로그아웃 성공으로 간주하지 않습니다. 응답 유실로 처리 여부가 불명확하면 `/api/auth/me`로 다시 확인할 수 있습니다. 인증 조회의 연결 실패·HTTP 오류·잘못된 응답은 정상 `user: null`과 구분해야 하며, 그것만으로 기존 사용자 상태를 비우지 않습니다.

### `GET /api/status`

`{ "ai": { "configured": boolean, "model": string }, "store": "postgres" | "memory" }`

`ai.configured`는 AI 인증 설정의 존재 여부이며 실제 모델 호출·권한·잔여 예산 확인 결과가 아닙니다. Postgres 설정이면 저장소 조회를 시도하므로 DB 오류 때는 공통 오류 응답이 반환될 수 있습니다.

### `GET /__health`

배포 상태 확인용입니다. `{ "releaseId": "<commit SHA>" }`

`RELEASE_ID`, `VERCEL_GIT_COMMIT_SHA` 순서로 사용하고 둘 다 없으면 `"dev"`입니다. 이 경로는 DB나 AI에 연결하지 않으므로 `200`만으로 전체 백엔드가 정상이라고 판단하지 않습니다.

## 오류

라우트의 공통 오류 처리기가 반환하는 오류는 다음 모양입니다. 일부 오류에는 `error.details`가 추가됩니다.

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
| `github_auth_failed` | 502 | 서버의 GitHub 인증 설정이 거절됨. 사용자 로그인 오류와 다름 |
| `ai_not_configured` | 503 | 서버에 AI 키가 없을 때 |
| `ai_access_denied` | 503 | 키 비활성·모델 권한·예산 소진 |
| `ai_timeout` | 504 | AI 응답 지연 |
| `ai_failed` | 502 | AI 응답 실패 |
| `analysis_not_found` | 404 | 없는 `analysisId` |
| `feature_not_found` | 404 | 없는 `featureId` |
| `invalid_credentials` | 401 | 이메일·비밀번호 조합이 일치하지 않음 |
| `email_taken` | 409 | 이미 가입한 이메일 |
| `auth_unavailable` | 503 | 인증에 필요한 Postgres 저장소가 설정되지 않음 |
| `login_required` | 401 | 로그인하지 않았거나 세션이 만료됐을 때 |
| `internal_error` | 500 | 그 밖의 서버 오류 |

## DB 구조

표 정의는 [`src/server/schema.ts`](../src/server/schema.ts)에 있어요. 앱이 처음 DB에 연결할 때 표를 스스로 만들어요.

| 표 | 저장하는 것 |
| --- | --- |
| `users` | 이름(`name`), 이메일(`username` 칸에 소문자로 저장, 중복 금지), 비밀번호 해시(`password_hash`, 원문 저장 안 함), 가입·수정 시각 |
| `sessions` | 로그인 유지용 세션. 토큰의 해시, 사용자, 만료 시각(7일) |
| `repositories` | GitHub 주소, 기본 브랜치, 마지막으로 확인한 최신 commit, **최종 수정 날짜**(`last_commit_at`), 확인한 시각 |
| `analyses` | 저장소 + commit 하나당 분석 결과(개요·기능 목록)와 분석에 쓴 파일 내용 |
| `analysis_artifacts` | 기능별 결과: 동작 흐름, 개념 학습(**코드 정리 내용**), 퀴즈(**문제와 정답**), 수정 미션 |
| `user_repositories` | 사용자가 분석한 저장소 목록(처음 추가한 시각, 마지막으로 본 시각, 최신 분석 결과) |
| `quiz_attempts` | 퀴즈 답과 수정 미션 점수(`kind` = `quiz`·`mission`). 퀴즈는 고른 보기·정답 여부, 미션은 `score`(0~100)·통과 여부 (FR-07·FR-08·FR-13) |

**같은 저장소를 다시 분석할 때 (토큰 절약)**

1. GitHub에서 기본 브랜치의 최신 commit과 최종 수정 날짜만 먼저 확인해요(파일은 받지 않음).
2. 그 commit으로 분석한 결과가 이미 있으면(= 그 사이 GitHub에 변경이 없으면) 파일을 다시 받지 않고 AI도 부르지 않은 채 저장된 결과를 돌려줘요(`cached: true`).
3. commit이 바뀌었거나 재사용 가능한 현재 형식의 결과가 없으면 다시 분석합니다. 기능별 자료도 캐시가 없거나 학습 자료가 이전 형식이면 생성합니다. 이 캐시는 동시 최초 요청을 하나로 합치거나 생성이 정확히 한 번만 실행됨을 보장하는 장치는 아닙니다.

회원가입·로그인(FR-10)은 `src/server/auth.ts`·`/api/auth/*`, 내 학습 기록(FR-13)은 `src/server/history.ts`·`/api/me/records`에 있어요.

## 서버 설정(환경변수)

| 이름 | 기본값 | 용도 |
| --- | --- | --- |
| `AI_GATEWAY_API_KEY` | (없음) | AI Gateway 키. 대시보드 자료 → API 키 |
| `AI_MODEL` | `anthropic/claude-haiku-5.5` | Gateway 모델 식별자 |
| `DATABASE_URL` | (연결 주소가 모두 없으면 메모리) | Postgres 주소. 없으면 `POSTGRES_URL`, `POSTGRES_PRISMA_URL` 순서로 확인. 회원가입·로그인·개인 학습 기록에는 Postgres 필요 |
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
  demo.ts      미리 분석해 둔 결과(data/demo/demo.json) 읽기. 같은 저장소·commit이면 재사용
  http.ts      웹 표준 Request/Response 도우미
src/app/api/** Next.js 라우트. server/의 함수를 부르기만 한다
scripts/build-demo.ts  공개 샘플 저장소를 실제로 분석해 data/demo/demo.json 생성
```

다른 프레임워크(Express, Hono 등)로 옮길 때는 `src/app/api/**`의 라우트만 새로 쓰고 `src/server/`는 그대로 씁니다.
