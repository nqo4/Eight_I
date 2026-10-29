import { requireUserId } from "@/server/auth";
import { AppError } from "@/server/errors";
import { handle, ok, readJson } from "@/server/http";
import { analyzeRepository } from "@/server/service";

// 저장소 수집 + AI 분석이 한 요청 안에 끝나도록 넉넉히 둔다(Vercel 함수 제한).
export const maxDuration = 60;

// POST /api/repositories/analyze  { "url": "https://github.com/owner/repo" }
export async function POST(req: Request) {
  return handle(async () => {
    // FR-10: 로그인해야 쓰는 서비스다. 분석한 저장소는 '내 학습 기록'(FR-13)에 남긴다.
    const userId = await requireUserId(req);
    const body = await readJson<{ url?: unknown }>(req);
    if (typeof body.url !== "string" || body.url.length === 0 || body.url.length > 300) {
      throw new AppError("invalid_request", "'url'에 GitHub 저장소 주소를 넣어 주세요.");
    }
    const { analysis, cached } = await analyzeRepository(body.url, { userId });
    return ok({ analysis, cached }, cached ? 200 : 201);
  });
}
