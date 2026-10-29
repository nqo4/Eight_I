# 출처 목록 (docs/problem.yaml의 sources와 1:1)

문서에 적은 모든 수치는 아래 출처에서 2026-10-29에 직접 열어 확인했다. 팀이 직접 잰 수치는 아직 없다.
새 출처를 넣을 때는 (1) 열리는 URL (2) 어떤 주장을 뒷받침하는지 (3) 확인 날짜를 같이 적는다. PDF 원문은 저장소에 넣지 않고 링크만 둔다.

| ID | 출처 | URL | 뒷받침하는 내용 | 확인일 |
|---|---|---|---|---|
| SRC-1 | KayserDocs, "바이브 코딩하는 사람, 뭘 물어야 하나 — 면접관을 위한 전체 그림과 판별 전략" (블로그, 개인 경험) | https://dorumugs.github.io/coding/%EB%B0%94%EC%9D%B4%EB%B8%8C%EC%BD%94%EB%94%A9_%EB%A9%B4%EC%A0%91_%EC%A0%84%EC%B2%B4%EA%B7%B8%EB%A6%BC_%ED%8C%90%EB%B3%84%EC%A0%84%EB%9E%B5/ | 면접관이 겪는 현상: "물어보면 자기 코드를 설명 못 하는 사람이 섞여 있다", "산출물과 실력 사이의 연결선이 끊어졌다" | 2026-10-29 |
| SRC-2 | 한국직업능력연구원, KRIVET Issue Brief 307호 "AI 시대의 학습에 대한 대학생의 인식과 불안" (2025-09-25) | https://www.krivet.re.kr/kor/sub.do?menuSn=14&pstNo=PB0000000598 | 2024년 1학기 생성형 AI 이용 경험 대학생 726명 조사. 효율 기대와 의존·역량 저하 불안이 공존 | 2026-10-29 |
| SRC-3 | 조선일보, "온라인 시험 중 자꾸 딴곳을… 연세대 50여명 'AI 커닝' 파문" (2025-11-09) | https://www.chosun.com/national/national_general/2025/11/09/H4NZNXFVJNHBXCBXXYXZFVWUZI/ | SRC-2 조사 인용: 726명 중 91.7% 과제·자료 검색에 AI 활용; 대학 131곳 중 71.1% AI 가이드라인 미비 | 2026-10-29 |
| SRC-4 | Stack Overflow, 2025 Developer Survey — AI 섹션 | https://survey.stackoverflow.co/2025/ai | 66% "AI solutions that are almost right, but not quite"가 최대 불만; 45% "Debugging AI-generated code is more time-consuming" | 2026-10-29 |
| SRC-5 | Anthropic Research, "How AI assistance impacts the formation of coding skills" (2026) | https://www.anthropic.com/research/AI-assistance-coding-skills | 개발자 52명 무작위 대조 실험. AI 도움 집단 퀴즈 점수 17% 낮음(학점 두 단계), 속도 이득 비유의, 설명 요청 용도는 예외 | 2026-10-29 |
| SRC-6 | Fawzy, Tahir, Blincoe, "Vibe Coding in Practice: Motivations, Challenges, and a Future Outlook — a Grey Literature Review", arXiv:2510.00328 (2025-09-30, CC BY 4.0) | https://arxiv.org/abs/2510.00328 | 101개 실무자 출처·518개 행동 기록 분석. 동기 속도 62%·접근성 14%·학습 11%; 경험 즉시 성공 64%·코드 붕괴·포기 11%; 품질 인식 '빠르지만 결함' 68%·'취약' 19%; 검증 관행 테스트 생략 36%·확인 없는 신뢰 18%·AI에 위임 10%·재프롬프트 5%; 인용 연구 Zi et al. CS1 학생 LLM 코드 이해 성공률 32.5%; '취약한 개발자' 개념과 도구 권고(walkthrough·다이어그램·인라인 설명·안내된 디버깅 발판) | 2026-10-29 |

## 쓰지 않은 것
- 출처가 없는 추정 수치(예: "대부분의 학생이…")는 문서에 넣지 않았다.
- SRC-6의 수치는 실무자가 온라인에 쓴 경험담을 분류한 비율이라, 전체 바이브코더 모집단의 비율이 아니다(논문 6장 외부 타당성). 문서에서도 "경험 기록의 n%"로 적었다.
- 팀원 경험(E1·E2)은 팀 대화 기록이 출처이며, 발표에서 인용하려면 발화자 허락이 필요하다([사람 확인] 표시).
