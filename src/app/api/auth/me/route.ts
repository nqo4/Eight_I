import { connection } from "next/server";
import { currentUser } from "@/server/auth";
import { handle, ok } from "@/server/http";

// GET /api/auth/me → { user: { name, email } | null }
export async function GET(req: Request) {
  await connection();
  return handle(async () => ok({ user: await currentUser(req) }));
}
