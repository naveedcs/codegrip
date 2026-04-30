import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import * as path from "path";
import test from "node:test";

import { initializeRepo } from "../services/initializeRepoService";
import type { TemplateName, TemplateService } from "../services/templateService";
import type { WorkspaceInfo } from "../services/workspaceService";

test("initializeRepo creates core files and agent rule files", async () => {
  const workspaceRoot = await createTempWorkspace();

  try {
    const result = await initializeRepo(
      createWorkspaceInfo(workspaceRoot),
      createTemplateService()
    );

    assert.equal(result.workspaceName, "test-workspace");
    assert.equal(result.files.length, 10);
    assert.ok(
      result.files.every((file) => file.status === "created"),
      "all initialization files should be created in a fresh workspace"
    );
    assert.match(
      await readFile(path.join(workspaceRoot, ".codegrip/agent-protocol.md"), "utf8"),
      /Protocol template/u
    );
    assert.match(
      await readFile(path.join(workspaceRoot, "AGENTS.md"), "utf8"),
      /BEGIN CODEGRIP/u
    );
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("initializeRepo preserves user content outside managed sections", async () => {
  const workspaceRoot = await createTempWorkspace();

  try {
    await writeFile(
      path.join(workspaceRoot, "AGENTS.md"),
      "User notes\n\n<!-- BEGIN CODEGRIP -->\nOld content\n<!-- END CODEGRIP -->\n\nTail notes\n",
      "utf8"
    );

    const result = await initializeRepo(
      createWorkspaceInfo(workspaceRoot),
      createTemplateService({
        "AGENTS.md": "Fresh Codex guidance"
      })
    );
    const agentsFile = await readFile(path.join(workspaceRoot, "AGENTS.md"), "utf8");
    const agentsResult = result.files.find((file) => file.path === "AGENTS.md");

    assert.equal(agentsResult?.status, "updated");
    assert.match(agentsFile, /User notes/u);
    assert.match(agentsFile, /Fresh Codex guidance/u);
    assert.match(agentsFile, /Tail notes/u);
    assert.doesNotMatch(agentsFile, /Old content/u);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

async function createTempWorkspace(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "codegrip-init-"));
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
  overrides: Partial<Record<TemplateName, string>> = {}
): TemplateService {
  const templates: Record<TemplateName, string> = {
    "agent-protocol.md": "Protocol template",
    "architecture.md": "Architecture template",
    "conventions.md": "Conventions template",
    "risk-rules.json": "{\"rules\": []}",
    "decision-log.md": "Decision log template",
    "AGENTS.md": "Codex guidance",
    "CLAUDE.md": "Claude guidance",
    "cursor-rule.mdc": "Cursor guidance",
    "copilot-instructions.md": "Copilot guidance",
    ...overrides
  };

  return {
    read: async (templateName: TemplateName) => templates[templateName]
  } as unknown as TemplateService;
}
