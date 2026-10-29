# 우리 팀 진행 기록

Agent가 서비스 저장소 루트의 `progress.md`로 복사해 이어 쓴다(`docs/` 아래에 두지 않는다). 필수 제출 양식을 대신하는 문서가 아니다. 비밀번호·토큰·팀 로그인 코드는 적지 않는다.

## 현재 상태

- 실제 서비스 저장소 폴더: C:\Users\user\OneDrive\Documents\8I\Eight_I
- 현재 단계 / 다음 행동 (2026-10-30 00:45, main 1107bab): 7단계 최종 검증 중. 문서 개정(76d05b3: 로그인 필수, 데모 모드 삭제, FR-13 내 학습 기록, FR-14·15 상세 화면)에 맞춰 구현·E2E를 다시 맞춤(dd1b029·7082174·680cda0, cc5b546). 빈 DB docker에서 S1~S8 E2E 8/8 통과, CI checks·scenarios 성공(680cda0·6ce5615), 배포 /__health가 main commit과 일치(6ce5615). S8 버튼 이름·proxy 경로(/mypage)도 문서에 맞춤(1107bab). 다음: 발표 슬라이드, 학생 확인 항목 처리
- 학생에게 확인할 내용: 대시보드 캔버스·흐름 S1~S8 표시와 제출 요건 화면 노란 줄, GitHub Secrets의 AI_GATEWAY_API_KEY 등록, 팀원별 역할·한 일(0/5), 발표 슬라이드 PDF 업로드, Vercel은 nqo4 작성 commit만 배포됨(다른 작성자는 차단)
- 브랜치 규칙: 매시 정각 채점. 기술 개발이 main에 합쳐졌고(PR #1~#3), 지금은 main에 바로 올리거나 짧은 기능 브랜치 → PR로 합침. 문서 변경은 화면·spec과 같은 commit에서 맞춤

## 1. GitHub 준비

- [x] 기존 저장소·브랜치·remote와 로그인 확인 (gh 2.103.3 설치, 계정 nqo4 로그인)
- [x] 학생과 저장소 이름 합의 (답을 받기 전에는 생성하지 않음)
- [x] 팀의 private 레포 생성 또는 기존 레포 확인
- [x] loopthon-bot 앱을 팀 레포에 설치 (https://github.com/apps/loopthon-bot/installations/new, 팀 레포만 선택)
- [x] 팀 코드로 대시보드 API 로그인(`data.teamId`), 레포 URL을 HTTP로 저장(`data.team.repoUrl`) 확인. 팀 코드로는 화면에 들어갈 수 없음
- [x] 사이트에 등록한 레포를 실제 작업 폴더로 clone, remote·기본 브랜치 확인
- [x] .gitignore / .env.example / README 준비(`.env`·`node_modules/`·`.next/`·`dist/`·`build/` 제외, 큰 데이터 파일 커밋 안 함. 파일이 너무 많으면 저장소를 읽지 못함)
- [x] 준비 파일 commit/push 확인 (5aeff5e)
- [x] 앱 설치 후 읽기 권한 확인 (5분 자동 재확인, 즉시 확인은 같은 레포 URL 다시 저장)
- 저장소 URL / 기본 브랜치 / commit SHA: https://github.com/nqo4/Eight_I / main / 준비 파일 commit은 git log 참고
- 사이트 등록 결과 / loopthon-bot 설치·접근 상태: teamId 8, repoUrl 저장 ok, check=ok (loopthon-bot 설치·읽기 권한 확인)

## 2. 문제정의 기록 → 문제 다지기 → 해법 찾기 → 기능 명세

- [x] 종이 기록 수령(학생이 채팅에 옮겨 적거나 사진 첨부) (사진 5장: 앞면 ①~⑥, 뒷면 1~4)
- [x] problem.example.yaml을 참고해 docs/problem.yaml 작성 (팀이 준 문서를 양식 키로 옮김)
- [x] 원문 의도와 불명확한 내용 확인, 없는 근거는 빈칸 유지 (종이에서 비어 있던 ④ 잃은 시간·횟수, WHY 3~5, 해법 reason, 통찰 1~3은 외부 출처 또는 (?)·[사람 확인]으로 표시)
- [x] 2-A 문제 다지기: 캔버스 칸을 질문으로 다짐(Agent가 해법·후보·예시 답을 먼저 내지 않음, 학생 답이 없는 칸은 "학생 답 대기") (학생 확인이 필요한 칸은 값 앞에 [사람 확인] 표시)
- [x] 팀원 경험을 언제·어떤 장면·어떻게 대응했는지까지 experiences에 기록 (팀원 1명의 경험 2건 E1·E2, 날짜·발화자·인용 허락은 [사람 확인])
- [x] 외부 자료는 열리는 URL을 sources에 그대로 적고 원문이 주장을 직접 뒷받침하는지 확인, 출처 없는 수치 없음 (SRC-1~6: 면접관 글, 직능연 726명 조사, 조선일보, Stack Overflow 2025, Anthropic 실험, Fawzy et al. 2025 바이브코딩 GLR; 모든 수치에 SRC 표기, 목록은 docs/sources.md)
- [x] 문제가 '우리 기능이 없어서'가 아니라 실제 상황·행동으로 서술됐는지 확인 (context 3시점·experiences 행동 서술)
- [x] 2-B 해법 찾기: 학생이 낸 해법과 결정을 solution_paths에, 기존 대안 대신 이 해법이어야 하는 이유를 학생 말로 why_ours에 작성 (팀 원본 문장으로 채움, 학생 확인 필요)
- [x] 2-C features에 학생이 고른 해법의 기능별 입력·결과·완료 조건 작성 (FR-03·FR-10 input 채움)
- [x] YAML 문법 검사, 등록된 레포의 기본 브랜치에 docs/problem.yaml push
- [x] 학생이 개인 로그인으로 우리 팀 → 문제 정의를 열어 캔버스 표시 확인(Agent는 화면을 열 수 없음, 약 1분 캐시)
- [x] 핵심 사용자 흐름·기능별 동작 규칙·완료 조건·제외 범위를 팀과 확인 (대회 흐름 S1~S7, 정적 피드백 FR-09는 P1이라 제외)
- [x] 로그인 필요 여부와 역할 이름(흐름 account·docker 시드 계정 역할 이름으로 씀) 결정 (2026-10-29 개정: 로그인 필수 FR-10, 역할 '학습자', S2~S8 account: 학습자, S1은 회원가입부터)
- [x] 첫 화면에서 알려 줄 것(로그인하지 않은 사람이 `/`에서 볼 서비스 이름·하는 일)을 학생과 정함 (서비스 이름 CodeBack, 한 줄: AI로 만든 프로젝트를 기능에서 코드까지 배우는 학습 서비스, 당시 버튼 '내 프로젝트 분석하기'·'샘플로 체험하기'; 사전 생성 체험은 제거됨)
- [x] 주 사용 플랫폼(desktop·mobile·both)과 실제 사용 장면에 근거한 platformReason 작성 (desktop)
- [x] 사용자 핵심 흐름 3~8개를 scenarios.example.yaml 참고해 docs/scenarios.yaml에 작성(steps는 화면의 메뉴·버튼 이름으로 한 줄에 한 동작, 로그인 흐름은 account 지정), YAML 파서로 형식 확인 후 기본 브랜치 push (7개 S1~S7, 모두 홈에서 시작, 제목은 '학습자가 …'로 example 규칙에 맞춤, js-yaml 파싱 확인)
- [x] 서비스의 AI 호출 필요 여부 확인 (필요: FR-03~FR-08의 구조 요약·기능 추출·설명·퀴즈·미션 생성. 사전 생성 샘플 모드는 제거되어 최초 분석은 실시간 AI 호출)
- [x] README 등 기존 문서에 확인된 구현 설계 기록, 기본 브랜치 push (README, docs/api.md의 API·DB 표·서버 구조)
- 문제정의·구현 설계 링크 / commit SHA / 확인할 빈칸: https://github.com/nqo4/Eight_I/blob/main/docs/problem.yaml , https://github.com/nqo4/Eight_I/blob/main/docs/scenarios.yaml / 양식 정렬 commit a482da8 / 남은 것: 팀 자체 측정 수치 없음(인터뷰 예정), README 구현 설계 기록

## 3. 최소 화면 docker 실행·CI·첫 배포

- [x] 설계에 맞는 최소 화면과 서버 실행 구성 준비, Dockerfile 작성(빌드는 Dockerfile에서 끝내고 시작 명령은 서버 실행만) (빌드는 이미지 안 `npm run build`, 시작은 `node server.js`)
- [x] docker-compose.example.yml을 docker-compose.yml로 복사: app·db, app만 ports "3000:3000", 앱은 컨테이너 안 3000에서 받음, 앱 설정에 localhost:3000 같은 절대 주소 없음
- [x] app 말고는 ports·container_name이 없고, 어느 서비스에도 env_file 없음
- [x] 환경변수 이름 그대로(RELEASE_ID·SEED_USER_*·AI_GATEWAY_API_KEY), 시드 계정 값은 `${}` 없이 직접 적음 (SEED_USER_EMAIL student@example.com, 서버 시작 시 src/instrumentation.ts가 생성)
- [x] 빈 DB에서 `docker compose up --build`만으로 앱·시드 데이터가 2분 안에 뜸(docker를 못 쓰면 GitHub Actions 결과로 확인) (빈 DB에서 /__health 약 1초, 시드 계정 로그인 확인, CI api-smoke 통과)
- [x] README 설치·빌드·실행 안내와 환경변수 표(이름·용도·설정 위치) (서비스 소개·문서 목록·docker 실행·시드 계정·E2E 실행·환경변수 7종 표)
- [x] GET /__health가 인증·리다이렉트 없이 200 응답(docker 앱·배포 둘 다, Next.js는 app/%5F%5Fhealth), 실제 배포 commit을 releaseId로 제공 (배포 releaseId = 6ce5615)
- [x] 공개 HTTPS URL 첫 배포(발표용, 배포용 DB는 학생 확인 후 무료 등급) (Vercel + Neon Postgres, 배포 /api/status store=postgres)
- [x] CI 실제 검사(workflows/scenarios.yml 복사)와 성공 뒤 자동 배포 연결, 실제 push로 확인 (checks·scenarios 성공: 680cda0, 6ce5615. Vercel 자동 배포는 nqo4 작성 commit만 됨)
- [ ] Agent가 대시보드 배포 URL 저장, UP·배포 commit 일치 확인 (URL 등록됨. 최신 commit 일치는 학생이 대시보드에서 확인 필요)
- 배포 URL / CI·배포 링크 / 첫 배포 commit SHA: https://eight-i-nu.vercel.app / https://github.com/nqo4/Eight_I/actions / 현재 배포 6ce5615

## 4. 서비스 AI API 설정 (필요할 때만)

- 해당 여부 / 선택한 Gateway 지원 모델: 필요(분석·흐름·학습·퀴즈·미션·위치 찾기) / anthropic/claude-haiku-5.5 (AI_MODEL로 변경 가능)
- [ ] 모든 지원 모델을 자유롭게 사용하며 권장 목록은 추천용임을 확인
- [ ] 팀 전체 누적 $10 한도와 현재 사용액·남은 예산·선택 모델 단가 확인
- [ ] 학생이 자료 → API 키에서 키가 없으면 직접 발급 후 복사, Agent는 키를 발급·조회하지 않음
- [x] 서버가 환경변수 AI_GATEWAY_API_KEY에서 키를 읽음(주최 측 실행도 이 이름으로 키를 넣음), docker-compose.yml app에 `AI_GATEWAY_API_KEY: ${AI_GATEWAY_API_KEY:-}`
- [ ] 학생이 AI_GATEWAY_API_KEY를 로컬·배포 환경과 GitHub Secrets에 직접 설정, .env.example에는 이름만 기록 (배포 환경 설정됨: 배포 /api/status ai.configured=true. GitHub Secrets는 아직 비어 있음. .env.example은 이름만)
- [x] 서버에서 Gateway 호출, 접근 제한·예산 부족·지연·실패 처리 (src/server/ai.ts: ai_not_configured·ai_access_denied·ai_timeout·ai_failed 안내)
- [ ] 팀 예산 안의 작은 실제 요청으로 연결 확인
- 키 값을 제외한 설정·연결 확인 결과 / 준비 대기 사항: 배포 환경 키 설정 확인. GitHub Secrets 등록과 팀 사용액 확인은 학생 대기. E2E 저장소(nextjs/saas-starter)의 사전 생성 결과는 제거됨. 최초 분석에는 AI 키가 필요하고 같은 commit은 DB 결과 재사용

## 5. 핵심 기능 구현

- [x] (로그인이 있으면) 회원가입·로그인·로그아웃·역할별 권한 검사 구현, 아이디/비밀번호로 바로 로그인 가능 (/api/auth/*, scrypt 해시, httpOnly 세션 7일, 역할은 '학습자' 하나)
- [x] 로그인하지 않은 사람이 `/`를 열면 서비스 이름과 하는 일이 보임(`/`를 로그인 화면으로 보내거나 로그인 칸만 두지 않음)
- [x] 핵심 입력 → 실제 처리 → 결과 → 다음 행동 구현 (저장소 분석 → 기술·기능 목록 → 흐름·학습·퀴즈·미션·위치 찾기·학습 노트 → 내 학습 기록)
- [x] features의 동작 규칙·완료 조건과 대조, 새 기능은 features에 먼저 추가 (FR-01~FR-15 대조, 문서 개정 76d05b3 뒤 구현)
- [ ] 화면 다듬기(문구·배치·빈 화면 안내·시각)는 학생이 정한 방향 안에서 Agent가 만들어 보여 주고 학생이 고름
- [x] docs/scenarios.yaml의 메뉴·버튼 이름이 실제 화면과 같은지 확인, 화면 이름을 바꾸면 흐름·spec도 같은 commit에서 수정 (S8 '학습 노트 내려받기' 화면·spec을 문서에 맞춤, 1107bab)
- [x] 로그인 전에는 로그인 필요 화면이 열리지 않음, 없는 주소는 404(500 아님), 주 사용 플랫폼 화면 폭에서 깨지지 않음 (/demo/*·/learn/*는 307→/login, 분석·기록 API는 401, /mypage는 로그인 안내, 없는 주소 404, 1440px 확인)
- [x] 실패 처리와 의미 있는 테스트, 실행한 검사 결과 기록 (CI api-smoke: 로그인 전 401·잘못된 URL 400·없는 분석 404)
- [x] 의미 있는 변경 commit/push, CI·자동 배포 결과 확인
- 완료한 과업 / 검사 결과 / 남은 구현: FR-01~FR-08, FR-10~FR-15 구현(FR-09는 P1 제외) / 빈 DB docker E2E 8/8, CI 성공 / 없음(문서 대비)

## 6. 흐름 E2E

- [x] 키트 e2e/를 저장소 e2e/로 복사, platform에 맞는 project만 남김 (desktop 1440×900만, f70cf11)
- [x] 흐름마다 e2e/scenarios/<id>.spec.ts 하나(id와 같은 파일 이름), 파일마다 test 하나 (S1~S8)
- [x] steps를 같은 순서의 화면 조작으로 spec 본문에 옮김(API 호출 없음), 다른 역할 단계는 새 창(context)으로 로그인, 회원가입 이메일은 실행마다 다르게 (S1 이메일 s1-<시각>@example.com)
- [x] page.goto는 창마다 처음 한 번만(로그인 화면으로 가는 goto만 예외), 회원가입은 첫 화면에서 눌러 가거나 회원가입 주소 하나만, 도우미 함수는 test보다 위에 (S1은 '/' 한 번, S2~S8은 e2e/flows.ts 로그인 도우미의 '/login'만)
- [ ] 마지막에 expected 결과를 expect로 확인(화면이 열렸는지만 보지 않음)
- [x] test.skip·test.fixme·test.only·조건부 return·실패를 삼키는 try/catch 없음 (spec 검색 0건)
- [x] page.route·route.fulfill·routeFromHAR·routeWebSocket·addInitScript·화면 글자를 바꾸는 page.evaluate 없음 (spec 검색 0건)
- [x] 흐름에 필요한 선행 데이터는 앱 시드로, 업로드 자료는 e2e/fixtures/에 커밋, 앞 흐름이 만든 데이터에 기대지 않음 (시드 계정 + 흐름마다 저장소를 새로 분석)
- [x] AI 기능은 실제 응답을 기다려 확인, 흐름 하나가 로컬에서 1분 안 (당시 흐름당 1~5초. 사전 생성 결과는 제거됨. 최초 분석은 실제 AI 응답 대기, 같은 commit은 DB 결과 재사용)
- [x] viewport를 spec에서 바꾸지 않음, platform의 화면(both면 둘 다)에서 통과
- [x] globalSetup·storageState 등 playwright.config.ts에만 있는 설정에 기대지 않음
- [x] `docker compose down -v`, `docker compose up -d --build` 뒤 `npx playwright test`로 모든 흐름 통과 (빈 DB 앱에서 8/8, 19.4초)
- 흐름별 E2E 결과(통과 / 실패 단계와 이유): 680cda0 기준 S1~S8 모두 통과(로컬 빈 DB docker, CI scenarios 성공). 보강 여지: S5 '그 이유', S7 '수정된 코드는 보이지 않음'은 expect로 직접 확인하지 않음

## 7. 최종 검증

- [ ] 실제 배포에서 인증·핵심 과업·대표 실패 동작과 환경변수 확인
- [ ] 빈 DB의 docker 앱에서 platform 화면으로 모든 흐름 E2E 통과, spec이 steps·expected 그대로인지 다시 읽음, 프로젝트 검사, 비밀값 노출 확인
- [ ] 최종 기본 브랜치 push, 해당 commit의 CI 성공·자동 배포 확인
- [ ] 같은 배포 URL을 다시 저장해 대시보드 UP·최종 배포 commit 일치 확인
- [ ] 학생이 자료 → 제출 요건 화면에서 노란 줄이 없다고 확인
- [ ] 문제정의·구현 설계·최종 결과 링크와 미확인 사항 보고
- 검사 결과 / CI·배포 링크 / 최종 commit SHA:
- 흐름별 E2E 결과(통과 / 실패 단계와 이유):
- 배포 URL:
- 아직 못 한 일 / 제한 / 다음 행동:
