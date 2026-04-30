import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import * as path from "path";
import test from "node:test";

import {
  appendAcceptedFindingEntry,
  appendDecisionLogEntry,
  formatAcceptedFindingEntry,
  formatDecisionLogEntry,
  formatReviewDetails,
  ReviewWorkflowService
} from "../services/reviewWorkflowService";
import type { Finding } from "../types/findings";

const createdAt = new Date("2026-04-29T12:34:56.000Z");

test("ReviewWorkflowService stores and clears the latest review", () => {
  const service = new ReviewWorkflowService();
  const latestReview = createLatestReview();

  assert.equal(service.getLatestReview(), undefined);

  service.setLatestReview(latestReview);
  assert.equal(service.getLatestReview(), latestReview);

  service.clearLatestReview();
  assert.equal(service.getLatestReview(), undefined);
});

test("formatDecisionLogEntry renders local decision details", () => {
  const entry = formatDecisionLogEntry({
    task: "Add diagnostics",
    decision: "Keep diagnostics local-only",
    reason: "No telemetry is needed for MVP review workflow.",
    verification: "Unit tests passed.",
    createdAt
  });

  assert.match(entry, /## 2026-04-29/u);
  assert.match(entry, /Task: Add diagnostics/u);
  assert.match(entry, /Decision: Keep diagnostics local-only/u);
  assert.match(entry, /Verification: Unit tests passed\./u);
});

test("formatAcceptedFindingEntry omits optional empty fields", () => {
  const entry = formatAcceptedFindingEntry({
    finding: createFinding(),
    createdAt
  });

  assert.match(entry, /Accepted finding: Auth flow changed/u);
  assert.match(entry, /Severity: high/u);
  assert.doesNotMatch(entry, /Task:/u);
  assert.doesNotMatch(entry, /Note:/u);
});

test("formatReviewDetails summarizes findings and suggested checks", () => {
  const details = formatReviewDetails(createLatestReview());

  assert.match(details, /# CodeGrip Review Details/u);
  assert.match(details, /Workspace: codegrip-test/u);
  assert.match(details, /Risk: high/u);
  assert.match(details, /src\/auth\/session\.ts/u);
  assert.match(details, /Run auth tests/u);
});

test("appendDecisionLogEntry and appendAcceptedFindingEntry create local files", async () => {
  const workspaceRoot = await mkdtemp(path.join(tmpdir(), "codegrip-review-"));

  try {
    await mkdir(path.join(workspaceRoot, ".codegrip"), { recursive: true });

    const decisionPath = await appendDecisionLogEntry(workspaceRoot, {
      task: "Add workflow",
      decision: "Use Markdown",
      reason: "It is repo-local and easy to inspect.",
      verification: "Read file after append.",
      createdAt
    });
    const acceptedPath = await appendAcceptedFindingEntry(workspaceRoot, {
      finding: createFinding(),
      task: "Add workflow",
      note: "Covered by manual verification.",
      createdAt
    });

    assert.equal(
      decisionPath,
      path.join(workspaceRoot, ".codegrip/decision-log.md")
    );
    assert.equal(
      acceptedPath,
      path.join(workspaceRoot, ".codegrip/task-history/accepted-findings.md")
    );
    assert.match(await readFile(decisionPath, "utf8"), /Decision: Use Markdown/u);
    assert.match(await readFile(acceptedPath, "utf8"), /Note: Covered by manual verification/u);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

function createLatestReview(): Parameters<ReviewWorkflowService["setLatestReview"]>[0] {
  return {
    workspaceName: "codegrip-test",
    workspaceRoot: "/tmp/codegrip-test",
    reviewedAt: createdAt,
    snapshot: {
      isGitRepo: true,
      repoRoot: "/tmp/codegrip-test",
      changedFiles: [
        {
          path: "src/auth/session.ts",
          status: "modified",
          additions: 2,
          deletions: 1,
          isTest: false,
          isBinary: false
        }
      ],
      additions: 2,
      deletions: 1,
      binaryFileCount: 0,
      unstagedDiff: "",
      stagedDiff: "",
      combinedDiff: "",
      diffBytes: 0,
      diffTruncated: false,
      maxDiffBytes: 750_000
    },
    review: {
      riskScore: "high",
      changedFileCount: 1,
      additions: 2,
      deletions: 1,
      testsChanged: false,
      matchingTestsChanged: false,
      findings: [createFinding()],
      suggestedChecks: ["Run auth tests."]
    }
  };
}

function createFinding(): Finding {
  return {
    id: "auth-change",
    severity: "high",
    title: "Auth flow changed",
    body: "Matched 1 file: src/auth/session.ts.",
    file: "src/auth/session.ts",
    whyItMatters: "Authentication changes can affect sign-in behavior.",
    suggestedAction: "Run auth tests."
  };
}
