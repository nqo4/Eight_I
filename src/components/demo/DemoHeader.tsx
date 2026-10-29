"use client";

import { AuthNav } from "@/components/auth/AuthNav";
import { Brand } from "@/components/Brand";
import { useSession } from "@/components/session/Session";

export function DemoHeader() {
  const { analysis } = useSession();
  return (
    <header className="flex h-[76px] w-full shrink-0 items-center justify-between border-b border-line bg-surface px-9">
      <Brand />
      <div className="flex items-center gap-6">
        {analysis && (
          <div className="flex items-center gap-4 text-sm font-bold">
            <span className="text-text-primary">현재 프로젝트 · {analysis.repository.id}</span>
          </div>
        )}
        <span aria-hidden className="h-5 w-px bg-line" />
        <AuthNav />
      </div>
    </header>
  );
}
