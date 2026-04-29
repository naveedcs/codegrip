import type { OutputChannel } from "vscode";

import {
  isCodePath,
  isDocumentationPath,
  isPackageOrLockPath,
  normalizeRepoPath
} from "./pathClassifier";
import type { Finding, RiskSeverity } from "../types/findings";
import type { ChangedFile, GitDiffSnapshot } from "../types/gitDiff";
import type { RiskRule } from "../types/rules";

export type RiskReview = {
  readonly riskScore: RiskSeverity;
  readonly changedFileCount: number;
  readonly additions: number;
  readonly deletions: number;
  readonly testsChanged: boolean;
  readonly matchingTestsChanged: boolean;
  readonly findings: readonly Finding[];
  readonly suggestedChecks: readonly string[];
};

const severityRank: Record<RiskSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3
};

const genericPathTokens = new Set([
  "app",
  "client",
  "common",
  "component",
  "components",
  "controller",
  "data",
  "helper",
  "helpers",
  "index",
  "lib",
  "main",
  "model",
  "page",
  "pages",
  "route",
  "routes",
  "server",
  "service",
  "services",
  "shared",
  "src",
  "test",
  "tests",
  "type",
  "types",
  "util",
  "utils"
]);

export function analyzeGitDiff(
  snapshot: GitDiffSnapshot,
  rules: readonly RiskRule[]
): RiskReview {
  const changedFiles = snapshot.changedFiles;
  const testFiles = changedFiles.filter((file) => file.isTest);
  const sourceFiles = changedFiles.filter(
    (file) => !file.isTest && isCodePath(file.path)
  );
  const findings: Finding[] = [];
  const docsOnly =
    changedFiles.length > 0 &&
    changedFiles.every((file) => isDocumentationPath(file.path));

  for (const rule of rules) {
    const matchedFiles = changedFiles.filter((file) =>
      rule.matchPaths.some((pattern) => matchesGlob(pattern, file.path))
    );

    if (matchedFiles.length === 0) {
      continue;
    }

    findings.push({
      id: rule.id,
      severity: rule.severity,
      title: rule.title,
      body: `Matched ${formatFileCount(matchedFiles.length)}: ${formatFileList(matchedFiles)}.`,
      file: matchedFiles[0]?.path,
      whyItMatters: rule.message,
      suggestedAction: rule.suggestedAction
    });

    const matchedSourceFiles = matchedFiles.filter(
      (file) => !file.isTest && isCodePath(file.path)
    );

    if (
      rule.requireTests === true &&
      matchedSourceFiles.length > 0 &&
      !matchedSourceFiles.some((file) => hasMatchingTestChanged(file, testFiles))
    ) {
      findings.push({
        id: `${rule.id}-missing-tests`,
        severity:
          rule.severity === "critical" || rule.severity === "high"
            ? "critical"
            : "high",
        title: "Matching test update not detected",
        body: `No changed test file appears to match ${formatFileList(matchedSourceFiles)}.`,
        file: matchedSourceFiles[0]?.path,
        whyItMatters:
          "High-risk behavior can regress silently when the related tests do not move with the code.",
        suggestedAction:
          rule.suggestedAction ??
          "Add or update a focused regression test for the changed behavior."
      });
    }
  }

  if (!docsOnly && sourceFiles.length > 0 && testFiles.length === 0) {
    findings.push({
      id: "code-change-without-tests",
      severity: "medium",
      title: "No tests changed",
      body: "Code files changed, but no test files were changed in the current diff.",
      file: sourceFiles[0]?.path,
      whyItMatters:
        "Without a nearby test update, reviewers have less evidence that the changed behavior is covered.",
      suggestedAction:
        "Run the closest existing tests or add focused coverage before landing."
    });
  }

  if (changedFiles.length >= 15) {
    findings.push({
      id: "large-diff",
      severity: changedFiles.length >= 30 ? "high" : "medium",
      title: "Large diff",
      body: `${changedFiles.length} files changed in the current diff.`,
      file: changedFiles[0]?.path,
      whyItMatters:
        "Large diffs are harder to review and can hide unrelated behavior changes.",
      suggestedAction:
        "Split unrelated changes or add a review note explaining the shared reason for the file set."
    });
  }

  const packageOrLockFiles = changedFiles.filter((file) =>
    isPackageOrLockPath(file.path)
  );

  if (packageOrLockFiles.length > 0) {
    findings.push({
      id: "package-or-lock-change",
      severity: "medium",
      title: "Dependency or package metadata changed",
      body: `Changed ${formatFileCount(packageOrLockFiles.length)}: ${formatFileList(packageOrLockFiles)}.`,
      file: packageOrLockFiles[0]?.path,
      whyItMatters:
        "Dependency and package metadata changes can affect install, build, runtime, or packaging behavior.",
      suggestedAction:
        "Run install/build verification and check that lockfile changes are expected."
    });
  }

  if (containsSecretLikeAddition(snapshot.combinedDiff)) {
    findings.push({
      id: "secret-like-addition",
      severity: "critical",
      title: "Possible secret added",
      body: "The diff includes an added line that looks like a credential or secret assignment.",
      whyItMatters:
        "Secrets committed to source control can expose user data, production systems, or third-party accounts.",
      suggestedAction:
        "Remove the secret, rotate it if it was real, and use environment-specific secret storage."
    });
  }

  const matchingTestsChanged = sourceFiles.some((file) =>
    hasMatchingTestChanged(file, testFiles)
  );
  const suggestedChecks = buildSuggestedChecks(findings, changedFiles);

  return {
    riskScore: scoreFindings(findings),
    changedFileCount: changedFiles.length,
    additions: snapshot.additions,
    deletions: snapshot.deletions,
    testsChanged: testFiles.length > 0,
    matchingTestsChanged,
    findings,
    suggestedChecks
  };
}

