import { currentUserId } from "@/server/auth";
import { AppError } from "@/server/errors";
import { handle, ok, readJson } from "@/server/http";
import { analyzeRepository } from "@/server/service";

// 저장소 수집 + AI 분석이 한 요청 안에 끝나도록 넉넉히 둔다(Vercel 함수 제한).
export const maxDuration = 60;

// POST /api/repositories/analyze  { "url": "https://github.com/owner/repo" }
export async function POST(req: Request) {
  return handle(async () => {
    const body = await readJson<{ url?: unknown }>(req);
    if (typeof body.url !== "string" || body.url.length === 0 || body.url.length > 300) {
      throw new AppError("invalid_request", "'url'에 GitHub 저장소 주소를 넣어 주세요.");
    }
    // 로그인한 사용자면 '내 학습 기록'(FR-13)의 분석한 저장소 목록에 남긴다.
    const userId = await currentUserId(req);
    const { analysis, cached } = await analyzeRepository(body.url, { userId: userId ?? undefined });
    return ok({ analysis, cached }, cached ? 200 : 201);
  });
}
