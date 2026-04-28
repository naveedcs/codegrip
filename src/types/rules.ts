import type { RiskSeverity } from "./findings";

export type RiskRule = {
  readonly id: string;
  readonly title: string;
  readonly severity: RiskSeverity;
  readonly matchPaths: readonly string[];
  readonly message: string;
  readonly suggestedAction?: string;
  readonly requireTests?: boolean;
};

export type RiskRulesFile = {
  readonly rules: readonly RiskRule[];
};
