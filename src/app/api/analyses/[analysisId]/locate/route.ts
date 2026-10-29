import { AppError } from "@/server/errors";
import { handle, ok, readJson } from "@/server/http";
import { locateChanges } from "@/server/service";

export const maxDuration = 60;

// POST /api/analyses/{analysisId}/locate (FR-11)
export async function POST(req: Request, ctx: { params: Promise<{ analysisId: string }> }) {
  return handle(async () => {
    const body = await readJson<{ query?: unknown } | null>(req);
    if (!body || typeof body.query !== "string" || body.query.trim().length === 0 || body.query.length > 200) {
      throw new AppError("invalid_request", "'query'에 바꾸고 싶은 동작을 1~200자로 넣어 주세요.");
    }
    const { analysisId } = await ctx.params;
    return ok({ result: await locateChanges(analysisId, body.query) });
  });
}
