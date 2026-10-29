import { connection } from "next/server";
import { clearedSessionCookie, logout } from "@/server/auth";
import { handle } from "@/server/http";

// POST /api/auth/logout → DB 세션 삭제, 쿠키 지움
export async function POST(req: Request) {
  await connection();
  return handle(async () => {
    await logout(req);
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store", "Set-Cookie": clearedSessionCookie(req) } },
    );
  });
}
