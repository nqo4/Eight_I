import { connection } from "next/server";
import { handle, ok } from "@/server/http";
import { getAnalysis } from "@/server/service";

// GET /api/analyses/{analysisId}  (analysisId가 "demo"면 샘플 프로젝트)
export async function GET(_req: Request, ctx: RouteContext<"/api/analyses/[analysisId]">) {
  await connection();
  return handle(async () => {
    const { analysisId } = await ctx.params;
    return ok({ analysis: await getAnalysis(analysisId) });
  });
}
