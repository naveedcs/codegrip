import { commands, window } from "vscode";

import type { PerformanceTracker } from "../services/performanceTracker";

export function registerOpenDashboardCommand(
  performanceTracker: PerformanceTracker
) {
  return commands.registerCommand("codegrip.openDashboard", async () => {
    await performanceTracker.trackCommand("codegrip.openDashboard", async () => {
      await commands.executeCommand("codegrip.dashboard.focus");
      window.showInformationMessage("CodeGrip dashboard is ready.");
    });
  });
}
