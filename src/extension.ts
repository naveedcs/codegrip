import type { ExtensionContext } from "vscode";
import * as path from "path";
import { window, workspace } from "vscode";

import { registerAddDecisionLogEntryCommand } from "./commands/addDecisionLogEntry";
import { registerGeneratePromptCommand } from "./commands/generatePrompt";
import { registerInitializeRepoCommand } from "./commands/initializeRepo";
import { registerMarkFindingAcceptedCommand } from "./commands/markFindingAccepted";
import { registerOpenAgentProtocolCommand } from "./commands/openAgentProtocol";
import { registerOpenDashboardCommand } from "./commands/openDashboard";
import { registerOpenReviewDetailsCommand } from "./commands/openReviewDetails";
import { registerReviewDiffCommand } from "./commands/reviewDiff";
import { registerShowPerformanceReportCommand } from "./commands/showPerformanceReport";
import { registerSyncRulesCommand } from "./commands/syncRules";
import { CodeGripDiagnosticService } from "./services/diagnosticService";
import { createOutputChannel } from "./services/outputChannel";
import { PerformanceTracker } from "./services/performanceTracker";
import { ReviewWorkflowService } from "./services/reviewWorkflowService";
import { TemplateService } from "./services/templateService";
import { DashboardProvider } from "./webview/dashboardProvider";

export function activate(context: ExtensionContext): void {
  const activationTimer = PerformanceTracker.start("extension activation");
  const output = createOutputChannel();
  const performanceTracker = new PerformanceTracker(output);
  const templateService = new TemplateService(context.extensionUri);
  const diagnosticService = new CodeGripDiagnosticService();
  const reviewWorkflowService = new ReviewWorkflowService();

  output.appendLine("CodeGrip activated.");

  const dashboardProvider = new DashboardProvider(
    context.extensionUri,
    output,
    performanceTracker,
    templateService
  );

  context.subscriptions.push(
    output,
    window.registerWebviewViewProvider(
      DashboardProvider.viewType,
      dashboardProvider
    ),
    workspace.onDidChangeTextDocument((event) => {
      if (event.document.uri.scheme !== "file") {
        return;
      }

      const latestReview = reviewWorkflowService.getLatestReview();

      if (!latestReview) {
        return;
      }

      const relativePath = path.relative(
        latestReview.workspaceRoot,
        event.document.uri.fsPath
      );
      const isWorkspaceFile =
        relativePath.length > 0 &&
        !relativePath.startsWith("..") &&
        !path.isAbsolute(relativePath);

      if (!isWorkspaceFile) {
        return;
      }

      diagnosticService.clear();
      reviewWorkflowService.clearLatestReview();
    }),
    diagnosticService,
    registerOpenDashboardCommand(performanceTracker),
    registerOpenAgentProtocolCommand(performanceTracker),
    registerInitializeRepoCommand(output, performanceTracker, templateService),
    registerGeneratePromptCommand(output, performanceTracker, templateService),
    registerReviewDiffCommand(
      output,
      performanceTracker,
      templateService,
      diagnosticService,
      reviewWorkflowService
    ),
    registerSyncRulesCommand(output, performanceTracker, templateService),
    registerOpenReviewDetailsCommand(performanceTracker, reviewWorkflowService),
    registerMarkFindingAcceptedCommand(
      output,
      performanceTracker,
      reviewWorkflowService
    ),
    registerAddDecisionLogEntryCommand(output, performanceTracker),
    registerShowPerformanceReportCommand(performanceTracker)
  );

  performanceTracker.record(activationTimer);
}

export function deactivate(): void {
  // No cleanup is needed yet. Disposables are registered on the extension context.
}
