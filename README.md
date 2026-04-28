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
- `CodeGrip: Show Performance Report`
- Local output channel named `CodeGrip`
- Local-only command timing and activation timing
- Repo initialization templates for `.codegrip/`, Codex, Claude, Cursor, and Copilot
- Local Git diff risk review using `.codegrip/risk-rules.json`
- Safe agent rule sync that preserves user-authored content outside CodeGrip-managed sections
- Focused tests for risk rule validation and agent rule sync

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
4. Confirm the review shows changed files, line changes, test detection, risk score, findings, and suggested checks.

Malformed `.codegrip/risk-rules.json` files should show a clear validation error instead of a generic parse failure.

## Testing Agent Rule Sync

In the Extension Development Host:

1. Open a workspace.
2. Run `CodeGrip: Sync Agent Rule Files`.
3. Confirm `AGENTS.md`, `CLAUDE.md`, Cursor rules, and Copilot instructions are created or updated.
4. Confirm any user-authored content outside `<!-- BEGIN CODEGRIP -->` and `<!-- END CODEGRIP -->` is preserved.

## Performance Tracking

CodeGrip records activation time, dashboard render time, prompt generation, diff review, and command duration in the `CodeGrip` output channel. Run `CodeGrip: Show Performance Report` to print a summary.

No performance data leaves the machine.