export function writeRiskReviewSummary(
  output: OutputChannel,
  snapshot: GitDiffSnapshot,
  review: RiskReview
): void {
  output.show(true);
  output.appendLine("");
  output.appendLine("CodeGrip Git Diff Review");
  output.appendLine("========================");
  output.appendLine(`Git repo: ${snapshot.repoRoot ?? "not detected"}`);
  output.appendLine(`Risk: ${capitalize(review.riskScore)}`);
  output.appendLine(
    `Changed files: ${review.changedFileCount} (+${review.additions} / -${review.deletions})`
  );
  output.appendLine(`Tests changed: ${review.testsChanged ? "yes" : "no"}`);
  output.appendLine(
    `Matching tests changed: ${review.matchingTestsChanged ? "yes" : "no"}`
  );
  output.appendLine("");

  if (snapshot.changedFiles.length > 0) {
    output.appendLine("Changed files:");

    for (const file of snapshot.changedFiles) {
      const testMarker = file.isTest ? " test" : "";
      output.appendLine(
        `- ${file.path} (${file.status}, +${file.additions} / -${file.deletions}${testMarker})`
      );
    }

    output.appendLine("");
  }

  if (review.findings.length === 0) {
    output.appendLine("Findings:");
    output.appendLine("No system-level issues found.");
  } else {
    output.appendLine("Findings:");

    review.findings.forEach((finding, index) => {
      output.appendLine(`${index + 1}. [${finding.severity}] ${finding.title}`);

      if (finding.file) {
        output.appendLine(`   File: ${finding.file}`);
      }

      output.appendLine(`   ${finding.body}`);
      output.appendLine(`   Why it matters: ${finding.whyItMatters}`);

      if (finding.suggestedAction) {
        output.appendLine(`   Suggested action: ${finding.suggestedAction}`);
      }
    });
  }

  if (review.suggestedChecks.length > 0) {
    output.appendLine("");
    output.appendLine("Suggested checks:");

    for (const check of review.suggestedChecks) {
      output.appendLine(`- ${check}`);
    }
  }
}

