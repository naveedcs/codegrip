import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import * as path from "path";
import test from "node:test";

import { loadRiskRules } from "../services/ruleService";
import type { TemplateName, TemplateService } from "../services/templateService";

const validRules = JSON.stringify({
  rules: [
    {
      id: "auth-change",
      title: "Auth changed",
      severity: "high",
      matchPaths: ["**/*auth*"],
      message: "Auth changes affect sign-in behavior.",
      suggestedAction: "Run auth tests.",
      requireTests: true
    }
  ]
});

test("loadRiskRules falls back to the default template when repo rules are missing", async () => {
  const workspaceRoot = await createTempWorkspace();

  try {
    const rules = await loadRiskRules(
      workspaceRoot,
      createTemplateService({ "risk-rules.json": validRules })
    );

    assert.equal(rules.length, 1);
    assert.equal(rules[0]?.id, "auth-change");
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("loadRiskRules reports malformed repo JSON clearly", async () => {
  const workspaceRoot = await createTempWorkspace();

  try {
    await mkdir(path.join(workspaceRoot, ".codegrip"), { recursive: true });
    await writeFile(
      path.join(workspaceRoot, ".codegrip/risk-rules.json"),
      "{ bad json",
      "utf8"
    );

    await assert.rejects(
      () =>
        loadRiskRules(
          workspaceRoot,
          createTemplateService({ "risk-rules.json": validRules })
        ),
      /Malformed JSON in \.codegrip\/risk-rules\.json/u
    );
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

test("loadRiskRules reports invalid rule schema locations", async () => {
  const workspaceRoot = await createTempWorkspace();
  const invalidRules = JSON.stringify({
    rules: [
      {
        id: "bad-rule",
        title: "Bad rule",
        severity: "urgent",
        matchPaths: ["**/*auth*"],
        message: "Bad severity."
      }
    ]
  });

  try {
    await mkdir(path.join(workspaceRoot, ".codegrip"), { recursive: true });
    await writeFile(
      path.join(workspaceRoot, ".codegrip/risk-rules.json"),
      invalidRules,
      "utf8"
    );

    await assert.rejects(
      () =>
        loadRiskRules(
          workspaceRoot,
          createTemplateService({ "risk-rules.json": validRules })
        ),
      /rules\[0\]\.severity/u
    );
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});

async function createTempWorkspace(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "codegrip-rules-"));
}

function createTemplateService(
  templates: Partial<Record<TemplateName, string>>
): TemplateService {
  return {
    read: async (templateName: TemplateName) => templates[templateName] ?? ""
  } as unknown as TemplateService;
}
