"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { LoginRequired } from "@/components/auth/LoginRequired";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ErrorBox, Loading } from "@/components/demo/ui";
import { api, useSession, type ApiError } from "@/components/session/Session";
import { useCurrentUser } from "@/lib/auth";
import type { Analysis } from "@/server/types";

// 홈의 시작 방법: 로그인한 사용자가 공개 GitHub 저장소를 분석한다(F1·F10).
export function RepoForm() {
  const router = useRouter();
  const { setAnalysis } = useSession();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // 내 저장소 분석은 로그인 후에만 열린다(F10).
  const user = useCurrentUser();
  const [needLogin, setNeedLogin] = useState(false);
  const closeLogin = useCallback(() => setNeedLogin(false), []);

  async function analyze() {
    setBusy(true);
    setError(null);
    try {
      const { analysis } = await api<{ analysis: Analysis }>("/api/repositories/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      setAnalysis(analysis);
      router.push("/demo/overview");
    } catch (e) {
      setError(e as ApiError);
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full max-w-[620px] flex-col items-start gap-4">
      {!open ? (
        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton
            label="GitHub 프로젝트 분석하기"
            onClick={() => {
              if (!user) {
                setNeedLogin(true);
                return;
              }
              setOpen(true);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
          />
        </div>
      ) : (
        <form
          className="flex w-full flex-col items-start gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!user) {
              setNeedLogin(true);
              return;
            }
            analyze();
          }}
        >
          <label htmlFor="repo-url" className="text-sm font-bold text-text-primary">
            GitHub 저장소 URL
          </label>
          <div className="flex w-full items-center justify-between gap-2 rounded-12 border border-line bg-surface py-1.5 pr-2 pl-4 focus-within:border-brand-purple">
            <span aria-hidden className="font-manrope text-lg font-bold text-text-primary">
              ◉
            </span>
            <input
              ref={inputRef}
              id="repo-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://github.com/owner/repository"
              className="min-w-0 flex-1 bg-transparent font-mono text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
            <PrimaryButton type="submit" label="분석 시작" tone="ink" disabled={busy || url.trim() === ""} />
          </div>
          <p className="text-sm text-text-muted">
            ✓ 공개 저장소만 지원해요 · ◇ 코드를 실행하거나 수정하지 않아요 · 코드 일부가 AI 모델로 전송돼요(.env 같은 비밀 파일은 빼요)
          </p>
        </form>
      )}
      {needLogin && !user && <LoginRequired feature="GitHub 프로젝트 분석" onClose={closeLogin} />}
      {busy && <Loading slow />}
      {error && <ErrorBox error={error} onRetry={analyze} />}
    </div>
  );
}
