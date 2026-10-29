// 회원가입·로그인·로그아웃. 아이디는 이메일이고(users.username에 소문자로 저장), 세션 토큰은 httpOnly 쿠키에 담는다.
// 시드 계정(SEED_USER_EMAIL·SEED_USER_PASSWORD)은 채점기가 E2E에서 그대로 로그인하므로 앱이 뜰 때 만들어 둔다.
import { AppError } from "./errors";
import { getSql } from "./store";
import { createSession, createUser, deleteSession, getSessionUser, hashPassword, verifyLogin, type User } from "./users";

export const SESSION_COOKIE = "codeback_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // users.ts의 SESSION_DAYS와 같다
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_FIELD_LENGTH = 200;

export type PublicUser = { name: string; email: string };

function toPublic(u: User): PublicUser {
  return { name: u.name, email: u.username };
}

function requireDb() {
  if (!getSql()) throw new AppError("auth_unavailable", "지금은 로그인을 쓸 수 없어요(DB 연결 없음).");
}

function field(v: unknown): string {
  return typeof v === "string" ? v.trim().slice(0, MAX_FIELD_LENGTH) : "";
}

const SEED_SQL = `INSERT INTO users (name, username, password_hash) VALUES ($1, $2, $3)
  ON CONFLICT ((lower(username))) DO NOTHING`;

function seedAccount() {
  const email = process.env.SEED_USER_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_USER_PASSWORD;
  if (!email || !password) return null;
  return { email, password, name: process.env.SEED_USER_NAME?.trim() || "체험 학습자" };
}

let seeded: Promise<void> | null = null;

export function ensureSeedUser(): Promise<void> {
  const seed = seedAccount();
  const sql = seed ? getSql() : null;
  if (!seed || !sql) return Promise.resolve();
  seeded ??= (async () => {
    await sql(SEED_SQL, [seed.name, seed.email, await hashPassword(seed.password)]);
  })().catch((err) => {
    seeded = null;
    throw err;
  });
  return seeded;
}

export async function signup(input: { name?: unknown; email?: unknown; password?: unknown }) {
  requireDb();
  const name = field(input.name);
  const email = field(input.email).toLowerCase();
  const password = typeof input.password === "string" ? input.password : "";
  if (!name) throw new AppError("invalid_request", "이름을 입력해 주세요.");
  if (!EMAIL_PATTERN.test(email)) throw new AppError("invalid_request", "올바른 이메일 주소를 입력해 주세요.");
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_FIELD_LENGTH) {
    throw new AppError("invalid_request", `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 해요.`);
  }
  await ensureSeedUser();
  let user: User;
  try {
    user = await createUser({ name, username: email, password });
  } catch (err) {
    if ((err as { code?: string })?.code === "23505") {
      throw new AppError("email_taken", "이미 가입된 이메일이에요. 로그인해 주세요.");
    }
    throw err;
  }
  return { user: toPublic(user), session: await createSession(user.id) };
}

export async function login(input: { email?: unknown; password?: unknown }) {
  requireDb();
  const email = field(input.email).toLowerCase();
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || !password) throw new AppError("invalid_request", "이메일과 비밀번호를 입력해 주세요.");
  await ensureSeedUser();
  const user = await verifyLogin(email, password);
  if (!user) throw new AppError("invalid_credentials", "이메일 또는 비밀번호가 맞지 않아요.");
  return { user: toPublic(user), session: await createSession(user.id) };
}

export function readSessionToken(req: Request): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === SESSION_COOKIE) return decodeURIComponent(v.join("=")) || null;
  }
  return null;
}

export async function currentUser(req: Request): Promise<PublicUser | null> {
  const token = readSessionToken(req);
  if (!token || !getSql()) return null;
  const user = await getSessionUser(token);
  return user ? toPublic(user) : null;
}

export async function logout(req: Request): Promise<void> {
  const token = readSessionToken(req);
  if (token && getSql()) await deleteSession(token);
}

function isHttps(req: Request) {
  return new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
}

export function sessionCookie(req: Request, token: string): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${isHttps(req) ? "; Secure" : ""}`;
}

export function clearedSessionCookie(req: Request): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isHttps(req) ? "; Secure" : ""}`;
}
