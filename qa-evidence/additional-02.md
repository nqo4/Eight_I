# 추가 결함 02: 인증 실패와 사용자 상태 구분

```text
담당 결함: #5, #8
기준 SHA / 기존 인증 작업 인계:
  - origin/main 7fed517 위의 브랜치 fix-auth-failure-state. main의 auth.ts는 수정 전 그대로였고, AuthNav.tsx는 cf0d996의 반응형 클래스를 유지한 채 수정함.
  - Eight_I-owner-a-takeover의 auth.ts 변경(epoch·invalidateUser)은 main에 없어 인계본으로 보지 않음. 합칠 때 함께 조율 필요.

수정 파일: src/lib/auth.ts, src/components/auth/AuthNav.tsx (Session.tsx·서버·API는 수정하지 않음)

정상 미인증과 통신 실패의 구분 기준:
  - /api/auth/me가 200 + user:null → 미인증(로그아웃 상태).
  - 연결 실패 또는 200이 아닌 응답 → 확인 실패. 이미 확인한 상태(로그인·미인증)는 그대로 유지.
    처음 확인부터 실패하면 undefined(확인 전)로 두고 헤더에 '로그인 상태를 확인하지 못했어요' + '다시 확인'.
  - 늦게 도착한 /me 응답은 요청 번호로 무시(로그아웃 뒤 사용자가 되살아나지 않음).

사용자 상태 / 서버 상태 / 복구 동작:
  - 로그아웃 200: 화면 사용자 비움 → 홈 이동.
  - 로그아웃 HTTP 오류: 사용자 유지, '로그아웃하지 못했어요. 다시 눌러 주세요.' 표시, 버튼 다시 사용 가능.
  - 로그아웃 응답 유실: /api/auth/me로 재확인. 미인증이면 성공 처리, 아니면
    '로그아웃됐는지 확인하지 못했어요…' 표시하고 사용자 유지.
  - 처리 중에는 버튼 비활성화('로그아웃 중')로 중복 요청 방지.

실제 결과:
  - 원본 auth.ts를 통제된 fetch 응답으로 직접 호출: PASS 11/11
    (최초 확인 실패 2, 재확인 복구, 로그인 중 일시 실패 2, 로그아웃 500·유실 2종·성공, 늦은 /me 무시, 실제 미인증).
  - eslint(두 파일) 통과. next typegen 뒤 tsc --noEmit 통과(오류 0).
  - 미검증: 실제 브라우저 화면 조작(헤더 문구·버튼 표시), 실제 서버 세션과의 E2E.

Session 소비 계약 변경 유무 / 합의 사항:
  - useCurrentUser() 반환(User | null | undefined)은 그대로. 확인 실패 표시는 새 useAuthCheckFailed()로 분리.
  - refreshUser() 반환형이 User | null | undefined로 넓어짐(호출처는 AuthNav·useCurrentUser뿐).

남은 일:
  - 성원 A2(owner-a-takeover의 epoch 기반 계정 전환)와 auth.ts를 합칠 때 두 요청 번호 방식을 하나로 정리.
  - 화면 확인: 로그인 상태에서 /api/auth/logout만 실패시켜 오류 문구·재시도 확인.
```
