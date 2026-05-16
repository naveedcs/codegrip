# CodeGrip

CodeGrip is a local-first VS Code extension that gives coding-agent workflows a durable system-thinking layer: repo rules, prompt generation, diff review, and risk checks.

## Current Status

Implemented so far:

- VS Code extension manifest and TypeScript configuration
- Activity bar contribution
- Placeholder dashboard webview
- `CodeGrip: Initialize Repo`
- `CodeGrip: Generate System-Aware Prompt`
- `CodeGrip: Review Current Git Diff`
- `CodeGrip: Sync Agent Rule Files`
- `CodeGrip: Open Dashboard`
- `CodeGrip: Open Agent Protocol`
- `CodeGrip: Open Review Details`
- `CodeGrip: Add Decision Log Entry`
- `CodeGrip: Mark Finding Accepted`
- `CodeGrip: Show Performance Report`
- `CodeGrip: Configure LLM Review`
- `CodeGrip: Create Team Policy Pack`
- `CodeGrip: Review Terminal Command`
- Local output channel named `CodeGrip`
- Local-only command timing and activation timing
- Repo initialization templates for `.codegrip/`, Codex, Claude, Cursor, and Copilot
- Local Git diff risk review using `.codegrip/risk-rules.json`
- VS Code Problems diagnostics for file-backed findings
- Review detail documents for the latest diff review
- Local decision log and accepted-finding history helpers
- Workspace settings for default agent target, review strictness, and max diff text size
- Optional LLM review settings that are disabled by default
- Repo-local team policy pack scaffolding
- Repo-local organization template defaults for team policy packs
- Terminal command risk detection prototype that never executes commands
- LLM review prompt template scaffolding for future review execution
- JSON-ready audit log export format
- Marketplace packaging metadata and release-readiness docs
- Dashboard risk visuals: Risk Storyboard, Blast Radius Map, and Risk Heat Strip
- Dashboard readiness pulse for agent readiness, release readiness, and false-positive signals
- Terminal command danger meter for risky command review
- Safer handling for multi-root workspaces, binary file changes, no-Git folders, and oversized diffs
- Safe agent rule sync that preserves user-authored content outside CodeGrip-managed sections
- Focused tests for initialization, prompt building, risk analysis, diagnostics, review workflow, risk rule validation, and agent rule sync

## Install From VSIX

Build the local package:

```bash
npm run package
```

Install `codegrip-0.0.1.vsix` through VS Code:

1. Open Extensions.
2. Choose `Install from VSIX...`.
3. Select `codegrip-0.0.1.vsix`.
4. Reload VS Code when prompted.

## Daily Workflow

1. Open a repository in VS Code.
2. Open the CodeGrip activity bar item.
3. Run `CodeGrip: Initialize Repo` if the repo is not initialized.
4. Fill in `.codegrip/architecture.md` and `.codegrip/conventions.md` as the system gets clearer.
5. Type the current task in the dashboard or run `CodeGrip: Generate System-Aware Prompt`.
6. Give the generated prompt to Codex, Claude, Cursor, Copilot, or another agent.
7. After the agent edits files, run `CodeGrip: Review Current Git Diff`.
8. Check the CodeGrip output, Problems diagnostics, and `Open Review Details`.
9. Fix findings, or record accepted findings and decisions when the risk is intentional.

## Settings

CodeGrip contributes these workspace settings:

```json
{
  "codegrip.defaultAgentTarget": "Codex",
  "codegrip.reviewStrictness": "standard",
  "codegrip.maxDiffBytes": 750000,
  "codegrip.llmReview.enabled": false,
  "codegrip.llmReview.provider": "local",
  "codegrip.llmReview.endpoint": "",
  "codegrip.llmReview.model": "",
  "codegrip.telemetry.enabled": false
}
```

`codegrip.reviewStrictness` can be `lenient`, `standard`, or `strict`. Strict mode scores generic code-without-tests findings more heavily; lenient mode scores them lower.

