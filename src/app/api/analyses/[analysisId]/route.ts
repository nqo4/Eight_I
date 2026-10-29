import { requireUserId } from "@/server/auth";
import { connection } from "next/server";
import { handle, ok } from "@/server/http";
import { getAnalysis } from "@/server/service";

// GET /api/analyses/{analysisId}
export async function GET(req: Request, ctx: RouteContext<"/api/analyses/[analysisId]">) {
  await connection();
  return handle(async () => {
    await requireUserId(req);
    const { analysisId } = await ctx.params;
    return ok({ analysis: await getAnalysis(analysisId) });
  });
}
