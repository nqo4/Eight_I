"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { LoginRequired } from "@/components/auth/LoginRequired";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ErrorBox, Loading, secondaryBtn } from "@/components/demo/ui";
import { api, useSession, type ApiError } from "@/components/session/Session";
import { useCurrentUser } from "@/lib/auth";
import type { Analysis } from "@/server/types";

// 홈의 두 시작 방법: 내 공개 저장소 분석(S1) 또는 샘플로 체험하기(S2~S7).
export function RepoForm() {
  const router = useRouter();
  const { setAnalysis } = useSession();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<"demo" | "analyze" | null>(null);
  const [error, setError] = useState<{ error: ApiError; from: "demo" | "analyze" } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // 내 저장소 분석은 로그인 후에만 열린다. 샘플로 체험하기는 로그인 없이 쓸 수 있다.
  const user = useCurrentUser();
  const [needLogin, setNeedLogin] = useState(false);
  const closeLogin = useCallback(() => setNeedLogin(false), []);

  async function start(from: "demo" | "analyze") {
    setBusy(from);
    setError(null);
    try {
      const { analysis } =
        from === "demo"
          ? await api<{ analysis: Analysis }>("/api/demo")
          : await api<{ analysis: Analysis }>("/api/repositories/analyze", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ url: url.trim() }),
            });
      setAnalysis(analysis);
      router.push("/demo/overview");
    } catch (e) {
      setError({ error: e as ApiError, from });
      setBusy(null);
    }
  }

  return (
    <div className="flex w-full max-w-[600px] flex-col items-start gap-4">
      {!open ? (
        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton
            label="내 프로젝트 분석하기"
            onClick={() => {
              if (!user) {
                setNeedLogin(true);
                return;
              }
              setOpen(true);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
          />
          <button type="button" className={secondaryBtn} disabled={busy !== null} onClick={() => start("demo")}>
            샘플로 체험하기
          </button>
          <span className="text-sm text-text-muted">GitHub 없이 준비된 샘플로 바로 해 봐요</span>
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
            start("analyze");
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
            <PrimaryButton type="submit" label="분석 시작" tone="ink" disabled={busy !== null || url.trim() === ""} />
          </div>
          <p className="text-sm text-text-muted">
            ✓ 공개 저장소만 지원해요 · ◇ 코드를 실행하거나 수정하지 않아요 · 코드 일부가 AI 모델로 전송돼요(.env 같은 비밀 파일은 빼요)
          </p>
          <button type="button" className={secondaryBtn} disabled={busy !== null} onClick={() => start("demo")}>
            샘플로 체험하기
          </button>
        </form>
      )}
      {needLogin && <LoginRequired feature="내 프로젝트 분석" onClose={closeLogin} />}
      {busy && <Loading slow={busy === "analyze"} />}
      {error && (
        <ErrorBox
          error={error.error}
          onRetry={() => start(error.from)}
          onDemo={error.from === "analyze" ? () => start("demo") : undefined}
        />
      )}
    </div>
  );
}
