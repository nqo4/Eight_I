// 코드 발췌의 문법 색 구분과 언어 이름. 배경은 어두운 코드 블록 그대로 두고 글자 색만 나눈다.
// 발췌는 파일의 일부라 완전한 파서 대신, 줄을 넘는 주석·문자열까지 이어서 읽는 가벼운 토큰 분리만 한다.

type Kind = "plain" | "keyword" | "type" | "function" | "string" | "number" | "operator" | "punct" | "comment" | "tag";
type Token = { text: string; kind: Kind };

const color: Record<Kind, string> = {
  plain: "text-[#E6E6EF]",
  keyword: "text-[#82AAFF]",
  type: "text-[#7FDBCA]",
  function: "text-[#F07178]",
  string: "text-[#C3E88D]",
  number: "text-[#E68AC0]",
  operator: "text-[#E5B37A]",
  punct: "text-[#9AA0B4]",
  comment: "text-[#6E7591] italic",
  tag: "text-[#FF9CAC]",
};

type Lang = { name: string; line: string[]; block: [string, string] | null; keywords: Set<string>; tags?: boolean };

const words = (s: string) => new Set(s.split(" "));
const JS = words(
  "import export from as default const let var function return if else for while do switch case break continue new this super class extends implements interface type enum async await yield try catch finally throw typeof instanceof in of void delete null undefined true false public private protected readonly static declare namespace satisfies keyof",
);
const PRIMITIVES = words("string number boolean any unknown never object symbol bigint void");

const langs: Record<string, Lang> = {
  ts: { name: "TypeScript", line: ["//"], block: ["/*", "*/"], keywords: JS },
  tsx: { name: "TSX", line: ["//"], block: ["/*", "*/"], keywords: JS, tags: true },
  js: { name: "JavaScript", line: ["//"], block: ["/*", "*/"], keywords: JS },
  jsx: { name: "JSX", line: ["//"], block: ["/*", "*/"], keywords: JS, tags: true },
  json: { name: "JSON", line: [], block: null, keywords: words("true false null") },
  css: { name: "CSS", line: [], block: ["/*", "*/"], keywords: words("@import @media @tailwind @apply @theme @layer !important") },
  py: { name: "Python", line: ["#"], block: null, keywords: words("def class return if elif else for while import from as with try except finally raise lambda yield pass break continue in is not and or None True False async await") },
  sql: { name: "SQL", line: ["--"], block: ["/*", "*/"], keywords: words("select from where insert into values update set delete create table index primary key references not null unique default and or on join left inner order by group limit as distinct returning if exists") },
  prisma: { name: "Prisma", line: ["//"], block: null, keywords: words("model enum generator datasource") },
  yaml: { name: "YAML", line: ["#"], block: null, keywords: words("true false null") },
  sh: { name: "Shell", line: ["#"], block: null, keywords: words("if then else fi for do done export echo cd") },
  html: { name: "HTML", line: [], block: ["<!--", "-->"], keywords: new Set(), tags: true },
  text: { name: "Text", line: [], block: null, keywords: new Set() },
};

const byExt: Record<string, string> = {
  ts: "ts", mts: "ts", cts: "ts", tsx: "tsx", js: "js", mjs: "js", cjs: "js", jsx: "jsx",
  json: "json", css: "css", scss: "css", py: "py", sql: "sql", prisma: "prisma",
  yml: "yaml", yaml: "yaml", sh: "sh", html: "html",
};

function langOf(path: string): Lang {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return langs[byExt[ext] ?? "text"];
}

export function languageName(path: string) {
  return langOf(path).name;
}

const OPS = "=+-*/%<>!&|^~?:";
const PUNCT = "(){}[];,.";

