import { requireUserUnlessDemo } from "@/server/auth";
import { AppError } from "@/server/errors";
import { handle, ok, readJson } from "@/server/http";
import { DEMO_ID, getAnalysis, locateChanges } from "@/server/service";

export const maxDuration = 60;

// POST /api/analyses/{analysisId}/locate (FR-11)
export async function POST(req: Request, ctx: { params: Promise<{ analysisId: string }> }) {
  return handle(async () => {
    const { analysisId } = await ctx.params;
    await requireUserUnlessDemo(req, analysisId);
    const body = await readJson<{ query?: unknown } | null>(req);
    if (!body || typeof body.query !== "string" || body.query.trim().length === 0 || body.query.length > 200) {
      throw new AppError("invalid_request", "'query'에 바꾸고 싶은 동작을 1~200자로 넣어 주세요.");
    }
    // 샘플은 로그인 없이 열리므로, 미리 만들어 둔 예시 문장만 받는다(아무 문장이나 넣어 AI 예산이 새지 않게).
    if (analysisId === DEMO_ID) {
      const examples = (await getAnalysis(DEMO_ID)).locate_examples ?? [];
      const q = body.query.normalize("NFC").trim().replace(/\s+/g, " ");
      if (!examples.includes(q)) {
        throw new AppError("invalid_request", "샘플에서는 입력란 아래 예시 문장으로 체험할 수 있어요. 내 저장소는 로그인 후 분석해 보세요.");
      }
    }
    return ok({ result: await locateChanges(analysisId, body.query) });
  });
}
