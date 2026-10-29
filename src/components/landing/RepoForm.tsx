"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { analyzeRepo, ApiError } from "@/lib/api";

export function RepoForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex min-h-[150px] w-[600px] flex-col items-start gap-[10px]"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;
        setPending(true);
        setError(null);
        try {
          const { analysis } = await analyzeRepo(url.trim());
          router.push(`/learn/${analysis.id}`);
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "분석에 실패했어요. 잠시 후 다시 시도해 주세요.");
          setPending(false);
        }
      }}
    >
      <label htmlFor="repo-url" className="text-[11px] leading-[16px] font-bold whitespace-nowrap text-text-primary">
        GitHub 저장소 URL
      </label>
      <div className="flex h-[62px] w-[600px] items-center justify-between rounded-12 border border-line bg-surface py-[6px] pr-[8px] pl-[16px] focus-within:border-brand-purple">
        <span aria-hidden className="font-manrope text-[17px] leading-[20px] font-bold text-text-primary">
          ◉
        </span>
        <input
          id="repo-url"
          type="url"
          required
          value={url}
          disabled={pending}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://github.com/owner/repository"
          className="min-w-0 flex-1 bg-transparent text-center font-mono text-[11px] leading-[18px] text-text-primary outline-none placeholder:text-text-muted"
        />
        <PrimaryButton type="submit" label={pending ? "분석 중…" : "분석 시작"} tone="ink" disabled={pending} />
      </div>
      {pending && (
        <p role="status" className="text-[10px] leading-[15px] text-brand-purple">
          저장소를 읽고 기능을 찾고 있어요. 처음 분석하는 저장소는 10~20초 걸려요.
        </p>
      )}
      {error && (
        <p role="alert" className="text-[10px] leading-[15px] font-bold text-text-primary">
          {error}
        </p>
      )}
      <p className="text-[9px] leading-[15px] whitespace-pre text-text-muted">
        {`✓ 공개 저장소만 지원해요    ◇ 코드를 실행하거나 수정하지 않아요`}
      </p>
    </form>
  );
}
