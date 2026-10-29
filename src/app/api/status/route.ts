import { connection } from "next/server";
import { aiConfigured } from "@/server/ai";
import { config } from "@/server/config";
import { handle, ok } from "@/server/http";
import { checkStore } from "@/server/store";

// GET /api/status  프런트가 AI 분석 가능 여부를 미리 알 수 있게 한다. 비밀값은 담지 않는다.
export async function GET() {
  await connection();
  return handle(async () => {
    return ok({
      ai: { configured: aiConfigured(), model: config.aiModel },
      store: await checkStore(),
    });
  });
}
