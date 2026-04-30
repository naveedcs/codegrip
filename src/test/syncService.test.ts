import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import * as path from "path";
import test from "node:test";

import {
  getAgentRuleFileStatuses,
  syncAgentRuleFiles
} from "../services/syncService";
import type { TemplateName, TemplateService } from "../services/templateService";
import type { WorkspaceInfo } from "../services/workspaceService";

test("syncAgentRuleFiles preserves user content and replaces stale managed sections", async () => {
  const workspaceRoot = await createTempWorkspace();

  try {
    const templateService = createTemplateService({
      "AGENTS.md": "Codex rules",
      "CLAUDE.md": "Claude rules",
      "cursor-rule.mdc": "Cursor rules",
      "copilot-instructions.md": "Copilot rules"
    });
    const workspaceInfo = createWorkspaceInfo(workspaceRoot);

    await writeFile(
      path.join(workspaceRoot, "AGENTS.md"),
      "User notes\n\n<!-- BEGIN CODEGRIP -->\nOld rules\n<!-- END CODEGRIP -->\n\nTail notes\n",
      "utf8"
    );

    const result = await syncAgentRuleFiles(workspaceInfo, templateService);
    const agentsFile = await readFile(
      path.join(workspaceRoot, "AGENTS.md"),
      "utf8"
    );
    const agentsResult = result.files.find((file) => file.path === "AGENTS.md");

    assert.equal(agentsResult?.status, "updated");
    assert.match(agentsFile, /User notes/u);
    assert.match(agentsFile, /Codex rules/u);
    assert.match(agentsFile, /Tail notes/u);
    assert.doesNotMatch(agentsFile, /Old rules/u);

    const statuses = await getAgentRuleFileStatuses(
      workspaceRoot,
      templateService
    );
    assert.deepEqual(
      statuses.map((status) => status.state),
      ["synced", "synced", "synced", "synced"]
    );
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("getAgentRuleFileStatuses reports stale and missing rule files", async () => {
  const workspaceRoot = await createTempWorkspace();

  try {
    const templateService = createTemplateService({
      "AGENTS.md": "Fresh Codex rules",
      "CLAUDE.md": "Fresh Claude rules",
      "cursor-rule.mdc": "Fresh Cursor rules",
      "copilot-instructions.md": "Fresh Copilot rules"
    });

    await writeFile(
      path.join(workspaceRoot, "AGENTS.md"),
      "User notes\n\n<!-- BEGIN CODEGRIP -->\nStale Codex rules\n<!-- END CODEGRIP -->\n\nTail notes\n",
      "utf8"
    );

    const statuses = await getAgentRuleFileStatuses(
      workspaceRoot,
      templateService
    );

    assert.equal(statuses[0]?.state, "out-of-sync");
    assert.deepEqual(
      statuses.slice(1).map((status) => status.state),
      ["missing", "missing", "missing"]
    );
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

async function createTempWorkspace(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "codegrip-sync-"));
}

function createWorkspaceInfo(workspaceRoot: string): WorkspaceInfo {
  return {
    name: "test-workspace",
    fsPath: workspaceRoot,
    isWritable: true,
    isGitRepo: true,
    workspaceFolderCount: 1
  };
}

function createTemplateService(
  templates: Partial<Record<TemplateName, string>>
): TemplateService {
  return {
    read: async (templateName: TemplateName) => templates[templateName] ?? ""
  } as unknown as TemplateService;
}
