import type { OutputChannel } from "vscode";
import { commands, window } from "vscode";

import type { PerformanceTracker } from "../services/performanceTracker";
import {
  analyzeTerminalCommand,
  writeTerminalCommandReviewSummary
} from "../services/commandRiskService";

export function registerReviewTerminalCommandCommand(
  output: OutputChannel,
  performanceTracker: PerformanceTracker
) {
  return commands.registerCommand("codegrip.reviewTerminalCommand", async () => {
    await performanceTracker.trackCommand(
      "codegrip.reviewTerminalCommand",
      async () => {
        const command = await window.showInputBox({
          title: "Review Terminal Command",
          prompt: "Paste the command to review. CodeGrip will not execute it.",
          placeHolder: "Example: git reset --hard",
          ignoreFocusOut: true
        });

        if (!command || command.trim().length === 0) {
          return;
        }

        const review = analyzeTerminalCommand(command);
        writeTerminalCommandReviewSummary(output, review);

        const message = `CodeGrip terminal command review: ${review.riskScore} risk.`;

        if (review.riskScore === "critical") {
          window.showErrorMessage(message);
          return;
        }

        if (review.riskScore === "high") {
          window.showWarningMessage(message);
          return;
        }

        window.showInformationMessage(message);
      }
    );
  });
}
