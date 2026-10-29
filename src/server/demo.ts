// '샘플로 체험하기'용 데이터(옛 FR-10 데모 모드. 2026-10-29 문서 개정에서 빠짐 — 팀이 정리할 때까지 유지). data/demo/demo.json은 scripts/build-demo.ts가 실제 공개 샘플 저장소를
// 실제로 분석해서 만든 결과다(가짜 데이터를 손으로 쓰지 않는다). 데모는 GitHub·AI를 호출하지 않는다.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AppError } from "./errors";
import type { StoredAnalysis } from "./store";

export type DemoData = {
  stored: StoredAnalysis;
  artifacts: Record<string, unknown>; // "F1:flow", "F1:lesson" ...
};

let cache: DemoData | null = null;

export function demoPath() {
  return join(process.cwd(), "data", "demo", "demo.json");
}

export function getDemo(): DemoData {
  if (cache) return cache;
  let raw: string;
  try {
    raw = readFileSync(demoPath(), "utf8");
  } catch {
    throw new AppError("demo_not_ready", "샘플 프로젝트가 아직 준비되지 않았어요.");
  }
  cache = JSON.parse(raw) as DemoData;
  return cache;
}
