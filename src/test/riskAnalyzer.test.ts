import assert from "node:assert/strict";
import test from "node:test";

import { analyzeGitDiff } from "../services/riskAnalyzer";
import type { ChangedFile, GitDiffSnapshot } from "../types/gitDiff";
import type { RiskRule } from "../types/rules";

const authRule: RiskRule = {
  id: "auth-change-requires-tests",
  title: "Auth flow changed",
  severity: "high",
  matchPaths: ["**/*auth*", "**/*session*"],
  message: "Authentication changes can affect login behavior.",
  suggestedAction: "Add or update auth regression tests.",
  requireTests: true
};

test("analyzeGitDiff escalates high-risk required-test rules when matching tests are absent", () => {
  const review = analyzeGitDiff(
    createSnapshot([
      createChangedFile("src/auth/session.ts", {
        additions: 12,
        deletions: 2
      })
    ]),
    [authRule]
  );

  assert.equal(review.riskScore, "critical");
  assert.equal(review.changedFileCount, 1);
  assert.equal(review.testsChanged, false);
  assert.equal(review.matchingTestsChanged, false);
  assert.ok(
    review.findings.some(
      (finding) => finding.id === "auth-change-requires-tests-missing-tests"
    )
  );
  assert.ok(
    review.suggestedChecks.includes("Add or update auth regression tests.")
  );
});

test("analyzeGitDiff detects matching tests and avoids missing-test escalation", () => {
  const review = analyzeGitDiff(
    createSnapshot([
      createChangedFile("src/auth/session.ts"),
      createChangedFile("src/auth/session.test.ts", { isTest: true })
    ]),
    [authRule]
  );

  assert.equal(review.riskScore, "high");
  assert.equal(review.testsChanged, true);
  assert.equal(review.matchingTestsChanged, true);
  assert.ok(
    !review.findings.some((finding) => finding.id.endsWith("-missing-tests"))
  );
  assert.ok(review.suggestedChecks.includes("Run the changed or closest matching tests."));
});

test("analyzeGitDiff treats docs-only changes as low risk without test findings", () => {
  const review = analyzeGitDiff(
    createSnapshot([
      createChangedFile("docs/sprints/sprint-5.md", {
        additions: 20,
        deletions: 0
      })
    ]),
    [authRule]
  );

  assert.equal(review.riskScore, "low");
  assert.deepEqual(review.findings, []);
});

test("analyzeGitDiff flags secret-like additions", () => {
  const review = analyzeGitDiff(
    createSnapshot(
      [createChangedFile("src/config.ts")],
      "+const apiKey = 'not-a-real-key';\n"
    ),
    []
  );

  assert.equal(review.riskScore, "critical");
  assert.ok(
    review.findings.some((finding) => finding.id === "secret-like-addition")
  );
});

test("analyzeGitDiff reports binary files and truncated diffs", () => {
  const review = analyzeGitDiff(
    createSnapshot(
      [
        createChangedFile("media/screenshot.png", {
          isBinary: true,
          additions: 0,
          deletions: 0
        })
      ],
      "",
      {
        diffBytes: 900_000,
        diffTruncated: true,
        maxDiffBytes: 750_000
      }
    ),
    [],
    {
      reviewStrictness: "strict"
    }
  );

  assert.equal(review.riskScore, "high");
  assert.ok(review.findings.some((finding) => finding.id === "binary-file-change"));
  assert.ok(review.findings.some((finding) => finding.id === "diff-truncated"));
});

test("analyzeGitDiff uses review strictness for generic missing-test findings", () => {
  const lenientReview = analyzeGitDiff(
    createSnapshot([createChangedFile("src/services/example.ts")]),
    [],
    {
      reviewStrictness: "lenient"
    }
  );
  const strictReview = analyzeGitDiff(
    createSnapshot([createChangedFile("src/services/example.ts")]),
    [],
    {
      reviewStrictness: "strict"
    }
  );

  assert.equal(
    lenientReview.findings.find((finding) => finding.id === "code-change-without-tests")
      ?.severity,
    "low"
  );
  assert.equal(
    strictReview.findings.find((finding) => finding.id === "code-change-without-tests")
      ?.severity,
    "high"
  );
});

function createSnapshot(
  changedFiles: readonly ChangedFile[],
  combinedDiff = "",
  overrides: Partial<GitDiffSnapshot> = {}
): GitDiffSnapshot {
  const additions = changedFiles.reduce((total, file) => total + file.additions, 0);
  const deletions = changedFiles.reduce((total, file) => total + file.deletions, 0);

  return {
    isGitRepo: true,
    repoRoot: "/tmp/codegrip-test",
    changedFiles,
    additions,
    deletions,
    binaryFileCount: changedFiles.filter((file) => file.isBinary).length,
    unstagedDiff: combinedDiff,
    stagedDiff: "",
    combinedDiff,
    diffBytes: Buffer.byteLength(combinedDiff, "utf8"),
    diffTruncated: false,
    maxDiffBytes: 750_000,
    ...overrides
  };
}

function createChangedFile(
  filePath: string,
  overrides: Partial<ChangedFile> = {}
): ChangedFile {
  return {
    path: filePath,
    status: "modified",
    additions: 1,
    deletions: 0,
    isTest: filePath.includes(".test."),
    isBinary: false,
    ...overrides
  };
}
