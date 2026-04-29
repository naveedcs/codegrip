import type { Finding, RiskSeverity } from "../types/findings";
import type { RiskReview } from "./riskAnalyzer";

export type RiskDiagnosticSeverity = "error" | "warning" | "information" | "hint";

export type RiskDiagnosticData = {
  readonly file: string;
  readonly line: number;
  readonly severity: RiskDiagnosticSeverity;
  readonly message: string;
  readonly code: string;
};

export function buildRiskDiagnosticData(
  review: RiskReview
): readonly RiskDiagnosticData[] {
  return review.findings.flatMap((finding) => {
    if (!finding.file) {
      return [];
    }

    return [
      {
        file: finding.file,
        line: Math.max((finding.line ?? 1) - 1, 0),
        severity: mapRiskSeverity(finding.severity),
        message: formatDiagnosticMessage(finding),
        code: finding.id
      }
    ];
  });
}

export function mapRiskSeverity(
  severity: RiskSeverity
): RiskDiagnosticSeverity {
  if (severity === "critical" || severity === "high") {
    return "error";
  }

  if (severity === "medium") {
    return "warning";
  }

  return "information";
}

function formatDiagnosticMessage(finding: Finding): string {
  const parts = [
    finding.title,
    finding.body,
    `Why it matters: ${finding.whyItMatters}`
  ];

  if (finding.suggestedAction) {
    parts.push(`Suggested action: ${finding.suggestedAction}`);
  }

  return parts.join("\n");
}
