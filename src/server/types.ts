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
    // FR-02: .env·비밀키·인증서처럼 민감해서 AI 입력에서 뺀 파일 수(skipped_by_filter에 포함된 수)
    skipped_sensitive: number;
  };
};

// FR-03·FR-11에서 쓰는 화면·서버·DB 구분
export type Layer = "ui" | "server" | "db" | "config" | "other";

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
  // FR-03: 폴더 역할. layer는 화면·서버·DB·설정 구분
  directories: { path: string; role: string; layer: Layer }[];
  support: { status: "supported" | "limited"; reason: string | null };
  // FR-03(2026-10-29 22:41 개정): 소개의 근거 파일(README 등). README 없이 코드로만 추정하면 intro_inferred=true('AI 추정')
  intro_sources?: string[];
  intro_inferred?: boolean;
  // FR-04 '사용한 기술': 기술마다 이 프로젝트에서 맡은 역할, 핵심 개념 설명, 쓰인 코드 위치(검증된 경로·라인)
  technologies?: { name: string; role: string; concept: string; references: CodeReference[] }[];
};

export type Feature = {
  id: string; // "F1"...
  title: string;
  summary: string;
  code_references: CodeReference[];
};

export type Analysis = {
  id: string;
  mode: "repository" | "demo"; // demo = 샘플로 체험하기(로그인 없이 보는 미리 분석한 샘플)
  created_at: string;
  repository: Repository;
  overview: Overview;
  features: Feature[];
  // 기능을 찾지 못했을 때 그 이유(FR-04). 기능이 있으면 null.
  features_notice: string | null;
  stats: Snapshot["stats"];
  // FR-11: '어디를 고쳐야 해?' 입력란 아래 이 저장소에 맞는 예시 문장
  locate_examples: string[];
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
  // FR-06: '왜 이렇게 만들었나'. 코드로 확인할 수 없는 이유는 inferred=true('AI 추정')
  design_reasons: { reason: string; reference: CodeReference | null; inferred: boolean }[];
  // FR-06 기능 설명을 쉽게: 사용자가 하는 행동 → 바뀌기 전/후 → 관련 코드 한 줄(팀원 배포본의 설명 방식)
  walkthrough?: { action: string; before: string; after: string; key_line: CodeReference | null };
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

// FR-11 고칠 위치 찾기 결과. 코드는 보여 주지 않고 위치와 이유만 준다.
export type LocateResult = {
  query: string;
  locations: {
    reference: CodeReference; // 바꿔야 하는 줄(하이라이트할 범위)
    layer: "ui" | "server" | "db";
    reason: string;
    // 원래 코드의 앞뒤 몇 줄. reference 범위의 줄을 하이라이트해서 보여 준다(고친 코드는 주지 않음).
    excerpt?: { start_line: number; lines: string[] };
  }[];
  // 찾지 못했을 때 안내 문구. 찾았으면 null
  notice: string | null;
};
