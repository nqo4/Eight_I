"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";

const REDIRECT_MS = 2000;

// 로그인이 필요한 기능을 눌렀을 때 띄우는 안내. 잠시 뒤 로그인 화면으로 자동 이동하고, 바로 가거나 닫을 수도 있다.
export function LoginRequired({ feature, onClose }: { feature: string; onClose: () => void }) {
  const router = useRouter();
  const loginRef = useRef<HTMLButtonElement>(null);

  // 이동하기 전에 안내를 닫는다. 닫지 않으면 홈으로 돌아왔을 때 화면 상태가 복원되면서 안내가 다시 떠 또 이동한다.
  const goLogin = useCallback(() => {
    onClose();
    router.push("/login");
  }, [onClose, router]);

  useEffect(() => {
    loginRef.current?.focus();
    const timer = window.setTimeout(goLogin, REDIRECT_MS);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [goLogin, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6" onClick={onClose}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="login-required-title"
        aria-describedby="login-required-desc"
        className="flex w-full max-w-[440px] flex-col items-start gap-4 rounded-16 border border-line bg-surface px-8 py-8"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="flex size-10 items-center justify-center rounded-8 bg-brand-purple-soft font-manrope text-lg font-extrabold text-brand-purple-ink">
          !
        </span>
        <h2 id="login-required-title" className="text-xl font-bold text-text-primary">
          로그인이 필요해요
        </h2>
        <p id="login-required-desc" className="text-sm leading-6 text-text-muted">
          ‘{feature}’ 기능은 로그인한 뒤 이용할 수 있어요.
          <br />
          잠시 후 로그인 화면으로 이동해요.
        </p>
        <div aria-hidden className="h-1 w-full overflow-hidden rounded-8 bg-brand-purple-soft">
          <div className="login-required-bar h-full bg-brand-purple" style={{ animationDuration: `${REDIRECT_MS}ms` }} />
        </div>
        <div className="flex w-full items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-8 border border-line bg-surface px-4 py-2.5 text-sm font-bold text-text-primary hover:border-brand-purple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple"
          >
            취소
          </button>
          <PrimaryButton ref={loginRef} label="지금 로그인하기" onClick={goLogin} />
        </div>
      </div>
    </div>
  );
}
