import { readFile } from "fs/promises";
import * as path from "path";
import type { OutputChannel } from "vscode";

import type { TemplateService } from "./templateService";

export const agentTargets = [
  "Generic",
  "Codex",
  "Claude",
  "Cursor",
  "Copilot"
] as const;

export type AgentTarget = (typeof agentTargets)[number];

export type PromptContext = {
  readonly agentProtocol: string;
  readonly conventions: string;
  readonly usedTemplateFallback: boolean;
};

export type PromptBuildInput = {
  readonly workspaceName: string;
  readonly task: string;
  readonly target: AgentTarget;
  readonly context: PromptContext;
};

export type PromptBuildResult = {
  readonly workspaceName: string;
  readonly task: string;
  readonly target: AgentTarget;
  readonly prompt: string;
  readonly usedTemplateFallback: boolean;
};

export function isAgentTarget(value: string): value is AgentTarget {
  return agentTargets.some((target) => target === value);
}

export async function loadPromptContext(
  workspaceRoot: string,
  templateService: TemplateService
): Promise<PromptContext> {
  const agentProtocol = await readRepoFileOrTemplate(
    workspaceRoot,
    ".codegrip/agent-protocol.md",
    "agent-protocol.md",
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
    conventions: conventions.content,
    usedTemplateFallback:
      agentProtocol.usedTemplateFallback || conventions.usedTemplateFallback
  };
}

export function buildSystemAwarePrompt(
  input: PromptBuildInput
): PromptBuildResult {
  const task = input.task.trim();
  const targetGuidance = getTargetGuidance(input.target);
  const prompt = [
    "# CodeGrip System-Aware Prompt",
    `Repository: ${input.workspaceName}`,
    `Agent target: ${input.target}`,
    "## Task",
    task,
    "## Repository Agent Protocol",
    trimForPrompt(input.context.agentProtocol),
    "## Repository Conventions",
    trimForPrompt(input.context.conventions),
    "## Target-Specific Guidance",
    targetGuidance,
    "## Working Instructions",
    [
      "- Inspect relevant files and likely callers before editing.",
      "- Keep the change small, reviewable, and consistent with local patterns.",
      "- Preserve unrelated user edits.",
      "- Treat auth, permissions, payments, migrations, deployment, config, secrets, and shared utilities as higher-risk areas.",
      "- After editing, summarize files changed, tests run, and remaining risks."
    ].join("\n"),
    "## Completion Format",
    [
      "- Summary:",
      "- Files changed:",
      "- Tests run:",
      "- Remaining risks or follow-ups:"
    ].join("\n")
  ].join("\n\n");

  return {
    workspaceName: input.workspaceName,
    task,
    target: input.target,
    prompt,
    usedTemplateFallback: input.context.usedTemplateFallback
  };
}

export function writePromptSummary(
  output: OutputChannel,
  result: PromptBuildResult
): void {
  output.show(true);
  output.appendLine("");
  output.appendLine("CodeGrip System-Aware Prompt");
  output.appendLine("============================");
  output.appendLine(`Workspace: ${result.workspaceName}`);
  output.appendLine(`Agent target: ${result.target}`);

  if (result.usedTemplateFallback) {
    output.appendLine(
      "Context: used default templates because one or more .codegrip files were missing."
    );
  }

  output.appendLine("");
  output.appendLine(result.prompt);
}

async function readRepoFileOrTemplate(
  workspaceRoot: string,
  relativePath: string,
  templateName: "agent-protocol.md" | "conventions.md",
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

function getTargetGuidance(target: AgentTarget): string {
  switch (target) {
    case "Codex":
      return [
        "- Act as a coding agent inside the user's workspace.",
        "- Prefer direct implementation once the repository context is clear.",
        "- Use concise progress updates and finish with verification details."
      ].join("\n");
    case "Claude":
      return [
        "- Follow the repository instruction files before making edits.",
        "- Keep explanations focused on behavior, risk, and verification.",
        "- Avoid broad rewrites unless the task explicitly requires them."
      ].join("\n");
    case "Cursor":
      return [
        "- Apply the prompt as repo-level working context.",
        "- Keep generated edits aligned with nearby file style.",
        "- Re-check affected files after edits before presenting the result."
      ].join("\n");
    case "Copilot":
      return [
        "- Use this prompt as guidance for suggestions and chat edits.",
        "- Prefer small, idiomatic changes over speculative refactors.",
        "- Include relevant tests or manual checks with the final answer."
      ].join("\n");
    case "Generic":
      return [
        "- Use the repository context below as the source of truth.",
        "- Ask only when missing information would materially change the implementation.",
        "- Keep final output concise and grounded in files changed and checks run."
      ].join("\n");
  }
}
