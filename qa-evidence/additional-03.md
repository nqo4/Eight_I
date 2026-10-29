# 추가 결함 #7·#10 검증 기록

```text
담당 결함: #7, #10
기준 SHA / 기존 Session·Mission 변경 인계: 6743696 (main). Session.tsx·MissionGrader.tsx에 진행 중인 다른 변경 없음.
수정 파일: src/components/session/Session.tsx, src/components/demo/MissionGrader.tsx
환경: 로컬 docker compose(빈 DB 아님, 시드 계정 student@example.com), http://localhost:3000, 앱 내장 브라우저

실패 전 상태 → 실패 상태 → 복구 상태:
  #7  로그인 → localStorage 'codeback:v1:last'를 없는 분석 ID로 바꿈 → /demo/overview에
      "이전에 분석한 저장소(nextjs/saas-starter)를 다시 불러오지 못했어요…" 표시
      → 같은 페이지에서(새로고침 없이) 헤더 '내 학습 기록' → '분석 결과 보기'
      → /demo/overview에 nextjs/saas-starter, commit 6e33e58… 표시, 이전 오류 문구 없음
  #10 F1 미션에 minLength={10} 코드 제출 → 100점 표시(채점 중 입력란 readOnly=true 확인)
      → 코드 끝에 비밀값 모양 줄을 추가해 '다시 채점하기' → 서버가 invalid_request로 거절(AI 호출 없음)
      → 오류 안내만 보이고 이전 100점 카드는 보이지 않음, 입력한 코드 그대로, 버튼은 '다시 채점하기'

이전 오류 / 이전 점수의 처리:
  #7  setAnalysis(정상 분석을 받은 뒤에만 호출)에서 loadError를 지움. 복원 실패(ensure)의 오류 설정은 그대로.
  #10 제출을 시작할 때 화면의 grade를 지움. 버튼 이름은 '한 번이라도 채점 성공' 여부(graded)로 정함.

입력 코드 및 서버 기록 보존 근거:
  실패 후 textarea 값이 제출 전과 같음. GET /api/me/records에서 F1 mission_best_score=100 유지.
  채점 뒤에도 analyzed_at·last_viewed_at 변화 없음(fa0bac8의 B5 수정과 함께 확인).

실제 결과:
  분석 복원 실패 후 내 학습 기록에서 정상 분석 열기: PASS
  분석 복원 실패 후 홈에서 정상 분석 열기: 미검증(같은 setAnalysis 경로. 이 시점 PC의 GitHub 무인증 한도 소진으로 분석 요청 불가)
  정상 복구 시도도 실패 → 실제 실패 안내 유지: 미검증(코드상 ensure가 오류를 그대로 설정)
  채점 성공 → 코드 변경 → 재채점 실패: PASS
  실패 후 재채점 성공: 미검증(추가 AI 호출이 필요해 생략. 성공 경로는 첫 채점과 같음)

역할 2와의 인증 계약 확인: auth.ts·인증 응답은 건드리지 않음. login_required 오류 표시 경로도 그대로.
AI 비용: 채점 1회(약 $0.002).
남은 일: 위 미검증 3건은 GitHub 한도가 풀린 뒤 또는 S1~S8 실행 때 확인.
```
