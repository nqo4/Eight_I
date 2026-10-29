import { requireUserId } from "@/server/auth";
import { AppError } from "@/server/errors";
import { recordQuizAttempt } from "@/server/history";
import { handle, ok, readJson } from "@/server/http";
import { getQuiz } from "@/server/service";

// POST /api/analyses/{analysisId}/features/{featureId}/quiz/attempts  { question_id, chosen_index }  (FR-13)
// 로그인한 사용자의 답을 남긴다. 정답 여부는 저장된 퀴즈로 서버가 판정한다.
export async function POST(req: Request, ctx: RouteContext<"/api/analyses/[analysisId]/features/[featureId]/quiz/attempts">) {
  return handle(async () => {
    const userId = await requireUserId(req);
    const { analysisId, featureId } = await ctx.params;
    const body = await readJson<{ question_id?: unknown; chosen_index?: unknown } | null>(req);
    if (!body || typeof body.question_id !== "string" || typeof body.chosen_index !== "number" || !Number.isInteger(body.chosen_index)) {
      throw new AppError("invalid_request", "문제와 고른 보기 번호를 확인해 주세요.");
    }
    const quiz = await getQuiz(analysisId, featureId);
    const result = await recordQuizAttempt({
      userId,
      analysisId,
      quiz,
      questionId: body.question_id,
      chosenIndex: body.chosen_index,
    });
    return ok(result);
  });
}
