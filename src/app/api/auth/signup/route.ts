import { connection } from "next/server";
import { sessionCookie, signup } from "@/server/auth";
import { handle, readJson } from "@/server/http";

// POST /api/auth/signup  { name, email, password } → 가입 후 바로 로그인 상태(세션 쿠키)
export async function POST(req: Request) {
  await connection();
  return handle(async () => {
    const { user, session } = await signup(await readJson(req));
    return Response.json(
      { user },
      { status: 201, headers: { "Cache-Control": "no-store", "Set-Cookie": sessionCookie(req, session.token) } },
    );
  });
}
