import { mkdir, stat, writeFile } from "fs/promises";
import * as path from "path";

import type { LlmReviewConfig, ReviewStrictness } from "./configService";
import type { OrgTemplate } from "../types/orgTemplate";
import type { TeamPolicyPack } from "../types/teamPolicyPack";
import { teamPolicyPackSchemaVersion } from "../types/teamPolicyPack";

export const teamPolicyPackRelativePath = ".codegrip/team-policy-pack.json";

export type CreateTeamPolicyPackInput = {
  readonly workspaceRoot: string;
  readonly name: string;
  readonly description: string;
  readonly reviewStrictness: ReviewStrictness;
  readonly llmReview: LlmReviewConfig;
  readonly orgTemplate?: OrgTemplate;
  readonly createdAt?: Date;
};

export type CreateTeamPolicyPackResult = {
  readonly filePath: string;
  readonly relativePath: typeof teamPolicyPackRelativePath;
  readonly status: "created" | "skipped";
  readonly policyPack?: TeamPolicyPack;
};

export async function createTeamPolicyPack(
  input: CreateTeamPolicyPackInput
): Promise<CreateTeamPolicyPackResult> {
  const filePath = path.join(input.workspaceRoot, teamPolicyPackRelativePath);

  if (await pathExists(filePath)) {
    return {
      filePath,
      relativePath: teamPolicyPackRelativePath,
      status: "skipped"
    };
  }

  const policyPack = buildDefaultTeamPolicyPack(input);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    `${JSON.stringify(policyPack, null, 2)}\n`,
    "utf8"
  );

  return {
    filePath,
    relativePath: teamPolicyPackRelativePath,
    status: "created",
    policyPack
  };
}

export function buildDefaultTeamPolicyPack(
  input: CreateTeamPolicyPackInput
): TeamPolicyPack {
  const createdAt = (input.createdAt ?? new Date()).toISOString();

  return {
    schemaVersion: teamPolicyPackSchemaVersion,
    name: input.name.trim(),
    description: input.description.trim(),
    createdAt,
    policies: {
      reviewStrictness: input.orgTemplate?.reviewStrictness ?? input.reviewStrictness,
      requiredChecks: input.orgTemplate?.requiredChecks ?? [
        "Run focused tests for changed behavior.",
        "Review risky path findings before landing.",
        "Record accepted high-risk findings with context."
      ],
      sensitivePaths: input.orgTemplate?.sensitivePaths ?? [
        "auth",
        "permissions",
        "payments",
        "migrations",
        "deployment",
        "config",
        "secrets",
        "shared utilities"
      ],
      agentInstructions: input.orgTemplate?.agentInstructions ?? [
        "Inspect relevant files and likely callers before editing.",
        "Keep changes small and preserve unrelated user edits.",
        "Summarize files changed, tests run, and remaining risks."
      ]
    },
    proFeatures: {
      llmReview: {
        enabled: false,
        provider: input.llmReview.provider,
        endpoint: input.llmReview.endpoint,
        model: input.llmReview.model
      }
    }
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
