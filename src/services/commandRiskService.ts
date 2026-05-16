import type { OutputChannel } from "vscode";

import type { RiskSeverity } from "../types/findings";

export type TerminalCommandFinding = {
  readonly id: string;
  readonly severity: RiskSeverity;
  readonly title: string;
  readonly body: string;
  readonly whyItMatters: string;
  readonly suggestedAction: string;
};

export type TerminalCommandReview = {
  readonly command: string;
  readonly riskScore: RiskSeverity;
  readonly findings: readonly TerminalCommandFinding[];
  readonly suggestedChecks: readonly string[];
  readonly dangerMeter: TerminalCommandDangerMeter;
};

export type TerminalCommandDangerMeter = {
  readonly riskScore: RiskSeverity;
  readonly score: number;
  readonly bar: string;
  readonly label: string;
  readonly detail: string;
};

type TerminalCommandRule = {
  readonly id: string;
  readonly severity: RiskSeverity;
  readonly title: string;
  readonly patterns: readonly RegExp[];
  readonly whyItMatters: string;
  readonly suggestedAction: string;
};

const commandRules: readonly TerminalCommandRule[] = [
  {
    id: "destructive-filesystem-command",
    severity: "critical",
    title: "Destructive filesystem command",
    patterns: [
      /\brm\s+-(?:[^\s]*r[^\s]*f|[^\s]*f[^\s]*r)\s+(?:\/|\*|\.|~)/iu,
      /\bfind\s+.+\s+-delete\b/iu
    ],
    whyItMatters:
      "Recursive deletion can remove project files, home-directory files, or system paths very quickly.",
    suggestedAction:
      "Confirm the exact target path, run a dry-run/list command first, and prefer a narrower path."
  },
  {
    id: "destructive-git-command",
    severity: "critical",
    title: "Destructive Git command",
    patterns: [/\bgit\s+reset\s+--hard\b/iu, /\bgit\s+clean\s+-[^\s]*[fd]/iu],
    whyItMatters:
      "These commands can discard local work, including user edits that are not recoverable from Git.",
    suggestedAction:
      "Run `git status` and consider stashing or committing work before running the command."
  },
  {
    id: "destructive-data-command",
    severity: "critical",
    title: "Destructive data command",
    patterns: [
      /\bdrop\s+database\b/iu,
      /\btruncate\s+table\b/iu,
      /\bdocker\s+(?:compose\s+)?down\b.*\s-v\b/iu,
      /\bterraform\s+destroy\b/iu
    ],
    whyItMatters:
      "Data, volumes, or infrastructure may be deleted and difficult to reconstruct.",
    suggestedAction:
      "Confirm environment, backups, rollback path, and exact target before proceeding."
  },
  {
    id: "remote-script-execution",
    severity: "high",
    title: "Remote script execution",
    patterns: [
      /\bcurl\b.+\|\s*(?:sudo\s+)?(?:sh|bash)\b/iu,
      /\bwget\b.+\|\s*(?:sudo\s+)?(?:sh|bash)\b/iu
    ],
    whyItMatters:
      "Piping downloaded content into a shell executes code before it can be reviewed.",
    suggestedAction:
      "Download the script, inspect it, verify the source, then run only the needed commands."
  },
  {
    id: "force-push-command",
    severity: "high",
    title: "Force push",
    patterns: [/\bgit\s+push\b.*--force(?:-with-lease)?\b/iu],
    whyItMatters:
      "Force pushing can rewrite shared branch history and disrupt collaborators.",
    suggestedAction:
      "Prefer `--force-with-lease`, confirm the branch, and coordinate with collaborators first."
  },
  {
    id: "production-or-publish-command",
    severity: "high",
    title: "Production or publish command",
    patterns: [
      /\bnpm\s+publish\b/iu,
      /\bvsce\s+publish\b/iu,
      /\bvercel\b.*\b--prod\b/iu,
      /\bfirebase\s+deploy\b/iu,
      /\bkubectl\s+(?:apply|delete|rollout)\b/iu
    ],
    whyItMatters:
      "Publish and production commands can affect users or release irreversible package versions.",
    suggestedAction:
      "Confirm version, environment, credentials, rollback plan, and release checklist before running."
  },
  {
    id: "migration-command",
    severity: "high",
    title: "Migration command",
    patterns: [
      /\bprisma\s+migrate\s+deploy\b/iu,
      /\brails\s+db:migrate\b/iu,
      /\balembic\s+upgrade\b/iu,
      /\bsupabase\s+db\s+push\b/iu
    ],
    whyItMatters:
      "Database migrations can change persisted data and may need rollback or compatibility planning.",
    suggestedAction:
      "Check migration diff, backups, rollback notes, and staging verification before applying."
  },
  {
    id: "dependency-install-command",
    severity: "medium",
    title: "Dependency install or update",
    patterns: [
      /\bnpm\s+(?:install|update)\b/iu,
      /\byarn\s+(?:add|upgrade)\b/iu,
      /\bpnpm\s+(?:add|update)\b/iu,
      /\bpip\s+install\b/iu,
      /\bbrew\s+install\b/iu
    ],
    whyItMatters:
      "Dependency changes can affect build, lockfiles, runtime behavior, or supply-chain risk.",
    suggestedAction:
      "Review package and lockfile changes, then run install/build/test verification."
  }
];

