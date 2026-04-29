import type { OutputChannel } from "vscode";
import { commands, window } from "vscode";

import type { CodeGripDiagnosticService } from "../services/diagnosticService";
import type { PerformanceTracker } from "../services/performanceTracker";
import { readCurrentGitDiff } from "../services/gitService";
import {
  analyzeGitDiff,
  writeRiskReviewSummary
} from "../services/riskAnalyzer";
import type { ReviewWorkflowService } from "../services/reviewWorkflowService";
import { loadRiskRules } from "../services/ruleService";
import type { TemplateService } from "../services/templateService";
import { getWorkspaceInfo } from "../services/workspaceService";

export function registerReviewDiffCommand(
  output: OutputChannel,
  performanceTracker: PerformanceTracker,
  templateService: TemplateService,
  diagnosticService: CodeGripDiagnosticService,
  reviewWorkflowService: ReviewWorkflowService
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
        diagnosticService.clear();
        reviewWorkflowService.clearLatestReview();
        return;
      }

      if (!snapshot.isGitRepo) {
        window.showErrorMessage(
          "CodeGrip could not detect a Git repository for the current workspace."
        );
        diagnosticService.clear();
        reviewWorkflowService.clearLatestReview();
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
        diagnosticService.clear();
        reviewWorkflowService.clearLatestReview();
        return;
      }

      const review = analyzeGitDiff(snapshot, rules);
      writeRiskReviewSummary(output, snapshot, review);
      const diagnosticCount = diagnosticService.applyReview(
        workspaceInfo.fsPath,
        review
      );
      reviewWorkflowService.setLatestReview({
        workspaceName: workspaceInfo.name,
        workspaceRoot: workspaceInfo.fsPath,
        snapshot,
        review,
        reviewedAt: new Date()
      });

      const message = `CodeGrip diff review complete: ${review.riskScore} risk across ${review.changedFileCount} changed files.`;
      output.appendLine("");
      output.appendLine(
        `Problems tab diagnostics: ${diagnosticCount} CodeGrip finding${diagnosticCount === 1 ? "" : "s"}`
      );

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
