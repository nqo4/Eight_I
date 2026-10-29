"use client";

// 화면에서 쓰는 로그인 상태. 실제 인증은 서버(/api/auth/*, src/server/auth.ts)가 하고,
// 여기서는 /api/auth/me 결과를 한곳에 두어 헤더·홈·마이페이지가 같은 값을 보게 한다.
import { useEffect, useSyncExternalStore } from "react";
import { z } from "zod";

const userSchema = z.object({ name: z.string(), email: z.string() });
export type User = z.infer<typeof userSchema>;

// undefined: 아직 확인 전(또는 확인 실패), null: 로그인 안 함(서버가 확인함)
let current: User | null | undefined = undefined;
// 로그인 상태를 서버에 묻지 못했을 때 true. 이때는 로그인·로그아웃을 단정하지 않는다(#8).
let checkFailed = false;
// 늦게 도착한 /api/auth/me 응답이 더 최신 상태(로그아웃 등)를 덮어쓰지 않게 요청마다 번호를 붙인다.
let request = 0;
let epoch = 0;
let signingOut = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function set(user: User | null) {
  // Initial discovery has no previous account state to clear. Remounting here
  // would discard form input entered while the first auth check was pending.
  if (current !== undefined && current?.email !== user?.email) epoch += 1;
  current = user;
  checkFailed = false;
  emit();
}

export const getAuthEpoch = () => epoch;
export const getCurrentUser = () => current;

export function invalidateUser() {
  request += 1;
  epoch += 1;
  current = undefined;
  checkFailed = false;
  emit();
}

export async function refreshUser(): Promise<User | null | undefined> {
  if (signingOut) return current;
  const ticket = ++request;
  let user: User | null;
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    // 미인증은 200 + user:null로 온다. 그 밖의 상태는 '확인 실패'이지 로그아웃이 아니다.
    if (!res.ok) throw new Error(`auth check ${res.status}`);
    user = z.object({ user: userSchema.nullable() }).parse(await res.json()).user;
  } catch {
    if (ticket === request) {
      // 이미 확인한 상태(로그인·미인증)는 그대로 둔다. 처음 확인부터 실패했으면 확인 실패로 표시한다.
      checkFailed = current === undefined;
      emit();
    }
    return current;
  }
  if (ticket === request) set(user);
  return current;
}

export type LogOutResult = "done" | "failed" | "unknown";

// 서버가 세션을 지웠다고 답했을 때만 화면의 사용자를 비운다(#5).
// 응답을 못 받으면(연결 끊김) 서버 처리 여부를 /api/auth/me로 다시 확인한다.
export async function logOut(): Promise<LogOutResult> {
  signingOut = true;
  const ticket = ++request;
  let res: Response;
  try {
    res = await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    signingOut = false;
    if (ticket !== request) return "unknown";
    const user = await refreshUser();
    return user === null ? "done" : "unknown";
  }
  signingOut = false;
  if (ticket !== request) return "unknown";
  if (!res.ok) return "failed";
  request++; // 로그아웃 전에 보낸 확인 요청의 응답은 무시한다.
  set(null);
  return "done";
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

export function useAuthCheckFailed(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => checkFailed,
    () => false,
  );
}
