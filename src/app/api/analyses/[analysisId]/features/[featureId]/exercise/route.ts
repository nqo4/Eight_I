import { connection } from "next/server";
import { handle, ok } from "@/server/http";
import { getExercise } from "@/server/service";

export const maxDuration = 60;

// GET /api/analyses/{analysisId}/features/{featureId}/exercise  (FR-08)
export async function GET(_req: Request, ctx: RouteContext<"/api/analyses/[analysisId]/features/[featureId]/exercise">) {
  await connection();
  return handle(async () => {
    const { analysisId, featureId } = await ctx.params;
    return ok({ exercise: await getExercise(analysisId, featureId) });
  });
}
