import { connection } from "next/server";
import { handle, ok } from "@/server/http";
import { getLesson } from "@/server/service";

export const maxDuration = 60;

// GET /api/analyses/{analysisId}/features/{featureId}/lesson  (FR-06)
export async function GET(_req: Request, ctx: RouteContext<"/api/analyses/[analysisId]/features/[featureId]/lesson">) {
  await connection();
  return handle(async () => {
    const { analysisId, featureId } = await ctx.params;
    return ok({ lesson: await getLesson(analysisId, featureId) });
  });
}
