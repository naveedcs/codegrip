import { execFile } from "child_process";
import * as path from "path";

import { isTestPath, normalizeRepoPath } from "./pathClassifier";
import type {
  ChangedFile,
  ChangedFileStatus,
  GitDiffSnapshot
} from "../types/gitDiff";

type MutableChangedFile = {
  path: string;
  status: ChangedFileStatus;
  additions: number;
  deletions: number;
};

export async function readCurrentGitDiff(
  workspaceRoot: string
): Promise<GitDiffSnapshot> {
  const repoRoot = await detectGitRoot(workspaceRoot);

  if (!repoRoot) {
    return {
      isGitRepo: false,
      changedFiles: [],
      additions: 0,
      deletions: 0,
      unstagedDiff: "",
      stagedDiff: "",
      combinedDiff: ""
    };
  }

  const [statusOutput, unstagedNumstat, stagedNumstat, unstagedDiff, stagedDiff] =
    await Promise.all([
      runGit(repoRoot, ["status", "--porcelain=v1"]),
      runGit(repoRoot, ["diff", "--numstat", "--"]),
      runGit(repoRoot, ["diff", "--cached", "--numstat", "--"]),
      runGit(repoRoot, ["diff", "--no-ext-diff", "--"]),
      runGit(repoRoot, ["diff", "--cached", "--no-ext-diff", "--"])
    ]);

  const changedFileMap = parseStatus(statusOutput);
  applyNumstat(changedFileMap, unstagedNumstat);
  applyNumstat(changedFileMap, stagedNumstat);

  const changedFiles = [...changedFileMap.values()]
    .map((file): ChangedFile => {
      return {
        path: file.path,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        isTest: isTestPath(file.path)
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));

  const additions = changedFiles.reduce((total, file) => total + file.additions, 0);
  const deletions = changedFiles.reduce((total, file) => total + file.deletions, 0);
  const combinedDiff = combineDiffs(unstagedDiff, stagedDiff);

  return {
    isGitRepo: true,
    repoRoot,
    changedFiles,
    additions,
    deletions,
    unstagedDiff,
    stagedDiff,
    combinedDiff
  };
}

async function detectGitRoot(workspaceRoot: string): Promise<string | undefined> {
  try {
    const stdout = await runGit(workspaceRoot, ["rev-parse", "--show-toplevel"]);
    return path.resolve(stdout.trim());
  } catch {
    return undefined;
  }
}

function parseStatus(statusOutput: string): Map<string, MutableChangedFile> {
  const changedFiles = new Map<string, MutableChangedFile>();

  for (const line of statusOutput.split(/\r?\n/u)) {
    if (line.trim().length === 0) {
      continue;
    }

    const statusCode = line.slice(0, 2);
    const filePath = normalizeStatusPath(line.slice(3));

    changedFiles.set(filePath, {
      path: filePath,
      status: parseStatusCode(statusCode),
      additions: 0,
      deletions: 0
    });
  }

  return changedFiles;
}

function applyNumstat(
  changedFiles: Map<string, MutableChangedFile>,
  numstatOutput: string
): void {
  for (const line of numstatOutput.split(/\r?\n/u)) {
    if (line.trim().length === 0) {
      continue;
    }

    const [additionsText, deletionsText, ...pathParts] = line.split("\t");
    const filePath = normalizeRepoPath(pathParts.join("\t"));
    const existing = changedFiles.get(filePath);
    const additions = parseLineCount(additionsText);
    const deletions = parseLineCount(deletionsText);

    if (existing) {
      existing.additions += additions;
      existing.deletions += deletions;
      continue;
    }

    changedFiles.set(filePath, {
      path: filePath,
      status: "modified",
      additions,
      deletions
    });
  }
}

function parseLineCount(value: string | undefined): number {
  if (!value || value === "-") {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeStatusPath(rawPath: string): string {
  const renameSeparator = " -> ";

  if (rawPath.includes(renameSeparator)) {
    return normalizeRepoPath(rawPath.split(renameSeparator).at(-1) ?? rawPath);
  }

  return normalizeRepoPath(rawPath);
}

function parseStatusCode(statusCode: string): ChangedFileStatus {
  if (statusCode.includes("?")) {
    return "untracked";
  }

  if (statusCode.includes("R")) {
    return "renamed";
  }

  if (statusCode.includes("C")) {
    return "copied";
  }

  if (statusCode.includes("A")) {
    return "added";
  }

  if (statusCode.includes("D")) {
    return "deleted";
  }

  if (statusCode.includes("M")) {
    return "modified";
  }

  return "unknown";
}

function combineDiffs(unstagedDiff: string, stagedDiff: string): string {
  const sections = [];

  if (unstagedDiff.trim().length > 0) {
    sections.push(`Unstaged diff:\n${unstagedDiff.trim()}`);
  }

  if (stagedDiff.trim().length > 0) {
    sections.push(`Staged diff:\n${stagedDiff.trim()}`);
  }

  return sections.join("\n\n");
}

function runGit(cwd: string, args: readonly string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      [...args],
      {
        cwd,
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              stderr.trim().length > 0
                ? stderr.trim()
                : `git ${args.join(" ")} failed`
            )
          );
          return;
        }

        resolve(stdout);
      }
    );
  });
}
