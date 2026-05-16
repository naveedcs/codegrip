import type { OutputChannel } from "vscode";
import { commands, Uri, window, workspace } from "vscode";

import { getCodeGripConfig } from "../services/configService";
import { loadOrgTemplate } from "../services/orgTemplateService";
import type { PerformanceTracker } from "../services/performanceTracker";
import {
  createTeamPolicyPack,
  teamPolicyPackRelativePath
} from "../services/teamPolicyPackService";
import type { TemplateService } from "../services/templateService";
import { getWorkspaceInfo } from "../services/workspaceService";

export function registerCreateTeamPolicyPackCommand(
  output: OutputChannel,
  performanceTracker: PerformanceTracker,
  templateService: TemplateService
) {
  return commands.registerCommand("codegrip.createTeamPolicyPack", async () => {
    await performanceTracker.trackCommand(
      "codegrip.createTeamPolicyPack",
      async () => {
        const workspaceInfo = await getWorkspaceInfo();

        if (!workspaceInfo) {
          window.showErrorMessage(
            "CodeGrip needs an open workspace folder before it can create a team policy pack."
          );
          return;
        }

        const name = await promptRequired(
          "Team Policy Pack Name",
          "Name this policy pack."
        );

        if (!name) {
          return;
        }

        const description = await promptRequired(
          "Team Policy Pack Description",
          "Describe the team or workflow this policy pack supports."
        );

        if (!description) {
          return;
        }

        try {
          const config = getCodeGripConfig();
          const orgTemplate = await loadOrgTemplate(
            workspaceInfo.fsPath,
            templateService
          );
          const result = await createTeamPolicyPack({
            workspaceRoot: workspaceInfo.fsPath,
            name,
            description,
            reviewStrictness: config.reviewStrictness,
            llmReview: config.llmReview,
            orgTemplate
          });

          output.show(true);
          output.appendLine("");
          output.appendLine("CodeGrip Team Policy Pack");
          output.appendLine("=========================");
          output.appendLine(`Workspace: ${workspaceInfo.name}`);
          output.appendLine(`Path: ${result.relativePath}`);
          output.appendLine(`Status: ${result.status}`);
          output.appendLine(`Org template: ${orgTemplate.organizationName}`);
          output.appendLine(
            `Name: ${result.policyPack?.name ?? "(existing file left unchanged)"}`
          );
          output.appendLine(
            `LLM review enabled in pack: ${
              result.policyPack
                ? result.policyPack.proFeatures.llmReview.enabled
                  ? "yes"
                  : "no"
                : "(existing file left unchanged)"
            }`
          );

          const document = await workspace.openTextDocument(Uri.file(result.filePath));
          await window.showTextDocument(document, { preview: false });

          if (result.status === "skipped") {
            window.showWarningMessage(
              `CodeGrip found an existing ${teamPolicyPackRelativePath} and left it unchanged.`
            );
            return;
          }

          window.showInformationMessage(
            `CodeGrip created ${teamPolicyPackRelativePath}.`
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          output.show(true);
          output.appendLine("");
          output.appendLine("CodeGrip team policy pack creation failed");
          output.appendLine("=========================================");
          output.appendLine(message);
          window.showErrorMessage(
            `CodeGrip could not create the team policy pack: ${message}`
          );
        }
      }
    );
  });
}

async function promptRequired(
  title: string,
  prompt: string
): Promise<string | undefined> {
  const value = await window.showInputBox({
    title,
    prompt,
    ignoreFocusOut: true
  });
  const trimmed = value?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}
