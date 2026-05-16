import { constants } from "fs";
import { access, stat } from "fs/promises";
import * as path from "path";
import { window, workspace } from "vscode";
import type { WorkspaceFolder } from "vscode";

export type WorkspaceInfo = {
  readonly name: string;
  readonly fsPath: string;
  readonly isWritable: boolean;
  readonly isGitRepo: boolean;
  readonly workspaceFolderCount: number;
};

export async function getWorkspaceInfo(): Promise<WorkspaceInfo | undefined> {
  const workspaceFolder = await getPreferredWorkspaceFolder();

  if (!workspaceFolder) {
    return undefined;
  }

  const fsPath = workspaceFolder.uri.fsPath;

  return {
    name: workspaceFolder.name,
    fsPath,
    isWritable: await isWritableDirectory(fsPath),
    isGitRepo: await hasGitMetadata(fsPath),
    workspaceFolderCount: workspace.workspaceFolders?.length ?? 0
  };
}

async function getPreferredWorkspaceFolder(): Promise<
  WorkspaceFolder | undefined
> {
  const activeDocument = window.activeTextEditor?.document;

  if (activeDocument) {
    const activeWorkspaceFolder = workspace.getWorkspaceFolder(
      activeDocument.uri
    );

    if (activeWorkspaceFolder) {
      return activeWorkspaceFolder;
    }
  }

  const workspaceFolders = workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length === 0) {
    return undefined;
  }

  if (workspaceFolders.length === 1) {
    return workspaceFolders[0];
  }

  return (
    (await findInitializedWorkspaceFolder(workspaceFolders)) ??
    workspaceFolders[0]
  );
}

async function isWritableDirectory(fsPath: string): Promise<boolean> {
  try {
    await access(fsPath, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

async function hasGitMetadata(fsPath: string): Promise<boolean> {
  try {
    await stat(path.join(fsPath, ".git"));
    return true;
  } catch {
    return false;
  }
}

async function findInitializedWorkspaceFolder(
  workspaceFolders: readonly WorkspaceFolder[]
): Promise<WorkspaceFolder | undefined> {
  for (const workspaceFolder of workspaceFolders) {
    try {
      await stat(path.join(workspaceFolder.uri.fsPath, ".codegrip"));
      return workspaceFolder;
    } catch {
      continue;
    }
  }

  return undefined;
}