`codegrip.maxDiffBytes` caps the diff text CodeGrip keeps for local review and secret scanning. When a diff is larger, CodeGrip truncates the stored diff text and adds a review finding.

`codegrip.llmReview.*` settings reserve a future Pro configuration path. They are disabled by default. The current extension does not execute LLM-powered review or call the configured endpoint.

`codegrip.telemetry.enabled` reserves a future opt-in telemetry path. It is disabled by default, and the current extension does not send telemetry.

## Free And Pro Boundaries

The local-first workflow remains the free foundation:

- Repo initialization.
- System-aware prompt generation.
- Deterministic Git diff risk review.
- Agent rule sync.
- Problems diagnostics, review details, decision log entries, and accepted-finding history.

Future Pro surfaces start behind explicit configuration:

- Optional LLM-powered review.
- Local or remote review provider settings.
- Team policy packs.
- Audit log export formats.

CodeGrip should keep deterministic local review working even when Pro settings are disabled or incomplete.

## Privacy

CodeGrip is local-first:

- It does not call external LLMs in the current implementation.
- It does not send telemetry.
- It reads local workspace files and Git diff output.
- Generated prompts, reviews, decision log entries, and accepted findings stay in the local workspace.
- Optional LLM review settings are stored as VS Code workspace settings and are disabled by default.
- Optional telemetry settings are stored as VS Code workspace settings and are disabled by default.

More detail lives in `docs/privacy.md`.

## Local Development

Install dependencies:

```bash
npm install
```

Compile the extension:

```bash
npm run compile
```

Run linting:

```bash
npm run lint
```

Run tests:

```bash
npm test
```

Launch the extension:

1. Open this folder in VS Code.
2. Run `npm install`.
3. Press `F5` or use `Run Extension` from the Run and Debug panel.
4. In the Extension Development Host, open the CodeGrip activity bar item or run `CodeGrip: Open Dashboard`.

## Testing Repo Initialization

In the Extension Development Host:

1. Open a test repository or folder.
2. Run `CodeGrip: Initialize Repo`.
3. Open the `CodeGrip` output channel to review created, updated, and skipped files.

Generated files:

```text
.codegrip/
  agent-protocol.md
  architecture.md
  conventions.md
  risk-rules.json
  org-template.json
  decision-log.md
  task-history/.gitkeep

AGENTS.md
CLAUDE.md
.cursor/rules/codegrip.mdc
.github/copilot-instructions.md
```

If an agent instruction file already exists, CodeGrip appends or updates only the marked CodeGrip section.

## Testing Prompt Generation

In the Extension Development Host:

1. Open a workspace.
2. Run `CodeGrip: Generate System-Aware Prompt`.
3. Enter a rough task and choose Generic, Codex, Claude, Cursor, or Copilot.
4. Confirm the prompt is copied to the clipboard, printed in the `CodeGrip` output channel, and opened as an editable Markdown document.

## Testing Git Diff Review

In the Extension Development Host:

1. Open a Git repository with local changes.
2. Run `CodeGrip: Review Current Git Diff`.
3. Open the `CodeGrip` output channel.
4. Confirm the review shows changed files, line changes, test detection, risk score, findings, suggested checks, and Problems diagnostics for file-backed findings.
5. Run `CodeGrip: Open Review Details` and confirm the latest review opens as an editable Markdown document.
6. Run `CodeGrip: Mark Finding Accepted` after a review with findings and confirm `.codegrip/task-history/accepted-findings.md` is updated.
7. Change a binary file and confirm CodeGrip reports that the text diff cannot inspect it.
8. Lower `codegrip.maxDiffBytes` and confirm oversized diffs show a truncation finding.

Malformed `.codegrip/risk-rules.json` files should show a clear validation error instead of a generic parse failure.

## Testing Decision Log Entries

In the Extension Development Host:

