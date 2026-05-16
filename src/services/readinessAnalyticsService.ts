import { readdir, readFile } from "fs/promises";
import * as path from "path";

import type { RiskSeverity } from "../types/findings";

export type ReadinessStatus = "ready" | "warning" | "missing";

export type ReadinessChecklistSignal = {
  readonly label: string;
  readonly path: string;
  readonly status: "ready" | "needs-detail" | "missing" | "warning";
  readonly detail: string;
};

export type ReadinessDiffSignal = {
  readonly state: "unavailable" | "clean" | "reviewed" | "error";
  readonly changedFileCount?: number;
  readonly testsChanged?: boolean;
  readonly matchingTestsChanged?: boolean;
};

export type AgentReadinessMetric = {
  readonly id:
    | "protocol"
    | "architecture"
    | "conventions"
    | "risk-rules"
    | "agent-files"
    | "test-signal";
  readonly label: string;
  readonly score: number;
  readonly status: ReadinessStatus;
  readonly detail: string;
};

export type ReleaseReadinessItem = {
  readonly id:
    | "compile"
    | "lint"
    | "tests"
    | "package"
    | "smoke"
    | "dogfooding"
    | "screenshots"
    | "license"
    | "changelog";
  readonly label: string;
  readonly status: ReadinessStatus;
  readonly detail: string;
  readonly sourcePath: string;
};

export type FalsePositiveSeverityBucket = {
  readonly severity: RiskSeverity;
  readonly count: number;
};

export type FalsePositiveTrend = {
  readonly status: ReadinessStatus;
  readonly acceptedFindingCount: number;
  readonly dogfoodingSignalCount: number;
  readonly loggedExampleCount: number;
  readonly severityBreakdown: readonly FalsePositiveSeverityBucket[];
  readonly detail: string;
};

export type ReadinessAnalytics = {
  readonly agentRadar: readonly AgentReadinessMetric[];
  readonly releaseBoard: readonly ReleaseReadinessItem[];
  readonly falsePositiveTrend: FalsePositiveTrend;
  readonly localSummary: string;
};

export type BuildReadinessAnalyticsInput = {
  readonly workspaceRoot: string;
  readonly systemReadiness: readonly ReadinessChecklistSignal[];
  readonly agentFiles: readonly ReadinessChecklistSignal[];
  readonly diffRisk: ReadinessDiffSignal;
};

const screenshotExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
const severityOrder: readonly RiskSeverity[] = [
  "critical",
  "high",
  "medium",
  "low"
];

export async function buildReadinessAnalytics(
  input: BuildReadinessAnalyticsInput
): Promise<ReadinessAnalytics> {
  const [releaseBoard, falsePositiveTrend] = await Promise.all([
    buildReleaseReadinessBoard(input.workspaceRoot),
    buildFalsePositiveTrend(input.workspaceRoot)
  ]);
  const agentRadar = buildAgentReadinessRadar(input);

  return {
    agentRadar,
    releaseBoard,
    falsePositiveTrend,
    localSummary: buildLocalSummary(agentRadar, releaseBoard, falsePositiveTrend)
  };
}

export function buildAgentReadinessRadar(
  input: Pick<
    BuildReadinessAnalyticsInput,
    "systemReadiness" | "agentFiles" | "diffRisk"
  >
): readonly AgentReadinessMetric[] {
  return [
    readinessFileMetric(
      "protocol",
      "Protocol",
      findChecklistSignal(input.systemReadiness, ".codegrip/agent-protocol.md")
    ),
    readinessFileMetric(
      "architecture",
      "Architecture",
      findChecklistSignal(input.systemReadiness, ".codegrip/architecture.md")
    ),
    readinessFileMetric(
      "conventions",
      "Conventions",
      findChecklistSignal(input.systemReadiness, ".codegrip/conventions.md")
    ),
    readinessFileMetric(
      "risk-rules",
      "Risk rules",
      findChecklistSignal(input.systemReadiness, ".codegrip/risk-rules.json")
    ),
    buildAgentFilesMetric(input.agentFiles),
    buildTestSignalMetric(input.diffRisk)
  ];
}

