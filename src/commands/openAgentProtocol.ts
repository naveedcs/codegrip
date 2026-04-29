import { existsSync } from "fs";
import * as path from "path";
import { commands, Uri, window } from "vscode";

import type { PerformanceTracker } from "../services/performanceTracker";
import { getWorkspaceInfo } from "../services/workspaceService";

export function registerOpenAgentProtocolCommand(
  performanceTracker: PerformanceTracker
) {
  return commands.registerCommand("codegrip.openAgentProtocol", async () => {
    await performanceTracker.trackCommand(
      "codegrip.openAgentProtocol",
      async () => {
        const workspaceInfo = await getWorkspaceInfo();

        if (!workspaceInfo) {
          window.showErrorMessage(
            "CodeGrip needs an open workspace folder before it can open the agent protocol."
          );
          return;
        }

        const protocolPath = path.join(
          workspaceInfo.fsPath,
          ".codegrip/agent-protocol.md"
        );

        if (!existsSync(protocolPath)) {
          window.showWarningMessage(
            "CodeGrip agent protocol was not found. Run CodeGrip: Initialize Repo first."
          );
          return;
        }

        await window.showTextDocument(Uri.file(protocolPath), {
          preview: false
        });
      }
    );
  });
}
