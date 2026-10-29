"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";

export function RepoForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  return (
    <form
      className="flex h-[150px] w-[600px] flex-col items-start gap-[10px]"
      onSubmit={(event) => {
        event.preventDefault();
        // 실제 분석 API가 연결되기 전까지는 준비된 데모로 이동
        router.push("/demo/overview");
      }}
    >
      <label htmlFor="repo-url" className="text-[11px] leading-[16px] font-bold whitespace-nowrap text-text-primary">
        공개 GitHub 저장소
      </label>
      <div className="flex h-[62px] w-[600px] items-center justify-between rounded-12 border border-line bg-surface py-[6px] pr-[8px] pl-[16px] focus-within:border-brand-purple">
        <span aria-hidden className="font-manrope text-[17px] leading-[20px] font-bold text-text-primary">
          ◉
        </span>
        <input
          id="repo-url"
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://github.com/owner/repository"
          className="min-w-0 flex-1 bg-transparent text-center font-mono text-[11px] leading-[18px] text-text-primary outline-none placeholder:text-text-muted"
        />
        <PrimaryButton type="submit" label="분석 시작" tone="ink" />
      </div>
      <p className="text-[9px] leading-[15px] whitespace-pre text-text-muted">
        {`✓ 공개 저장소만 지원해요    ◇ 코드를 실행하거나 수정하지 않아요`}
      </p>
    </form>
  );
}
