import * as path from "path";

const codeExtensions = new Set([
  ".c",
  ".cc",
  ".cpp",
  ".cs",
  ".css",
  ".go",
  ".h",
  ".java",
  ".js",
  ".jsx",
  ".kt",
  ".php",
  ".py",
  ".rb",
  ".rs",
  ".scss",
  ".swift",
  ".ts",
  ".tsx",
  ".vue",
  ".svelte"
]);

const documentationExtensions = new Set([
  ".adoc",
  ".md",
  ".mdx",
  ".rst",
  ".txt"
]);

const packageOrLockFiles = new Set([
  "bun.lockb",
  "cargo.lock",
  "composer.lock",
  "gemfile.lock",
  "go.mod",
  "go.sum",
  "package-lock.json",
  "package.json",
  "pnpm-lock.yaml",
  "poetry.lock",
  "requirements.txt",
  "yarn.lock"
]);

export function normalizeRepoPath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

export function isTestPath(filePath: string): boolean {
  const normalized = normalizeRepoPath(filePath).toLowerCase();
  const baseName = path.posix.basename(normalized);

  return (
    /(^|\/)(__tests__|tests?|specs?)(\/|$)/u.test(normalized) ||
    /\.(test|spec)\.[cm]?[jt]sx?$/u.test(baseName) ||
    /^test[_-]/u.test(baseName) ||
    /[_-]test\./u.test(baseName)
  );
}

export function isDocumentationPath(filePath: string): boolean {
  const normalized = normalizeRepoPath(filePath).toLowerCase();
  const extension = path.posix.extname(normalized);

  return normalized.startsWith("docs/") || documentationExtensions.has(extension);
}

export function isCodePath(filePath: string): boolean {
  const extension = path.posix.extname(normalizeRepoPath(filePath).toLowerCase());

  return codeExtensions.has(extension);
}

export function isPackageOrLockPath(filePath: string): boolean {
  const normalized = normalizeRepoPath(filePath).toLowerCase();
  const baseName = path.posix.basename(normalized);

  return packageOrLockFiles.has(baseName);
}
