import { commands, window, workspace } from "vscode";

import type { PerformanceTracker } from "../services/performanceTracker";
import { formatReviewDetails } from "../services/reviewWorkflowService";
import type { ReviewWorkflowService } from "../services/reviewWorkflowService";

export function registerOpenReviewDetailsCommand(
  performanceTracker: PerformanceTracker,
  reviewWorkflowService: ReviewWorkflowService
) {
  return commands.registerCommand("codegrip.openReviewDetails", async () => {
    await performanceTracker.trackCommand(
      "codegrip.openReviewDetails",
      async () => {
        const latestReview = reviewWorkflowService.getLatestReview();

        if (!latestReview) {
          window.showInformationMessage(
            "Run CodeGrip: Review Current Git Diff before opening review details."
          );
          return;
        }

        const document = await workspace.openTextDocument({
          language: "markdown",
          content: formatReviewDetails(latestReview)
        });
        await window.showTextDocument(document, { preview: false });
      }
    );
  });
}
