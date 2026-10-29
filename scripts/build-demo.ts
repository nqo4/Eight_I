// '샘플로 체험하기' 데이터 만들기. 실제 공개 샘플 저장소를 실제로 분석해 data/demo/demo.json에 저장한다.
// 실행: AI_GATEWAY_API_KEY가 설정된 상태에서  npm run demo:build -- https://github.com/owner/repo
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { demoPath, type DemoData } from "../src/server/demo";
import {
  analyzeRepository,
  DEMO_ID,
  getExercise,
  getFlow,
  getLesson,
  locateChanges,
  getQuiz,
} from "../src/server/service";
import { getStore } from "../src/server/store";

async function main() {
  const url = process.argv[2];
  if (!url) throw new Error("사용법: npm run demo:build -- https://github.com/owner/repo");
  delete process.env.DATABASE_URL; // 메모리 저장소로만 만든다

  const { analysis } = await analyzeRepository(url);
  console.log(`분석 완료: ${analysis.repository.id} @ ${analysis.repository.commit_sha}, 기능 ${analysis.features.length}개`);
  if (analysis.features.length < 2) throw new Error("데모에는 기능 카드가 2개 이상 필요해요. 다른 샘플 저장소를 골라 주세요.");

  const artifacts: Record<string, unknown> = {};
  for (const f of analysis.features) {
    artifacts[`${f.id}:flow`] = await getFlow(analysis.id, f.id);
    artifacts[`${f.id}:lesson`] = await getLesson(analysis.id, f.id);
    artifacts[`${f.id}:quiz`] = await getQuiz(analysis.id, f.id);
    artifacts[`${f.id}:exercise`] = await getExercise(analysis.id, f.id);
    console.log(`  ${f.id} ${f.title}: 흐름·학습·퀴즈·미션 생성`);
  }

  for (const query of analysis.locate_examples) {
    const result = await locateChanges(analysis.id, query);
    if (result.locations.length === 0) throw new Error(`데모 예시의 코드 위치를 찾지 못했어요: ${query}`);
    artifacts[`locate:${result.query}`] = result;
    console.log(`  위치 찾기: ${query}, ${result.locations.length}곳`);
  }

  const stored = await getStore().getAnalysis(analysis.id);
  if (!stored) throw new Error("분석 결과를 다시 읽지 못했어요.");
  const demo: DemoData = {
    stored: { analysis: { ...stored.analysis, id: DEMO_ID, mode: "demo" }, snapshot: stored.snapshot },
    artifacts,
  };
  mkdirSync(dirname(demoPath()), { recursive: true });
  writeFileSync(demoPath(), JSON.stringify(demo, null, 2) + "\n");
  console.log(`저장: ${demoPath()}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? `${err.name}: ${err.message}` : err);
  process.exit(1);
});
