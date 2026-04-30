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
- `.codegrip/task-history/accepted-findings.md`.
- Local VS Code Problems diagnostics from the current review.
- Local in-memory performance samples in the `CodeGrip` output channel.

## What CodeGrip Does Not Do

- No external LLM calls.
- No telemetry.
- No cloud sync.
- No background upload of prompts, diffs, findings, or file contents.
- No automatic command execution beyond local Git read commands used for diff review.

## Large Diffs And Binary Files

CodeGrip keeps only up to `codegrip.maxDiffBytes` of diff text for local review. Larger diffs are truncated and receive a review finding.

Binary files are counted and flagged because text diff review cannot inspect their contents.
