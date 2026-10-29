import { connection } from "next/server";
import { handle, ok } from "@/server/http";
import { getDemoAnalysis } from "@/server/service";

// GET /api/demo  '샘플로 체험하기'. 로그인 없이 미리 분석해 둔 공개 샘플을 돌려준다. 이후 요청은 analysisId "demo"로 한다.
export async function GET() {
  await connection();
  return handle(async () => ok({ analysis: await getDemoAnalysis() }));
}
