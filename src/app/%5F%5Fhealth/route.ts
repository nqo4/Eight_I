import { connection } from "next/server";

// GET /__health: 대시보드 UP 표시와 주최 측 실행의 기동 확인용.
// 폴더 이름의 %5F는 `_`다(Next.js는 `_`로 시작하는 폴더를 주소로 만들지 않는다).
export async function GET() {
  // 빌드 때 미리 만들어 두지 않고 요청마다 응답한다.
  await connection();
  const releaseId =
    process.env.RELEASE_ID || process.env.VERCEL_GIT_COMMIT_SHA || "dev";
  return Response.json(
    { releaseId },
    { headers: { "Cache-Control": "no-store" } },
  );
}
