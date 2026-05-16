import { isDocumentationPath, isPackageOrLockPath } from "./pathClassifier";
import type { RiskReview } from "./riskAnalyzer";
import type { RiskSeverity } from "../types/findings";
import type { ChangedFile, GitDiffSnapshot } from "../types/gitDiff";

export type RiskVisualization = {
  readonly storyboard: readonly RiskStoryboardStep[];
  readonly blastRadius: readonly BlastRadiusZone[];
  readonly heatStrip: readonly HeatStripFile[];
};

export type RiskStoryboardStep = {
  readonly label: string;
  readonly detail: string;
  readonly severity: RiskSeverity;
  readonly active: boolean;
};

export type BlastRadiusZone = {
  readonly id: BlastRadiusZoneId;
  readonly label: string;
  readonly severity: RiskSeverity;
  readonly fileCount: number;
  readonly findingCount: number;
  readonly active: boolean;
};

export type HeatStripFile = {
  readonly path: string;
  readonly status: ChangedFile["status"];
  readonly severity: RiskSeverity;
  readonly additions: number;
  readonly deletions: number;
  readonly isTest: boolean;
  readonly isBinary: boolean;
};

export type BlastRadiusZoneId =
  | "auth"
  | "config"
  | "shared"
  | "tests"
  | "docs"
  | "deployment";

type BlastRadiusZoneDefinition = {
  readonly id: BlastRadiusZoneId;
  readonly label: string;
  readonly matchesPath: (filePath: string) => boolean;
  readonly matchesFinding: (text: string) => boolean;
};

const severityRank: Record<RiskSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3
};

const blastRadiusZones: readonly BlastRadiusZoneDefinition[] = [
  {
    id: "auth",
    label: "Auth",
    matchesPath: (filePath) =>
      /(^|\/)(auth|session|login|token|permission|permissions)(\/|\.|-|_)?/iu.test(
        filePath
      ),
    matchesFinding: (text) =>
      /\b(auth|session|login|token|permission|security)\b/iu.test(text)
  },
  {
    id: "config",
    label: "Config",
    matchesPath: (filePath) =>
      /(^|\/)(config|settings)(\/|\.|-|_)?/iu.test(filePath) ||
      /(^|\/)\.env/iu.test(filePath) ||
      /\.config\./iu.test(filePath),
    matchesFinding: (text) => /\b(config|settings|environment)\b/iu.test(text)
  },
  {
    id: "shared",
    label: "Shared",
    matchesPath: (filePath) =>
      /(^|\/)(shared|common|utils?|helpers?)(\/|\.|-|_)?/iu.test(filePath),
    matchesFinding: (text) => /\b(shared|utility|utilities|helper)\b/iu.test(text)
  },
  {
    id: "tests",
    label: "Tests",
    matchesPath: (filePath) =>
      /(^|\/)(__tests__|tests?|specs?)(\/|$)/iu.test(filePath) ||
      /\.(test|spec)\.[cm]?[jt]sx?$/iu.test(filePath),
    matchesFinding: (text) => /\b(test|tests|coverage)\b/iu.test(text)
  },
  {
    id: "docs",
    label: "Docs",
    matchesPath: (filePath) => isDocumentationPath(filePath),
    matchesFinding: (text) => /\b(doc|docs|documentation|readme)\b/iu.test(text)
  },
  {
    id: "deployment",
    label: "Deploy",
    matchesPath: (filePath) =>
      /(^|\/)(deploy|deployment|infra|infrastructure|workflows?)(\/|\.|-|_)?/iu.test(
        filePath
      ) ||
      /(^|\/)(Dockerfile|docker-compose)/iu.test(filePath) ||
      isPackageOrLockPath(filePath),
    matchesFinding: (text) =>
      /\b(deploy|deployment|infra|infrastructure|package|dependency|lockfile)\b/iu.test(
        text
      )
  }
];

export function buildRiskVisualization(
  snapshot: GitDiffSnapshot,
  review: RiskReview
): RiskVisualization {
  return {
    storyboard: buildStoryboard(snapshot, review),
    blastRadius: buildBlastRadius(snapshot, review),
    heatStrip: buildHeatStrip(snapshot, review)
  };
}

