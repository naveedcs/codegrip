# CodeGrip Task Tracker

## Sprint Status

- [x] Sprint 0: Project Foundation
- [x] Sprint 1: Repo Initialization Prototype
- [x] Sprint 2: Prompt Builder And Git Diff Review
- [x] Sprint 3: Sidebar Dashboard MVP
- [x] Sprint 4: Rule Sync And Configuration
- [x] Sprint 5: Diagnostics, Decisions, And Review Workflow
- [x] Sprint 6: Beta Hardening And Packaging
- [x] Sprint 7: Pro Foundations
- [ ] Sprint 8: Team Release Readiness (release validation pending)
- [x] Sprint 9: Cinematic Risk Visualization
- [x] Sprint 10: Readiness And Release Analytics

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
- [x] Reconciled manual smoke scope into Release Closure.
- [x] Package coverage superseded by later VSIX builds.

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

## Sprint 7 Tasks

- [x] Add command: `CodeGrip: Configure LLM Review`.
- [x] Add provider settings model for local or remote review.
- [x] Add feature flag for LLM-powered review.
- [x] Add review prompt template that includes diff summary, rules, and repo context.
- [x] Add team policy pack data model.
- [x] Add command: `CodeGrip: Create Team Policy Pack`.
- [x] Add audit log export format.
- [x] Define free/pro feature boundaries in docs.
- [x] Keep all LLM features optional and disabled by default.
- [x] Reconciled manual smoke scope into Release Closure.
- [x] Package Sprint 7 VSIX.

## Sprint 8 Tasks

- [x] Add CI integration design and first implementation path.
- [x] Add terminal command risk detection prototype.
- [x] Improve multi-root workspace support.
- [x] Add org template support.
- [x] Add marketplace packaging metadata.
- [x] Add telemetry opt-in copy and implementation plan.
- [x] Add onboarding docs and short demo script.
- [x] Add release checklist.
- [ ] Run dogfooding on at least two real repos.
- [x] Add false-positive example log and tune broad default config rule.
- [ ] Collect false positive examples from dogfooding.
- [x] Reconciled manual smoke scope into Release Closure.
- [x] Package Sprint 8 VSIX.

## Sprint 9 Tasks

- [x] Add a visualization data model derived from `GitDiffSnapshot`, `RiskReview`, changed files, findings, and suggested checks.
- [x] Add a Risk Storyboard: `Files touched -> Risk triggers -> Missing checks -> Suggested action`.
- [x] Add a Blast Radius Map showing changed files connected to risk zones.
- [x] Add a Risk Heat Strip beside changed files.
- [x] Add empty states for no changed files in the heat strip.
- [x] Keep the existing findings list visible as the source of truth.
- [x] Add tests for visualization data derivation.
- [x] Manual dashboard checks moved to Release Closure.

## Sprint 10 Tasks

- [x] Add a compact Readiness Pulse for agent readiness, release readiness, and false-positive signals.
- [x] Derive agent readiness from protocol, architecture, conventions, risk rules, synced agent files, and test signal.
- [x] Derive release readiness from compile, lint, tests, VSIX packaging, smoke test, dogfooding, screenshots, license, and changelog.
- [x] Add a Command Danger Meter for `CodeGrip: Review Terminal Command`.
- [x] Add a local false-positive signal using accepted findings and dogfooding notes where available.
- [x] Add local-only chart summaries to dashboard state without sending telemetry.
- [x] Add screenshot/demo documentation updates for the new visual analytics.
- [x] Keep detailed interpretation in local docs instead of expanding the sidebar by default.

## Release Closure

- [ ] Run one full Extension Development Host smoke test covering Sprint 3, 5, 6, 7, and 8 behavior.
- [ ] Install the latest `codegrip-0.0.1.vsix` in a normal VS Code window and confirm activation/dashboard behavior.
- [ ] Dogfood CodeGrip on at least two real repositories.
- [ ] Log dogfooding results in `docs/dogfooding.md`.
- [ ] Collect real false-positive examples in `docs/false-positive-examples.md`.
- [ ] Decide final license before public marketplace redistribution.
- [ ] Add final screenshots and changelog before public release.
- [ ] Run Sprint 9 visual QA for theme contrast, reduced motion, and keyboard navigation.
- [ ] Run Sprint 10 readiness pulse QA for dashboard accuracy and command danger meter output.

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
- [x] Sprint 5 Extension Development Host smoke scope moved to Release Closure.
- [x] Sprint 5 VSIX package builds.
- [x] Sprint 6 compile passes.
- [x] Sprint 6 lint passes.
- [x] Sprint 6 unit tests pass.
- [x] Sprint 6 VSIX package builds.
- [x] Sprint 6 Extension Development Host smoke scope moved to Release Closure.
- [x] Sprint 7 compile passes.
- [x] Sprint 7 lint passes.
- [x] Sprint 7 unit tests pass.
- [x] Sprint 7 VSIX package builds.
- [x] Sprint 7 Extension Development Host smoke scope moved to Release Closure.
- [x] Sprint 8 compile passes.
- [x] Sprint 8 lint passes.
- [x] Sprint 8 unit tests pass.
- [x] Sprint 8 VSIX package builds.
- [x] Sprint 8 Extension Development Host smoke scope moved to Release Closure.
- [x] Sprint 9 compile passes.
- [x] Sprint 9 lint passes.
- [x] Sprint 9 unit tests pass.
- [x] Sprint 9 VSIX package builds.
- [x] Sprint 9 visual QA scope moved to Release Closure.
- [x] Sprint 10 compile passes.
- [x] Sprint 10 lint passes.
- [x] Sprint 10 unit tests pass.
- [x] Sprint 10 VSIX package builds.
- [x] Sprint 10 dashboard QA scope moved to Release Closure.
