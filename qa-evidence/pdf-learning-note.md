# 학습 노트 PDF 수정 검증

## 범위

- 기준: 최신 main `896e021`을 받은 `backup/before-rollback-0620`.
- 반영 대상은 백업 브랜치뿐이며 main/dev 반영·배포는 하지 않는다.
- 기존 사용자 작업본·DB·세션·비밀값을 변경하지 않았다.

## 수정

- 화면과 PDF가 같은 `techViews()`를 사용한다. 기존 화면의 이전 형식 fallback도 보존했다.
- 기술의 역할·개념·근거, 학습 개념과 설계 이유의 파일·라인 및 AI 추정 표시를 PDF에 포함했다.
- 설명과 그 근거를 같은 페이지에 배치할 공간을 먼저 계산해 근거만 다음 페이지에 남는 현상을 줄였다.
- 샘플의 해시/암호화·JWT 서명·쿠키 보안·비밀번호 검증 대상·계정 삭제 복구 설명을 실제 snapshot 코드와 대조해 정정했다.
- 학습 생성 지시도 같은 과장·문맥 혼동을 피하도록 보완했다. 프롬프트 변경만으로 모든 새 AI 설명이 정확해진다고 보장하지 않는다.
- 동일 저장소·commit·기능 근거의 보관 샘플은 기존 캐시가 있어도 검토한 설명을 반환한다. 기술 설명은 기능 목록까지 동일한 경우에만 갱신된 보관 설명을 사용한다. DB 행을 덮어쓰거나 추가 AI를 호출하지 않는다.
- S8은 첫 기술 경로뿐 아니라 화면 전체 기술 이름과 PDF 기술 항목 수를 비교하도록 보강했다.

## 실제 출력 결과

같은 saas-starter commit `6e33e58b1e553a41fe22e6b941a7229a002de361`을 입력했다.

| 조건 | 수정 전 | 수정 후 |
|---|---|---|
| 화면 기술 12개와 PDF 일치 | FAIL: PDF 6개, 화면 기술 7개 누락 | PASS: 12개 모두 존재 |
| 화면에 없는 unconfirmed Vercel 제외 | FAIL: 포함 | PASS: 제외 |
| 개념·설계 이유별 파일/라인 | 미출력 | PASS: 입력 자료의 근거 모두 출력 |
| 실제 PDF 전 페이지 시각 확인 | 3페이지 확인 | 5페이지 모두 확인, 내용 겹침·잘림 없음 |

추가 오프라인 실행:

```json
{
  "existingCacheCorrected": true,
  "storedDataUnchanged": true,
  "unrelatedRepositoryUnchanged": true,
  "differentFeatureUnchanged": true,
  "technologies": 12,
  "conceptAndDesignReferencesPresent": true,
  "fallbackMatchesScreen": true,
  "externalRequests": 0
}
```

원본 `getAnalysis`, `getLesson`, `getNoteInput`, `renderLearningNote`를 사용했다. 저장소는 원본 MemoryStore이고 이전 학습 자료를 넣어 실행했다. 외부 fetch는 호출 횟수를 세고 실패하도록 막았으며 실제 호출은 0이었다. 기존 DB나 유료 AI 요청은 사용하지 않았다.

## 코드·자료 검사

- 샘플 전체 CodeReference 196개의 경로·범위·snippet·commit 일치.
- snapshot과 저장소/commit/기능 식별자는 보존. analysis 변경은 bcryptjs 역할·개념, jose 개념 세 필드뿐.
- `next typegen`, `tsc --noEmit`, 변경 TS/TSX lint 통과.
- S8은 기본 ESLint 제외 대상이라 최초 검사에 ignored 경고가 있었다. `eslint --no-ignore e2e/scenarios/S8.spec.ts`로 실제 검사했고 통과했다.
- 타입 검사에서 샘플 생성기의 `Record<string, unknown>`과 강화된 artifact 타입 불일치가 발견됐다. `DemoData["artifacts"]`를 재사용하도록 수정한 뒤 최종 타입·린트 종료 코드 0.
- `git diff --check` 통과. LSP 서버 미설치이므로 LSP 통과라고 주장하지 않는다.
- S1~S8 전체 E2E와 실배포 수동 브라우저 검증은 실행하지 않았다. 이 문서의 PASS는 위에 명시한 실제 PDF 출력·오프라인 읽기 경로·정적 검사의 범위다.

## 증거 위치

작업 PC의 `C:/Users/user/Desktop/Sumtech/.omo/pdf-backup-fix-20261030/`:

- `before/`: 수정 전 PDF, 텍스트, 3개 페이지 이미지, 좌표 기록
- `after/`: 최종 PDF, 텍스트, 5개 페이지 이미지, 좌표 기록
- `cached-note.pdf`: 이전 캐시 입력에서 생성한 수정 PDF
- `notepad.md`: 실행 명령과 변경·정리 기록

새 AI 생성의 실제 응답 품질은 별도 검증 대상이다. 다른 저장소나 다른 commit의 기존 생성 문장을 임의로 덮어쓰지 않는다.
