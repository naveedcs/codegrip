import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import * as path from "path";
import test from "node:test";

import {
  buildAgentReadinessRadar,
  buildReadinessAnalytics
} from "../services/readinessAnalyticsService";

test("buildAgentReadinessRadar scores repo guidance and test signal", () => {
  const radar = buildAgentReadinessRadar({
    systemReadiness: [
      readiness(".codegrip/agent-protocol.md", "Protocol", "ready"),
      readiness(".codegrip/architecture.md", "Architecture", "needs-detail"),
      readiness(".codegrip/conventions.md", "Conventions", "ready"),
      readiness(".codegrip/risk-rules.json", "Risk rules", "missing")
    ],
    agentFiles: [
      readiness("AGENTS.md", "AGENTS", "ready"),
      readiness("CLAUDE.md", "Claude", "warning")
    ],
    diffRisk: {
      state: "reviewed",
      changedFileCount: 2,
      testsChanged: true,
      matchingTestsChanged: true
    }
  });

  assert.equal(radar.find((metric) => metric.id === "protocol")?.score, 100);
  assert.equal(radar.find((metric) => metric.id === "architecture")?.status, "warning");
  assert.equal(radar.find((metric) => metric.id === "risk-rules")?.score, 0);
  assert.equal(radar.find((metric) => metric.id === "agent-files")?.detail, "1/2 synced");
  assert.equal(radar.find((metric) => metric.id === "test-signal")?.status, "ready");
});

test("buildReadinessAnalytics reads local release and false-positive signals", async () => {
  const workspaceRoot = await mkdtemp(path.join(tmpdir(), "codegrip-analytics-"));

  try {
    await mkdir(path.join(workspaceRoot, "docs/sprints"), { recursive: true });
    await mkdir(path.join(workspaceRoot, "media/screenshots"), { recursive: true });
    await mkdir(path.join(workspaceRoot, ".codegrip/task-history"), {
      recursive: true
    });
    await writeFile(
      path.join(workspaceRoot, "docs/release-checklist.md"),
      [
        "# Release Checklist",
        "",
        "- [x] `npm run compile`",
        "- [ ] `npm run lint`",
        "- [ ] `npm test`",
        "- [ ] `npm run package`"
      ].join("\n"),
      "utf8"
    );
    await writeFile(
      path.join(workspaceRoot, "docs/sprints/task-tracker.md"),
      [
        "# Tracker",
        "",
        "- [x] Sprint 9 lint passes.",
        "- [x] Sprint 9 unit tests pass.",
        "- [x] Sprint 9 VSIX package builds.",
        "- [ ] Dogfood CodeGrip on at least two real repositories."
      ].join("\n"),
      "utf8"
    );
    await writeFile(
      path.join(workspaceRoot, "docs/dogfooding.md"),
      "- False positives: noisy config finding\n",
      "utf8"
    );
    await writeFile(
      path.join(workspaceRoot, "docs/false-positive-examples.md"),
      [
        "| Date | Repo | Finding | Why It Was Noisy | Action |",
        "| --- | --- | --- | --- | --- |",
        "| 2026-05-01 | test | Config warning | Fixture only | Tune glob |"
      ].join("\n"),
      "utf8"
    );
    await writeFile(
      path.join(workspaceRoot, ".codegrip/task-history/accepted-findings.md"),
      [
        "## 2026-05-01",
        "",
        "Accepted finding: Config changed",
        "Severity: high"
      ].join("\n"),
      "utf8"
    );
    await writeFile(
      path.join(workspaceRoot, "media/screenshots/dashboard.png"),
      "placeholder",
      "utf8"
    );
    await writeFile(
      path.join(workspaceRoot, "package.json"),
      "{\"license\":\"MIT\"}\n",
      "utf8"
    );
    await writeFile(path.join(workspaceRoot, "LICENSE"), "MIT\n", "utf8");
    await writeFile(
      path.join(workspaceRoot, "CHANGELOG.md"),
      "# Changelog\n\n- Initial beta notes.\n",
      "utf8"
    );

    const analytics = await buildReadinessAnalytics({
      workspaceRoot,
      systemReadiness: [
        readiness(".codegrip/agent-protocol.md", "Protocol", "ready"),
        readiness(".codegrip/architecture.md", "Architecture", "ready"),
        readiness(".codegrip/conventions.md", "Conventions", "ready"),
        readiness(".codegrip/risk-rules.json", "Risk rules", "ready")
      ],
      agentFiles: [readiness("AGENTS.md", "AGENTS", "ready")],
      diffRisk: {
        state: "clean"
      }
    });

    assert.equal(
      analytics.releaseBoard.find((item) => item.id === "compile")?.status,
      "ready"
    );
    assert.equal(
      analytics.releaseBoard.find((item) => item.id === "lint")?.status,
      "warning"
    );
    assert.equal(
      analytics.releaseBoard.find((item) => item.id === "screenshots")?.status,
      "ready"
    );
    assert.equal(
      analytics.releaseBoard.find((item) => item.id === "license")?.status,
      "ready"
    );
    assert.equal(analytics.falsePositiveTrend.acceptedFindingCount, 1);
    assert.equal(analytics.falsePositiveTrend.dogfoodingSignalCount, 1);
    assert.equal(analytics.falsePositiveTrend.loggedExampleCount, 1);
    assert.match(analytics.localSummary, /agent signals ready/u);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

function readiness(
  filePath: string,
  label: string,
  status: "ready" | "needs-detail" | "missing" | "warning"
) {
  return {
    label,
    path: filePath,
    status,
    detail: status === "ready" ? "Ready" : "Needs work"
  };
}
