export type ChangedFileStatus =
  | "added"
  | "copied"
  | "deleted"
  | "modified"
  | "renamed"
  | "untracked"
  | "unknown";

export type ChangedFile = {
  readonly path: string;
  readonly status: ChangedFileStatus;
  readonly additions: number;
  readonly deletions: number;
  readonly isTest: boolean;
  readonly isBinary: boolean;
};

export type GitDiffSnapshot = {
  readonly isGitRepo: boolean;
  readonly repoRoot?: string;
  readonly changedFiles: readonly ChangedFile[];
  readonly additions: number;
  readonly deletions: number;
  readonly binaryFileCount: number;
  readonly unstagedDiff: string;
  readonly stagedDiff: string;
  readonly combinedDiff: string;
  readonly diffBytes: number;
  readonly diffTruncated: boolean;
  readonly maxDiffBytes: number;
};
