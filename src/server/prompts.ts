// AI에게 받을 결과 모양(zod 스키마)과 요청 문장. 받은 결과의 파일·라인은 evidence.ts에서 다시 검증한다.
import { z } from "zod";

const ref = z.object({
  path: z.string(),
  start_line: z.number().int(),
  end_line: z.number().int(),
});

export const overviewSchema = z.object({
  summary: z.string().describe("프로젝트 한 줄 소개(40자 안팎)"),
  purpose: z.string().describe("이 앱이 무엇을 하는지 2~3문장"),
  unconfirmed_stack: z
    .array(z.object({ name: z.string(), note: z.string() }))
    .describe("코드에서 쓰는 흔적은 있지만 설정 파일로 확인하지 못한 기술(예: 배포 환경, DB). 없으면 빈 배열"),
  directories: z.array(z.object({ path: z.string(), role: z.string() })).describe("주요 폴더와 역할, 최대 8개"),
  features: z
    .array(
      z.object({
        title: z.string().describe("사용자가 화면에서 알아볼 수 있는 기능 이름(예: 로그인, 상품 검색)"),
        summary: z.string().describe("한 줄 설명"),
        evidence: z.array(ref).describe("이 기능을 구현한 파일과 라인 범위, 1~4개"),
      }),
    )
    .describe("코드 근거가 있는 사용자 기능 최대 5개. 근거가 없으면 빈 배열"),
  features_notice: z.string().nullable().describe("기능을 찾지 못했다면 그 이유, 찾았으면 null"),
});

export function overviewPrompt(meta: string, files: string) {
  return `아래 GitHub 저장소를 분석해 프로젝트 개요와 사용자 기능 목록을 만들어라.
- 폴더 구조를 나열하는 대신, 사용자가 화면에서 알아볼 수 있는 기능을 찾는다.
- 각 기능에는 그 기능을 실제로 구현한 파일과 라인 범위를 근거로 붙인다.
- 근거를 찾지 못한 기능은 넣지 않는다.

${meta}

${files}`;
}

export const flowSchema = z.object({
  steps: z
    .array(
      z.object({
        layer: z.enum(["ui", "state_logic", "api", "data", "config", "other"]),
        title: z.string(),
        description: z.string().describe("이 단계에서 일어나는 일, 초보자 눈높이 1~2문장"),
        reference: ref,
      }),
    )
    .describe("사용자 동작부터 결과까지 순서대로 2~6단계"),
});

export const lessonSchema = z.object({
  overview: z.string().describe("이 기능이 사용자에게 어떤 결과를 만드는지"),
  file_roles: z.array(z.object({ path: z.string(), role: z.string() })),
  code_explanations: z.array(z.object({ reference: ref, explanation: z.string() })).describe("중요한 코드 2~4곳"),
  concepts: z
    .array(
      z.object({
        name: z.string().describe("실제 코드에 쓰인 개념(예: React state, 이벤트 처리, API 요청)"),
        why_needed: z.string().describe("이 서비스에서 왜 필요한가"),
        explanation: z.string(),
        easy_explanation: z.string().describe("비유를 써서 아주 쉽게 푼 설명"),
        references: z.array(ref).describe("이 개념이 쓰인 실제 코드 1~3곳"),
      }),
    )
    .describe("코드에 실제로 있는 개념만 2~4개"),
});

export const quizSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        choices: z.array(z.string()).describe("보기 3~4개"),
        answer_index: z.number().int().describe("정답 보기의 0부터 시작하는 번호"),
        explanation: z.string().describe("왜 정답인지, 오답은 왜 틀렸는지"),
        references: z.array(ref).describe("답의 근거가 되는 코드 1~2곳"),
      }),
    )
    .describe("이 기능의 코드에 대한 객관식 1~3문제. 일반 상식 문제는 내지 않는다"),
});

export const exerciseSchema = z.object({
  kind: z.enum(["modify", "observe"]).describe("안전한 작은 수정 과제를 낼 근거가 부족하면 observe"),
  instruction: z.string().describe("구체적인 변경 목표 한두 문장"),
  targets: z.array(ref).describe("수정할 것으로 예상되는 위치 1~3곳"),
  hints: z
    .object({
      minimal: z.string().describe("방향만 알려 주는 최소 힌트"),
      concept: z.string().describe("필요한 개념 힌트"),
      code: z.string().describe("어느 코드를 보면 되는지 알려 주는 힌트(정답 코드는 쓰지 않음)"),
    })
    .describe("단계별 힌트"),
  acceptance_checks: z.array(z.string()).describe("사용자가 직접 확인할 성공 조건 2~4개"),
});

export function featurePrompt(task: string, feature: { title: string; summary: string }, files: string) {
  return `기능 "${feature.title}"(${feature.summary})에 대해 ${task}

${files}`;
}
