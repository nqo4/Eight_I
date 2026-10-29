import { connection } from "next/server";
import { handle, ok } from "@/server/http";
import { DEMO_ID, getAnalysis } from "@/server/service";

// GET /api/demo  '샘플로 체험하기'(FR-10). 이후 요청은 analysisId "demo"로 한다.
export async function GET() {
  await connection();
  return handle(async () => ok({ analysis: await getAnalysis(DEMO_ID) }));
}
