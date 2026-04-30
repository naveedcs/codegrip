import { workspace } from "vscode";

import type { AgentTarget } from "./promptBuilder";
import { isAgentTarget } from "./promptBuilder";

export const reviewStrictnessLevels = ["lenient", "standard", "strict"] as const;

export type ReviewStrictness = (typeof reviewStrictnessLevels)[number];

export type CodeGripConfig = {
  readonly defaultAgentTarget: AgentTarget;
  readonly reviewStrictness: ReviewStrictness;
  readonly maxDiffBytes: number;
};

const defaultConfig: CodeGripConfig = {
  defaultAgentTarget: "Codex",
  reviewStrictness: "standard",
  maxDiffBytes: 750_000
};

export function getCodeGripConfig(): CodeGripConfig {
  const config = workspace.getConfiguration("codegrip");
  const configuredTarget = config.get<string>("defaultAgentTarget");
  const configuredStrictness = config.get<string>("reviewStrictness");
  const configuredMaxDiffBytes = config.get<number>("maxDiffBytes");
  const target = configuredTarget ?? "";

  return {
    defaultAgentTarget: isAgentTarget(target)
      ? target
      : defaultConfig.defaultAgentTarget,
    reviewStrictness: isReviewStrictness(configuredStrictness)
      ? configuredStrictness
      : defaultConfig.reviewStrictness,
    maxDiffBytes: normalizeMaxDiffBytes(configuredMaxDiffBytes)
  };
}

export function isReviewStrictness(
  value: unknown
): value is ReviewStrictness {
  return reviewStrictnessLevels.some((strictness) => strictness === value);
}

function normalizeMaxDiffBytes(value: number | undefined): number {
  if (!Number.isFinite(value) || value === undefined) {
    return defaultConfig.maxDiffBytes;
  }

  return Math.max(50_000, Math.min(Math.floor(value), 5_000_000));
}
