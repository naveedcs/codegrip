import type { OutputChannel } from "vscode";

import {
  createFileIfMissing,
  upsertManagedFileSection
} from "./fileWriteService";
import { agentRuleFiles } from "./syncService";
import type { TemplateService } from "./templateService";
import type {
  InitializedFileResult,
  InitializeRepoResult
} from "../types/initializeRepo";
import type { WorkspaceInfo } from "./workspaceService";

const coreFiles = [
  {
    path: ".codegrip/agent-protocol.md",
    template: "agent-protocol.md"
  },
  {
    path: ".codegrip/architecture.md",
    template: "architecture.md"
  },
  {
    path: ".codegrip/conventions.md",
    template: "conventions.md"
  },
  {
    path: ".codegrip/risk-rules.json",
    template: "risk-rules.json"
  },
  {
    path: ".codegrip/decision-log.md",
    template: "decision-log.md"
  }
] as const;

export async function initializeRepo(
  workspaceInfo: WorkspaceInfo,
  templateService: TemplateService
): Promise<InitializeRepoResult> {
  const files: InitializedFileResult[] = [];

  for (const file of coreFiles) {
    files.push(
      await createFileIfMissing(
        workspaceInfo.fsPath,
        file.path,
        await templateService.read(file.template)
      )
    );
  }

  files.push(
    await createFileIfMissing(
      workspaceInfo.fsPath,
      ".codegrip/task-history/.gitkeep",
      ""
    )
  );

  for (const file of agentRuleFiles) {
    files.push(
      await upsertManagedFileSection(
        workspaceInfo.fsPath,
        file.path,
        await templateService.read(file.template)
      )
    );
  }

  return {
    workspaceName: workspaceInfo.name,
    workspacePath: workspaceInfo.fsPath,
    isGitRepo: workspaceInfo.isGitRepo,
    files
  };
}

export function writeInitializeRepoSummary(
  output: OutputChannel,
  result: InitializeRepoResult
): void {
  output.show(true);
  output.appendLine("");
  output.appendLine("CodeGrip Repo Initialization");
  output.appendLine("============================");
  output.appendLine(`Workspace: ${result.workspaceName}`);
  output.appendLine(`Path: ${result.workspacePath}`);
  output.appendLine(`Git repo: ${result.isGitRepo ? "yes" : "not detected"}`);
  output.appendLine("");

  for (const file of result.files) {
    const reason = file.reason ? ` (${file.reason})` : "";
    output.appendLine(`${formatStatus(file.status)} ${file.path}${reason}`);
  }
}

function formatStatus(status: InitializedFileResult["status"]): string {
  if (status === "created") {
    return "created";
  }

  if (status === "updated") {
    return "updated";
  }

  return "skipped";
}
