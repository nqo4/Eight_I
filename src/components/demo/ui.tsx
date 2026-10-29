import Link from "next/link";
import type { ReactNode } from "react";
import type { CodeReference, Overview } from "@/server/types";
import type { ApiError } from "@/components/session/Session";

export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple";
export const secondaryBtn = `inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-8 border border-line bg-surface px-4 py-2 text-sm font-bold text-text-primary transition-colors hover:border-brand-purple disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

// FR-04 '사용한 기술'. 예전 분석(technologies 없음)은 설정 파일로 확인한 stack으로 보여 준다.
export type TechView = { name: string; role: string | null; concept: string | null; references: CodeReference[] };

export function techViews(o: Overview): TechView[] {
  if (o.technologies && o.technologies.length > 0) return o.technologies;
  return o.stack.map((s) => ({
    name: s.name,
    role: s.note,
    concept: null,
    references: s.status === "confirmed" && s.evidence ? [s.evidence] : [],
  }));
}

export function refLabel(r: CodeReference) {
  return `${r.path} (${r.start_line}–${r.end_line}행)`;
}

export function stripNumber(title: string) {
  return title.replace(/^\s*\d+\s*[.)·:-]?\s*/, "");
}

export function seededOrder(n: number, seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Array.from({ length: n }, (_, i) => i).sort((a, b) => ((a * 7919 + h) % 97) - ((b * 7919 + h) % 97));
}

export function CodeExcerpt({ r, highlight = false }: { r: CodeReference; highlight?: boolean }) {
  return (
    <figure
      data-testid="code-excerpt"
      className={`min-w-0 max-w-full overflow-hidden rounded-12 bg-text-primary text-surface ${highlight ? "ring-2 ring-yellow-mark" : ""}`}
    >
      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-surface/10 px-5 py-2.5 font-mono text-xs text-surface/70">
        <span>{refLabel(r)}</span>
        <span>{r.commit_sha.slice(0, 7)}</span>
      </figcaption>
      <pre className="max-h-96 overflow-auto px-5 py-3 font-mono text-sm leading-6">
        {r.snippet.split("\n").map((line, i) => (
          <div key={i}>
            <span className="mr-4 inline-block w-10 select-none text-right text-surface/40">{r.start_line + i}</span>
            {line}
          </div>
        ))}
      </pre>
    </figure>
  );
}

export function Loading({ slow }: { slow?: boolean }) {
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-text-muted">
      <span aria-hidden="true" className="size-2 rounded-full bg-brand-purple motion-safe:animate-pulse" />
      {slow ? "AI가 내용을 만드는 중이에요. 처음에는 수십 초 걸릴 수 있어요…" : "불러오는 중…"}
    </p>
  );
}

export function ErrorBox({ error, onRetry, home }: { error: ApiError; onRetry?: () => void; home?: boolean }) {
  return (
    <div role="alert" className="flex w-full flex-col gap-3 rounded-12 bg-status-red-soft p-4 text-status-red">
      <p className="font-bold">{error.message}</p>
      {((error.retryable && onRetry) || home || error.code === "login_required") && (
        <div className="flex flex-wrap gap-2">
          {error.retryable && onRetry && (
            <button type="button" className={secondaryBtn} onClick={onRetry}>
              다시 시도
            </button>
          )}
          {error.code === "login_required" && (
            <Link href="/login" className={secondaryBtn}>
              로그인하기
            </Link>
          )}
          {home && (
            <Link href="/" className={secondaryBtn}>
              홈으로
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-manrope text-xs font-bold tracking-wider text-brand-purple-ink">{children}</p>;
}
