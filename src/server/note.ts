// F12: 학습 노트를 PDF로 만든다. 이미 저장된 분석 결과만 쓰고 AI·GitHub는 부르지 않는다(비용 0).
// 한글을 위해 나눔고딕(OFL, assets/fonts/OFL.txt)을 PDF에 넣는다.
import { join } from "node:path";
import PDFDocument from "pdfkit";
import type { Analysis, Lesson } from "./types";

const FONT_DIR = join(process.cwd(), "assets", "fonts");
const REGULAR = join(FONT_DIR, "NanumGothic-Regular.ttf");
const BOLD = join(FONT_DIR, "NanumGothic-Bold.ttf");

const LAYER: Record<string, string> = { ui: "화면", server: "서버", db: "DB", config: "설정", other: "확인 불가" };

export type NoteInput = { analysis: Analysis; lessons: Record<string, Lesson | null> };

export function noteFileName(analysis: Analysis): string {
  return `codeback-note-${analysis.repository.name}-${analysis.repository.commit_sha.slice(0, 7)}.pdf`;
}

export async function renderLearningNote({ analysis: a, lessons }: NoteInput): Promise<Uint8Array> {
  // font 옵션으로 처음부터 한글 글꼴을 쓴다(기본 Helvetica를 읽지 않게).
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    font: REGULAR,
    // 내려받은 파일을 기계로도 확인할 수 있게 저장소·commit·경로를 문서 정보(Keywords)에 함께 넣는다(흐름 테스트 S8).
    info: {
      Title: `CodeBack 학습 노트 - ${a.repository.id}`,
      Author: "CodeBack",
      Subject: `${a.repository.id} ${a.repository.commit_sha}`,
      Keywords: [
        a.repository.id,
        a.repository.commit_sha,
        ...a.overview.directories.map((d) => d.path),
        ...a.features.flatMap((f) => f.code_references.map((r) => r.path)),
      ].join(" "),
    },
  });
  doc.registerFont("regular", REGULAR);
  doc.registerFont("bold", BOLD);
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<void>((resolve) => doc.on("end", () => resolve()));

  const r = a.repository;
  const h1 = (t: string) => doc.font("bold").fontSize(20).fillColor("#1b1530").text(t).moveDown(0.4);
  const h2 = (t: string) => doc.moveDown(0.8).font("bold").fontSize(13).fillColor("#5b3df5").text(t).moveDown(0.3);
  const body = (t: string) => doc.font("regular").fontSize(10).fillColor("#1b1530").text(t, { lineGap: 2 });
  const muted = (t: string) => doc.font("regular").fontSize(9).fillColor("#6b6680").text(t, { lineGap: 2 });
  const bullet = (t: string) => doc.font("regular").fontSize(10).fillColor("#1b1530").text(`•  ${t}`, { indent: 6, lineGap: 2 });

  h1(`${r.name} 학습 노트`);
  muted("CodeBack 분석 결과");
  doc.moveDown(0.5);
  body(`저장소: ${r.url}`);
  body(`기본 브랜치: ${r.default_branch}`);
  body(`분석 기준 commit: ${r.commit_sha}`);
  if (r.last_commit_at) body(`최종 수정: ${new Date(r.last_commit_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}`);
  body(`분석한 파일: ${a.stats.included_files}개 / 전체 ${a.stats.total_files}개`);

  h2("프로젝트 소개");
  body(a.overview.summary);
  if (a.overview.purpose) muted(a.overview.purpose);
  const sources = a.overview.intro_sources ?? [];
  muted(
    sources.length > 0
      ? `소개 근거: ${sources.join(", ")}${a.overview.intro_inferred ? " (AI 추정)" : ""}`
      : "README 없이 코드로 추정한 소개예요 (AI 추정)",
  );

  h2("사용한 기술");
  const techs = a.overview.technologies ?? [];
  for (const s of a.overview.stack) {
    const where = s.evidence ? `${s.evidence.path}:${s.evidence.start_line}` : "근거 파일 확인 불가";
    const t = techs.find((x) => x.name.toLowerCase() === s.name.toLowerCase());
    bullet(`${s.name} (${s.status === "confirmed" ? where : "확인 불가"})${t?.role ? ` — ${t.role}` : ""}`);
    if (t?.concept) muted(`     핵심 개념: ${t.concept}`);
    for (const u of t?.references ?? []) muted(`     쓰인 곳: ${u.path}:${u.start_line}–${u.end_line}`);
  }

  if (a.overview.directories.length > 0) {
    h2("폴더 역할");
    for (const d of a.overview.directories) bullet(`${d.path} [${LAYER[d.layer ?? "other"] ?? d.layer}] — ${d.role}`);
  }

  h2("기능과 근거 파일");
  if (a.features.length === 0) body(a.features_notice ?? "기능을 찾지 못했어요.");
  for (const f of a.features) {
    doc.moveDown(0.3).font("bold").fontSize(11).fillColor("#1b1530").text(`${f.id}. ${f.title}`);
    muted(f.summary);
    for (const ref of f.code_references) bullet(`${ref.path} : ${ref.start_line}–${ref.end_line}`);
    const lesson = lessons[f.id];
    if (lesson) {
      doc.moveDown(0.2);
      body(`배운 내용: ${lesson.overview}`);
      for (const c of lesson.concepts) bullet(`${c.name} — ${c.why_needed}`);
      for (const w of lesson.design_reasons ?? []) bullet(`왜 이렇게 만들었나: ${w.reason}${w.inferred ? " (AI 추정)" : ""}`);
    }
  }

  doc.moveDown(1);
  muted("이 노트의 파일 경로와 라인은 위 commit 기준이에요. 이후 저장소가 바뀌면 위치가 달라질 수 있어요.");
  doc.end();
  await done;
  return new Uint8Array(Buffer.concat(chunks));
}