const severityRank: Record<RiskSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3
};

export function analyzeTerminalCommand(command: string): TerminalCommandReview {
  const trimmedCommand = command.trim();
  const findings = commandRules
    .filter((rule) =>
      rule.patterns.some((pattern) => pattern.test(trimmedCommand))
    )
    .map((rule) => ({
      id: rule.id,
      severity: rule.severity,
      title: rule.title,
      body: `Matched command pattern in: ${trimmedCommand}`,
      whyItMatters: rule.whyItMatters,
      suggestedAction: rule.suggestedAction
    }));

  const riskScore = scoreFindings(findings);

  return {
    command: trimmedCommand,
    riskScore,
    findings,
    suggestedChecks: buildSuggestedChecks(findings),
    dangerMeter: buildTerminalCommandDangerMeter(riskScore, findings)
  };
}

export function buildTerminalCommandDangerMeter(
  riskScore: RiskSeverity,
  findings: readonly TerminalCommandFinding[]
): TerminalCommandDangerMeter {
  const score = severityRank[riskScore];
  const filledSegments = score + 1;

  return {
    riskScore,
    score,
    bar: `[${"=".repeat(filledSegments)}${"-".repeat(4 - filledSegments)}]`,
    label: capitalize(riskScore),
    detail:
      findings.length === 0
        ? "No high-signal command risks matched."
        : `${findings.length} matched command risk${findings.length === 1 ? "" : "s"}.`
  };
}

export function writeTerminalCommandReviewSummary(
  output: OutputChannel,
  review: TerminalCommandReview
): void {
  output.show(true);
  output.appendLine("");
  output.appendLine("CodeGrip Terminal Command Review");
  output.appendLine("================================");
  output.appendLine(`Risk: ${capitalize(review.riskScore)}`);
  output.appendLine(
    `Danger meter: ${review.dangerMeter.bar} ${review.dangerMeter.label} - ${review.dangerMeter.detail}`
  );
  output.appendLine(`Command: ${review.command}`);
  output.appendLine("");

  if (review.findings.length === 0) {
    output.appendLine("Findings:");
    output.appendLine("No high-signal terminal command risks matched.");
    return;
  }

  output.appendLine("Findings:");

  review.findings.forEach((finding, index) => {
    output.appendLine(`${index + 1}. [${finding.severity}] ${finding.title}`);
    output.appendLine(`   ${finding.body}`);
    output.appendLine(`   Why it matters: ${finding.whyItMatters}`);
    output.appendLine(`   Suggested action: ${finding.suggestedAction}`);
  });

  output.appendLine("");
  output.appendLine("Suggested checks:");

  for (const check of review.suggestedChecks) {
    output.appendLine(`- ${check}`);
  }
}

function buildSuggestedChecks(
  findings: readonly TerminalCommandFinding[]
): readonly string[] {
  if (findings.length === 0) {
    return ["Confirm the command target and run the smallest useful command."];
  }

  return [...new Set(findings.map((finding) => finding.suggestedAction))];
}

function scoreFindings(
  findings: readonly TerminalCommandFinding[]
): RiskSeverity {
  return findings.reduce<RiskSeverity>((highest, finding) => {
    return severityRank[finding.severity] > severityRank[highest]
      ? finding.severity
      : highest;
  }, "low");
}

function capitalize(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