1. Open an initialized workspace.
2. Run `CodeGrip: Add Decision Log Entry`.
3. Enter task, decision, reason, and verification text.
4. Confirm the entry is appended to `.codegrip/decision-log.md`.

## Testing Sprint 7 Pro Foundations

In the Extension Development Host:

1. Run `CodeGrip: Configure LLM Review`.
2. Confirm `Show Current Configuration` prints disabled-by-default LLM review settings.
3. Enable and disable LLM review, then confirm the workspace setting changes without running an LLM review.
4. Run `CodeGrip: Create Team Policy Pack`.
5. Enter a name and description.
6. Confirm `.codegrip/team-policy-pack.json` opens and has `"llmReview": { "enabled": false }`.
7. Run the command again and confirm the existing policy pack is not overwritten.

## Testing Sprint 8 Release Readiness

In the Extension Development Host:

1. Run `CodeGrip: Review Terminal Command`.
2. Enter `git status` and confirm CodeGrip reports low risk without executing the command.
3. Enter `git reset --hard HEAD` and confirm CodeGrip reports critical risk.
4. Run `CodeGrip: Initialize Repo` in a disposable workspace and confirm `.codegrip/org-template.json` is created.
5. Edit `.codegrip/org-template.json`, then run `CodeGrip: Create Team Policy Pack`.
6. Confirm the generated policy pack uses the org template policy defaults.
7. In a multi-root workspace, open a file in the intended folder and confirm CodeGrip uses that active workspace; with no active editor, confirm it prefers an initialized `.codegrip/` folder.

## Testing Sprint 9 Risk Visualization

In the Extension Development Host:

1. Open a Git repository with changes across a few risk zones, such as auth, shared utilities, tests, docs, config, or deployment files.
2. Run `CodeGrip: Review Current Git Diff`.
3. Open the CodeGrip dashboard.
4. Confirm the Risk Storyboard shows files touched, risk triggers, missing checks, and suggested action stages.
5. Confirm the Blast Radius Map highlights the expected risk zones.
6. Confirm the Risk Heat Strip shows changed files and severity without hiding the existing findings list.
7. Check light theme, dark theme, reduced-motion settings, and keyboard navigation.

## Testing Sprint 10 Readiness Pulse

In the Extension Development Host:

1. Open a Git repository initialized with CodeGrip.
2. Open the CodeGrip dashboard.
3. Confirm the Readiness Pulse shows one compact row each for agent readiness, release readiness, and false positives.
4. Record an accepted finding or dogfooding false-positive note, then refresh the dashboard and confirm the false-positive pulse updates.
5. Confirm detailed release interpretation remains in local docs instead of expanding the sidebar by default.
6. Run `CodeGrip: Review Terminal Command`.
7. Enter `git status` and confirm the danger meter reports low risk.
8. Enter `git reset --hard HEAD` and confirm the danger meter reports critical risk without executing the command.

## Testing Agent Rule Sync

In the Extension Development Host:

1. Open a workspace.
2. Run `CodeGrip: Sync Agent Rule Files`.
3. Confirm `AGENTS.md`, `CLAUDE.md`, Cursor rules, and Copilot instructions are created or updated.
4. Confirm any user-authored content outside `<!-- BEGIN CODEGRIP -->` and `<!-- END CODEGRIP -->` is preserved.

## Performance Tracking

CodeGrip records activation time, dashboard render time, prompt generation, diff review, and command duration in the `CodeGrip` output channel. Run `CodeGrip: Show Performance Report` to print a summary.

No performance data leaves the machine.

## Beta Checklist

Use `docs/manual-extension-host-checklist.md` before sharing a fresh VSIX with early users.

Screenshot placeholders and capture notes live in `docs/screenshots.md`.

Release readiness docs:

- `docs/ci.md`
- `docs/demo-script.md`
- `docs/release-checklist.md`
- `docs/dogfooding.md`
- `docs/false-positive-examples.md`
