import { requireUserId } from "@/server/auth";
import { connection } from "next/server";
import { handle, ok } from "@/server/http";
import { getQuiz } from "@/server/service";

export const maxDuration = 60;

// GET /api/analyses/{analysisId}/features/{featureId}/quiz  (F7)
export async function GET(req: Request, ctx: RouteContext<"/api/analyses/[analysisId]/features/[featureId]/quiz">) {
  await connection();
  return handle(async () => {
    await requireUserId(req);
    const { analysisId, featureId } = await ctx.params;
    return ok({ quiz: await getQuiz(analysisId, featureId) });
  });
}

// docs/problem.yaml 계약은 POST다. 결과는 처음 한 번만 만들고 저장하므로 GET과 같다.
export const POST = GET;
