import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import * as path from "path";
import test from "node:test";

import { loadOrgTemplate } from "../services/orgTemplateService";
import type { TemplateName, TemplateService } from "../services/templateService";

const validOrgTemplate = JSON.stringify({
  schemaVersion: 1,
  organizationName: "Platform",
  defaultAgentTarget: "Codex",
  reviewStrictness: "strict",
  requiredChecks: ["Run focused tests."],
  sensitivePaths: ["auth"],
  agentInstructions: ["Preserve user edits."]
});

test("loadOrgTemplate falls back to the default template", async () => {
  const workspaceRoot = await mkdtemp(path.join(tmpdir(), "codegrip-org-"));

  try {
    const template = await loadOrgTemplate(
      workspaceRoot,
      createTemplateService(validOrgTemplate)
    );

    assert.equal(template.organizationName, "Platform");
    assert.equal(template.reviewStrictness, "strict");
    assert.deepEqual(template.sensitivePaths, ["auth"]);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("loadOrgTemplate reports invalid schema clearly", async () => {
  const workspaceRoot = await mkdtemp(path.join(tmpdir(), "codegrip-org-"));

  try {
    await mkdir(path.join(workspaceRoot, ".codegrip"), { recursive: true });
    await writeFile(
      path.join(workspaceRoot, ".codegrip/org-template.json"),
      JSON.stringify({
        schemaVersion: 1,
        organizationName: "",
        defaultAgentTarget: "Unknown",
        reviewStrictness: "standard",
        requiredChecks: [],
        sensitivePaths: ["auth"],
        agentInstructions: ["Preserve user edits."]
      }),
      "utf8"
    );

    await assert.rejects(
      () => loadOrgTemplate(workspaceRoot, createTemplateService(validOrgTemplate)),
      /Invalid \.codegrip\/org-template\.json/u
    );
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

function createTemplateService(content: string): TemplateService {
  const templates: Partial<Record<TemplateName, string>> = {
    "org-template.json": content
  };

  return {
    read: async (templateName: TemplateName) => templates[templateName] ?? ""
  } as unknown as TemplateService;
}
