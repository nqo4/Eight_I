// 미리 분석해 둔 결과. data/demo/demo.json은 scripts/build-demo.ts가 공개 샘플 저장소의 한 commit을
// 실제로 분석한 결과와 코드 근거로 검토·정정한 학습 설명을 담는다. 사용자가 같은 저장소의 같은 commit을 분석하면
// AI를 다시 부르지 않고 이 결과를 그 사용자의 분석으로 저장해 쓴다(F1의 '같은 commit이면 저장된 결과' 규칙과 같다).
// 데모 모드는 없다(F10: 로그인해야 쓰는 서비스).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { StoredAnalysis } from "./store";
import type { Analysis, Exercise, Feature, Flow, Lesson, LocateResult, Quiz } from "./types";

export type DemoData = {
  stored: StoredAnalysis;
  artifacts: Record<string, Flow | Lesson | Quiz | Exercise | LocateResult>; // "F1:flow", "F1:lesson", "locate:<문장>" ...
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

export function getPrecomputedLesson(analysis: Analysis, feature: Feature): Lesson | null {
  const pre = getPrecomputed();
  if (!pre
    || pre.stored.analysis.repository.id.toLowerCase() !== analysis.repository.id.toLowerCase()
    || pre.stored.analysis.repository.commit_sha !== analysis.repository.commit_sha) return null;
  const original = pre.stored.analysis.features.find((item) => item.id === feature.id);
  if (!original || original.title !== feature.title
    || JSON.stringify(original.code_references) !== JSON.stringify(feature.code_references)) return null;
  const artifact = pre.artifacts[`${feature.id}:lesson`];
  return artifact && "concepts" in artifact ? artifact : null;
}

export function withPrecomputedTechnologies(analysis: Analysis): Analysis {
  const pre = getPrecomputed();
  if (!pre
    || pre.stored.analysis.repository.id.toLowerCase() !== analysis.repository.id.toLowerCase()
    || pre.stored.analysis.repository.commit_sha !== analysis.repository.commit_sha
    || JSON.stringify(pre.stored.analysis.features) !== JSON.stringify(analysis.features)) return analysis;
  return {
    ...analysis,
    overview: { ...analysis.overview, technologies: pre.stored.analysis.overview.technologies },
  };
}
