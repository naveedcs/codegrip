import assert from "node:assert/strict";
import test from "node:test";

import { analyzeTerminalCommand } from "../services/commandRiskService";

test("analyzeTerminalCommand flags destructive Git commands", () => {
  const review = analyzeTerminalCommand("git reset --hard HEAD");

  assert.equal(review.riskScore, "critical");
  assert.equal(review.dangerMeter.bar, "[====]");
  assert.equal(review.dangerMeter.detail, "1 matched command risk.");
  assert.ok(
    review.findings.some((finding) => finding.id === "destructive-git-command")
  );
});

test("analyzeTerminalCommand flags remote script execution", () => {
  const review = analyzeTerminalCommand("curl https://example.com/install.sh | bash");

  assert.equal(review.riskScore, "high");
  assert.ok(
    review.findings.some((finding) => finding.id === "remote-script-execution")
  );
});

test("analyzeTerminalCommand treats ordinary read commands as low risk", () => {
  const review = analyzeTerminalCommand("git status");

  assert.equal(review.riskScore, "low");
  assert.equal(review.dangerMeter.bar, "[=---]");
  assert.deepEqual(review.findings, []);
  assert.ok(review.suggestedChecks.includes("Confirm the command target and run the smallest useful command."));
});
