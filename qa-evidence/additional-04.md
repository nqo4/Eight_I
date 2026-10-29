# 추가 결함 04: GitHub 수집과 코드 연결 근거

```text
담당 결함: #6, #12
기준 SHA / 기존 서버 작업 인계: fa0bac8 (B1~B5 서버 수정 "Server fixes from the B1-B5 review" 포함본 위에서 작업)
수정 파일: src/server/github.ts, src/server/evidence.ts (service.ts는 수정하지 않음)

원본 HTTP 상태 / 의도적 제외와 실패의 구분:
  - fetchRaw()가 비정상 응답을 모두 null(제외)로 처리하던 것을 나눔.
  - 404: 받을 파일이 없음 → 기존처럼 제외(raw_not_found 로그).
  - 429·403(한도)·401·5xx: 기존 checkStatus()로 github_rate_limited / github_auth_failed / github_unavailable을 던짐.
  - 연결 실패: 기존 request()가 github_unavailable을 던짐(변경 없음).
  - 본문 수신 중 끊김: 새로 github_unavailable로 변환.
  - 바이너리·민감·잠금 파일·크기 한도: 기존 정책대로 제외(변경 없음).
  - 하나라도 실패하면 남은 파일 요청을 멈춤(mapLimit). 재시도·timeout은 바꾸지 않음.

캐시 저장·재사용 결과:
  - 수집이 실패하면 AI 호출과 saveAnalysis 전에 오류가 나서, 해당 commit의 분석이 저장되지 않음.
  - 장애가 사라진 뒤 같은 commit을 다시 요청하면 그 파일을 포함해 분석·저장됨.
  - 정상 분석이 저장된 뒤의 재요청은 파일·AI를 다시 요청하지 않고 저장본을 씀.
  - 사전 생성 샘플(savePrecomputed)은 fetchSnapshot보다 먼저 처리되므로 영향 없음.

주석·문자열·실제 import별 판정 결과:
  - SnapshotIndex.imports()가 원문 대신 maskNonCode()로 주석과 문자열·템플릿·정규식의 글자를 지운 텍스트에서 import를 찾음.
    경로 글자는 원문의 같은 위치에서 읽음.
  - 다음은 연결 근거로 보지 않음: 줄 주석, 블록 주석, 문자열(이스케이프 포함), 템플릿 글자, 식별자 일부(myrequire, obj.require).
  - 다음은 계속 인식함: 템플릿 ${} 안의 import(), 정적 import, import type, 여러 줄 import, 동적 import, require,
    export * from, export {} from, 별칭 경로 @/·~/.
  - 확인하지 못한 연결은 기존처럼 inferred로 남음(getFlow의 판정 계약은 변경 없음).
  - 정확한 파서가 아니라서, 판정이 애매하면 연결을 놓치는(inferred) 쪽으로 처리됨.
    예: JSX 글의 작은따옴표는 그 줄에서만 문자열로 처리됨.
  - 이 작업은 import 근거만 다룸. 함수 호출이나 실행 순서를 증명하지는 않음.

실제 결과: PASS (22/22)
  - 검증 방법: GitHub·AI 응답만 가짜 fetch로 대신하고, 메모리 저장소에서 실제 analyzeRepository·SnapshotIndex 경로를 실행함.
  - #6 검증 조건:
    - 503·429·연결 실패·본문 끊김에서 각각 재시도 가능한 오류가 남, AI 호출 0회, 캐시 없음.
    - 장애 제거 뒤 재요청하면 해당 파일이 포함됨.
    - 바이너리·.env·404 파일은 제외됨.
    - 정상 캐시를 재사용하면 파일·AI 요청이 0회임.
  - #12 검증 조건: 위 판정 결과의 사례 15개.
  - 수정 전 코드에서 같은 검사를 돌리면 8/22 PASS.
    - 503 실패 뒤 불완전한 분석이 캐시로 남아, 이후 요청이 모두 그 캐시를 씀.
    - 주석·문자열 import를 연결로 인정함.
  - tsc --noEmit, eslint src/server 통과.
  - 미검증:
    - 실제 GitHub 장애 상황.
    - Postgres 저장소(메모리 저장소로만 확인했고, 저장 경계는 같은 코드 경로임).
    - 실제 AI가 만든 흐름의 verified 표시 변화.

기존 B1~B5와의 계약 및 변경 충돌:
  - B1의 GitHub 오류 로그(logGithubFailure)와 오류 코드를 그대로 재사용함. 새 ErrorCode·스키마·패키지는 없음.
  - 공용 타입·프런트·e2e·docs는 변경하지 않음.

남은 일:
  - 이번 수정 전에 이미 저장된 불완전한 분석은 그대로 남아 있음.
    - 대상: GitHub 장애 중 분석된 commit. 로그에 github_unavailable / github_rate_limited가 없던 시절이라 식별이 어려움.
    - 공유 DB의 캐시는 임의로 삭제하지 않았음.
    - 필요하면 담당자가 stats.skipped_by_filter가 비정상적으로 큰 행을 확인함.
```
