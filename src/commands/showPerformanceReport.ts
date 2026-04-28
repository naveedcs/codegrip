import { commands } from "vscode";

import type { PerformanceTracker } from "../services/performanceTracker";

export function registerShowPerformanceReportCommand(
  performanceTracker: PerformanceTracker
) {
  return commands.registerCommand("codegrip.showPerformanceReport", () => {
    performanceTracker.printReport();
  });
}
