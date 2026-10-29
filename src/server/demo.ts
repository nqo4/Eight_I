// 미리 분석해 둔 결과. data/demo/demo.json은 scripts/build-demo.ts가 공개 샘플 저장소의 한 commit을
// 실제로 분석해 만든 결과다(손으로 쓴 가짜 데이터가 아님). 사용자가 같은 저장소의 같은 commit을 분석하면
// AI를 다시 부르지 않고 이 결과를 그 사용자의 분석으로 저장해 쓴다(FR-01의 '같은 commit이면 저장된 결과' 규칙과 같다).
// 같은 데이터를 '샘플로 체험하기'(로그인 없이, id "demo")에도 쓴다(service.ts getDemoAnalysis).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { StoredAnalysis } from "./store";

export type DemoData = {
  stored: StoredAnalysis;
  artifacts: Record<string, unknown>; // "F1:flow", "F1:lesson", "locate:<문장>" ...
};

let cache: DemoData | null | undefined;

export function demoPath() {
  return join(process.cwd(), "data", "demo", "demo.json");
}

// 파일이 없으면 null(그때는 평소처럼 AI로 분석한다).
export function getPrecomputed(): DemoData | null {
  if (cache !== undefined) return cache;
  try {
    cache = JSON.parse(readFileSync(demoPath(), "utf8")) as DemoData;
  } catch {
    cache = null;
  }
  return cache;
}
