import type { OutputChannel } from "vscode";
import { commands, window } from "vscode";

import type { PerformanceTracker } from "../services/performanceTracker";
import {
  syncAgentRuleFiles,
  writeAgentRuleSyncSummary
} from "../services/syncService";
import type { TemplateService } from "../services/templateService";
import { getWorkspaceInfo } from "../services/workspaceService";

export function registerSyncRulesCommand(
  output: OutputChannel,
  performanceTracker: PerformanceTracker,
  templateService: TemplateService
) {
  return commands.registerCommand("codegrip.syncAgentRuleFiles", async () => {
    await performanceTracker.trackCommand(
      "codegrip.syncAgentRuleFiles",
      async () => {
        const workspaceInfo = await getWorkspaceInfo();

        if (!workspaceInfo) {
          window.showErrorMessage(
            "CodeGrip needs an open workspace folder before it can sync agent rules."
          );
          return;
        }

        if (!workspaceInfo.isWritable) {
          window.showErrorMessage(
            `CodeGrip cannot sync agent rules for ${workspaceInfo.name} because the workspace is not writable.`
          );
          return;
        }

        const result = await syncAgentRuleFiles(workspaceInfo, templateService);
        writeAgentRuleSyncSummary(output, result);

        const updatedCount = result.files.filter(
          (file) => file.status === "updated"
        ).length;
        const createdCount = result.files.filter(
          (file) => file.status === "created"
        ).length;
        const skippedCount = result.files.filter(
          (file) => file.status === "skipped"
        ).length;

        window.showInformationMessage(
          `CodeGrip synced agent rules: ${createdCount} created, ${updatedCount} updated, ${skippedCount} unchanged.`
        );
      }
    );
  });
}
