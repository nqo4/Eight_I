import { requireUserId } from "@/server/auth";
import { connection } from "next/server";
import { handle, ok } from "@/server/http";
import { getFlow } from "@/server/service";

export const maxDuration = 60;

// GET /api/analyses/{analysisId}/features/{featureId}/flow  (F5)
export async function GET(req: Request, ctx: RouteContext<"/api/analyses/[analysisId]/features/[featureId]/flow">) {
  await connection();
  return handle(async () => {
    await requireUserId(req);
    const { analysisId, featureId } = await ctx.params;
    return ok({ flow: await getFlow(analysisId, featureId) });
  });
}