function tokenize(code: string, lang: Lang): Token[] {
  const out: Token[] = [];
  const push = (text: string, kind: Kind) => text && out.push({ text, kind });
  const sql = lang === langs.sql;
  let i = 0;
  while (i < code.length) {
    const rest = code.slice(i);
    const c = code[i];
    const lineStart = lang.line.find((m) => rest.startsWith(m));
    if (lineStart) {
      const end = code.indexOf("\n", i);
      const j = end < 0 ? code.length : end;
      push(code.slice(i, j), "comment");
      i = j;
      continue;
    }
    if (lang.block && rest.startsWith(lang.block[0])) {
      const end = code.indexOf(lang.block[1], i + lang.block[0].length);
      const j = end < 0 ? code.length : end + lang.block[1].length;
      push(code.slice(i, j), "comment");
      i = j;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < code.length && code[j] !== c) {
        if (code[j] === "\\") j++;
        else if (code[j] === "\n" && c !== "`") break;
        j++;
      }
      j = Math.min(j + 1, code.length);
      push(code.slice(i, j), "string");
      i = j;
      continue;
    }
    if (/[0-9]/.test(c) && !/[\w$]/.test(code[i - 1] ?? "")) {
      const m = /^(0x[\da-f]+|\d[\d_]*(\.\d+)?(e[+-]?\d+)?n?)/i.exec(rest)!;
      push(m[0], "number");
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_$@]/.test(c)) {
      const m = /^[@A-Za-z_$][\w$-]*/.exec(rest)!;
      let word = m[0];
      // 하이픈은 CSS 속성 이름에서만 단어에 포함한다.
      if (lang !== langs.css && word.includes("-")) word = word.slice(0, word.indexOf("-"));
      const next = code.slice(i + word.length).trimStart();
      let kind: Kind = "plain";
      // JSX·HTML 태그 이름은 '<' 바로 뒤에 붙어 있다('a < b' 비교식과 구분).
      const before = code.slice(0, i).trimEnd();
      const prevWord = /[\w$]+$/.exec(before)?.[0];
      // 타입 자리: ': T', '<T', 'A | T', 'new T', 'extends T' 등. 화면 글자(JSX 텍스트)와 구분한다.
      const typeSpot = /[:<|&,]$/.test(before) || ["new", "extends", "implements", "as", "type", "interface", "class"].includes(prevWord ?? "");
      if (lang.tags && /<\/?$/.test(code.slice(Math.max(0, i - 2), i))) kind = "tag";
      // JSX 속성 이름(type="..." 등)은 키워드가 아니다.
      else if (lang.tags && /^=[^=]/.test(next)) kind = "plain";
      else if (lang.keywords.has(sql ? word.toLowerCase() : word)) kind = "keyword";
      else if (PRIMITIVES.has(word) && lang.keywords === JS) kind = "type";
      else if (next.startsWith("(")) kind = "function";
      else if (/^[A-Z]/.test(word) && lang.keywords === JS && typeSpot) kind = "type";
      else if (lang === langs.json && next.startsWith(":")) kind = "keyword";
      push(word, kind);
      i += word.length;
      continue;
    }
    if (OPS.includes(c)) {
      let j = i;
      while (j < code.length && OPS.includes(code[j])) j++;
      push(code.slice(i, j), "operator");
      i = j;
      continue;
    }
    if (PUNCT.includes(c)) {
      push(c, "punct");
      i++;
      continue;
    }
    let j = i + 1;
    while (j < code.length && !/[\w$@"'`0-9]/.test(code[j]) && !OPS.includes(code[j]) && !PUNCT.includes(code[j]) && !code.startsWith("//", j) && !code.startsWith("/*", j) && !code.startsWith("#", j) && !code.startsWith("--", j) && !code.startsWith("<!--", j)) j++;
    push(code.slice(i, j), "plain");
    i = j;
  }
  return out;
}

// 줄 단위로 나눈 토큰. 여러 줄 주석·문자열도 줄마다 같은 색으로 이어진다.
export function highlightLines(code: string, path: string): Token[][] {
  const lines: Token[][] = [[]];
  for (const t of tokenize(code, langOf(path))) {
    t.text.split("\n").forEach((part, k) => {
      if (k > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ text: part, kind: t.kind });
    });
  }
  return lines;
}

// as="code": 줄 번호 span 옆에 놓일 때 쓴다. 토큰이 span이면 'span:first-child'로 줄 번호를 읽는 쪽(E2E S7)이 토큰까지 읽는다.
export function Tokens({ tokens, as: Tag = "span" }: { tokens: Token[]; as?: "span" | "code" }) {
  return (
    <>
      {tokens.map((t, i) => (
        <Tag key={i} className={color[t.kind]}>
          {t.text}
        </Tag>
      ))}
    </>
  );
}

// 사진처럼 코드 블록 위쪽에 붙는 언어 이름 표시.
export function LanguageTag({ path }: { path: string }) {
  return (
    <span data-testid="code-language" className="rounded-8 border border-surface/15 bg-surface/5 px-2 py-0.5 font-sans text-[11px] font-bold text-surface/80">
      {languageName(path)}
    </span>
  );
}
