import { requireUserId } from "@/server/auth";
import { AppError } from "@/server/errors";
import { ensureUserRepository, recordMissionScore } from "@/server/history";
import { handle, ok, readJson } from "@/server/http";
import { getAnalysis, gradeMission } from "@/server/service";

export const maxDuration = 60;

// POST /api/analyses/{analysisId}/features/{featureId}/exercise/grade  { code }  (FR-08: 수정 미션 점수)
// 사용자가 자기 개발 환경에서 고친 코드를 붙여 넣으면 AI가 성공 조건과 비교해 0~100점을 매긴다(실행하지 않음, AI 추정).
// AI 비용이 들어서 로그인한 사용자만 쓸 수 있다. 점수는 '내 학습 기록'(FR-13)에 남는다.
export async function POST(req: Request, ctx: RouteContext<"/api/analyses/[analysisId]/features/[featureId]/exercise/grade">) {
  return handle(async () => {
    const userId = await requireUserId(req);
    const { analysisId, featureId } = await ctx.params;
    const body = await readJson<{ code?: unknown } | null>(req);
    if (!body || typeof body.code !== "string") throw new AppError("invalid_request", "'code'에 고친 코드를 넣어 주세요.");
    const grade = await gradeMission(analysisId, featureId, body.code);
    const { saved } = await recordMissionScore({ userId, analysisId, featureId, score: grade.score, passed: grade.passed });
    // 채점은 분석 날짜·기록의 commit을 바꾸지 않는다(목록에 없을 때만 추가).
    if (saved) await ensureUserRepository(userId, (await getAnalysis(analysisId)).repository.id, analysisId);
    return ok({ grade, saved });
  });
}
