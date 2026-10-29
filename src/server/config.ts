// 서버 설정. 모두 환경변수로 바꿀 수 있고, 없으면 기본값을 쓴다.
function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  // AI Gateway 모델 식별자. https://ai-gateway.vercel.sh/v1/models 목록에 있는 값만 쓴다.
  aiModel: process.env.AI_MODEL || "anthropic/claude-haiku-5.5",
  aiTimeoutMs: intEnv("AI_TIMEOUT_MS", 50_000),
  aiMaxOutputTokens: intEnv("AI_MAX_OUTPUT_TOKENS", 6_000),

  githubToken: process.env.GITHUB_TOKEN || undefined,
  githubTimeoutMs: intEnv("GITHUB_TIMEOUT_MS", 10_000),

  // 분석에 넣을 파일 한도. 큰 저장소는 우선순위가 높은 파일부터 이 한도까지만 읽는다.
  maxFiles: intEnv("ANALYZE_MAX_FILES", 80),
  maxFileBytes: intEnv("ANALYZE_MAX_FILE_BYTES", 40_000),
  maxTotalBytes: intEnv("ANALYZE_MAX_TOTAL_BYTES", 250_000),
  // 기능 하나의 상세(흐름·학습·퀴즈·미션)를 만들 때 넣을 파일 한도.
  featureContextBytes: intEnv("FEATURE_CONTEXT_BYTES", 80_000),

  databaseUrl: process.env.DATABASE_URL || undefined,
};
