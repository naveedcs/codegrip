import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSystemAwarePrompt,
  isAgentTarget
} from "../services/promptBuilder";

test("buildSystemAwarePrompt trims task text and includes repo context", () => {
  const result = buildSystemAwarePrompt({
    workspaceName: "codegrip-test",
    task: "  Add diagnostics coverage  ",
    target: "Codex",
    context: {
      agentProtocol: "# Protocol\nInspect before editing.",
      conventions: "# Conventions\nKeep changes focused.",
      usedTemplateFallback: false
    }
  });

  assert.equal(result.task, "Add diagnostics coverage");
  assert.equal(result.workspaceName, "codegrip-test");
  assert.equal(result.target, "Codex");
  assert.equal(result.usedTemplateFallback, false);
  assert.match(result.prompt, /Repository: codegrip-test/u);
  assert.match(result.prompt, /Agent target: Codex/u);
  assert.match(result.prompt, /Inspect before editing/u);
  assert.match(result.prompt, /Keep changes focused/u);
  assert.match(result.prompt, /Preserve unrelated user edits/u);
});

test("buildSystemAwarePrompt renders fallback context as explicit guidance", () => {
  const result = buildSystemAwarePrompt({
    workspaceName: "codegrip-test",
    task: "Review diff",
    target: "Generic",
    context: {
      agentProtocol: "",
      conventions: "",
      usedTemplateFallback: true
    }
  });

  assert.equal(result.usedTemplateFallback, true);
  assert.match(result.prompt, /\(No guidance yet\.\)/u);
  assert.match(result.prompt, /Use the repository context below as the source of truth/u);
});

test("isAgentTarget accepts supported targets only", () => {
  assert.equal(isAgentTarget("Codex"), true);
  assert.equal(isAgentTarget("Claude"), true);
  assert.equal(isAgentTarget("Windsurf"), false);
});
