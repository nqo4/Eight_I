// AI가 말한 파일·라인을 실제로 받은 파일과 대조한다. 없는 파일이나 범위를 벗어난 라인은 응답에서 뺀다.
import type { CodeReference, Snapshot, SnapshotFile, StackItem } from "./types";

const MAX_REF_LINES = 60;

export type RawRef = { path: string; start_line: number; end_line: number };

export class SnapshotIndex {
  private byPath = new Map<string, { file: SnapshotFile; lines: string[]; specs?: string[] }>();

  constructor(
    readonly snapshot: Snapshot,
    readonly commitSha: string,
  ) {
    for (const file of snapshot.files) {
      this.byPath.set(file.path, { file, lines: file.content.split("\n") });
    }
  }

  has(path: string) {
    return this.byPath.has(normalizePath(path));
  }

  file(path: string) {
    return this.byPath.get(normalizePath(path))?.file;
  }

  // 검증된 참조만 돌려준다. 라인 범위가 파일 밖이면 null.
  ref(raw: RawRef): CodeReference | null {
    const entry = this.byPath.get(normalizePath(raw.path));
    if (!entry) return null;
    const count = entry.lines.length;
    const start = Math.trunc(raw.start_line);
    let end = Math.trunc(raw.end_line);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || start > count || end < start) {
      return null;
    }
    end = Math.min(end, count, start + MAX_REF_LINES - 1);
    return {
      path: entry.file.path,
      start_line: start,
      end_line: end,
      commit_sha: this.commitSha,
      snippet: entry.lines.slice(start - 1, end).join("\n"),
    };
  }

  refs(raws: RawRef[]): CodeReference[] {
    return raws.map((r) => this.ref(r)).filter((r): r is CodeReference => r !== null);
  }

  // FR-11: 바꿔야 하는 줄 앞뒤로 context줄씩 붙인 원래 코드. 줄 번호는 원래 파일 기준.
  excerpt(ref: { path: string; start_line: number; end_line: number }, context = 3): { start_line: number; lines: string[] } | null {
    const entry = this.byPath.get(normalizePath(ref.path));
    if (!entry) return null;
    const start = Math.max(1, ref.start_line - context);
    const end = Math.min(entry.lines.length, ref.end_line + context);
    return { start_line: start, lines: entry.lines.slice(start - 1, end) };
  }

  // 파일 전체를 가리키는 참조(라인 1~끝, 최대 MAX_REF_LINES줄)
  wholeFile(path: string): CodeReference | null {
    const entry = this.byPath.get(normalizePath(path));
    if (!entry) return null;
    return this.ref({ path, start_line: 1, end_line: entry.lines.length });
  }

  // from 파일이 to 파일을 상대 경로나 @/ 별칭으로 import하는지 정적으로 확인한다.
  imports(fromPath: string, toPath: string): boolean {
    const from = this.byPath.get(normalizePath(fromPath));
    if (!from) return false;
    const target = stripExt(normalizePath(toPath));
    const dir = from.file.path.split("/").slice(0, -1).join("/");
    from.specs ??= importSpecifiers(from.file.content);
    for (const spec of from.specs) {
      let resolved: string | null = null;
      if (spec.startsWith(".")) resolved = joinPath(dir, spec);
      else if (spec.startsWith("@/") || spec.startsWith("~/")) resolved = spec.slice(2);
      else if (spec.startsWith("src/") || spec.startsWith("app/")) resolved = spec;
      if (!resolved) continue;
      const r = stripExt(resolved);
      if (r === target || `${r}/index` === target || r === `src/${target}` || `src/${r}` === target) return true;
    }
    return false;
  }

  // 모델에 보낼 파일 본문. 각 줄 앞에 라인 번호를 붙여 모델이 정확한 라인을 고르게 한다.
  formatFiles(paths: string[], maxBytes: number): string {
    const parts: string[] = [];
    let total = 0;
    for (const p of paths) {
      const entry = this.byPath.get(normalizePath(p));
      if (!entry) continue;
      const body = entry.lines.map((l, i) => `${i + 1}| ${l}`).join("\n");
      const block = `<file path="${entry.file.path}" lines="${entry.lines.length}">\n${body}\n</file>`;
      if (total + block.length > maxBytes) continue;
      parts.push(block);
      total += block.length;
    }
    return parts.join("\n\n");
  }

  paths(): string[] {
    return [...this.byPath.keys()];
  }

  // 기능 상세를 만들 때 근거 파일과 그 파일이 import하는 파일까지 넣는다.
  relatedPaths(seed: string[]): string[] {
    const out = new Set(seed.map(normalizePath).filter((p) => this.byPath.has(p)));
    for (const p of [...out]) {
      for (const other of this.byPath.keys()) {
        if (!out.has(other) && this.imports(p, other)) out.add(other);
      }
    }
    return [...out];
  }
}

