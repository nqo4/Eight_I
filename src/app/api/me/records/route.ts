import { connection } from "next/server";
import { requireUserId } from "@/server/auth";
import { listLearningRecords } from "@/server/history";
import { handle, ok } from "@/server/http";

// GET /api/me/records → { records: LearningRecord[] }  내 학습 기록(F13). 로그인해야 한다(401 login_required).
export async function GET(req: Request) {
  await connection();
  return handle(async () => ok({ records: await listLearningRecords(await requireUserId(req)) }));
}
