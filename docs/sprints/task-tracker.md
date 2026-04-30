# CodeGrip Task Tracker

## Sprint Status

- [x] Sprint 0: Project Foundation
- [x] Sprint 1: Repo Initialization Prototype
- [x] Sprint 2: Prompt Builder And Git Diff Review
- [ ] Sprint 3: Sidebar Dashboard MVP (in progress)
- [x] Sprint 4: Rule Sync And Configuration
- [x] Sprint 5: Diagnostics, Decisions, And Review Workflow
- [x] Sprint 6: Beta Hardening And Packaging
- [ ] Sprint 7: Pro Foundations
- [ ] Sprint 8: Team Release Readiness

## Sprint 1 Tasks

- [x] Implement workspace root detection.
- [x] Detect whether the workspace is writable.
- [x] Add command: `CodeGrip: Initialize Repo`.
- [x] Create `.codegrip/` folder.
- [x] Add templates for `agent-protocol.md`, `architecture.md`, `conventions.md`, `risk-rules.json`, and `decision-log.md`.
- [x] Add templates for `AGENTS.md`, `CLAUDE.md`, Cursor rules, and Copilot instructions.
- [x] Preserve existing user files with clearly marked CodeGrip sections.
- [x] Show created, skipped, and updated files in the output channel.
- [x] Add basic messages for missing workspace, permissions, or invalid repo state.

## Sprint 2 Tasks

- [x] Add command: `CodeGrip: Generate System-Aware Prompt`.
- [x] Read `.codegrip/agent-protocol.md` and `.codegrip/conventions.md`.
- [x] Support agent targets: Generic, Codex, Claude, Cursor, and Copilot.
- [x] Copy generated prompt to clipboard.
- [x] Show generated prompt in the output channel and an editable Markdown document.
- [x] Add command: `CodeGrip: Review Current Git Diff`.
- [x] Implement Git repo detection.
- [x] Read changed files and current diff.
- [x] Count changed files and line changes.
- [x] Detect risky path keywords from `risk-rules.json`.
- [x] Detect whether matching tests changed.
- [x] Generate low, medium, high, or critical risk score.
- [x] Render findings with title, severity, why it matters, and suggested action.

## Sprint 3 Tasks

- [x] Replace the placeholder dashboard with an interactive sidebar webview.
- [x] Show repo name and initialization status.
- [x] Add current task input and agent target selector.
- [x] Add `Generate Prompt`, `Review Diff`, `Refresh`, and `Sync Rules` controls.
- [x] Generate prompts from the sidebar task input.
- [x] Show system readiness checklist.
- [x] Show current diff risk summary.
- [x] Show agent file sync status.
- [x] Refresh dashboard state after initialization, prompt generation, review, and sync.
- [x] Use VS Code theme tokens for compact native styling.
- [ ] Manual Extension Development Host smoke test.
- [ ] Package Sprint 3 VSIX.

## Sprint 4 Tasks

- [x] Add command: `CodeGrip: Sync Agent Rule Files`.
- [x] Implement `syncService`.
- [x] Detect out-of-sync `AGENTS.md`, `CLAUDE.md`, Cursor rules, and Copilot instructions.
- [x] Update only the marked CodeGrip-managed section in each file.
- [x] Add config loading and validation for `.codegrip/risk-rules.json`.
- [x] Improve default risk rules for auth, payments, security, migrations, infra, config, and shared utilities.
- [x] Add clear validation errors for malformed JSON.
- [x] Show sync state in the dashboard.
- [x] Add unit tests for rule loading and sync section replacement.

## Sprint 5 Tasks

- [x] Convert findings to VS Code diagnostics.
- [x] Add Problems tab integration.
- [x] Clear diagnostics when review is rerun or workspace edits make the latest review stale.
- [x] Add command: `CodeGrip: Open Agent Protocol`.
- [x] Add command: `CodeGrip: Add Decision Log Entry`.
- [x] Add command: `CodeGrip: Mark Finding Accepted`.
- [x] Persist accepted findings in task history notes.
- [x] Add review detail view for the latest review.
- [x] Add suggested next commands to diff review output.
- [x] Add tests for diagnostic generation.
- [x] Add tests for prompt building, risk analysis, and review workflow formatting/persistence.

## Sprint 6 Tasks

- [x] Add extension/service tests for initialization, prompt builder, risk analyzer, and sync service.
- [x] Add manual extension host test checklist.
- [x] Add packaged `.vsix` build.
- [x] Write README with install, setup, daily workflow, settings, and privacy notes.
- [x] Add screenshot placeholder documentation.
- [x] Add privacy notes explaining local-first behavior.
- [x] Add workspace settings for default agent target, review strictness, and max diff text size.
- [x] Improve no-Git, binary-file, huge-diff, and multi-root workspace behavior.
- [x] Run build, lint, and tests.

## Verification

- [x] Sprint 1 compile passed.
- [x] Sprint 1 lint passed.
- [x] Sprint 1 audit passed with 0 vulnerabilities.
- [x] Sprint 1 VSIX package built.
- [x] Sprint 1 temporary workspace smoke test passed.
- [x] Sprint 2 compile passes.
- [x] Sprint 2 lint passes.
- [x] Sprint 2 risk analyzer smoke test passes.
- [x] Sprint 2 VSIX package builds.
- [x] Sprint 3 compile passes.
- [x] Sprint 3 lint passes.
- [x] Sprint 4 compile passes.
- [x] Sprint 4 lint passes.
- [x] Sprint 4 unit tests pass.
- [x] Sprint 5 compile passes.
- [x] Sprint 5 lint passes.
- [x] Sprint 5 unit tests pass.
- [ ] Sprint 5 Extension Development Host smoke test.
- [x] Sprint 5 VSIX package builds.
- [x] Sprint 6 compile passes.
- [x] Sprint 6 lint passes.
- [x] Sprint 6 unit tests pass.
- [x] Sprint 6 VSIX package builds.
- [ ] Sprint 6 Extension Development Host smoke test.
