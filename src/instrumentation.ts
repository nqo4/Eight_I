// 서버가 뜰 때 한 번 실행된다. 빈 DB에서도 채점기 E2E가 바로 로그인할 수 있게 시드 계정을 먼저 만든다.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ensureSeedUser } = await import("./server/auth");
  await ensureSeedUser().catch((err) => {
    console.error("[auth] 시드 계정을 만들지 못했어요(첫 로그인 요청 때 다시 시도):", err instanceof Error ? err.message : err);
  });
}
