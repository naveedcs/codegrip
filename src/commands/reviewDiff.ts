import type { OutputChannel } from "vscode";
import { commands, window } from "vscode";

import type { PerformanceTracker } from "../services/performanceTracker";
import { readCurrentGitDiff } from "../services/gitService";
import {
  analyzeGitDiff,
  writeRiskReviewSummary
} from "../services/riskAnalyzer";
import { loadRiskRules } from "../services/ruleService";
import type { TemplateService } from "../services/templateService";
import { getWorkspaceInfo } from "../services/workspaceService";

export function registerReviewDiffCommand(
  output: OutputChannel,
  performanceTracker: PerformanceTracker,
  templateService: TemplateService
) {
  return commands.registerCommand("codegrip.reviewDiff", async () => {
    await performanceTracker.trackCommand("codegrip.reviewDiff", async () => {
      const workspaceInfo = await getWorkspaceInfo();

      if (!workspaceInfo) {
        window.showErrorMessage(
          "CodeGrip needs an open workspace folder before it can review a Git diff."
        );
        return;
      }

      let snapshot: Awaited<ReturnType<typeof readCurrentGitDiff>>;

      try {
        snapshot = await readCurrentGitDiff(workspaceInfo.fsPath);
      } catch (error) {
        const message = formatUnknownError(error);
        output.show(true);
        output.appendLine("");
        output.appendLine("CodeGrip Git diff read failed");
        output.appendLine("=============================");
        output.appendLine(message);
        window.showErrorMessage(
          `CodeGrip could not read the current Git diff: ${message}`
        );
        return;
      }

      if (!snapshot.isGitRepo) {
        window.showErrorMessage(
          "CodeGrip could not detect a Git repository for the current workspace."
        );
        return;
      }

      let rules: Awaited<ReturnType<typeof loadRiskRules>>;

      try {
        rules = await loadRiskRules(workspaceInfo.fsPath, templateService);
      } catch (error) {
        const message = formatUnknownError(error);
        output.show(true);
        output.appendLine("");
        output.appendLine("CodeGrip risk rule load failed");
        output.appendLine("==============================");
        output.appendLine(message);
        window.showErrorMessage(`CodeGrip could not load risk rules: ${message}`);
        return;
      }

      const review = analyzeGitDiff(snapshot, rules);
      writeRiskReviewSummary(output, snapshot, review);

      const message = `CodeGrip diff review complete: ${review.riskScore} risk across ${review.changedFileCount} changed files.`;

      if (review.riskScore === "critical") {
        window.showErrorMessage(message);
        return;
      }

      if (review.riskScore === "high") {
        window.showWarningMessage(message);
        return;
      }

      window.showInformationMessage(message);
    });
  });
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
