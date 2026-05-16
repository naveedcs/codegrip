import { readFile } from "fs/promises";
import * as path from "path";

import type { GitDiffSnapshot } from "../types/gitDiff";
import type { RiskRule } from "../types/rules";
import type { RiskReview } from "./riskAnalyzer";
import type { TemplateService } from "./templateService";

export type LlmReviewPromptContext = {
  readonly agentProtocol: string;
  readonly architecture: string;
  readonly conventions: string;
  readonly usedTemplateFallback: boolean;
};

export type LlmReviewPromptInput = {
  readonly workspaceName: string;
  readonly diffSummary: string;
  readonly riskRules: readonly RiskRule[];
  readonly context: LlmReviewPromptContext;
};

export async function loadLlmReviewPromptContext(
  workspaceRoot: string,
  templateService: TemplateService
): Promise<LlmReviewPromptContext> {
  const agentProtocol = await readRepoFileOrTemplate(
    workspaceRoot,
    ".codegrip/agent-protocol.md",
    "agent-protocol.md",
    templateService
  );
  const architecture = await readRepoFileOrTemplate(
    workspaceRoot,
    ".codegrip/architecture.md",
    "architecture.md",
    templateService
  );
  const conventions = await readRepoFileOrTemplate(
    workspaceRoot,
    ".codegrip/conventions.md",
    "conventions.md",
    templateService
  );

  return {
    agentProtocol: agentProtocol.content,
    architecture: architecture.content,
    conventions: conventions.content,
    usedTemplateFallback:
      agentProtocol.usedTemplateFallback ||
      architecture.usedTemplateFallback ||
      conventions.usedTemplateFallback
  };
}

export async function buildLlmReviewPrompt(
  templateService: TemplateService,
  input: LlmReviewPromptInput
): Promise<string> {
  const template = await templateService.read("llm-review-prompt.md");

  return template
    .replaceAll("{{workspaceName}}", input.workspaceName)
    .replaceAll("{{diffSummary}}", trimForPrompt(input.diffSummary))
    .replaceAll("{{riskRules}}", formatRiskRules(input.riskRules))
    .replaceAll("{{agentProtocol}}", trimForPrompt(input.context.agentProtocol))
    .replaceAll("{{architecture}}", trimForPrompt(input.context.architecture))
    .replaceAll("{{conventions}}", trimForPrompt(input.context.conventions));
}

export function formatLlmReviewDiffSummary(
  snapshot: GitDiffSnapshot,
  review: RiskReview
): string {
  const changedFiles =
    snapshot.changedFiles.length === 0
      ? "No changed files."
      : snapshot.changedFiles
          .map((file) => {
            const markers = [
              file.isTest ? "test" : undefined,
              file.isBinary ? "binary" : undefined
            ]
              .filter((marker): marker is string => marker !== undefined)
              .join(", ");
            const markerText = markers.length > 0 ? `, ${markers}` : "";
            return `- ${file.path} (${file.status}, +${file.additions} / -${file.deletions}${markerText})`;
          })
          .join("\n");

  return [
    `Risk: ${review.riskScore}`,
    `Changed files: ${review.changedFileCount}`,
    `Lines changed: +${review.additions} / -${review.deletions}`,
    `Tests changed: ${review.testsChanged ? "yes" : "no"}`,
    `Matching tests changed: ${review.matchingTestsChanged ? "yes" : "no"}`,
    `Binary files changed: ${snapshot.binaryFileCount}`,
    `Diff truncated: ${snapshot.diffTruncated ? "yes" : "no"}`,
    "",
    "Changed files:",
    changedFiles
  ].join("\n");
}

async function readRepoFileOrTemplate(
  workspaceRoot: string,
  relativePath: string,
  templateName: "agent-protocol.md" | "architecture.md" | "conventions.md",
  templateService: TemplateService
): Promise<{
  readonly content: string;
  readonly usedTemplateFallback: boolean;
}> {
  try {
    return {
      content: await readFile(path.join(workspaceRoot, relativePath), "utf8"),
      usedTemplateFallback: false
    };
  } catch (error) {
    if (!isMissingFile(error)) {
      throw error;
    }

    return {
      content: await templateService.read(templateName),
      usedTemplateFallback: true
    };
  }
}

function formatRiskRules(rules: readonly RiskRule[]): string {
  if (rules.length === 0) {
    return "No risk rules loaded.";
  }

  return rules
    .map((rule) => {
      const requireTests = rule.requireTests ? " Requires tests." : "";
      const suggestedAction = rule.suggestedAction
        ? ` Suggested action: ${rule.suggestedAction}`
        : "";
      return `- [${rule.severity}] ${rule.title}: ${rule.message}${requireTests}${suggestedAction}`;
    })
    .join("\n");
}

function trimForPrompt(content: string): string {
  return content.trim().length > 0 ? content.trim() : "(No guidance yet.)";
}

function isMissingFile(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { readonly code?: string }).code === "ENOENT"
  );
}
