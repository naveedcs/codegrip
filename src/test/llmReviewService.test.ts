import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import * as path from "path";
import test from "node:test";

import {
  buildLlmReviewPrompt,
  formatLlmReviewDiffSummary,
  loadLlmReviewPromptContext
} from "../services/llmReviewService";
import type { TemplateName, TemplateService } from "../services/templateService";
import type { GitDiffSnapshot } from "../types/gitDiff";
import type { RiskRule } from "../types/rules";
import type { RiskReview } from "../services/riskAnalyzer";

test("buildLlmReviewPrompt includes diff summary, rules, and repo context", async () => {
  const prompt = await buildLlmReviewPrompt(createTemplateService(), {
    workspaceName: "codegrip-test",
    diffSummary: "Risk: high\nChanged files: 1",
    riskRules: [createRiskRule()],
    context: {
      agentProtocol: "Inspect first.",
      architecture: "Shared utilities have broad blast radius.",
      conventions: "Keep changes small.",
      usedTemplateFallback: false
    }
  });

  assert.match(prompt, /Repository: codegrip-test/u);
  assert.match(prompt, /Risk: high/u);
  assert.match(prompt, /Auth flow changed/u);
  assert.match(prompt, /Requires tests/u);
  assert.match(prompt, /Inspect first/u);
  assert.match(prompt, /Shared utilities have broad blast radius/u);
  assert.match(prompt, /Keep changes small/u);
});

test("formatLlmReviewDiffSummary renders review metadata and changed files", () => {
  const summary = formatLlmReviewDiffSummary(createSnapshot(), createReview());

  assert.match(summary, /Risk: high/u);
  assert.match(summary, /Changed files: 1/u);
  assert.match(summary, /Tests changed: no/u);
  assert.match(summary, /src\/auth\/session\.ts/u);
});

test("loadLlmReviewPromptContext reads repo files and falls back to templates", async () => {
  const workspaceRoot = await mkdtemp(path.join(tmpdir(), "codegrip-llm-"));

  try {
    await mkdir(path.join(workspaceRoot, ".codegrip"), { recursive: true });
    await writeFile(
      path.join(workspaceRoot, ".codegrip/agent-protocol.md"),
      "Repo protocol",
      "utf8"
    );

    const context = await loadLlmReviewPromptContext(
      workspaceRoot,
      createTemplateService()
    );

    assert.equal(context.agentProtocol, "Repo protocol");
    assert.equal(context.architecture, "Template architecture");
    assert.equal(context.conventions, "Template conventions");
    assert.equal(context.usedTemplateFallback, true);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

function createTemplateService(): TemplateService {
  const templates: Partial<Record<TemplateName, string>> = {
    "llm-review-prompt.md": [
      "Repository: {{workspaceName}}",
      "## Diff Summary",
      "{{diffSummary}}",
      "## Risk Rules",
      "{{riskRules}}",
      "## Repository Agent Protocol",
      "{{agentProtocol}}",
      "## Repository Architecture Notes",
      "{{architecture}}",
      "## Repository Conventions",
      "{{conventions}}"
    ].join("\n\n"),
    "agent-protocol.md": "Template protocol",
    "architecture.md": "Template architecture",
    "conventions.md": "Template conventions"
  };

  return {
    read: async (templateName: TemplateName) => templates[templateName] ?? ""
  } as unknown as TemplateService;
}

function createRiskRule(): RiskRule {
  return {
    id: "auth-change-requires-tests",
    title: "Auth flow changed",
    severity: "high",
    matchPaths: ["**/*auth*"],
    message: "Authentication changes can affect sign-in behavior.",
    suggestedAction: "Run auth regression tests.",
    requireTests: true
  };
}

function createSnapshot(): GitDiffSnapshot {
  return {
    isGitRepo: true,
    repoRoot: "/tmp/codegrip-test",
    changedFiles: [
      {
        path: "src/auth/session.ts",
        status: "modified",
        additions: 3,
        deletions: 1,
        isTest: false,
        isBinary: false
      }
    ],
    additions: 3,
    deletions: 1,
    binaryFileCount: 0,
    unstagedDiff: "",
    stagedDiff: "",
    combinedDiff: "",
    diffBytes: 0,
    diffTruncated: false,
    maxDiffBytes: 750_000
  };
}

function createReview(): RiskReview {
  return {
    riskScore: "high",
    changedFileCount: 1,
    additions: 3,
    deletions: 1,
    testsChanged: false,
    matchingTestsChanged: false,
    findings: [],
    suggestedChecks: []
  };
}