// 실제 코드에 있는 import·require·export ... from의 경로만 모은다(#12).
// 주석이나 문자열 안에 import처럼 적힌 글자는 실행되지 않으므로 연결 근거로 쓰지 않는다.
const IMPORT_RE = /(?<![\w$.])(?:import\s[^'"]*?from\s*|import\s*\(\s*|require\s*\(\s*|export\s[^'"]*?from\s*)(['"])/g;

export function importSpecifiers(source: string): string[] {
  const masked = maskNonCode(source);
  const out: string[] = [];
  for (const m of masked.matchAll(IMPORT_RE)) {
    const open = m.index + m[0].length - 1;
    const close = source.indexOf(m[1], open + 1);
    const spec = close > open ? source.slice(open + 1, close) : "";
    if (spec && !spec.includes("\n")) out.push(spec);
  }
  return out;
}

// 주석은 공백으로, 문자열·템플릿·정규식의 글자는 따옴표만 남기고 공백으로 바꾼다. 위치와 줄바꿈은 그대로 둔다.
// 템플릿의 ${...} 안은 실행되는 코드라 그대로 둔다. 문자열은 줄을 넘지 않으므로 JSX 글의 작은따옴표(Don't)가
// 뒤쪽 코드까지 문자열로 잘못 읽게 두지 않고 그 줄에서 끊는다. 정확한 파서가 아니라서 애매하면 연결을 놓치는 쪽(inferred)으로 둔다.
export function maskNonCode(src: string): string {
  const out = src.split("");
  const n = src.length;
  const blank = (i: number) => {
    if (out[i] !== "\n") out[i] = " ";
  };
  const templates: number[] = []; // 열린 ${ 마다 그때의 중괄호 깊이
  let depth = 0;
  let prev = ""; // 정규식과 나눗셈을 가르려고 앞의 의미 있는 토큰을 기억한다
  let i = 0;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "/") {
      while (i < n && src[i] !== "\n") blank(i++);
      continue;
    }
    if (c === "/" && d === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end < 0 ? n : end + 2;
      while (i < stop) blank(i++);
      continue;
    }
    if (c === "'" || c === '"') {
      i++;
      while (i < n && src[i] !== c && src[i] !== "\n") {
        if (src[i] === "\\" && i + 1 < n && src[i + 1] !== "\n") blank(i++);
        blank(i++);
      }
      if (src[i] === c) i++;
      prev = "a";
      continue;
    }
    if (c === "`" || (c === "}" && templates.length > 0 && templates[templates.length - 1] === depth)) {
      if (c === "}") templates.pop();
      i++;
      while (i < n && src[i] !== "`" && !(src[i] === "$" && src[i + 1] === "{")) {
        if (src[i] === "\\" && i + 1 < n) blank(i++);
        blank(i++);
      }
      if (src[i] === "$") {
        templates.push(depth);
        i += 2;
        prev = "(";
      } else {
        i++;
        prev = "a";
      }
      continue;
    }
    if (c === "/" && regexAllowed(prev)) {
      i++;
      let inClass = false;
      while (i < n && src[i] !== "\n" && (src[i] !== "/" || inClass)) {
        if (src[i] === "\\" && i + 1 < n && src[i + 1] !== "\n") blank(i++);
        else if (src[i] === "[") inClass = true;
        else if (src[i] === "]") inClass = false;
        blank(i++);
      }
      if (src[i] === "/") i++;
      prev = "a";
      continue;
    }
    if (/[\w$]/.test(c)) {
      let j = i;
      while (j < n && /[\w$]/.test(src[j])) j++;
      prev = src.slice(i, j);
      i = j;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return out.join("");
}

