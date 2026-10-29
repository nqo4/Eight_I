"use client";

import { Brand } from "@/components/Brand";
import { useSession } from "@/components/session/Session";

export function DemoHeader() {
  const { analysis } = useSession();
  return (
    <header className="flex h-[76px] w-full shrink-0 items-center justify-between border-b border-line bg-surface px-9">
      <Brand />
      {analysis && (
        <div className="flex items-center gap-4 text-sm font-bold">
          <span className="text-text-primary">현재 프로젝트 · {analysis.repository.id}</span>
          {analysis.mode === "demo" && (
            <span className="flex items-center gap-1.5 text-status-green-ink">
              <span aria-hidden="true">●</span>
              <span>데모 모드</span>
            </span>
          )}
        </div>
      )}
    </header>
  );
}
