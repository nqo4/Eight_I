// 홈 오른쪽 예시: 실제 학습 화면의 이해도 퀴즈(FR-07)를 한 문항 보여 준다.
// 내용은 샘플 저장소(nextjs/saas-starter) 로그인 기능 퀴즈에서 가져왔다. 장식용 그림이라 화면 읽기 프로그램에는 요약 한 줄만 읽힌다.

const question = "login.tsx의 비밀번호 minLength를 6으로 바꾸면 어떻게 될까?";
const choices = [
  "서버도 6자 이상만 허용해 화면과 서버가 같아진다",
  "화면은 6자로 검사하지만 서버는 8자 미만을 거부한다",
  "비밀번호가 6자면 로그인이 바로 성공한다",
  "아무 변화 없이 8자 이상만 입력할 수 있다",
];
const picked = 1;
const keys = "ABCD";

export function QuizShowcase() {
  return (
    <figure className="relative mr-16 h-[560px] w-[560px] shrink-0">
      <figcaption className="sr-only">
        예시: 샘플 저장소의 로그인 기능 퀴즈. 비밀번호 길이 검사를 바꿨을 때 화면과 서버가 어떻게 동작하는지 고르고, 정답과 코드 근거를 확인한다.
      </figcaption>

      {/* 배경 원 */}
      <div aria-hidden className="absolute top-1/2 left-1/2 size-[560px] -translate-1/2 rounded-full border border-brand-purple/15" />

      <div aria-hidden className="absolute inset-x-8 top-8 bottom-10">
        <div className="flex h-full rotate-[1deg] flex-col gap-3.5 rounded-16 border border-line bg-surface px-7 pt-7 pb-6 shadow-[0_30px_60px_rgba(6,2,22,0.18)]">
          <div className="flex items-center justify-between">
            <span className="font-manrope text-xs font-bold tracking-wider text-brand-purple-ink">QUIZ · 1 / 3</span>
            <span className="text-xs font-bold text-text-muted">이메일·비밀번호로 로그인</span>
          </div>
          <p className="text-lg leading-7 font-bold text-balance break-keep text-text-primary">{question}</p>

          <ul className="flex flex-col gap-2">
            {choices.map((c, i) => {
              const active = i === picked;
              return (
                <li
                  key={c}
                  className={`flex min-h-10 items-center gap-2.5 rounded-8 border px-3 py-2 ${
                    active ? "border-brand-purple bg-brand-purple-soft" : "border-line bg-surface"
                  }`}
                >
                  <span
                    className={`rounded-12 px-2 py-0.5 text-[11px] font-bold ${
                      active ? "bg-brand-purple text-surface" : "bg-brand-purple-soft text-brand-purple-ink"
                    }`}
                  >
                    {keys[i]}
                  </span>
                  <span className="text-[13px] leading-5 break-keep text-text-primary">{c}</span>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-1.5 rounded-8 bg-brand-purple-soft p-3.5">
            <p className="text-sm font-bold text-status-green-ink">✓ 정답이에요</p>
            <p className="text-[13px] leading-5 break-keep text-text-primary">
              화면의 minLength는 브라우저 검사일 뿐이고, 서버의 signInSchema가 .min(8)로 다시 검사해요.
            </p>
            <p className="font-mono text-xs text-text-muted">참고: app/(login)/actions.ts:47-50</p>
          </div>
        </div>
      </div>

    </figure>
  );
}
