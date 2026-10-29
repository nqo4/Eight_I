// API가 돌려주는 오류. code는 프런트가 분기할 때 쓰고, message는 화면에 그대로 보여 줄 수 있는 한국어다.
export type ErrorCode =
  | "invalid_request"
  | "invalid_url"
  | "repo_not_found"
  | "repo_private"
  | "repo_empty"
  | "github_rate_limited"
  | "github_unavailable"
  | "ai_not_configured"
  | "ai_access_denied"
  | "ai_timeout"
  | "ai_failed"
  | "analysis_not_found"
  | "feature_not_found"
  | "demo_not_ready"
  | "demo_example_only"
  | "invalid_credentials"
  | "email_taken"
  | "auth_unavailable"
  | "login_required"
  | "internal_error";

const STATUS: Record<ErrorCode, number> = {
  invalid_request: 400,
  invalid_url: 400,
  repo_not_found: 404,
  repo_private: 403,
  repo_empty: 422,
  github_rate_limited: 429,
  github_unavailable: 502,
  ai_not_configured: 503,
  ai_access_denied: 503,
  ai_timeout: 504,
  ai_failed: 502,
  analysis_not_found: 404,
  feature_not_found: 404,
  demo_not_ready: 503,
  demo_example_only: 400,
  invalid_credentials: 401,
  email_taken: 409,
  auth_unavailable: 503,
  login_required: 401,
  internal_error: 500,
};

// 다시 시도하면 나아질 수 있는 오류인지. 프런트의 '다시 시도' 버튼 표시에 쓴다.
const RETRYABLE = new Set<ErrorCode>([
  "github_rate_limited",
  "github_unavailable",
  "ai_timeout",
  "ai_failed",
]);

export class AppError extends Error {
  readonly status: number;
  readonly retryable: boolean;

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.status = STATUS[code];
    this.retryable = RETRYABLE.has(code);
  }
}
