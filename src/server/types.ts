// API가 주고받는 데이터 모양. docs/problem.yaml의 interface_contracts를 따른다.
// 모든 코드 위치(CodeReference)는 서버가 실제로 받은 파일과 대조한 뒤에만 응답에 들어간다.

export type CodeReference = {
  path: string;
  start_line: number;
  end_line: number;
  commit_sha: string;
  // 실제 파일에서 잘라 온 해당 라인들. 서버가 채운다(AI가 쓴 문장이 아님).
  snippet: string;
};

export type Repository = {
  id: string; // "owner/repo"
  url: string;
  name: string;
  owner: string;
  default_branch: string;
  commit_sha: string;
  // 기본 브랜치 최신 commit의 시각(최종 수정 날짜). GitHub가 주지 않으면 null.
  last_commit_at: string | null;
  description: string | null;
};

export type SnapshotFile = {
  path: string;
  content: string; // 비밀값으로 보이는 부분은 [REDACTED]로 바뀐 상태
  size: number;
};

export type Snapshot = {
  files: SnapshotFile[];
  // 저장소 전체 파일 수, 분석에 넣은 수, 한도 때문에 뺀 수
  stats: {
    total_files: number;
    included_files: number;
    skipped_by_filter: number;
    skipped_by_limit: number;
    truncated_tree: boolean;
  };
};

export type StackItem = {
  name: string;
  status: "confirmed" | "unconfirmed"; // unconfirmed = 확인 불가
  evidence: CodeReference | null;
  note: string | null;
};

export type Overview = {
  summary: string; // 프로젝트 한 줄 소개
  purpose: string;
  stack: StackItem[];
  directories: { path: string; role: string }[];
  support: { status: "supported" | "limited"; reason: string | null };
};

export type Feature = {
  id: string; // "F1"...
  title: string;
  summary: string;
  code_references: CodeReference[];
};

export type Analysis = {
  id: string;
  mode: "repository" | "demo";
  created_at: string;
  repository: Repository;
  overview: Overview;
  features: Feature[];
  // 기능을 찾지 못했을 때 그 이유(FR-04). 기능이 있으면 null.
  features_notice: string | null;
  stats: Snapshot["stats"];
};

export type FlowStep = {
  order: number;
  layer: "ui" | "state_logic" | "api" | "data" | "config" | "other";
  title: string;
  description: string;
  reference: CodeReference;
};

export type FlowLink = {
  from: number; // FlowStep.order
  to: number;
  // verified: from 파일이 to 파일을 실제로 import한다. inferred: AI 추정이라 확정 화살표로 그리지 않는다.
  confidence: "verified" | "inferred";
};

export type Flow = {
  feature_id: string;
  steps: FlowStep[];
  links: FlowLink[];
};

export type Lesson = {
  feature_id: string;
  overview: string; // 1. 이 기능이 사용자에게 만드는 결과
  file_roles: { path: string; role: string }[]; // 2. 파일 역할
  code_explanations: {
    // 3. 중요한 코드
    reference: CodeReference;
    explanation: string;
  }[];
  concepts: {
    // 4. 적용 개념
    name: string;
    why_needed: string;
    explanation: string;
    easy_explanation: string; // '쉬운 설명 펼치기'
    references: CodeReference[];
  }[];
};

export type Quiz = {
  feature_id: string;
  questions: {
    id: string;
    question: string;
    choices: string[];
    answer_index: number;
    explanation: string;
    references: CodeReference[];
  }[];
  disclaimer: string;
};

export type Exercise = {
  feature_id: string;
  kind: "modify" | "observe"; // observe: 안전한 수정 근거가 부족해 관찰 미션으로 바꾼 경우
  instruction: string;
  target_references: CodeReference[];
  hints: { level: "minimal" | "concept" | "code"; text: string }[];
  acceptance_checks: string[];
  disclaimer: string;
};

export type FeatureDetail = {
  analysis_id: string;
  feature: Feature;
};
