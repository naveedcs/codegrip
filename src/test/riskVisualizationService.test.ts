import assert from "node:assert/strict";
import test from "node:test";

import { buildRiskVisualization } from "../services/riskVisualizationService";
import type { RiskReview } from "../services/riskAnalyzer";
import type { ChangedFile, GitDiffSnapshot } from "../types/gitDiff";

test("buildRiskVisualization derives storyboard and active blast radius zones", () => {
  const visualization = buildRiskVisualization(
    createSnapshot([
      createChangedFile("src/auth/session.ts", { additions: 8 }),
      createChangedFile("src/auth/session.test.ts", { isTest: true }),
      createChangedFile("src/shared/logger.ts")
    ]),
    createReview()
  );

  assert.equal(visualization.storyboard.length, 4);
  assert.equal(visualization.storyboard[0]?.label, "Files touched");
  assert.match(visualization.storyboard[0]?.detail ?? "", /3 files/u);
  assert.equal(
    visualization.blastRadius.find((zone) => zone.id === "auth")?.active,
    true
  );
  assert.equal(
    visualization.blastRadius.find((zone) => zone.id === "auth")?.severity,
    "high"
  );
  assert.equal(
    visualization.blastRadius.find((zone) => zone.id === "shared")?.active,
    true
  );
  assert.equal(
    visualization.blastRadius.find((zone) => zone.id === "tests")?.fileCount,
    1
  );
});

test("buildRiskVisualization creates heat strip file severities", () => {
  const visualization = buildRiskVisualization(
    createSnapshot([
      createChangedFile("src/auth/session.ts", { additions: 8 }),
      createChangedFile("README.md")
    ]),
    createReview()
  );

  assert.equal(visualization.heatStrip[0]?.path, "src/auth/session.ts");
  assert.equal(visualization.heatStrip[0]?.severity, "high");
  assert.equal(visualization.heatStrip[1]?.severity, "low");
});

test("buildRiskVisualization handles clean low-risk reviews", () => {
  const visualization = buildRiskVisualization(createSnapshot([]), {
    riskScore: "low",
    changedFileCount: 0,
    additions: 0,
    deletions: 0,
    testsChanged: false,
    matchingTestsChanged: false,
    findings: [],
    suggestedChecks: []
  });

  assert.equal(visualization.heatStrip.length, 0);
  assert.equal(visualization.storyboard[0]?.active, false);
  assert.equal(
    visualization.blastRadius.every((zone) => zone.active === false),
    true
  );
});

function createReview(): RiskReview {
  return {
    riskScore: "high",
    changedFileCount: 3,
    additions: 10,
    deletions: 1,
    testsChanged: true,
    matchingTestsChanged: true,
    findings: [
      {
        id: "auth-change-requires-tests",
        severity: "high",
        title: "Auth flow changed",
        body: "Matched 1 file: src/auth/session.ts.",
        file: "src/auth/session.ts",
        whyItMatters: "Authentication changes can affect sign-in behavior.",
        suggestedAction: "Run auth tests."
      },
      {
        id: "shared-utility-change",
        severity: "medium",
        title: "Shared utility changed",
        body: "Matched 1 file: src/shared/logger.ts.",
        file: "src/shared/logger.ts",
        whyItMatters: "Shared code may have callers outside the visible task.",
        suggestedAction: "Search callers."
      }
    ],
    suggestedChecks: ["Run auth tests.", "Search callers."]
  };
}

function createSnapshot(changedFiles: readonly ChangedFile[]): GitDiffSnapshot {
  const additions = changedFiles.reduce((total, file) => total + file.additions, 0);
  const deletions = changedFiles.reduce((total, file) => total + file.deletions, 0);

  return {
    isGitRepo: true,
    repoRoot: "/tmp/codegrip-test",
    changedFiles,
    additions,
    deletions,
    binaryFileCount: changedFiles.filter((file) => file.isBinary).length,
    unstagedDiff: "",
    stagedDiff: "",
    combinedDiff: "",
    diffBytes: 0,
    diffTruncated: false,
    maxDiffBytes: 750_000
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
