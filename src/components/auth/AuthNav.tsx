"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logOut, useCurrentUser } from "@/lib/auth";

const linkClass =
  "rounded-8 text-sm font-bold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple";

// 헤더 오른쪽 계정 메뉴. 로그인 전에는 '로그인', 로그인 후에는 이름·'마이페이지'·'로그아웃'을 보여 준다.
export function AuthNav() {
  const user = useCurrentUser();
  const router = useRouter();

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
    <div className="flex items-center gap-4">
      <span className="text-sm text-text-muted" data-testid="current-user">
        <span className="font-bold text-text-primary">{user.name}</span>님
      </span>
      <Link href="/mypage" className={`${linkClass} text-brand-purple-ink`}>
        마이페이지
      </Link>
      <button
        type="button"
        onClick={async () => {
          await logOut();
          router.push("/");
          router.refresh();
        }}
        className="rounded-8 border border-line bg-surface px-3 py-1.5 text-sm font-bold text-text-primary hover:border-brand-purple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple"
      >
        로그아웃
      </button>
    </div>
  );
}