async function buildReleaseReadinessBoard(
  workspaceRoot: string
): Promise<readonly ReleaseReadinessItem[]> {
  const [releaseChecklist, taskTracker] = await Promise.all([
    readOptionalText(path.join(workspaceRoot, "docs/release-checklist.md")),
    readOptionalText(path.join(workspaceRoot, "docs/sprints/task-tracker.md"))
  ]);
  const verificationInputs = {
    releaseChecklist,
    taskTracker
  };

  const [screenshots, license, changelog] = await Promise.all([
    buildScreenshotItem(workspaceRoot),
    buildLicenseItem(workspaceRoot),
    buildChangelogItem(workspaceRoot)
  ]);

  return [
    buildVerificationItem({
      id: "compile",
      label: "Compile",
      checklistPattern: /`npm run compile`/u,
      trackerPattern: /- \[x\] Sprint \d+ compile pass(?:es|ed)\./u,
      sourcePath: "docs/release-checklist.md",
      ...verificationInputs
    }),
    buildVerificationItem({
      id: "lint",
      label: "Lint",
      checklistPattern: /`npm run lint`/u,
      trackerPattern: /- \[x\] Sprint \d+ lint pass(?:es|ed)\./u,
      sourcePath: "docs/release-checklist.md",
      ...verificationInputs
    }),
    buildVerificationItem({
      id: "tests",
      label: "Tests",
      checklistPattern: /`npm test`/u,
      trackerPattern: /- \[x\] Sprint \d+ unit tests pass\./u,
      sourcePath: "docs/release-checklist.md",
      ...verificationInputs
    }),
    buildVerificationItem({
      id: "package",
      label: "VSIX",
      checklistPattern: /`npm run package`/u,
      trackerPattern: /- \[x\] Sprint \d+ VSIX package builds\./u,
      sourcePath: "docs/release-checklist.md",
      ...verificationInputs
    }),
    buildReleaseClosureItem({
      id: "smoke",
      label: "Smoke",
      pattern: /Run one full Extension Development Host smoke test/u,
      sourcePath: "docs/sprints/task-tracker.md",
      taskTracker
    }),
    buildReleaseClosureItem({
      id: "dogfooding",
      label: "Dogfood",
      pattern: /Dogfood CodeGrip on at least two real repositories/u,
      sourcePath: "docs/sprints/task-tracker.md",
      taskTracker
    }),
    screenshots,
    license,
    changelog
  ];
}

async function buildFalsePositiveTrend(
  workspaceRoot: string
): Promise<FalsePositiveTrend> {
  const [acceptedFindings, dogfooding, examples] = await Promise.all([
    readOptionalText(
      path.join(workspaceRoot, ".codegrip/task-history/accepted-findings.md")
    ),
    readOptionalText(path.join(workspaceRoot, "docs/dogfooding.md")),
    readOptionalText(path.join(workspaceRoot, "docs/false-positive-examples.md"))
  ]);
  const acceptedFindingCount = countMatches(
    acceptedFindings,
    /^Accepted finding:/gimu
  );
  const severityBreakdown = countAcceptedSeverities(acceptedFindings);
  const dogfoodingSignalCount = countDogfoodingFalsePositiveSignals(dogfooding);
  const loggedExampleCount = countLoggedFalsePositiveExamples(examples);
  const status = falsePositiveTrendStatus(
    acceptedFindingCount,
    dogfoodingSignalCount,
    loggedExampleCount
  );

  return {
    status,
    acceptedFindingCount,
    dogfoodingSignalCount,
    loggedExampleCount,
    severityBreakdown,
    detail: `${acceptedFindingCount} accepted, ${dogfoodingSignalCount} dogfood signals, ${loggedExampleCount} logged examples`
  };
}

function readinessFileMetric(
  id: AgentReadinessMetric["id"],
  label: string,
  signal: ReadinessChecklistSignal | undefined
): AgentReadinessMetric {
  if (!signal) {
    return {
      id,
      label,
      score: 0,
      status: "missing",
      detail: "Not found"
    };
  }

  if (signal.status === "ready") {
    return {
      id,
      label,
      score: 100,
      status: "ready",
      detail: signal.detail ?? "Ready"
    };
  }

  if (signal.status === "missing") {
    return {
      id,
      label,
      score: 0,
      status: "missing",
      detail: "Missing"
    };
  }

  return {
    id,
    label,
    score: 50,
    status: "warning",
    detail: signal.status === "warning" ? "Warning" : "Needs detail"
  };
}

function buildAgentFilesMetric(
  agentFiles: readonly ReadinessChecklistSignal[]
): AgentReadinessMetric {
  if (agentFiles.length === 0) {
    return {
      id: "agent-files",
      label: "Agent files",
      score: 0,
      status: "missing",
      detail: "No agent files checked"
    };
  }

  const readyCount = agentFiles.filter((file) => file.status === "ready").length;
  const score = Math.round((readyCount / agentFiles.length) * 100);

  return {
    id: "agent-files",
    label: "Agent files",
    score,
    status:
      readyCount === agentFiles.length
        ? "ready"
        : readyCount === 0
          ? "missing"
          : "warning",
    detail: `${readyCount}/${agentFiles.length} synced`
  };
}