function matchesGlob(pattern: string, filePath: string): boolean {
  const normalizedPattern = normalizeRepoPath(pattern).toLowerCase();
  const normalizedFilePath = normalizeRepoPath(filePath).toLowerCase();

  return (
    globToRegExp(normalizedPattern).test(normalizedFilePath) ||
    matchesWildcardKeyword(normalizedPattern, normalizedFilePath)
  );
}

function globToRegExp(pattern: string): RegExp {
  const segments = pattern.split("/");
  let source = "^";

  segments.forEach((segment, index) => {
    if (segment === "**") {
      source += index === segments.length - 1 ? "(?:/.*)?" : "(?:.*/)?";
      return;
    }

    if (index > 0 && segments[index - 1] !== "**") {
      source += "/";
    }

    source += segmentToRegExp(segment);
  });

  source += "$";
  return new RegExp(source, "u");
}

function matchesWildcardKeyword(pattern: string, filePath: string): boolean {
  const keywordMatches = pattern.matchAll(/\*([a-z0-9_-]{3,})\*/gu);

  for (const match of keywordMatches) {
    if (match[1] && filePath.includes(match[1])) {
      return true;
    }
  }

  return false;
}

function segmentToRegExp(segment: string): string {
  return segment
    .replace(/[|\\{}()[\]^$+?.]/gu, "\\$&")
    .replace(/\*/gu, "[^/]*");
}

function hasMatchingTestChanged(
  sourceFile: ChangedFile,
  testFiles: readonly ChangedFile[]
): boolean {
  const sourceTokens = extractPathTokens(sourceFile.path);

  return testFiles.some((testFile) => {
    const testTokens = extractPathTokens(testFile.path);

    return [...sourceTokens].some((token) => testTokens.has(token));
  });
}

function extractPathTokens(filePath: string): Set<string> {
  const normalized = normalizeRepoPath(filePath)
    .replace(/([a-z])([A-Z])/gu, "$1 $2")
    .toLowerCase();

  return new Set(
    normalized
      .split(/[^a-z0-9]+/u)
      .filter((token) => token.length > 2 && !genericPathTokens.has(token))
  );
}

function containsSecretLikeAddition(diff: string): boolean {
  return diff
    .split(/\r?\n/u)
    .some(
      (line) =>
        line.startsWith("+") &&
        !line.startsWith("+++") &&
        /\b(api[_-]?key|password|private[_-]?key|secret|token)\b/iu.test(
          line
        ) &&
        /[:=]/u.test(line)
    );
}

function scoreFindings(findings: readonly Finding[]): RiskSeverity {
  return findings.reduce<RiskSeverity>((highest, finding) => {
    return severityRank[finding.severity] > severityRank[highest]
      ? finding.severity
      : highest;
  }, "low");
}

function buildSuggestedChecks(
  findings: readonly Finding[],
  changedFiles: readonly ChangedFile[]
): readonly string[] {
  const checks = new Set<string>();

  for (const finding of findings) {
    if (finding.suggestedAction) {
      checks.add(finding.suggestedAction);
    }
  }

  if (changedFiles.some((file) => file.isTest)) {
    checks.add("Run the changed or closest matching tests.");
  }

  if (changedFiles.length === 0) {
    checks.add("Make or stage changes before running another diff review.");
  }

  return [...checks];
}

function formatFileList(files: readonly ChangedFile[]): string {
  const visibleFiles = files.slice(0, 4).map((file) => file.path);
  const remainingCount = files.length - visibleFiles.length;
  const suffix = remainingCount > 0 ? `, and ${remainingCount} more` : "";

  return `${visibleFiles.join(", ")}${suffix}`;
}

function formatFileCount(count: number): string {
  return count === 1 ? "1 file" : `${count} files`;
}

function capitalize(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
