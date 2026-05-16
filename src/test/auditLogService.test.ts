import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAuditLogExport,
  formatAuditLogExport
} from "../services/auditLogService";
import type { Finding } from "../types/findings";

const createdAt = new Date("2026-04-30T10:00:00.000Z");

test("buildAuditLogExport creates a stable JSON-ready audit format", () => {
  const exportData = buildAuditLogExport({
    workspaceName: "codegrip-test",
    exportedAt: createdAt,
    decisions: [
      {
        task: "Add diagnostics",
        decision: "Use VS Code diagnostics",
        reason: "Problems tab is native.",
        verification: "Unit tests passed.",
        createdAt
      }
    ],
    acceptedFindings: [
      {
        finding: createFinding(),
        task: "Add diagnostics",
        note: "Accepted for beta.",
        createdAt
      }
    ]
  });
  const formatted = formatAuditLogExport(exportData);

  assert.equal(exportData.schemaVersion, 1);
  assert.equal(exportData.workspaceName, "codegrip-test");
  assert.equal(exportData.decisions[0]?.createdAt, createdAt.toISOString());
  assert.equal(exportData.acceptedFindings[0]?.finding.title, "Auth flow changed");
  assert.match(formatted, /"schemaVersion": 1/u);
  assert.match(formatted, /"decision": "Use VS Code diagnostics"/u);
});

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
