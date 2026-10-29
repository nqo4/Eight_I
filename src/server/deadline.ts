import { AppError } from "./errors";

function timeoutError() {
  return new AppError("ai_timeout", "AI 응답이 너무 오래 걸렸어요. 잠시 후 다시 시도해 주세요.");
}

// Leave time for the app's error response before the route's 60-second limit.
export class AnalysisDeadline {
  private readonly controller = new AbortController();
  readonly signal = this.controller.signal;

  constructor(private readonly expiresAt = Date.now() + 52_000) {}

  timeout(maxMs: number): number {
    const remaining = this.expiresAt - Date.now() - 250;
    if (remaining <= 0 || this.signal.aborted) throw timeoutError();
    return Math.min(maxMs, remaining);
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    this.timeout(Infinity);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const expired = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const error = timeoutError();
        this.controller.abort(error);
        reject(error);
      }, this.expiresAt - Date.now());
    });
    try {
      return await Promise.race([fn(), expired]);
    } finally {
      clearTimeout(timer);
    }
  }
}
