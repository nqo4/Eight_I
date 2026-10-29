// 백엔드 기능의 본체. 웹 프레임워크와 상관없이 호출할 수 있다(Next.js 라우트는 이 함수를 부르기만 한다).
import { randomUUID } from "node:crypto";
import { generate } from "./ai";
import { config } from "./config";
import { getDemo } from "./demo";
import { AppError } from "./errors";
import { detectStack, isSupportedStack, SnapshotIndex } from "./evidence";
import { fetchRepository } from "./github";
import {
  exerciseSchema,
  featurePrompt,
  flowSchema,
  lessonSchema,
  overviewPrompt,
  overviewSchema,
  quizSchema,
} from "./prompts";
import { getStore, type StoredAnalysis } from "./store";
import type { Analysis, Exercise, Feature, FeatureDetail, Flow, Lesson, Quiz, StackItem } from "./types";

export const DEMO_ID = "demo";

// FR-01~04: 저장소를 읽고 개요와 기능 카드를 만든다.
export async function analyzeRepository(url: string): Promise<{ analysis: Analysis; cached: boolean }> {
  const { repository, snapshot } = await fetchRepository(url);
  if (snapshot.files.length === 0) {
    throw new AppError("repo_empty", "분석할 수 있는 소스 파일을 찾지 못했어요.");
  }

  const store = getStore();
  const existing = await store.findByCommit(repository.id, repository.commit_sha);
  if (existing) return { analysis: existing.analysis, cached: true };

  const index = new SnapshotIndex(snapshot, repository.commit_sha);
  const confirmed = detectStack(index);
  const meta = [
    `저장소: ${repository.id} (기본 브랜치 ${repository.default_branch}, commit ${repository.commit_sha})`,
    repository.description ? `저장소 설명: ${repository.description}` : null,
    `설정 파일로 확인된 기술: ${confirmed.map((s) => s.name).join(", ") || "없음"}`,
    `전체 파일 ${snapshot.stats.total_files}개 중 ${snapshot.stats.included_files}개를 아래에 넣었다.`,
  ]
    .filter(Boolean)
    .join("\n");

  const out = await generate(
    overviewSchema,
    overviewPrompt(meta, index.formatFiles(index.paths(), config.maxTotalBytes * 2)),
  );

  const features: Feature[] = [];
  for (const f of out.features.slice(0, 5)) {
    const refs = index.refs(f.evidence);
    if (refs.length === 0) continue; // 근거가 확인되지 않은 기능은 뺀다(FR-04)
    features.push({ id: `F${features.length + 1}`, title: f.title, summary: f.summary, code_references: refs });
  }

  const stack: StackItem[] = [
    ...confirmed,
    ...out.unconfirmed_stack
      .filter((u) => !confirmed.some((c) => c.name.toLowerCase() === u.name.toLowerCase()))
      .map((u) => ({ name: u.name, status: "unconfirmed" as const, evidence: null, note: u.note })),
  ];
  const supported = isSupportedStack(confirmed);

  const analysis: Analysis = {
    id: randomUUID(),
    mode: "repository",
    created_at: new Date().toISOString(),
    repository,
    overview: {
      summary: out.summary,
      purpose: out.purpose,
      stack,
      directories: out.directories.filter((d) => index.paths().some((p) => p === d.path || p.startsWith(`${d.path.replace(/\/$/, "")}/`))),
      support: supported
        ? { status: "supported", reason: null }
        : { status: "limited", reason: "React/Next.js 프로젝트가 아니어서 분석 결과가 제한적일 수 있어요." },
    },
    features,
    features_notice:
      features.length > 0
        ? null
        : out.features_notice || "코드에서 근거를 확인할 수 있는 기능을 찾지 못했어요. 지원 범위(React/Next.js)를 확인해 주세요.",
    stats: snapshot.stats,
  };

  await store.saveAnalysis({ analysis, snapshot });
  return { analysis, cached: false };
}

async function load(analysisId: string): Promise<StoredAnalysis> {
  if (analysisId === DEMO_ID) return getDemo().stored;
  const stored = await getStore().getAnalysis(analysisId);
  if (!stored) throw new AppError("analysis_not_found", "분석 결과를 찾을 수 없어요. 저장소를 다시 분석해 주세요.");
  return stored;
}

export async function getAnalysis(analysisId: string): Promise<Analysis> {
  return (await load(analysisId)).analysis;
}

function findFeature(stored: StoredAnalysis, featureId: string): Feature {
  const feature = stored.analysis.features.find((f) => f.id === featureId);
  if (!feature) throw new AppError("feature_not_found", "해당 기능을 찾을 수 없어요.");
  return feature;
}

export async function getFeature(analysisId: string, featureId: string): Promise<FeatureDetail> {
  const stored = await load(analysisId);
  return { analysis_id: stored.analysis.id, feature: findFeature(stored, featureId) };
}

type Kind = "flow" | "lesson" | "quiz" | "exercise";

