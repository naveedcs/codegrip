import type { AgentTarget } from "../services/promptBuilder";
import type { ReviewStrictness } from "../services/configService";

export const orgTemplateSchemaVersion = 1;

export type OrgTemplate = {
  readonly schemaVersion: typeof orgTemplateSchemaVersion;
  readonly organizationName: string;
  readonly defaultAgentTarget: AgentTarget;
  readonly reviewStrictness: ReviewStrictness;
  readonly requiredChecks: readonly string[];
  readonly sensitivePaths: readonly string[];
  readonly agentInstructions: readonly string[];
};
