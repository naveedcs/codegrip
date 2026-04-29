import type { OutputChannel } from "vscode";
import { commands, window } from "vscode";

import {
  appendDecisionLogEntry,
  type DecisionLogEntry
} from "../services/reviewWorkflowService";
import type { PerformanceTracker } from "../services/performanceTracker";
import { getWorkspaceInfo } from "../services/workspaceService";

export function registerAddDecisionLogEntryCommand(
  output: OutputChannel,
  performanceTracker: PerformanceTracker
) {
  return commands.registerCommand("codegrip.addDecisionLogEntry", async () => {
    await performanceTracker.trackCommand(
      "codegrip.addDecisionLogEntry",
      async () => {
        const workspaceInfo = await getWorkspaceInfo();

        if (!workspaceInfo) {
          window.showErrorMessage(
            "CodeGrip needs an open workspace folder before it can add a decision log entry."
          );
          return;
        }

        const entry = await promptForDecisionLogEntry();

        if (!entry) {
          return;
        }

        const filePath = await appendDecisionLogEntry(workspaceInfo.fsPath, entry);

        output.show(true);
        output.appendLine("");
        output.appendLine("CodeGrip Decision Log");
        output.appendLine("=====================");
        output.appendLine(`Added entry to ${filePath}`);
        window.showInformationMessage("CodeGrip added a decision log entry.");
      }
    );
  });
}

async function promptForDecisionLogEntry(): Promise<DecisionLogEntry | undefined> {
  const task = await promptRequired("Task", "What task or change is this about?");

  if (!task) {
    return undefined;
  }

  const decision = await promptRequired("Decision", "What decision was made?");

  if (!decision) {
    return undefined;
  }

  const reason = await promptRequired("Reason", "Why was this the right choice?");

  if (!reason) {
    return undefined;
  }

  const verification = await promptRequired(
    "Verification",
    "What verification supports this decision?"
  );

  if (!verification) {
    return undefined;
  }

  return {
    task,
    decision,
    reason,
    verification,
    createdAt: new Date()
  };
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
