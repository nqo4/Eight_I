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
      <header className="flex h-[76px] w-full shrink-0 items-center justify-between border-b border-line bg-surface px-[36px]">
        <Brand />
        <span className="font-manrope text-[10px] leading-[16px] font-bold whitespace-pre text-status-green">{`●  INTERACTIVE PROTOTYPE`}</span>
      </header>

      <main className="flex w-full flex-1 items-center justify-center gap-[96px] px-[72px] py-[80px]">
        <section className="flex w-[520px] shrink-0 flex-col items-start gap-[20px]">
          <div className="flex items-center gap-[10px]">
            <span className="rounded-12 bg-brand-purple px-[10px] py-[6px] text-[9px] leading-[14px] font-bold whitespace-nowrap text-surface">
              {step}
            </span>
            <span className="font-manrope text-[11px] leading-[16px] font-bold whitespace-nowrap text-brand-purple">{eyebrow}</span>
          </div>
          <h1 className="font-manrope text-[52px] leading-[62px] font-extrabold tracking-[-1.56px] text-text-primary">{title}</h1>
          <div className="h-[8px] w-[300px] shrink-0 bg-brand-purple" />
          <p className="w-[480px] text-[15px] leading-[27px] text-text-muted">{description}</p>
        </section>

        <section className="flex w-[440px] shrink-0 flex-col items-start gap-[24px] rounded-16 border border-line bg-surface px-[36px] py-[40px]">
          {children}
        </section>
      </main>
    </div>
  );
}
