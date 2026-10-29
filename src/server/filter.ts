// FR-02: 분석에 넣을 파일 고르기와 비밀값 가리기.

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "out",
  "coverage",
  ".vercel",
  ".turbo",
  ".cache",
  "vendor",
  "__pycache__",
]);

const LOCKFILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "bun.lock",
  "composer.lock",
  "Gemfile.lock",
  "poetry.lock",
  "Cargo.lock",
]);

const BINARY_EXT = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "svg", "avif",
  "mp3", "mp4", "mov", "webm", "wav", "ogg",
  "woff", "woff2", "ttf", "otf", "eot",
  "zip", "gz", "tar", "rar", "7z", "pdf",
  "exe", "dll", "so", "dylib", "wasm", "bin",
  "map",
]);

// 내용을 모델에 보내지 않는 민감 파일
const SENSITIVE_NAME = [
  /^\.env(\..*)?$/i,
  /\.(pem|key|p12|pfx|crt|cer|jks|keystore)$/i,
  /^id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/i,
  /^\.npmrc$/i,
  /^\.netrc$/i,
  /credentials?(\.json)?$/i,
  /service[-_]?account.*\.json$/i,
  /secrets?\.(json|ya?ml|toml)$/i,
];

export type SkipReason = "excluded_dir" | "lockfile" | "binary" | "sensitive" | "minified";

export function skipReason(path: string): SkipReason | null {
  const parts = path.split("/");
  const name = parts[parts.length - 1];
  // .env.example도 실제 값이 들어 있는 경우가 있어 함께 뺀다.
  if (SENSITIVE_NAME.some((re) => re.test(name))) return "sensitive";
  if (parts.slice(0, -1).some((p) => EXCLUDED_DIRS.has(p))) return "excluded_dir";
  if (LOCKFILES.has(name)) return "lockfile";
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  if (BINARY_EXT.has(ext)) return "binary";
  if (/\.min\.(js|css)$/i.test(name)) return "minified";
  return null;
}

// 저장소가 클 때 먼저 읽을 파일. 숫자가 작을수록 먼저.
export function priority(path: string): number {
  const lower = path.toLowerCase();
  const name = lower.split("/").pop()!;
  if (lower === "readme.md" || lower === "package.json") return 0;
  if (/(^|\/)(__tests__|__mocks__|tests?|e2e|specs?|docs?|examples?|fixtures?|__fixtures__|benchmarks?|scripts|config)\//.test(lower)
    || /\.(test|spec|stories)\./.test(name)) return 7;
  if (/(^|\/)(app|pages|src|components|lib|hooks|api|server|routes|actions|db|prisma|drizzle|store|utils|services)\//.test(lower)
    && /\.(tsx?|jsx?|mjs|cjs|vue|svelte|py|go|rb|java|kt|php|sql|prisma)$/.test(name)) return 1;
  if (/\.(tsx?|jsx?|mjs|cjs|vue|svelte|py|go|rb|java|kt|php|sql|prisma)$/.test(name)
    && !/\.config\./.test(name)) return 2;
  if (/^(next|vite|nuxt|svelte|astro|tailwind)\.config\./.test(name) || name === "tsconfig.json" || name === "package.json") return 3;
  if (/\.(css|scss|html)$/.test(name)) return 4;
  if (/\.(json|ya?ml|toml)$/.test(name)) return 5;
  if (/\.mdx?$/.test(name)) return 7;
  return 6;
}

export function looksBinary(content: string): boolean {
  return content.includes("\u0000");
}

const SECRET_PATTERNS: RegExp[] = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  /\bAKIA[0-9A-Z]{16}\b/g, // AWS access key
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g, // GitHub token
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/g,
  /\bsk-[A-Za-z0-9_-]{20,}\b/g, // OpenAI·Anthropic 등
  /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g, // Slack
  /\bAIza[0-9A-Za-z_-]{35}\b/g, // Google API key
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, // JWT
];

// key = "값" 꼴에서 이름이 비밀값처럼 보이면 값만 가린다.
const ASSIGNMENT =
  /((?:api[_-]?key|secret|token|password|passwd|private[_-]?key|access[_-]?key|client[_-]?secret)["']?\s*[:=]\s*)(["'`])([^"'`\n]{8,})\2/gi;

// 비밀값으로 보이는 문자열을 [REDACTED]로 바꾼다. 줄 수는 바뀌지 않아 라인 번호가 그대로 맞는다.
export function redactSecrets(content: string): { content: string; redacted: number } {
  let redacted = 0;
  let out = content;
  for (const re of SECRET_PATTERNS) {
    out = out.replace(re, (m) => {
      redacted++;
      // 여러 줄짜리(개인키)는 줄 수를 유지한다.
      return m.split("\n").map(() => "[REDACTED]").join("\n");
    });
  }
  out = out.replace(ASSIGNMENT, (_m, head: string, q: string) => {
    redacted++;
    return `${head}${q}[REDACTED]${q}`;
  });
  return { content: out, redacted };
}
