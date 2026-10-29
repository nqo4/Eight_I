import type { ReactNode } from "react";
import { Brand } from "@/components/Brand";

type AuthShellProps = {
  step: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  children: ReactNode;
};

export function AuthShell({ step, eyebrow, title, description, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-paper">
      <header className="flex h-16 w-full shrink-0 items-center justify-between border-b border-line bg-surface px-4 sm:h-[76px] sm:px-[36px]">
        <Brand />
        <span className="font-manrope text-[10px] leading-[16px] font-bold whitespace-pre text-status-green hidden sm:inline">{`●  INTERACTIVE PROTOTYPE`}</span>
      </header>

      <main className="flex w-full flex-1 flex-col items-center justify-center gap-10 px-5 py-10 sm:px-10 sm:py-14 xl:flex-row xl:gap-[96px] xl:px-[72px] xl:py-[80px]">
        <section className="flex w-full max-w-[520px] flex-col items-start gap-[20px] xl:w-[520px] xl:max-w-none xl:shrink-0">
          <div className="flex items-center gap-[10px]">
            <span className="rounded-12 bg-brand-purple px-[10px] py-[6px] text-[9px] leading-[14px] font-bold whitespace-nowrap text-surface">
              {step}
            </span>
            <span className="font-manrope text-[11px] leading-[16px] font-bold whitespace-nowrap text-brand-purple">{eyebrow}</span>
          </div>
          <h1 className="font-manrope text-[36px] leading-[44px] font-extrabold tracking-[-1px] sm:text-[52px] sm:leading-[62px] sm:tracking-[-1.56px] text-text-primary">{title}</h1>
          <div className="h-[8px] w-[200px] shrink-0 bg-brand-purple sm:w-[300px]" />
          <p className="w-full max-w-[480px] text-[15px] leading-[27px] text-text-muted">{description}</p>
        </section>

        <section className="flex w-full max-w-[440px] flex-col items-start gap-[24px] rounded-16 border border-line bg-surface px-6 py-8 sm:px-[36px] sm:py-[40px] xl:w-[440px] xl:max-w-none xl:shrink-0">
          {children}
        </section>
      </main>
    </div>
  );
}