function buildTestSignalMetric(
  diffRisk: ReadinessDiffSignal
): AgentReadinessMetric {
  if (diffRisk.state === "clean") {
    return {
      id: "test-signal",
      label: "Test signal",
      score: 80,
      status: "ready",
      detail: "No current diff"
    };
  }

  if (diffRisk.state !== "reviewed") {
    return {
      id: "test-signal",
      label: "Test signal",
      score: 25,
      status: "warning",
      detail: "Review unavailable"
    };
  }

  if (diffRisk.matchingTestsChanged) {
    return {
      id: "test-signal",
      label: "Test signal",
      score: 100,
      status: "ready",
      detail: "Matching tests changed"
    };
  }

  if (diffRisk.testsChanged) {
    return {
      id: "test-signal",
      label: "Test signal",
      score: 75,
      status: "warning",
      detail: "Tests changed"
    };
  }

  return {
    id: "test-signal",
    label: "Test signal",
    score: diffRisk.changedFileCount === 0 ? 80 : 35,
    status: diffRisk.changedFileCount === 0 ? "ready" : "warning",
    detail: diffRisk.changedFileCount === 0 ? "No changed files" : "No test signal"
  };
}

function buildVerificationItem(input: {
  readonly id: ReleaseReadinessItem["id"];
  readonly label: string;
  readonly checklistPattern: RegExp;
  readonly trackerPattern: RegExp;
  readonly sourcePath: string;
  readonly releaseChecklist: string | undefined;
  readonly taskTracker: string | undefined;
}): ReleaseReadinessItem {
  if (isChecklistPatternChecked(input.releaseChecklist, input.checklistPattern)) {
    return {
      id: input.id,
      label: input.label,
      status: "ready",
      detail: "Release checklist checked",
      sourcePath: input.sourcePath
    };
  }

  if (input.taskTracker && input.trackerPattern.test(input.taskTracker)) {
    return {
      id: input.id,
      label: input.label,
      status: "warning",
      detail: "Latest sprint passed; release box still open",
      sourcePath: input.sourcePath
    };
  }

  return {
    id: input.id,
    label: input.label,
    status: "missing",
    detail: "Not verified for release",
    sourcePath: input.sourcePath
  };
}

function buildReleaseClosureItem(input: {
  readonly id: ReleaseReadinessItem["id"];
  readonly label: string;
  readonly pattern: RegExp;
  readonly sourcePath: string;
  readonly taskTracker: string | undefined;
}): ReleaseReadinessItem {
  const checked = isChecklistPatternChecked(input.taskTracker, input.pattern);

  return {
    id: input.id,
    label: input.label,
    status: checked ? "ready" : "missing",
    detail: checked ? "Release closure checked" : "Release closure open",
    sourcePath: input.sourcePath
  };
}

async function buildScreenshotItem(
  workspaceRoot: string
): Promise<ReleaseReadinessItem> {
  const screenshotDir = path.join(workspaceRoot, "media/screenshots");
  const screenshotCount = await countScreenshotFiles(screenshotDir);

  return {
    id: "screenshots",
    label: "Screens",
    status: screenshotCount > 0 ? "ready" : "missing",
    detail:
      screenshotCount > 0
        ? `${screenshotCount} screenshot${screenshotCount === 1 ? "" : "s"} captured`
        : "No screenshots captured",
    sourcePath: "media/screenshots"
  };
}

async function buildLicenseItem(
  workspaceRoot: string
): Promise<ReleaseReadinessItem> {
  const [packageText, licenseText] = await Promise.all([
    readOptionalText(path.join(workspaceRoot, "package.json")),
    readOptionalText(path.join(workspaceRoot, "LICENSE"))
  ]);
  const packageLicense = readPackageLicense(packageText);
  const licenseReady =
    packageLicense !== undefined &&
    packageLicense.toUpperCase() !== "UNLICENSED" &&
    !/not licensed|unlicensed for public redistribution/iu.test(licenseText ?? "");

  return {
    id: "license",
    label: "License",
    status: licenseReady ? "ready" : "warning",
    detail: licenseReady ? packageLicense : "Public license undecided",
    sourcePath: "LICENSE"
  };
}

