"use client";

// 브라우저에만 저장하는 임시 계정·로그인 상태. 서버 인증(src/server/users.ts)을 연결하기 전까지 쓰는 화면용 구현이라
// 다른 기기와 공유되지 않고, 비밀번호 해시도 브라우저에 남으므로 실제 보안 수단으로 쓰지 않는다.
import { useSyncExternalStore } from "react";

export type User = { name: string; email: string; created_at: string };
type Account = User & { password_hash: string };

const ACCOUNTS_KEY = "codeback:v1:accounts";
const USER_KEY = "codeback:v1:user";
const CHANGE_EVENT = "codeback:auth-change";

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const normalize = (email: string) => email.trim().toLowerCase();

async function hashPassword(email: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`${normalize(email)}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function setCurrentUser({ name, email, created_at }: User) {
  writeJson(USER_KEY, { name, email, created_at });
}

export async function signUp(input: { name: string; email: string; password: string }): Promise<"ok" | "exists"> {
  const email = normalize(input.email);
  const accounts = readJson<Account[]>(ACCOUNTS_KEY) ?? [];
  if (accounts.some((a) => a.email === email)) return "exists";
  const account: Account = {
    name: input.name.trim(),
    email,
    created_at: new Date().toISOString(),
    password_hash: await hashPassword(email, input.password),
  };
  writeJson(ACCOUNTS_KEY, [...accounts, account]);
  setCurrentUser(account);
  return "ok";
}

export async function logIn(input: { email: string; password: string }): Promise<boolean> {
  const email = normalize(input.email);
  const account = (readJson<Account[]>(ACCOUNTS_KEY) ?? []).find((a) => a.email === email);
  if (!account || account.password_hash !== (await hashPassword(email, input.password))) return false;
  setCurrentUser(account);
  return true;
}

export function logOut() {
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange); // 다른 탭에서 로그인·로그아웃한 경우
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// useSyncExternalStore는 같은 값이면 같은 객체를 돌려받아야 하므로 원문 문자열 기준으로 캐시한다.
let cachedRaw: string | null = null;
let cachedUser: User | null = null;
function getSnapshot(): User | null {
  const raw = window.localStorage.getItem(USER_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedUser = raw ? (JSON.parse(raw) as User) : null;
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser;
}

// 서버 렌더링과 첫 화면에서는 "확인 중"(undefined), 브라우저에서 읽은 뒤에는 사용자 또는 null.
export function useCurrentUser(): User | null | undefined {
  return useSyncExternalStore<User | null | undefined>(subscribe, getSnapshot, () => undefined);
}