const REGEX_AFTER_WORD = new Set(["return", "typeof", "instanceof", "in", "of", "new", "delete", "void", "throw", "case", "do", "else", "yield", "await"]);

function regexAllowed(prev: string) {
  if (prev === "") return true;
  if (/^[\w$]/.test(prev)) return REGEX_AFTER_WORD.has(prev);
  return prev !== ")" && prev !== "]";
}

function normalizePath(p: string) {
  return p.trim().replace(/^\.?\//, "").replace(/\\/g, "/");
}

function stripExt(p: string) {
  return p.replace(/\.(tsx?|jsx?|mjs|cjs|vue|svelte)$/, "");
}

function joinPath(dir: string, rel: string) {
  const out = dir ? dir.split("/") : [];
  for (const seg of rel.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") out.pop();
    else out.push(seg);
  }
  return out.join("/");
}

// FR-04 '사용한 기술'의 근거: package.json에서 확인되는 기술만 confirmed로 둔다(근거 파일·라인 포함). FR-03 기술 스택 요약은 이 이름만 쓴다.
const KNOWN: { pkg: string; name: string }[] = [
  { pkg: "next", name: "Next.js" },
  { pkg: "react", name: "React" },
  { pkg: "vue", name: "Vue" },
  { pkg: "svelte", name: "Svelte" },
  { pkg: "vite", name: "Vite" },
  { pkg: "typescript", name: "TypeScript" },
  { pkg: "tailwindcss", name: "Tailwind CSS" },
  { pkg: "express", name: "Express" },
  { pkg: "prisma", name: "Prisma" },
  { pkg: "@prisma/client", name: "Prisma" },
  { pkg: "drizzle-orm", name: "Drizzle ORM" },
  { pkg: "@supabase/supabase-js", name: "Supabase" },
  { pkg: "firebase", name: "Firebase" },
  { pkg: "mongoose", name: "MongoDB (Mongoose)" },
  { pkg: "next-auth", name: "NextAuth" },
  { pkg: "zustand", name: "Zustand" },
  { pkg: "redux", name: "Redux" },
  { pkg: "@reduxjs/toolkit", name: "Redux Toolkit" },
  { pkg: "@tanstack/react-query", name: "TanStack Query" },
  { pkg: "axios", name: "Axios" },
  { pkg: "ai", name: "Vercel AI SDK" },
  { pkg: "openai", name: "OpenAI SDK" },
];

export function detectStack(index: SnapshotIndex): StackItem[] {
  const pkgFile = index.file("package.json");
  if (!pkgFile) return [];
  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try {
    pkg = JSON.parse(pkgFile.content);
  } catch {
    return [];
  }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const lines = pkgFile.content.split("\n");
  const seen = new Set<string>();
  const items: StackItem[] = [];
  for (const { pkg: name, name: label } of KNOWN) {
    if (!(name in deps) || seen.has(label)) continue;
    seen.add(label);
    const lineNo = lines.findIndex((l) => l.includes(`"${name}"`)) + 1;
    items.push({
      name: label,
      status: "confirmed",
      evidence: lineNo > 0 ? index.ref({ path: "package.json", start_line: lineNo, end_line: lineNo }) : null,
      note: `package.json에 ${name}@${deps[name]}`,
    });
  }
  return items;
}

export function isSupportedStack(stack: StackItem[]): boolean {
  return stack.some((s) => s.name === "React" || s.name === "Next.js");
}
