// 웹 표준 Request/Response 도우미. Next.js가 아닌 서버로 옮겨도 그대로 쓸 수 있다.
import { AppError } from "./errors";

export function ok(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(err: unknown): Response {
  const e =
    err instanceof AppError
      ? err
      : (console.error("[api] unexpected error:", err), new AppError("internal_error", "서버에서 문제가 생겼어요. 잠시 후 다시 시도해 주세요."));
  return Response.json(
    { error: { code: e.code, message: e.message, retryable: e.retryable, ...(e.details ? { details: e.details } : {}) } },
    { status: e.status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    return fail(err);
  }
}

const MAX_BODY = 4_000;

export async function readJson<T>(req: Request): Promise<T> {
  const text = await req.text();
  if (text.length > MAX_BODY) throw new AppError("invalid_request", "요청이 너무 커요.");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AppError("invalid_request", "요청 형식(JSON)이 올바르지 않아요.");
  }
}
