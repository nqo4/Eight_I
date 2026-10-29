import { requireUserId } from "@/server/auth";
import { connection } from "next/server";
import { handle, ok } from "@/server/http";
import { getExercise } from "@/server/service";

export const maxDuration = 60;

// GET /api/analyses/{analysisId}/features/{featureId}/exercise  (F8)
export async function GET(req: Request, ctx: RouteContext<"/api/analyses/[analysisId]/features/[featureId]/exercise">) {
  await connection();
  return handle(async () => {
    await requireUserId(req);
    const { analysisId, featureId } = await ctx.params;
    return ok({ exercise: await getExercise(analysisId, featureId) });
  });
}
