"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logOut, refreshUser, useAuthCheckFailed, useCurrentUser } from "@/lib/auth";

const linkClass =
  "rounded-8 text-sm font-bold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple";
const buttonClass =
  "rounded-8 border border-line bg-surface px-3 py-1.5 text-sm font-bold whitespace-nowrap text-text-primary hover:border-brand-purple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple disabled:opacity-60";

const logoutMessage = {
  failed: "로그아웃하지 못했어요. 다시 눌러 주세요.",
  unknown: "로그아웃됐는지 확인하지 못했어요. 연결을 확인한 뒤 다시 눌러 주세요.",
} as const;

// 헤더 오른쪽 계정 메뉴. 로그인 전에는 '로그인', 로그인 후에는 이름·'내 학습 기록'·'로그아웃'을 보여 준다.
export function AuthNav() {
  const user = useCurrentUser();
  const checkFailed = useAuthCheckFailed();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<keyof typeof logoutMessage | null>(null);

  if (user === undefined && checkFailed) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <span role="alert">로그인 상태를 확인하지 못했어요.</span>
        <button type="button" className={buttonClass} onClick={() => refreshUser()}>
          다시 확인
        </button>
      </div>
    );
  }

  // 서버에 확인하기 전에는 자리만 잡아 두어 '로그인'이 잠깐 보였다 사라지지 않게 한다.
  if (user === undefined) return <span aria-hidden className="h-5 w-14" />;

  if (!user) {
    return (
      <Link href="/login" className={`${linkClass} text-text-primary`}>
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2.5 sm:gap-4">
      <span className="hidden text-sm text-text-muted sm:inline" data-testid="current-user">
        <span className="font-bold text-text-primary">{user.name}</span>님
      </span>
      <Link href="/mypage" className={`${linkClass} whitespace-nowrap text-brand-purple-ink`}>
        내 학습 기록
      </Link>
      {error && (
        <span role="alert" className="text-sm font-bold text-status-red">
          {logoutMessage[error]}
        </span>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const result = await logOut();
          setBusy(false);
          if (result !== "done") {
            setError(result);
            return;
          }
          router.push("/");
          router.refresh();
        }}
        className={buttonClass}
      >
        {busy ? "로그아웃 중" : "로그아웃"}
      </button>
    </div>
  );
}
