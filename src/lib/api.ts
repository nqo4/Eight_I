// 화면에서 백엔드 API를 부르는 함수. 응답 모양은 src/server/types.ts, 설명은 docs/api.md.
// 같은 내용을 여러 화면이 동시에 요청해도 한 번만 부르도록 결과(Promise)를 기억해 둔다.
import type { Analysis, Exercise, FeatureDetail, Flow, Lesson, Quiz } from "@/server/types";

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch {
    throw new ApiError("network", "서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.", true);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const e = body?.error;
    throw new ApiError(e?.code ?? "internal_error", e?.message ?? "서버에서 문제가 생겼어요.", Boolean(e?.retryable));
  }
  return body as T;
}

const memo = new Map<string, Promise<unknown>>();

function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = memo.get(key) as Promise<T> | undefined;
  if (hit) return hit;
  const p = load().catch((err) => {
    memo.delete(key); // 실패한 요청은 다시 시도할 수 있게 지운다
    throw err;
  });
  memo.set(key, p);
  return p;
}

export async function analyzeRepo(url: string): Promise<{ analysis: Analysis; cached: boolean }> {
  const out = await request<{ analysis: Analysis; cached: boolean }>("/api/repositories/analyze", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
  memo.set(`analysis:${out.analysis.id}`, Promise.resolve(out.analysis));
  return out;
}

export function getAnalysis(analysisId: string): Promise<Analysis> {
  return once(`analysis:${analysisId}`, () =>
    request<{ analysis: Analysis }>(`/api/analyses/${encodeURIComponent(analysisId)}`).then((r) => r.analysis),
  );
}

function featurePath(analysisId: string, featureId: string, kind?: string) {
  return `/api/analyses/${encodeURIComponent(analysisId)}/features/${encodeURIComponent(featureId)}${kind ? `/${kind}` : ""}`;
}

export function getFeature(analysisId: string, featureId: string): Promise<FeatureDetail> {
  return once(`feature:${analysisId}:${featureId}`, () => request<FeatureDetail>(featurePath(analysisId, featureId)));
}

export function getFlow(analysisId: string, featureId: string): Promise<Flow> {
  return once(`flow:${analysisId}:${featureId}`, () =>
    request<{ flow: Flow }>(featurePath(analysisId, featureId, "flow")).then((r) => r.flow),
  );
}

export function getLesson(analysisId: string, featureId: string): Promise<Lesson> {
  return once(`lesson:${analysisId}:${featureId}`, () =>
    request<{ lesson: Lesson }>(featurePath(analysisId, featureId, "lesson")).then((r) => r.lesson),
  );
}

export function getQuiz(analysisId: string, featureId: string): Promise<Quiz> {
  return once(`quiz:${analysisId}:${featureId}`, () =>
    request<{ quiz: Quiz }>(featurePath(analysisId, featureId, "quiz"), { method: "POST" }).then((r) => r.quiz),
  );
}

export function getExercise(analysisId: string, featureId: string): Promise<Exercise> {
  return once(`exercise:${analysisId}:${featureId}`, () =>
    request<{ exercise: Exercise }>(featurePath(analysisId, featureId, "exercise")).then((r) => r.exercise),
  );
}

export type ServerStatus = { ai: { configured: boolean; model: string }; store: string };

export function getStatus(): Promise<ServerStatus> {
  return once("status", () => request<ServerStatus>("/api/status"));
}
