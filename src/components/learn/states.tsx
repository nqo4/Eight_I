"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

type LoadState<T> = { data: T | null; error: ApiError | null; loading: boolean; reload: () => void };

// API를 부르고 로딩·오류 상태를 돌려준다. key가 바뀌면 다시 부른다.
export function useLoad<T>(key: string, load: () => Promise<T>): LoadState<T> {
  const [state, setState] = useState<{ key: string; data: T | null; error: ApiError | null }>({
    key: "",
    data: null,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    load()
      .then((data) => alive && setState({ key, data, error: null }))
      .catch((err) =>
        alive &&
        setState({
          key,
          data: null,
          error: err instanceof ApiError ? err : new ApiError("internal_error", "문제가 생겼어요.", true),
        }),
      );
    return () => {
      alive = false;
    };
    // load는 key로 구분한다(화면마다 새로 만든 함수라 의존성에서 뺀다)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const current = state.key === key;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: !current || (!state.data && !state.error),
    reload,
  };
}

export function Loading({ message }: { message: string }) {
  return (
    <div role="status" className="flex w-full items-center gap-[12px] rounded-12 border border-line bg-surface px-[24px] py-[20px]">
      <span className="size-[14px] shrink-0 animate-spin rounded-full border-2 border-brand-purple border-t-transparent" />
      <div className="flex flex-col gap-[2px]">
        <p className="text-[12px] leading-[18px] font-bold text-text-primary">{message}</p>
        <p className="text-[10px] leading-[16px] text-text-muted">처음 여는 내용은 AI가 실제 코드를 읽고 만들어서 10~20초 걸릴 수 있어요.</p>
      </div>
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: ApiError; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex w-full items-center justify-between gap-[12px] rounded-12 border border-line bg-surface px-[24px] py-[20px]">
      <p className="text-[12px] leading-[18px] font-bold text-text-primary">{error.message}</p>
      {error.retryable && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-8 bg-brand-purple px-[14px] py-[8px] text-[11px] font-bold text-surface"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

// 실제 파일에서 잘라 온 코드 발췌. 줄 번호는 원래 파일의 라인 번호다.
export function CodeBlock({ path, start, snippet, commit }: { path: string; start: number; snippet: string; commit?: string }) {
  const lines = snippet.split("\n");
  return (
    <figure className="flex w-full min-w-0 flex-col gap-[10px] rounded-12 bg-text-primary px-[22px] py-[18px]">
      <figcaption className="font-mono text-[10px] leading-[14px] text-brand-purple-soft">
        {path} · {start}–{start + lines.length - 1}
        {commit ? `  ·  ${commit.slice(0, 7)}` : ""}
      </figcaption>
      <pre className="overflow-x-auto font-mono text-[12px] leading-[22px] text-surface">
        {lines.map((line, i) => (
          <div key={i}>
            <span className="mr-[14px] inline-block w-[28px] text-right text-text-muted select-none">{start + i}</span>
            {line}
          </div>
        ))}
      </pre>
    </figure>
  );
}
