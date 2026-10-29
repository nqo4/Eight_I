"use client";

import { AuthNav } from "@/components/auth/AuthNav";
import { Brand } from "@/components/Brand";
import { useSession } from "@/components/session/Session";

export function DemoHeader() {
  const { analysis } = useSession();
  return (
    <header className="flex h-16 w-full shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:h-[76px] sm:px-9">
      <Brand />
      <div className="flex min-w-0 items-center gap-6">
        {analysis && (
          <div className="hidden items-center gap-4 text-sm font-bold xl:flex">
            <span className="text-text-primary">현재 프로젝트 · {analysis.repository.id}</span>
          </div>
        )}
        <span aria-hidden className="hidden h-5 w-px bg-line xl:block" />
        <AuthNav />
      </div>
    </header>
  );
}
