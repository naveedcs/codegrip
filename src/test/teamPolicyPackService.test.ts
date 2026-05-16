import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import * as path from "path";
import test from "node:test";

import {
  buildDefaultTeamPolicyPack,
  createTeamPolicyPack,
  teamPolicyPackRelativePath
} from "../services/teamPolicyPackService";

const createdAt = new Date("2026-04-30T10:00:00.000Z");

test("buildDefaultTeamPolicyPack creates disabled-by-default pro settings", () => {
  const policyPack = buildDefaultTeamPolicyPack({
    workspaceRoot: "/tmp/codegrip-test",
    name: "  Platform Pack  ",
    description: "  Shared platform defaults  ",
    reviewStrictness: "strict",
    llmReview: {
      enabled: true,
      provider: "remote",
      endpoint: "https://review.example.com",
      model: "review-model"
    },
    createdAt
  });

  assert.equal(policyPack.schemaVersion, 1);
  assert.equal(policyPack.name, "Platform Pack");
  assert.equal(policyPack.description, "Shared platform defaults");
  assert.equal(policyPack.policies.reviewStrictness, "strict");
  assert.equal(policyPack.proFeatures.llmReview.enabled, false);
  assert.equal(policyPack.proFeatures.llmReview.provider, "remote");
  assert.match(policyPack.policies.sensitivePaths.join(" "), /auth/u);
  assert.match(policyPack.policies.requiredChecks.join(" "), /focused tests/u);
});

test("buildDefaultTeamPolicyPack applies org template policy defaults", () => {
  const policyPack = buildDefaultTeamPolicyPack({
    workspaceRoot: "/tmp/codegrip-test",
    name: "Platform Pack",
    description: "Shared platform defaults",
    reviewStrictness: "standard",
    llmReview: {
      enabled: false,
      provider: "local",
      endpoint: "",
      model: ""
    },
    orgTemplate: {
      schemaVersion: 1,
      organizationName: "Platform",
      defaultAgentTarget: "Codex",
      reviewStrictness: "strict",
      requiredChecks: ["Run platform checks."],
      sensitivePaths: ["packages/auth"],
      agentInstructions: ["Follow platform ownership boundaries."]
    },
    createdAt
  });

  assert.equal(policyPack.policies.reviewStrictness, "strict");
  assert.deepEqual(policyPack.policies.requiredChecks, ["Run platform checks."]);
  assert.deepEqual(policyPack.policies.sensitivePaths, ["packages/auth"]);
  assert.deepEqual(policyPack.policies.agentInstructions, [
    "Follow platform ownership boundaries."
  ]);
});

test("createTeamPolicyPack writes the pack once and preserves existing content", async () => {
  const workspaceRoot = await mkdtemp(path.join(tmpdir(), "codegrip-policy-"));

  try {
    const input = {
      workspaceRoot,
      name: "Team Pack",
      description: "Team policy defaults",
      reviewStrictness: "standard" as const,
      llmReview: {
        enabled: false,
        provider: "local" as const,
        endpoint: "",
        model: ""
      },
      createdAt
    };

    const created = await createTeamPolicyPack(input);
    const skipped = await createTeamPolicyPack({
      ...input,
      name: "Replacement Pack"
    });
    const content = await readFile(
      path.join(workspaceRoot, teamPolicyPackRelativePath),
      "utf8"
    );

    assert.equal(created.status, "created");
    assert.equal(skipped.status, "skipped");
    assert.equal(skipped.policyPack, undefined);
    assert.match(content, /"name": "Team Pack"/u);
    assert.doesNotMatch(content, /Replacement Pack/u);
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
});
