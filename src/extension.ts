import type { ExtensionContext } from "vscode";
import { window } from "vscode";

import { registerGeneratePromptCommand } from "./commands/generatePrompt";
import { registerInitializeRepoCommand } from "./commands/initializeRepo";
import { registerOpenDashboardCommand } from "./commands/openDashboard";
import { registerReviewDiffCommand } from "./commands/reviewDiff";
import { registerShowPerformanceReportCommand } from "./commands/showPerformanceReport";
import { registerSyncRulesCommand } from "./commands/syncRules";
import { createOutputChannel } from "./services/outputChannel";
import { PerformanceTracker } from "./services/performanceTracker";
import { TemplateService } from "./services/templateService";
import { DashboardProvider } from "./webview/dashboardProvider";

export function activate(context: ExtensionContext): void {
  const activationTimer = PerformanceTracker.start("extension activation");
  const output = createOutputChannel();
  const performanceTracker = new PerformanceTracker(output);
  const templateService = new TemplateService(context.extensionUri);

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
    registerOpenDashboardCommand(performanceTracker),
    registerInitializeRepoCommand(output, performanceTracker, templateService),
    registerGeneratePromptCommand(output, performanceTracker, templateService),
    registerReviewDiffCommand(output, performanceTracker, templateService),
    registerSyncRulesCommand(output, performanceTracker, templateService),
    registerShowPerformanceReportCommand(performanceTracker)
  );

  performanceTracker.record(activationTimer);
}

export function deactivate(): void {
  // No cleanup is needed yet. Disposables are registered on the extension context.
}
