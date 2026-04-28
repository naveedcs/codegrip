export type InitializedFileStatus = "created" | "updated" | "skipped";

export type InitializedFileResult = {
  readonly path: string;
  readonly status: InitializedFileStatus;
  readonly reason?: string;
};

export type InitializeRepoResult = {
  readonly workspaceName: string;
  readonly workspacePath: string;
  readonly isGitRepo: boolean;
  readonly files: readonly InitializedFileResult[];
};
