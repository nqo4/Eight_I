import { currentUserId } from "@/server/auth";
import { recordQuizAttempt } from "@/server/history";
import { handle, ok, readJson } from "@/server/http";
import { getQuiz } from "@/server/service";

// POST /api/analyses/{analysisId}/features/{featureId}/quiz/attempts  { question_id, chosen_index }  (F13)
// 로그인한 사용자의 답을 남긴다. 정답 여부는 저장된 퀴즈로 서버가 판정한다. 로그인 전이면 저장하지 않는다(saved: false).
export async function POST(req: Request, ctx: RouteContext<"/api/analyses/[analysisId]/features/[featureId]/quiz/attempts">) {
  return handle(async () => {
    const { analysisId, featureId } = await ctx.params;
    const body = await readJson<{ question_id?: unknown; chosen_index?: unknown }>(req);
    const userId = await currentUserId(req);
    const quiz = await getQuiz(analysisId, featureId);
    const result = await recordQuizAttempt({
      userId,
      analysisId,
      quiz,
      questionId: String(body.question_id ?? ""),
      chosenIndex: Number(body.chosen_index),
    });
    return ok(result);
  });
}
