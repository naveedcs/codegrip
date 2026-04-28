export type RiskSeverity = "low" | "medium" | "high" | "critical";

export type Finding = {
  readonly id: string;
  readonly severity: RiskSeverity;
  readonly title: string;
  readonly body: string;
  readonly file?: string;
  readonly line?: number;
  readonly whyItMatters: string;
  readonly suggestedAction?: string;
  readonly accepted?: boolean;
};
