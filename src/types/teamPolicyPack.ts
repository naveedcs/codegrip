import type { ReviewStrictness } from "../services/configService";
import type { LlmReviewSettings } from "./proFeatures";

export const teamPolicyPackSchemaVersion = 1;

export type TeamPolicyPack = {
  readonly schemaVersion: typeof teamPolicyPackSchemaVersion;
  readonly name: string;
  readonly description: string;
  readonly createdAt: string;
  readonly policies: TeamPolicyPackPolicies;
  readonly proFeatures: TeamPolicyPackProFeatures;
};

export type TeamPolicyPackPolicies = {
  readonly reviewStrictness: ReviewStrictness;
  readonly requiredChecks: readonly string[];
  readonly sensitivePaths: readonly string[];
  readonly agentInstructions: readonly string[];
};

export type TeamPolicyPackProFeatures = {
  readonly llmReview: LlmReviewSettings;
};
