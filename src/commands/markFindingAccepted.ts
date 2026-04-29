import type { OutputChannel } from "vscode";
import { commands, window } from "vscode";

import type { Finding } from "../types/findings";
import type { PerformanceTracker } from "../services/performanceTracker";
import { appendAcceptedFindingEntry } from "../services/reviewWorkflowService";
import type { ReviewWorkflowService } from "../services/reviewWorkflowService";

type FindingQuickPickItem = {
  readonly label: string;
  readonly description: string;
  readonly detail: string;
  readonly finding: Finding;
};

export function registerMarkFindingAcceptedCommand(
  output: OutputChannel,
  performanceTracker: PerformanceTracker,
  reviewWorkflowService: ReviewWorkflowService
) {
  return commands.registerCommand("codegrip.markFindingAccepted", async () => {
    await performanceTracker.trackCommand(
      "codegrip.markFindingAccepted",
      async () => {
        const latestReview = reviewWorkflowService.getLatestReview();

        if (!latestReview) {
          window.showInformationMessage(
            "Run CodeGrip: Review Current Git Diff before accepting a finding."
          );
          return;
        }

        if (latestReview.review.findings.length === 0) {
          window.showInformationMessage(
            "The latest CodeGrip review has no findings to accept."
          );
          return;
        }

        const selected = await window.showQuickPick(
          latestReview.review.findings.map(toQuickPickItem),
          {
            title: "Accept CodeGrip Finding",
            placeHolder: "Choose the finding to record as accepted",
            ignoreFocusOut: true
          }
        );

        if (!selected) {
          return;
        }

        const note = await window.showInputBox({
          title: "Acceptance Note",
          prompt: "Optional: why is this finding acceptable for this task?",
          ignoreFocusOut: true
        });
        const task = await window.showInputBox({
          title: "Task",
          prompt: "Optional: what task should this accepted finding be tied to?",
          ignoreFocusOut: true
        });

        const filePath = await appendAcceptedFindingEntry(
          latestReview.workspaceRoot,
          {
            finding: selected.finding,
            note: note?.trim() || undefined,
            task: task?.trim() || undefined,
            createdAt: new Date()
          }
        );

        output.show(true);
        output.appendLine("");
        output.appendLine("CodeGrip Accepted Finding");
        output.appendLine("=========================");
        output.appendLine(`Accepted: ${selected.finding.title}`);
        output.appendLine(`Recorded in ${filePath}`);
        window.showInformationMessage(
          `CodeGrip recorded accepted finding: ${selected.finding.title}`
        );
      }
    );
  });
}

function toQuickPickItem(finding: Finding, index: number): FindingQuickPickItem {
  return {
    label: `${index + 1}. ${finding.title}`,
    description: finding.severity,
    detail: finding.file ?? finding.whyItMatters,
    finding
  };
}
