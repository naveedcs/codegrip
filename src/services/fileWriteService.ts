import { mkdir, readFile, stat, writeFile } from "fs/promises";
import * as path from "path";

import { upsertManagedSection } from "./managedSectionService";
import type { InitializedFileResult } from "../types/initializeRepo";

export async function createFileIfMissing(
  workspaceRoot: string,
  relativePath: string,
  content: string
): Promise<InitializedFileResult> {
  const targetPath = path.join(workspaceRoot, relativePath);

  if (await pathExists(targetPath)) {
    return {
      path: relativePath,
      status: "skipped",
      reason: "already exists"
    };
  }

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, normalizeTrailingNewline(content), "utf8");

  return {
    path: relativePath,
    status: "created"
  };
}

export async function upsertManagedFileSection(
  workspaceRoot: string,
  relativePath: string,
  managedContent: string
): Promise<InitializedFileResult> {
  const targetPath = path.join(workspaceRoot, relativePath);
  await mkdir(path.dirname(targetPath), { recursive: true });

  if (!(await pathExists(targetPath))) {
    await writeFile(targetPath, createInitialManagedFile(managedContent), "utf8");

    return {
      path: relativePath,
      status: "created"
    };
  }

  const existingContent = await readFile(targetPath, "utf8");
  const result = upsertManagedSection(existingContent, managedContent);

  if (!result.changed) {
    return {
      path: relativePath,
      status: "skipped",
      reason: "CodeGrip section already up to date"
    };
  }

  await writeFile(targetPath, result.content, "utf8");

  return {
    path: relativePath,
    status: "updated",
    reason: result.replacedExistingSection
      ? "replaced existing CodeGrip section"
      : "appended CodeGrip section"
  };
}

async function pathExists(fsPath: string): Promise<boolean> {
  try {
    await stat(fsPath);
    return true;
  } catch {
    return false;
  }
}

function createInitialManagedFile(content: string): string {
  return upsertManagedSection("", content).content;
}

function normalizeTrailingNewline(content: string): string {
  return content.endsWith("\n") ? content : `${content}\n`;
}
