import type { OutputChannel } from "vscode";
import { commands, ConfigurationTarget, window, workspace } from "vscode";

import { getCodeGripConfig } from "../services/configService";
import type { PerformanceTracker } from "../services/performanceTracker";
import type { LlmReviewProvider } from "../types/proFeatures";

type LlmReviewConfigAction =
  | "show"
  | "open-settings"
  | "enable"
  | "disable"
  | "provider-local"
  | "provider-remote"
  | "endpoint"
  | "model";

type LlmReviewConfigChoice = {
  readonly label: string;
  readonly description: string;
  readonly action: LlmReviewConfigAction;
};

const choices: readonly LlmReviewConfigChoice[] = [
  {
    label: "Show Current Configuration",
    description: "Print optional LLM review settings in the CodeGrip output.",
    action: "show"
  },
  {
    label: "Open Settings",
    description: "Open VS Code settings filtered to CodeGrip LLM review.",
    action: "open-settings"
  },
  {
    label: "Enable LLM Review",
    description: "Enable optional LLM review for this workspace.",
    action: "enable"
  },
  {
    label: "Disable LLM Review",
    description: "Keep CodeGrip local-only deterministic review active.",
    action: "disable"
  },
  {
    label: "Set Provider: Local",
    description: "Use a local provider when LLM review is enabled.",
    action: "provider-local"
  },
  {
    label: "Set Provider: Remote",
    description: "Use a remote provider when LLM review is enabled.",
    action: "provider-remote"
  },
  {
    label: "Set Endpoint",
    description: "Store an optional provider endpoint in workspace settings.",
    action: "endpoint"
  },
  {
    label: "Set Model",
    description: "Store an optional model name in workspace settings.",
    action: "model"
  }
];

export function registerConfigureLlmReviewCommand(
  output: OutputChannel,
  performanceTracker: PerformanceTracker
) {
  return commands.registerCommand("codegrip.configureLlmReview", async () => {
    await performanceTracker.trackCommand(
      "codegrip.configureLlmReview",
      async () => {
        const selected = await window.showQuickPick(choices, {
          placeHolder: "Configure optional LLM-powered review",
          ignoreFocusOut: true
        });

        if (!selected) {
          return;
        }

        await handleAction(output, selected.action);
      }
    );
  });
}

async function handleAction(
  output: OutputChannel,
  action: LlmReviewConfigAction
): Promise<void> {
  switch (action) {
    case "show":
      writeCurrentConfig(output);
      return;
    case "open-settings":
      await commands.executeCommand(
        "workbench.action.openSettings",
        "codegrip.llmReview"
      );
      return;
    case "enable":
      if (await updateWorkspaceSetting("llmReview.enabled", true)) {
        window.showInformationMessage(
          "CodeGrip optional LLM review is enabled for this workspace."
        );
      }
      return;
    case "disable":
      if (await updateWorkspaceSetting("llmReview.enabled", false)) {
        window.showInformationMessage(
          "CodeGrip optional LLM review is disabled for this workspace."
        );
      }
      return;
    case "provider-local":
      await updateProvider("local");
      return;
    case "provider-remote":
      await updateProvider("remote");
      return;
    case "endpoint":
      await updateTextSetting(
        "llmReview.endpoint",
        "LLM Review Endpoint",
        "Example: http://localhost:11434 or https://review.example.com"
      );
      return;
    case "model":
      await updateTextSetting(
        "llmReview.model",
        "LLM Review Model",
        "Example: local-reviewer or gpt-review"
      );
      return;
  }
}

function writeCurrentConfig(output: OutputChannel): void {
  const config = getCodeGripConfig();

  output.show(true);
  output.appendLine("");
  output.appendLine("CodeGrip LLM Review Configuration");
  output.appendLine("=================================");
  output.appendLine(`Enabled: ${config.llmReview.enabled ? "yes" : "no"}`);
  output.appendLine(`Provider: ${config.llmReview.provider}`);
  output.appendLine(
    `Endpoint: ${config.llmReview.endpoint.length > 0 ? config.llmReview.endpoint : "(not set)"}`
  );
  output.appendLine(
    `Model: ${config.llmReview.model.length > 0 ? config.llmReview.model : "(not set)"}`
  );
  output.appendLine("");
  output.appendLine(
    "CodeGrip does not make LLM calls unless optional LLM review is enabled and future review execution is wired."
  );
}

async function updateProvider(provider: LlmReviewProvider): Promise<void> {
  if (await updateWorkspaceSetting("llmReview.provider", provider)) {
    window.showInformationMessage(
      `CodeGrip LLM review provider set to ${provider}.`
    );
  }
}

async function updateTextSetting(
  key: "llmReview.endpoint" | "llmReview.model",
  title: string,
  placeHolder: string
): Promise<void> {
  const value = await window.showInputBox({
    title,
    placeHolder,
    ignoreFocusOut: true
  });

  if (value === undefined) {
    return;
  }

  if (await updateWorkspaceSetting(key, value.trim())) {
    window.showInformationMessage(`CodeGrip updated ${title}.`);
  }
}

async function updateWorkspaceSetting(
  key: string,
  value: boolean | string
): Promise<boolean> {
  if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
    window.showErrorMessage(
      "CodeGrip needs an open workspace folder before it can update LLM review settings."
    );
    return false;
  }

  await workspace
    .getConfiguration("codegrip")
    .update(key, value, ConfigurationTarget.Workspace);
  return true;
}