// 기능별 결과는 처음 한 번만 AI로 만들고 저장해 둔다. 데모는 미리 만든 결과만 쓴다.
async function cached<T>(analysisId: string, featureId: string, kind: Kind, build: (ctx: FeatureCtx) => Promise<T>): Promise<T> {
  const stored = await load(analysisId);
  const feature = findFeature(stored, featureId);
  const key = `${featureId}:${kind}`;
  if (analysisId === DEMO_ID) {
    const hit = getDemo().artifacts[key] as T | undefined;
    if (!hit) throw new AppError("demo_not_ready", "샘플 프로젝트에 이 내용이 아직 준비되지 않았어요.");
    return hit;
  }
  const store = getStore();
  const hit = await store.getArtifact<T>(analysisId, key);
  if (hit) return hit;
  const index = new SnapshotIndex(stored.snapshot, stored.analysis.repository.commit_sha);
  const paths = index.relatedPaths(feature.code_references.map((r) => r.path));
  const files = index.formatFiles(paths, config.featureContextBytes);
  const value = await build({ feature, index, files });
  await store.saveArtifact(analysisId, key, value);
  return value;
}

type FeatureCtx = { feature: Feature; index: SnapshotIndex; files: string };

// FR-05
export function getFlow(analysisId: string, featureId: string): Promise<Flow> {
  return cached(analysisId, featureId, "flow", async ({ feature, index, files }) => {
    const out = await generate(
      flowSchema,
      featurePrompt("사용자 동작부터 결과까지 코드가 어떤 순서로 이어지는지 단계별로 정리하라.", feature, files),
    );
    const steps = out.steps
      .map((s) => ({ ...s, reference: index.ref(s.reference) }))
      .filter((s): s is typeof s & { reference: NonNullable<typeof s.reference> } => s.reference !== null)
      .map((s, i) => ({ order: i + 1, layer: s.layer, title: s.title, description: s.description, reference: s.reference }));
    const links = steps.slice(1).map((s, i) => {
      const from = steps[i];
      const verified = from.reference.path === s.reference.path || index.imports(from.reference.path, s.reference.path);
      return { from: from.order, to: s.order, confidence: verified ? ("verified" as const) : ("inferred" as const) };
    });
    return { feature_id: feature.id, steps, links };
  });
}

// FR-06
export function getLesson(analysisId: string, featureId: string): Promise<Lesson> {
  return cached(analysisId, featureId, "lesson", async ({ feature, index, files }) => {
    const out = await generate(
      lessonSchema,
      featurePrompt(
        "초보자가 이해하도록 1) 기능 설명 2) 파일 역할 3) 중요한 코드 4) 적용 개념 순서로 설명하라. 개념은 실제 코드에 쓰인 것만 고른다.",
        feature,
        files,
      ),
    );
    return {
      feature_id: feature.id,
      overview: out.overview,
      file_roles: out.file_roles.filter((r) => index.has(r.path)),
      code_explanations: out.code_explanations
        .map((c) => ({ reference: index.ref(c.reference), explanation: c.explanation }))
        .filter((c): c is { reference: NonNullable<typeof c.reference>; explanation: string } => c.reference !== null),
      concepts: out.concepts
        .map((c) => ({ ...c, references: index.refs(c.references) }))
        .filter((c) => c.references.length > 0), // 실제 코드에 연결되지 않은 개념은 뺀다
    };
  });
}

// FR-07
export function getQuiz(analysisId: string, featureId: string): Promise<Quiz> {
  return cached(analysisId, featureId, "quiz", async ({ feature, index, files }) => {
    const out = await generate(quizSchema, featurePrompt("이해도를 확인하는 객관식 문제를 만들어라.", feature, files));
    const questions = out.questions
      .map((q) => ({ ...q, references: index.refs(q.references) }))
      .filter((q) => q.choices.length >= 2 && q.answer_index >= 0 && q.answer_index < q.choices.length && q.references.length > 0)
      .slice(0, 3)
      .map((q, i) => ({ id: `Q${i + 1}`, ...q }));
    return {
      feature_id: feature.id,
      questions,
      disclaimer: "퀴즈 결과는 이해도 확인용이며 실제 코드 수정 능력을 보장하지 않아요.",
    };
  });
}

// FR-08
export function getExercise(analysisId: string, featureId: string): Promise<Exercise> {
  return cached(analysisId, featureId, "exercise", async ({ feature, index, files }) => {
    const out = await generate(
      exerciseSchema,
      featurePrompt(
        "학습자가 자기 개발 환경에서 직접 해 볼 작고 안전한 코드 변경 과제를 하나 만들어라. 정답 코드는 쓰지 않는다.",
        feature,
        files,
      ),
    );
    const targets = index.refs(out.targets);
    const kind = targets.length === 0 ? "observe" : out.kind;
    return {
      feature_id: feature.id,
      kind,
      instruction: out.instruction,
      target_references: targets.length > 0 ? targets : feature.code_references,
      hints: [
        { level: "minimal", text: out.hints.minimal },
        { level: "concept", text: out.hints.concept },
        { level: "code", text: out.hints.code },
      ],
      acceptance_checks: out.acceptance_checks,
      disclaimer: "완료 체크는 자기 보고이며 실행 결과를 보증하지 않음",
    };
  });
}
