# Manual Extension Host Checklist

Run this checklist before sharing a fresh beta VSIX.

## Setup

- [ ] Run `npm install`.
- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run package`.
- [ ] Start `Run Extension` from VS Code.
- [ ] Open a disposable Git test workspace in the Extension Development Host.

## Dashboard

- [ ] Open the CodeGrip activity bar item.
- [ ] Confirm repo name, initialization status, Git status, readiness, diff risk, and agent file status render.
- [ ] In a multi-root workspace, open a file in the intended folder and confirm CodeGrip uses that active folder.
- [ ] In a multi-root workspace with no active editor, confirm CodeGrip prefers an initialized `.codegrip/` folder.

## Initialization And Sync

- [ ] Run `CodeGrip: Initialize Repo`.
- [ ] Confirm `.codegrip/` files are created.
- [ ] Confirm `.codegrip/org-template.json` is created.
- [ ] Confirm `AGENTS.md`, `CLAUDE.md`, Cursor rules, and Copilot instructions are created with managed sections.
- [ ] Add custom text outside a managed section.
- [ ] Run `CodeGrip: Sync Agent Rule Files`.
- [ ] Confirm custom text remains and the managed section updates.

## Prompt Generation

- [ ] Set `codegrip.defaultAgentTarget` to a non-default target.
- [ ] Run `CodeGrip: Generate System-Aware Prompt`.
- [ ] Confirm the default target appears first in the picker.
- [ ] Confirm the prompt is copied, printed in the output channel, and opened as Markdown.
- [ ] Generate a prompt from the dashboard task input.

## Diff Review

- [ ] Change a normal source file without a test.
- [ ] Run `CodeGrip: Review Current Git Diff`.
- [ ] Confirm risk, findings, suggested checks, and Problems diagnostics appear.
- [ ] Confirm the dashboard Risk Storyboard matches the review findings.
- [ ] Confirm the dashboard Blast Radius Map highlights expected risk zones.
- [ ] Confirm the dashboard Risk Heat Strip shows changed files and severity.
- [ ] Confirm the textual findings list remains visible below the visuals.
- [ ] Confirm the Readiness Pulse stays compact and reflects agent readiness, release readiness, and false-positive signals.
- [ ] Run `CodeGrip: Open Review Details`.
- [ ] Confirm the Markdown review includes changed files and suggested checks.
- [ ] Edit a workspace file after review and confirm stale CodeGrip diagnostics clear.
- [ ] Change a binary file and confirm CodeGrip reports a binary-file finding.
- [ ] Lower `codegrip.maxDiffBytes`, create a larger diff, and confirm CodeGrip reports truncation.
- [ ] Open a folder without Git metadata and confirm CodeGrip shows a clear no-Git message.

## Decisions And Accepted Findings

- [ ] Run `CodeGrip: Mark Finding Accepted`.
- [ ] Confirm `.codegrip/task-history/accepted-findings.md` is updated.
- [ ] Run `CodeGrip: Add Decision Log Entry`.
- [ ] Confirm `.codegrip/decision-log.md` is updated.

## Pro And Release Readiness

- [ ] Run `CodeGrip: Configure LLM Review`.
- [ ] Confirm LLM review settings are disabled by default.
- [ ] Run `CodeGrip: Create Team Policy Pack`.
- [ ] Confirm `.codegrip/team-policy-pack.json` is created from `.codegrip/org-template.json`.
- [ ] Run `CodeGrip: Review Terminal Command` with `git status` and confirm low risk.
- [ ] Run `CodeGrip: Review Terminal Command` with `git reset --hard HEAD` and confirm critical risk without command execution.
- [ ] Confirm terminal command review prints a danger meter with matched findings and suggested checks.
- [ ] Confirm `codegrip.telemetry.enabled` exists and is disabled by default.

## Packaging

- [ ] Install the generated `codegrip-0.0.1.vsix` in a normal VS Code window.
- [ ] Confirm the extension activates and the dashboard opens.
- [ ] Record the package size and any VSIX warnings.
