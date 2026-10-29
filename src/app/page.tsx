import { Brand } from "@/components/Brand";
import { AuthNav } from "@/components/auth/AuthNav";
import { QuizShowcase } from "@/components/landing/QuizShowcase";
import { RepoForm } from "@/components/landing/RepoForm";

export default function Home() {
  return (
    <div className="flex w-full flex-col items-start bg-paper">
      <header className="flex h-16 w-full shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:h-[76px] sm:px-9">
        <Brand />
        <AuthNav />
      </header>

      <div className="flex w-full shrink-0 flex-wrap items-center justify-between gap-4 bg-surface px-5 py-5 sm:px-10 xl:px-[72px] xl:py-8">
        <p className="text-sm font-bold text-brand-purple-ink">AI로 만든 내 프로젝트, 기능 하나부터 직접 설명할 수 있게</p>
        <p className="text-sm font-medium text-text-muted">기능 이해 · 코드 근거 · 개념 학습 · 직접 수정</p>
      </div>

      <section className="flex w-full flex-col items-start gap-12 px-5 pt-10 pb-16 sm:px-10 xl:flex-row xl:gap-[54px] xl:px-[72px] xl:pt-20 xl:pb-24">
        <div className="flex w-full min-w-0 flex-1 flex-col items-start gap-6">
          <span className="font-manrope text-sm font-bold text-brand-purple-ink">FROM FEATURE TO CODE</span>

          <h1 className="font-manrope text-[40px] leading-[48px] font-extrabold tracking-[-1.2px] sm:text-[56px] sm:leading-[66px] xl:text-[72px] xl:leading-[82px] xl:tracking-[-2.16px] text-text-primary">
            AI가 만든 코드를,
            <br />
            <span className="text-brand-purple">진짜 내 코드로.</span>
          </h1>

          <div aria-hidden className="h-2 w-[410px] max-w-full shrink-0 bg-brand-purple" />

          <p className="max-w-[600px] text-base leading-7 text-text-muted sm:text-lg sm:leading-8">
            “발표에서 이 부분 어떻게 만들었냐고 물으면?” 내 GitHub 프로젝트에서 익숙한 기능 하나를 골라 실제 파일과 코드를 따라가고,
            개념을 이해한 뒤 작은 수정까지 직접 해 보세요. CodeBack은 코드를 대신 고쳐 주지 않아요.
          </p>

          <RepoForm />
        </div>

        <QuizShowcase />
      </section>
    </div>
  );
}
