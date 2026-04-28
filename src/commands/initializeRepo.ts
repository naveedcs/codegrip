import type { OutputChannel } from "vscode";
import { commands, window } from "vscode";

import {
  initializeRepo,
  writeInitializeRepoSummary
} from "../services/initializeRepoService";
import type { PerformanceTracker } from "../services/performanceTracker";
import type { TemplateService } from "../services/templateService";
import { getWorkspaceInfo } from "../services/workspaceService";

export function registerInitializeRepoCommand(
  output: OutputChannel,
  performanceTracker: PerformanceTracker,
  templateService: TemplateService
) {
  return commands.registerCommand("codegrip.initializeRepo", async () => {
    await performanceTracker.trackCommand("codegrip.initializeRepo", async () => {
      const workspaceInfo = await getWorkspaceInfo();

      if (!workspaceInfo) {
        window.showErrorMessage(
          "CodeGrip needs an open workspace folder before it can initialize repo files."
        );
        return;
      }

      if (!workspaceInfo.isWritable) {
        window.showErrorMessage(
          `CodeGrip cannot initialize ${workspaceInfo.name} because the workspace is not writable.`
        );
        return;
      }

      if (!workspaceInfo.isGitRepo) {
        window.showWarningMessage(
          "CodeGrip did not detect Git metadata. It will create local files, but diff review needs a Git repo."
        );
      }

      const result = await initializeRepo(workspaceInfo, templateService);
      writeInitializeRepoSummary(output, result);

      const createdCount = result.files.filter(
        (file) => file.status === "created"
      ).length;
      const updatedCount = result.files.filter(
        (file) => file.status === "updated"
      ).length;
      const skippedCount = result.files.filter(
        (file) => file.status === "skipped"
      ).length;

      window.showInformationMessage(
        `CodeGrip initialized ${result.workspaceName}: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped.`
      );
    });
  });
}
