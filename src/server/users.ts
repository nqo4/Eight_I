// 사용자(이름·아이디·비밀번호)와 로그인 세션. 아직 API에는 연결하지 않았다(로그인 화면과 함께 연결 예정).
// 비밀번호는 scrypt로 해시해 저장하고, 원문은 어디에도 남기지 않는다.
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getSql } from "./store";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const KEY_LEN = 64;

export type User = { id: string; name: string; username: string; created_at: string };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LEN);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltB64, keyB64] = stored.split("$");
  if (algo !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

function sql() {
  const q = getSql();
  if (!q) throw new Error("사용자 저장은 DATABASE_URL(Postgres)이 있어야 해요.");
  return q;
}

export async function createUser(input: { name: string; username: string; password: string }): Promise<User> {
  const rows = await sql()<User>(
    `INSERT INTO users (name, username, password_hash) VALUES ($1, $2, $3)
     RETURNING id::text, name, username, created_at`,
    [input.name, input.username, await hashPassword(input.password)],
  );
  return rows[0];
}

const SESSION_DAYS = 7;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// 로그인 성공 시 세션을 만든다. 돌려준 token을 쿠키(httpOnly)에 담고, DB에는 해시만 둔다.
export async function createSession(userId: string): Promise<{ token: string; expires_at: string }> {
  const token = randomBytes(32).toString("base64url");
  const rows = await sql()<{ expires_at: string }>(
    `INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + ($3 || ' days')::interval)
     RETURNING expires_at`,
    [tokenHash(token), userId, String(SESSION_DAYS)],
  );
  return { token, expires_at: rows[0].expires_at };
}

export async function getSessionUser(token: string): Promise<User | null> {
  const rows = await sql()<User>(
    `SELECT u.id::text, u.name, u.username, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [tokenHash(token)],
  );
  return rows[0] ?? null;
}

export async function deleteSession(token: string): Promise<void> {
  await sql()(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash(token)]);
}

// 아이디·비밀번호가 맞으면 사용자, 아니면 null
export async function verifyLogin(username: string, password: string): Promise<User | null> {
  const rows = await sql()<User & { password_hash: string }>(
    `SELECT id::text, name, username, created_at, password_hash FROM users WHERE lower(username) = lower($1)`,
    [username],
  );
  const row = rows[0];
  if (!row || !(await verifyPassword(password, row.password_hash))) return null;
  return { id: row.id, name: row.name, username: row.username, created_at: row.created_at };
}
