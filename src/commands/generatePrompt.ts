import type { OutputChannel } from "vscode";
import { commands, env, window, workspace } from "vscode";

import type { PerformanceTracker } from "../services/performanceTracker";
import { getCodeGripConfig } from "../services/configService";
import {
  agentTargets,
  buildSystemAwarePrompt,
  isAgentTarget,
  loadPromptContext,
  writePromptSummary
} from "../services/promptBuilder";
import type { AgentTarget, PromptBuildResult } from "../services/promptBuilder";
import type { TemplateService } from "../services/templateService";
import type { WorkspaceInfo } from "../services/workspaceService";
import { getWorkspaceInfo } from "../services/workspaceService";

export type GeneratePromptFromTaskInput = {
  readonly output: OutputChannel;
  readonly templateService: TemplateService;
  readonly workspaceInfo: WorkspaceInfo;
  readonly task: string;
  readonly target: AgentTarget;
};

export function registerGeneratePromptCommand(
  output: OutputChannel,
  performanceTracker: PerformanceTracker,
  templateService: TemplateService
) {
  return commands.registerCommand("codegrip.generatePrompt", async () => {
    await performanceTracker.trackCommand("codegrip.generatePrompt", async () => {
      const workspaceInfo = await getWorkspaceInfo();

      if (!workspaceInfo) {
        window.showErrorMessage(
          "CodeGrip needs an open workspace folder before it can generate a prompt."
        );
        return;
      }

      const task = await window.showInputBox({
        prompt: "Describe the task you want an agent to handle.",
        placeHolder: "Example: Fix password reset redirect and add coverage",
        ignoreFocusOut: true
      });

      if (!task || task.trim().length === 0) {
        return;
      }

      const config = getCodeGripConfig();
      const target = await window.showQuickPick(
        prioritizeTarget(config.defaultAgentTarget),
        {
          placeHolder: "Choose the agent target for this prompt",
          ignoreFocusOut: true
        }
      );

      if (!target || !isAgentTarget(target)) {
        return;
      }

      try {
        await generatePromptFromTask({
          output,
          templateService,
          workspaceInfo,
          task,
          target
        });
      } catch (error) {
        const message = formatUnknownError(error);
        output.show(true);
        output.appendLine("");
        output.appendLine("CodeGrip prompt generation failed");
        output.appendLine("=================================");
        output.appendLine(message);
        window.showErrorMessage(`CodeGrip could not generate a prompt: ${message}`);
        return;
      }

      window.showInformationMessage(
        `CodeGrip generated a ${target} prompt and copied it to the clipboard.`
      );
    });
  });
}

export async function generatePromptFromTask(
  input: GeneratePromptFromTaskInput
): Promise<PromptBuildResult> {
  const promptContext = await loadPromptContext(
    input.workspaceInfo.fsPath,
    input.templateService
  );
  const result = buildSystemAwarePrompt({
    workspaceName: input.workspaceInfo.name,
    task: input.task,
    target: input.target,
    context: promptContext
  });

  await env.clipboard.writeText(result.prompt);
  writePromptSummary(input.output, result);

  const document = await workspace.openTextDocument({
    content: result.prompt,
    language: "markdown"
  });
  await window.showTextDocument(document, { preview: false });

  return result;
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function prioritizeTarget(target: AgentTarget): readonly AgentTarget[] {
  return [target, ...agentTargets.filter((agentTarget) => agentTarget !== target)];
}