function buildStoryboard(
  snapshot: GitDiffSnapshot,
  review: RiskReview
): readonly RiskStoryboardStep[] {
  const riskFindings = review.findings.filter(
    (finding) => finding.id !== "code-change-without-tests"
  );
  const missingCheckFindings = review.findings.filter((finding) =>
    /missing|without-tests|test/i.test(finding.id)
  );

  return [
    {
      label: "Files touched",
      detail: `${review.changedFileCount} files, +${review.additions} / -${review.deletions}`,
      severity: review.changedFileCount >= 15 ? "medium" : "low",
      active: review.changedFileCount > 0
    },
    {
      label: "Risk triggers",
      detail:
        riskFindings.length === 0
          ? "No high-signal triggers"
          : `${riskFindings.length} trigger${riskFindings.length === 1 ? "" : "s"}`,
      severity: highestFindingSeverity(riskFindings),
      active: riskFindings.length > 0
    },
    {
      label: "Missing checks",
      detail: review.matchingTestsChanged
        ? "Matching tests changed"
        : review.testsChanged
          ? "Tests changed"
          : "No test signal",
      severity:
        missingCheckFindings.length > 0
          ? highestFindingSeverity(missingCheckFindings)
          : review.testsChanged
            ? "low"
            : "medium",
      active: missingCheckFindings.length > 0 || !review.testsChanged
    },
    {
      label: "Suggested action",
      detail:
        review.suggestedChecks.length === 0
          ? "No follow-up checks"
          : `${review.suggestedChecks.length} next check${review.suggestedChecks.length === 1 ? "" : "s"}`,
      severity: review.riskScore,
      active: review.suggestedChecks.length > 0
    }
  ];
}

function buildBlastRadius(
  snapshot: GitDiffSnapshot,
  review: RiskReview
): readonly BlastRadiusZone[] {
  return blastRadiusZones.map((zone) => {
    const matchingFiles = snapshot.changedFiles.filter((file) =>
      zone.matchesPath(file.path)
    );
    const matchingFindings = review.findings.filter((finding) =>
      zone.matchesFinding(
        [
          finding.id,
          finding.title,
          finding.body,
          finding.file ?? "",
          finding.whyItMatters,
          finding.suggestedAction ?? ""
        ].join(" ")
      )
    );
    const active = matchingFiles.length > 0 || matchingFindings.length > 0;

    return {
      id: zone.id,
      label: zone.label,
      severity: active
        ? highestSeverity([
            ...matchingFindings.map((finding) => finding.severity),
            ...matchingFiles.map((file) => fileSeverity(file, review))
          ])
        : "low",
      fileCount: matchingFiles.length,
      findingCount: matchingFindings.length,
      active
    };
  });
}

function buildHeatStrip(
  snapshot: GitDiffSnapshot,
  review: RiskReview
): readonly HeatStripFile[] {
  return snapshot.changedFiles.slice(0, 12).map((file) => ({
    path: file.path,
    status: file.status,
    severity: fileSeverity(file, review),
    additions: file.additions,
    deletions: file.deletions,
    isTest: file.isTest,
    isBinary: file.isBinary
  }));
}

function fileSeverity(file: ChangedFile, review: RiskReview): RiskSeverity {
  const directFindings = review.findings.filter(
    (finding) => finding.file === file.path
  );

  if (directFindings.length > 0) {
    return highestFindingSeverity(directFindings);
  }

  if (file.isBinary) {
    return "medium";
  }

  if (file.isTest || isDocumentationPath(file.path)) {
    return "low";
  }

  return review.riskScore === "low" ? "low" : "medium";
}

function highestFindingSeverity(
  findings: readonly { readonly severity: RiskSeverity }[]
): RiskSeverity {
  return highestSeverity(findings.map((finding) => finding.severity));
}

function highestSeverity(severities: readonly RiskSeverity[]): RiskSeverity {
  return severities.reduce<RiskSeverity>((highest, severity) => {
    return severityRank[severity] > severityRank[highest] ? severity : highest;
  }, "low");
}
