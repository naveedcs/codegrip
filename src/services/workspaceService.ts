import { constants } from "fs";
import { access, stat } from "fs/promises";
import * as path from "path";
import { workspace } from "vscode";

export type WorkspaceInfo = {
  readonly name: string;
  readonly fsPath: string;
  readonly isWritable: boolean;
  readonly isGitRepo: boolean;
};

export async function getWorkspaceInfo(): Promise<WorkspaceInfo | undefined> {
  const workspaceFolder = workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    return undefined;
  }

  const fsPath = workspaceFolder.uri.fsPath;

  return {
    name: workspaceFolder.name,
    fsPath,
    isWritable: await isWritableDirectory(fsPath),
    isGitRepo: await hasGitMetadata(fsPath)
  };
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
