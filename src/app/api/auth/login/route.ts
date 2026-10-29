import { connection } from "next/server";
import { login, sessionCookie } from "@/server/auth";
import { handle, readJson } from "@/server/http";

// POST /api/auth/login  { email, password } → 세션 쿠키
export async function POST(req: Request) {
  await connection();
  return handle(async () => {
    const { user, session } = await login(await readJson(req));
    return Response.json(
      { user },
      { headers: { "Cache-Control": "no-store", "Set-Cookie": sessionCookie(req, session.token) } },
    );
  });
}
