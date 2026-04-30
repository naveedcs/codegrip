# Sprint 2 Report: Prompt Builder And Git Diff Review

Status:
Complete.

Duration:
Implemented as the first daily workflow slice.

## Sprint Goal

Deliver the first useful daily loop: describe task, generate prompt, review current diff.

## Completed Tasks

- Added `CodeGrip: Generate System-Aware Prompt`.
- Read repo-specific `.codegrip/agent-protocol.md` and `.codegrip/conventions.md`, with default template fallback when a repo is not initialized yet.
- Added prompt targets for Generic, Codex, Claude, Cursor, and Copilot.
- Copied generated prompts to the clipboard.
- Printed generated prompts in the `CodeGrip` output channel.
- Opened generated prompts as editable Markdown documents.
- Added `CodeGrip: Review Current Git Diff`.
- Added Git repository detection through `git rev-parse --show-toplevel`.
- Read changed files, staged diff, and unstaged diff.
- Counted changed files, additions, and deletions.
- Loaded and validated `.codegrip/risk-rules.json`.
- Matched risky paths against configured rule globs.
- Detected test file changes and likely matching test updates.
- Generated low, medium, high, and critical risk scores from deterministic heuristics.
- Rendered findings with title, severity, why it matters, and suggested action.
- Added local performance timing for prompt generation and diff review commands.

## Verification

- `npm run compile`: passed.
- `npm run lint`: passed.
- Risk analyzer smoke test: passed. Auth directory changes without matching tests score critical; adding a matching auth test changes matching test detection to yes.
- `npm run package`: passed and created `codegrip-0.0.1.vsix`.

Packaging note:

- `package.json` still needs a real `repository` URL before public release.

## Manual Test Checklist

- Open the extension in an Extension Development Host.
- Run `CodeGrip: Generate System-Aware Prompt`.
- Enter a rough task and choose each supported agent target.
- Confirm the prompt is copied, printed in the output channel, and opened as Markdown.
- Open a Git repo with changed source files.
- Run `CodeGrip: Review Current Git Diff`.
- Confirm changed files, line counts, test detection, risk score, findings, and suggested checks appear in the output channel.
- Add or modify a matching test file and rerun review.
- Confirm matching test detection changes from `no` to `yes`.

## Known Follow-Ups

- Add automated tests around prompt building, risk rules, glob matching, and test matching.
- Surface prompt and diff review controls in the Sprint 3 dashboard.
- Add richer rule editing and validation in Sprint 4.
