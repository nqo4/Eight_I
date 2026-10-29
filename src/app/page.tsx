import { Brand } from "@/components/Brand";
import { AuthNav } from "@/components/auth/AuthNav";
import { RepoForm } from "@/components/landing/RepoForm";
import { learningSteps } from "@/lib/demo";

export default function Home() {
  return (
    <div className="flex w-full flex-col items-start bg-paper">
      <header className="flex h-[76px] w-full shrink-0 items-center justify-between border-b border-line bg-surface px-9">
        <Brand />
        <AuthNav />
      </header>

      <div className="flex w-full shrink-0 flex-wrap items-center justify-between gap-4 bg-surface px-[72px] py-8">
        <p className="text-sm font-bold text-brand-purple-ink">AI로 만든 내 프로젝트, 기능 하나부터 직접 설명할 수 있게</p>
        <p className="text-sm font-medium text-text-muted">1 기능 이해 ─ 2 코드 근거 ─ 3 개념 학습 ─ 4 직접 수정</p>
      </div>

      <section className="flex w-full items-start gap-[54px] px-[72px] pt-20 pb-24">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-6">
          <span className="font-manrope text-sm font-bold text-brand-purple-ink">FROM FEATURE TO CODE</span>

          <h1 className="font-manrope text-[72px] leading-[82px] font-extrabold tracking-[-2.16px] text-text-primary">
            AI가 만든 코드를,
            <br />
            <span className="text-brand-purple">진짜 내 코드로.</span>
          </h1>

          <div aria-hidden className="h-2 w-[410px] max-w-full shrink-0 bg-brand-purple" />

          <p className="max-w-[600px] text-lg leading-8 text-text-muted">
            “발표에서 이 부분 어떻게 만들었냐고 물으면?” 내 GitHub 프로젝트에서 익숙한 기능 하나를 골라 실제 파일과 코드를 따라가고,
            개념을 이해한 뒤 작은 수정까지 직접 해 보세요. CodeBack은 코드를 대신 고쳐 주지 않아요.
          </p>

          <RepoForm />
        </div>

        <div className="mt-10 flex w-[480px] shrink-0 flex-col items-start gap-4 rounded-16 bg-text-primary p-7 text-surface">
          <div className="flex w-full items-center justify-between gap-4">
            <span className="font-mono text-sm text-surface/70">학습 순서</span>
            <span className="text-sm font-bold text-accent-lime">● 실제 파일과 행 번호로 진행</span>
          </div>
          <ol className="flex w-full flex-col divide-y divide-surface/10">
            {learningSteps.slice(1).map((step) => (
              <li key={step.href} className="flex items-start gap-4 py-3.5">
                <span className="font-mono text-sm text-accent-lime">{step.number}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-bold">{step.title}</span>
                  <span className="text-sm text-surface/70">{step.caption}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