async function buildChangelogItem(
  workspaceRoot: string
): Promise<ReleaseReadinessItem> {
  const candidates = ["CHANGELOG.md", "docs/changelog.md"];

  for (const candidate of candidates) {
    const content = await readOptionalText(path.join(workspaceRoot, candidate));

    if (content && content.trim().length > 0) {
      return {
        id: "changelog",
        label: "Changelog",
        status: "ready",
        detail: "Changelog exists",
        sourcePath: candidate
      };
    }
  }

  return {
    id: "changelog",
    label: "Changelog",
    status: "missing",
    detail: "No changelog yet",
    sourcePath: "CHANGELOG.md"
  };
}

function buildLocalSummary(
  agentRadar: readonly AgentReadinessMetric[],
  releaseBoard: readonly ReleaseReadinessItem[],
  falsePositiveTrend: FalsePositiveTrend
): string {
  const readyMetrics = agentRadar.filter((metric) => metric.status === "ready")
    .length;
  const readyReleaseItems = releaseBoard.filter((item) => item.status === "ready")
    .length;

  return `${readyMetrics}/${agentRadar.length} agent signals ready, ${readyReleaseItems}/${releaseBoard.length} release items ready, ${falsePositiveTrend.acceptedFindingCount} accepted findings tracked locally.`;
}

function findChecklistSignal(
  signals: readonly ReadinessChecklistSignal[],
  filePath: string
): ReadinessChecklistSignal | undefined {
  return signals.find((signal) => signal.path === filePath);
}

function isChecklistPatternChecked(
  content: string | undefined,
  pattern: RegExp
): boolean {
  if (!content) {
    return false;
  }

  return content.split(/\r?\n/u).some((line) => {
    return /^- \[x\]/iu.test(line) && pattern.test(line);
  });
}

async function readOptionalText(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (isMissingFile(error)) {
      return undefined;
    }

    throw error;
  }
}

async function countScreenshotFiles(directoryPath: string): Promise<number> {
  try {
    const entries = await readdir(directoryPath);
    return entries.filter((entry) => {
      return !entry.startsWith(".") && screenshotExtensions.has(path.extname(entry));
    }).length;
  } catch (error) {
    if (isMissingFile(error)) {
      return 0;
    }

    throw error;
  }
}

function readPackageLicense(packageText: string | undefined): string | undefined {
  if (!packageText) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(packageText) as { readonly license?: unknown };
    return typeof parsed.license === "string" ? parsed.license : undefined;
  } catch {
    return undefined;
  }
}

function countMatches(content: string | undefined, pattern: RegExp): number {
  return content ? [...content.matchAll(pattern)].length : 0;
}

function countAcceptedSeverities(
  acceptedFindings: string | undefined
): readonly FalsePositiveSeverityBucket[] {
  const counts = new Map<RiskSeverity, number>();

  for (const match of acceptedFindings?.matchAll(/^Severity:\s*(low|medium|high|critical)$/gimu) ??
    []) {
    const severity = match[1]?.toLowerCase() as RiskSeverity | undefined;

    if (severity) {
      counts.set(severity, (counts.get(severity) ?? 0) + 1);
    }
  }

  return severityOrder
    .map((severity) => ({
      severity,
      count: counts.get(severity) ?? 0
    }))
    .filter((bucket) => bucket.count > 0);
}

function countDogfoodingFalsePositiveSignals(
  dogfooding: string | undefined
): number {
  if (!dogfooding) {
    return 0;
  }

  return dogfooding.split(/\r?\n/u).filter((line) => {
    const match = line.match(/^- False positives:\s*(.+)$/iu);
    const value = match?.[1]?.trim();

    return (
      value !== undefined &&
      value.length > 0 &&
      !/^(?:tbd|none|no|n\/a|-)\.?$/iu.test(value)
    );
  }).length;
}

function countLoggedFalsePositiveExamples(examples: string | undefined): number {
  if (!examples) {
    return 0;
  }

  return examples.split(/\r?\n/u).filter((line) => {
    if (!line.startsWith("|") || /\|\s*---/u.test(line)) {
      return false;
    }

    const [date] = line
      .split("|")
      .slice(1)
      .map((cell) => cell.trim());

    return Boolean(date) && !/^date$/iu.test(date) && !/^tbd$/iu.test(date);
  }).length;
}

function falsePositiveTrendStatus(
  acceptedFindingCount: number,
  dogfoodingSignalCount: number,
  loggedExampleCount: number
): ReadinessStatus {
  if (loggedExampleCount > 0) {
    return "ready";
  }

  if (acceptedFindingCount > 0 || dogfoodingSignalCount > 0) {
    return "warning";
  }

  return "missing";
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { readonly code?: string }).code === "ENOENT"
  );
}
