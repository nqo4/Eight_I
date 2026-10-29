import { requireUserId } from "@/server/auth";
import { connection } from "next/server";
import { handle, ok } from "@/server/http";
import { getFeature } from "@/server/service";

// GET /api/analyses/{analysisId}/features/{featureId}
export async function GET(req: Request, ctx: RouteContext<"/api/analyses/[analysisId]/features/[featureId]">) {
  await connection();
  return handle(async () => {
    await requireUserId(req);
    const { analysisId, featureId } = await ctx.params;
    return ok(await getFeature(analysisId, featureId));
  });
}
