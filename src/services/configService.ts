import { workspace } from "vscode";

import type { AgentTarget } from "./promptBuilder";
import { isAgentTarget } from "./promptBuilder";
import type { LlmReviewProvider } from "../types/proFeatures";
import { isLlmReviewProvider } from "../types/proFeatures";

export const reviewStrictnessLevels = ["lenient", "standard", "strict"] as const;

export type ReviewStrictness = (typeof reviewStrictnessLevels)[number];

export type CodeGripConfig = {
  readonly defaultAgentTarget: AgentTarget;
  readonly reviewStrictness: ReviewStrictness;
  readonly maxDiffBytes: number;
  readonly llmReview: LlmReviewConfig;
  readonly telemetry: TelemetryConfig;
};

export type LlmReviewConfig = {
  readonly enabled: boolean;
  readonly provider: LlmReviewProvider;
  readonly endpoint: string;
  readonly model: string;
};

export type TelemetryConfig = {
  readonly enabled: boolean;
};

const defaultConfig: CodeGripConfig = {
  defaultAgentTarget: "Codex",
  reviewStrictness: "standard",
  maxDiffBytes: 750_000,
  llmReview: {
    enabled: false,
    provider: "local",
    endpoint: "",
    model: ""
  },
  telemetry: {
    enabled: false
  }
};

export function getCodeGripConfig(): CodeGripConfig {
  const config = workspace.getConfiguration("codegrip");
  const configuredTarget = config.get<string>("defaultAgentTarget");
  const configuredStrictness = config.get<string>("reviewStrictness");
  const configuredMaxDiffBytes = config.get<number>("maxDiffBytes");
  const configuredLlmReviewEnabled = config.get<boolean>("llmReview.enabled");
  const configuredLlmReviewProvider = config.get<string>("llmReview.provider");
  const configuredLlmReviewEndpoint = config.get<string>("llmReview.endpoint");
  const configuredLlmReviewModel = config.get<string>("llmReview.model");
  const configuredTelemetryEnabled = config.get<boolean>("telemetry.enabled");
  const target = configuredTarget ?? "";

  return {
    defaultAgentTarget: isAgentTarget(target)
      ? target
      : defaultConfig.defaultAgentTarget,
    reviewStrictness: isReviewStrictness(configuredStrictness)
      ? configuredStrictness
      : defaultConfig.reviewStrictness,
    maxDiffBytes: normalizeMaxDiffBytes(configuredMaxDiffBytes),
    llmReview: {
      enabled: configuredLlmReviewEnabled ?? defaultConfig.llmReview.enabled,
      provider: isLlmReviewProvider(configuredLlmReviewProvider)
        ? configuredLlmReviewProvider
        : defaultConfig.llmReview.provider,
      endpoint: normalizeOptionalText(configuredLlmReviewEndpoint),
      model: normalizeOptionalText(configuredLlmReviewModel)
    },
    telemetry: {
      enabled: configuredTelemetryEnabled ?? defaultConfig.telemetry.enabled
    }
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

function normalizeOptionalText(value: string | undefined): string {
  return value?.trim() ?? "";
}
