# CodeGrip Privacy Notes

CodeGrip is designed as a local-first VS Code extension.

## What CodeGrip Reads

- The active VS Code workspace folder.
- Repo-local `.codegrip/` files.
- Agent instruction files such as `AGENTS.md`, `CLAUDE.md`, Cursor rules, and Copilot instructions.
- Current Git status, numstat, staged diff, and unstaged diff.
- VS Code workspace settings under `codegrip.*`.

## What CodeGrip Writes

- `.codegrip/` initialization files.
- Managed CodeGrip sections in supported agent rule files.
- Generated prompt documents opened in the editor.
- Review detail documents opened in the editor.
- `.codegrip/decision-log.md`.
- `.codegrip/team-policy-pack.json` when the user runs `CodeGrip: Create Team Policy Pack`.
- `.codegrip/org-template.json` when the user initializes a repo.
- `.codegrip/task-history/accepted-findings.md`.
- Local VS Code Problems diagnostics from the current review.
- Local in-memory performance samples in the `CodeGrip` output channel.

## What CodeGrip Does Not Do

- No external LLM calls in the current implementation.
- No telemetry in the current implementation.
- No cloud sync.
- No background upload of prompts, diffs, findings, or file contents.
- No automatic command execution beyond local Git read commands used for diff review.

Optional `codegrip.llmReview.*` settings reserve a future LLM-powered review path. They are disabled by default, and the current extension does not call the configured endpoint.

Optional `codegrip.telemetry.enabled` reserves a future opt-in telemetry path. It is disabled by default, and the current extension does not send telemetry.

## Large Diffs And Binary Files

CodeGrip keeps only up to `codegrip.maxDiffBytes` of diff text for local review. Larger diffs are truncated and receive a review finding.

Binary files are counted and flagged because text diff review cannot inspect their contents.
