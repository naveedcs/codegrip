import assert from "node:assert/strict";
import test from "node:test";

import { buildRiskDiagnosticData } from "../services/diagnosticModel";
import type { RiskReview } from "../services/riskAnalyzer";

test("buildRiskDiagnosticData converts file-backed findings into diagnostics", () => {
  const diagnostics = buildRiskDiagnosticData(
    createReview({
      findings: [
        {
          id: "auth-change",
          severity: "high",
          title: "Auth flow changed",
          body: "Matched 1 file: src/auth/session.ts.",
          file: "src/auth/session.ts",
          whyItMatters: "Auth changes can affect sign-in behavior.",
          suggestedAction: "Run auth tests."
        },
        {
          id: "repo-note",
          severity: "medium",
          title: "Repo-level note",
          body: "No file anchor.",
          whyItMatters: "This should stay in output only."
        }
      ]
    })
  );

  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0]?.file, "src/auth/session.ts");
  assert.equal(diagnostics[0]?.severity, "error");
  assert.equal(diagnostics[0]?.line, 0);
  assert.equal(diagnostics[0]?.code, "auth-change");
  assert.match(diagnostics[0]?.message ?? "", /Auth flow changed/u);
  assert.match(diagnostics[0]?.message ?? "", /Suggested action: Run auth tests/u);
});

test("buildRiskDiagnosticData maps medium and low severities", () => {
  const diagnostics = buildRiskDiagnosticData(
    createReview({
      findings: [
        {
          id: "missing-tests",
          severity: "medium",
          title: "No tests changed",
          body: "Code files changed.",
          file: "src/service.ts",
          line: 12,
          whyItMatters: "Reviewers need coverage evidence."
        },
        {
          id: "small-doc",
          severity: "low",
          title: "Docs changed",
          body: "Docs-only update.",
          file: "README.md",
          whyItMatters: "Docs should stay accurate."
        }
      ]
    })
  );

  assert.equal(diagnostics[0]?.severity, "warning");
  assert.equal(diagnostics[0]?.line, 11);
  assert.equal(diagnostics[1]?.severity, "information");
});

function createReview(
  partial: Pick<RiskReview, "findings">
): RiskReview {
  return {
    riskScore: "high",
    changedFileCount: 1,
    additions: 1,
    deletions: 0,
    testsChanged: false,
    matchingTestsChanged: false,
    suggestedChecks: [],
    ...partial
  };
}
