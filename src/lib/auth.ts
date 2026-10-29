"use client";

// 화면에서 쓰는 로그인 상태. 실제 인증은 서버(/api/auth/*, src/server/auth.ts)가 하고,
// 여기서는 /api/auth/me 결과를 한곳에 두어 헤더·홈·마이페이지가 같은 값을 보게 한다.
import { useEffect, useSyncExternalStore } from "react";

export type User = { name: string; email: string };

// undefined: 아직 확인 전, null: 로그인 안 함
let current: User | null | undefined = undefined;
const listeners = new Set<() => void>();

function set(user: User | null) {
  current = user;
  listeners.forEach((l) => l());
}

export async function refreshUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const body = res.ok ? ((await res.json()) as { user: User | null }) : { user: null };
    set(body.user ?? null);
  } catch {
    set(null);
  }
  return current ?? null;
}

export async function logOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
  set(null);
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

// 화면이 열릴 때마다 서버에 다시 물어 로그인·로그아웃 직후에도 최신 상태를 보인다.
export function useCurrentUser(): User | null | undefined {
  const user = useSyncExternalStore(
    subscribe,
    () => current,
    () => undefined,
  );
  useEffect(() => {
    refreshUser();
  }, []);
  return user;
}
