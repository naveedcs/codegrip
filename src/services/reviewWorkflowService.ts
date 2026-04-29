import { appendFile, mkdir } from "fs/promises";
import * as path from "path";

import type { Finding } from "../types/findings";
import type { GitDiffSnapshot } from "../types/gitDiff";
import type { RiskReview } from "./riskAnalyzer";

export type LatestReview = {
  readonly workspaceName: string;
  readonly workspaceRoot: string;
  readonly snapshot: GitDiffSnapshot;
  readonly review: RiskReview;
  readonly reviewedAt: Date;
};

export type DecisionLogEntry = {
  readonly task: string;
  readonly decision: string;
  readonly reason: string;
  readonly verification: string;
  readonly createdAt: Date;
};

export type AcceptedFindingEntry = {
  readonly finding: Finding;
  readonly task?: string;
  readonly note?: string;
  readonly createdAt: Date;
};

export class ReviewWorkflowService {
  private latestReview: LatestReview | undefined;

  public setLatestReview(review: LatestReview): void {
    this.latestReview = review;
  }

  public getLatestReview(): LatestReview | undefined {
    return this.latestReview;
  }

  public clearLatestReview(): void {
    this.latestReview = undefined;
  }
}

export async function appendDecisionLogEntry(
  workspaceRoot: string,
  entry: DecisionLogEntry
): Promise<string> {
  const filePath = path.join(workspaceRoot, ".codegrip/decision-log.md");
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(filePath, formatDecisionLogEntry(entry), "utf8");
  return filePath;
}

export async function appendAcceptedFindingEntry(
  workspaceRoot: string,
  entry: AcceptedFindingEntry
): Promise<string> {
  const filePath = path.join(
    workspaceRoot,
    ".codegrip/task-history/accepted-findings.md"
  );
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(filePath, formatAcceptedFindingEntry(entry), "utf8");
  return filePath;
}

export function formatDecisionLogEntry(entry: DecisionLogEntry): string {
  return [
    "",
    `## ${formatDate(entry.createdAt)}`,
    "",
    `Task: ${entry.task}`,
    `Decision: ${entry.decision}`,
    `Reason: ${entry.reason}`,
    `Verification: ${entry.verification}`,
    ""
  ].join("\n");
}

export function formatAcceptedFindingEntry(entry: AcceptedFindingEntry): string {
  const lines = [
    "",
    `## ${formatDate(entry.createdAt)}`,
    "",
    entry.task ? `Task: ${entry.task}` : undefined,
    `Accepted finding: ${entry.finding.title}`,
    `Severity: ${entry.finding.severity}`,
    entry.finding.file ? `File: ${entry.finding.file}` : undefined,
    `Why it matters: ${entry.finding.whyItMatters}`,
    entry.finding.suggestedAction
      ? `Suggested action: ${entry.finding.suggestedAction}`
      : undefined,
    entry.note ? `Note: ${entry.note}` : undefined,
    ""
  ].filter((line): line is string => line !== undefined);

  return lines.join("\n");
}

export function formatReviewDetails(review: LatestReview): string {
  const findings =
    review.review.findings.length === 0
      ? "No system-level issues found."
      : review.review.findings
          .map((finding, index) => {
            return [
              `${index + 1}. [${finding.severity}] ${finding.title}`,
              finding.file ? `   File: ${finding.file}` : undefined,
              `   ${finding.body}`,
              `   Why it matters: ${finding.whyItMatters}`,
              finding.suggestedAction
                ? `   Suggested action: ${finding.suggestedAction}`
                : undefined
            ]
              .filter((line): line is string => line !== undefined)
              .join("\n");
          })
          .join("\n\n");

  const suggestedChecks =
    review.review.suggestedChecks.length === 0
      ? "No suggested checks."
      : review.review.suggestedChecks.map((check) => `- ${check}`).join("\n");

  return [
    "# CodeGrip Review Details",
    "",
    `Workspace: ${review.workspaceName}`,
    `Reviewed: ${formatDateTime(review.reviewedAt)}`,
    `Risk: ${review.review.riskScore}`,
    `Changed files: ${review.review.changedFileCount} (+${review.review.additions} / -${review.review.deletions})`,
    `Tests changed: ${review.review.testsChanged ? "yes" : "no"}`,
    `Matching tests changed: ${review.review.matchingTestsChanged ? "yes" : "no"}`,
    "",
    "## Changed Files",
    "",
    ...formatChangedFiles(review.snapshot),
    "",
    "## Findings",
    "",
    findings,
    "",
    "## Suggested Checks",
    "",
    suggestedChecks,
    ""
  ].join("\n");
}

function formatChangedFiles(review: GitDiffSnapshot): readonly string[] {
  if (review.changedFiles.length === 0) {
    return ["No changed files."];
  }

  return review.changedFiles.map((file) => {
    const testMarker = file.isTest ? " test" : "";
    return `- ${file.path} (${file.status}, +${file.additions} / -${file.deletions}${testMarker})`;
  });
}

function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function formatDateTime(value: Date): string {
  return value.toISOString().replace(/\.\d{3}Z$/u, "Z");
}
