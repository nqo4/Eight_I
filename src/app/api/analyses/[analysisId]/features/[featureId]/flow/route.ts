import { connection } from "next/server";
import { handle, ok } from "@/server/http";
import { getFlow } from "@/server/service";

export const maxDuration = 60;

// GET /api/analyses/{analysisId}/features/{featureId}/flow  (FR-05)
export async function GET(_req: Request, ctx: RouteContext<"/api/analyses/[analysisId]/features/[featureId]/flow">) {
  await connection();
  return handle(async () => {
    const { analysisId, featureId } = await ctx.params;
    return ok({ flow: await getFlow(analysisId, featureId) });
  });
}
