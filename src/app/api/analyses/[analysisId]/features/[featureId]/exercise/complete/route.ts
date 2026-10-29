import { currentUserId } from "@/server/auth";
import { recordMissionDone } from "@/server/history";
import { handle, ok } from "@/server/http";
import { getFeature } from "@/server/service";

// POST /api/analyses/{analysisId}/features/{featureId}/exercise/complete  (FR-08·FR-13)
// '완료로 표시'(자기 보고)를 로그인한 사용자 기록에 남긴다. 로그인 전이면 저장하지 않는다(saved: false).
export async function POST(req: Request, ctx: RouteContext<"/api/analyses/[analysisId]/features/[featureId]/exercise/complete">) {
  return handle(async () => {
    const { analysisId, featureId } = await ctx.params;
    await getFeature(analysisId, featureId); // 없는 분석·기능이면 404
    return ok(await recordMissionDone({ userId: await currentUserId(req), analysisId, featureId }));
  });
}
