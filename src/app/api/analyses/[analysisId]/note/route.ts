import { requireUserUnlessDemo } from "@/server/auth";
import { connection } from "next/server";
import { handle } from "@/server/http";
import { noteFileName, renderLearningNote } from "@/server/note";
import { getNoteInput } from "@/server/service";

// GET /api/analyses/{analysisId}/note  학습 노트 PDF(FR-12). 저장된 결과만 쓰므로 AI 비용이 들지 않는다.
export async function GET(req: Request, ctx: RouteContext<"/api/analyses/[analysisId]/note">) {
  await connection();
  return handle(async () => {
    const { analysisId } = await ctx.params;
    await requireUserUnlessDemo(req, analysisId);
    const input = await getNoteInput(analysisId);
    const pdf = await renderLearningNote(input);
    const name = noteFileName(input.analysis);
    return new Response(pdf as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${name.replace(/[^\w.-]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`,
        "Cache-Control": "no-store",
      },
    });
  });
}
