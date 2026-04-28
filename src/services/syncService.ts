import { readFile, stat } from "fs/promises";
import * as path from "path";
import type { OutputChannel } from "vscode";

import { upsertManagedFileSection } from "./fileWriteService";
import { hasCurrentManagedSection } from "./managedSectionService";
import type { TemplateService } from "./templateService";
import type { WorkspaceInfo } from "./workspaceService";
import type {
  InitializedFileResult,
  InitializeRepoResult
} from "../types/initializeRepo";

export const agentRuleFiles = [
  {
    path: "AGENTS.md",
    template: "AGENTS.md",
    label: "Codex"
  },
  {
    path: "CLAUDE.md",
    template: "CLAUDE.md",
    label: "Claude"
  },
  {
    path: ".cursor/rules/codegrip.mdc",
    template: "cursor-rule.mdc",
    label: "Cursor"
  },
  {
    path: ".github/copilot-instructions.md",
    template: "copilot-instructions.md",
    label: "Copilot"
  }
] as const;

export type AgentRuleFilePath = (typeof agentRuleFiles)[number]["path"];

export type AgentRuleSyncState = "missing" | "out-of-sync" | "synced";

export type AgentRuleSyncStatus = {
  readonly label: string;
  readonly path: AgentRuleFilePath;
  readonly state: AgentRuleSyncState;
};

export async function syncAgentRuleFiles(
  workspaceInfo: WorkspaceInfo,
  templateService: TemplateService
): Promise<InitializeRepoResult> {
  const files: InitializedFileResult[] = [];

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

export async function getAgentRuleFileStatuses(
  workspaceRoot: string,
  templateService: TemplateService
): Promise<readonly AgentRuleSyncStatus[]> {
  return Promise.all(
    agentRuleFiles.map(async (file) => {
      const content = await readOptionalFile(workspaceRoot, file.path);

      if (content === undefined) {
        return {
          label: file.label,
          path: file.path,
          state: "missing"
        };
      }

      const template = await templateService.read(file.template);

      return {
        label: file.label,
        path: file.path,
        state: hasCurrentManagedSection(content, template)
          ? "synced"
          : "out-of-sync"
      };
    })
  );
}

export function writeAgentRuleSyncSummary(
  output: OutputChannel,
  result: InitializeRepoResult
): void {
  output.show(true);
  output.appendLine("");
  output.appendLine("CodeGrip Agent Rule Sync");
  output.appendLine("========================");
  output.appendLine(`Workspace: ${result.workspaceName}`);
  output.appendLine(`Path: ${result.workspacePath}`);
  output.appendLine("");

  for (const file of result.files) {
    const reason = file.reason ? ` (${file.reason})` : "";
    output.appendLine(`${formatStatus(file.status)} ${file.path}${reason}`);
  }
}

async function readOptionalFile(
  workspaceRoot: string,
  relativePath: string
): Promise<string | undefined> {
  const fsPath = path.join(workspaceRoot, relativePath);

  try {
    await stat(fsPath);
    return await readFile(fsPath, "utf8");
  } catch (error) {
    if (isMissingFile(error)) {
      return undefined;
    }

    throw error;
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

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { readonly code?: string }).code === "ENOENT"
  );
}
