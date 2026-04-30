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
- Local output channel named `CodeGrip`
- Local-only command timing and activation timing
- Repo initialization templates for `.codegrip/`, Codex, Claude, Cursor, and Copilot
- Local Git diff risk review using `.codegrip/risk-rules.json`
- VS Code Problems diagnostics for file-backed findings
- Review detail documents for the latest diff review
- Local decision log and accepted-finding history helpers
- Workspace settings for default agent target, review strictness, and max diff text size
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
  "codegrip.maxDiffBytes": 750000
}
```

`codegrip.reviewStrictness` can be `lenient`, `standard`, or `strict`. Strict mode scores generic code-without-tests findings more heavily; lenient mode scores them lower.

`codegrip.maxDiffBytes` caps the diff text CodeGrip keeps for local review and secret scanning. When a diff is larger, CodeGrip truncates the stored diff text and adds a review finding.

## Privacy

CodeGrip is local-first:

- It does not call external LLMs.
- It does not send telemetry.
- It reads local workspace files and Git diff output.
- Generated prompts, reviews, decision log entries, and accepted findings stay in the local workspace.

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
