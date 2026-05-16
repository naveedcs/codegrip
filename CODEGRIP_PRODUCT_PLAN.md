# CodeGrip Product Plan

## 1. Product Vision

CodeGrip is a VS Code extension that sits beside Codex, Claude Code, Cursor, Copilot, Windsurf, and other coding agents. It gives the repository a durable system-thinking layer: shared rules, architecture context, risk checks, prompt generation, and post-change review.

The product does not try to replace coding agents. It makes every agent safer and more coherent inside the codebase.

### One-line promise

Use any coding agent you like. CodeGrip makes sure it understands the system before it changes the system.

### Core outcome

Developers should feel that agentic coding has a calm senior-engineer reviewer in the room:

- What does this touch?
- What could break?
- Did we follow repo conventions?
- Are tests or docs missing?
- Is this solving the root problem?
- Is this change safe enough to land?

## 2. Target Users

### Primary users

- Solo builders using Codex, Claude Code, Cursor, or Copilot
- Senior engineers reviewing AI-generated edits
- Tech leads trying to standardize AI behavior across a team
- Startup teams using several coding agents at once

### Secondary users

- DevEx teams
- Platform teams
- Security engineers
- Engineering managers adopting AI coding workflows

## 3. Product Principles

1. Agent-neutral
   CodeGrip should work with whatever tool the user already likes.

2. Local-first
   Repo context, rules, and review history should live in the workspace and be version-controllable.

3. Advisory before authoritarian
   The extension should guide, warn, and explain. Blocking should exist only for high-risk actions and should be configurable.

4. System-thinking over generic linting
   The product is not just a code smell detector. It should reason about architecture, blast radius, tests, operational risk, and repo conventions.

5. Zero-friction daily use
   The main loop should take seconds:
   initialize repo, generate prompt, run agent, review diff, fix warnings.

6. Human control stays central
   The user should always understand what the extension is doing, what it found, and why it matters.

## 4. Final Product Shape

CodeGrip should feel like a compact control center inside VS Code.

It has:

- Activity bar icon
- Sidebar dashboard
- Command palette actions
- Output panel for generated prompts and reviews
- Inline diagnostics for risky code changes
- Repo-local `.codegrip/` folder
- Optional sync into agent-specific rule files

The final product should look calm, dense, and practical, not like a marketing app. It should feel like a developer tool built for daily use.

## 5. Core User Loop

1. User opens a repo in VS Code.
2. CodeGrip detects whether the repo has been initialized.
3. If not initialized, it shows a simple setup screen.
4. User clicks `Initialize`.
5. The extension creates local governance files.
6. User enters a task: `Fix password reset redirect`.
7. CodeGrip generates a system-aware prompt.
8. User gives that prompt to Codex, Claude, Cursor, or another agent.
9. The agent edits files.
10. User runs `Review Current Diff`.
11. CodeGrip scores risk and shows findings.
12. User fixes or accepts findings.
13. The task summary can be appended to local history.

## 6. Repo Files Created

```text
.codegrip/
  agent-protocol.md
  architecture.md
  conventions.md
  risk-rules.json
  decision-log.md
  task-history/
    .gitkeep

AGENTS.md
CLAUDE.md
.cursor/rules/codegrip.mdc
.github/copilot-instructions.md
```

### File purposes

`agent-protocol.md`
Defines how agents should work in this repo.

`architecture.md`
Captures important systems, boundaries, and flows.

`conventions.md`
Captures coding style, testing expectations, naming patterns, and team preferences.

`risk-rules.json`
Machine-readable rules used by the extension.

`decision-log.md`
Stores important AI-assisted decisions.

`task-history/`
Stores optional per-task summaries.

`AGENTS.md`
Codex-compatible agent guidance.

`CLAUDE.md`
Claude Code-compatible agent guidance.

`.cursor/rules/codegrip.mdc`
Cursor-compatible rules.

`.github/copilot-instructions.md`
Copilot-compatible instructions.

## 7. VS Code Commands

### MVP commands

- `CodeGrip: Initialize Repo`
- `CodeGrip: Generate System-Aware Prompt`
- `CodeGrip: Review Current Git Diff`
- `CodeGrip: Open Dashboard`
- `CodeGrip: Open Agent Protocol`
- `CodeGrip: Sync Agent Rule Files`

### Beta commands

- `CodeGrip: Update Architecture Map`
- `CodeGrip: Add Decision Log Entry`
- `CodeGrip: Explain Current Risk Score`
- `CodeGrip: Mark Finding Accepted`
- `CodeGrip: Export Task Summary`

### Later commands

- `CodeGrip: Configure LLM Review`
- `CodeGrip: Review Terminal Command`
- `CodeGrip: Run Policy Check`
- `CodeGrip: Create Team Policy Pack`

## 8. Sidebar UI

The sidebar should be the main home of the extension.

### Layout

```text
┌────────────────────────────────────┐
│ CodeGrip                      │
│ Repo: safejourney                  │
│ Status: Initialized                │
├────────────────────────────────────┤
│ Current Task                       │
│ ┌────────────────────────────────┐ │
│ │ Fix password reset redirect    │ │
│ └────────────────────────────────┘ │
│ [Generate Prompt] [Review Diff]    │
├────────────────────────────────────┤
│ System Readiness                   │
│ Protocol      ✓                    │
│ Architecture  Needs detail         │
│ Conventions   ✓                    │
│ Risk rules    ✓                    │
├────────────────────────────────────┤
│ Current Diff Risk                  │
│ Score: High                        │
│ Auth changed                       │
│ Shared helper changed              │
│ Missing test update                │
│ [Open Review]                      │
├────────────────────────────────────┤
│ Agent Files                        │
│ AGENTS.md       Synced             │
│ CLAUDE.md       Synced             │
│ Cursor rules    Synced             │
│ Copilot         Not found          │
│ [Sync]                             │
└────────────────────────────────────┘
```

### User-friendly details

- The task input should be short and obvious.
- Primary buttons should be verbs: `Generate Prompt`, `Review Diff`, `Sync Rules`.
- Status labels should be plain: `Ready`, `Needs detail`, `Out of sync`.
- Risk should use clear severity: `Low`, `Medium`, `High`, `Critical`.
- Every warning should answer `why this matters`.
- Empty states should suggest the next action, not explain the whole product.

## 9. First-run Onboarding

When the extension opens in an uninitialized repo:

```text
CodeGrip is not set up for this repo.

Create local files that help coding agents follow your architecture,
conventions, and safety rules.

[Initialize Repo]
```

After clicking initialize:

```text
Repo initialized.

Created:
✓ .codegrip/agent-protocol.md
✓ .codegrip/risk-rules.json
✓ AGENTS.md
✓ CLAUDE.md
✓ Cursor rules
✓ Copilot instructions

Next: describe your current task.
```

Keep this flow fast. The user should not have to answer a long wizard before seeing value.

## 10. Main Screens

### Screen 1: Dashboard

Purpose:
Show current repo status and the next best action.

Sections:

- Current task
- System readiness
- Current diff risk
- Agent rule sync status
- Recent decisions

### Screen 2: Prompt Builder

Purpose:
Turn a rough task into a strong agent prompt.

Fields:

- Task
- Scope
- Constraints
- Agent target: Codex, Claude, Cursor, Copilot, Generic
- Risk level: Auto, Low, Medium, High

Output:

```text
Before editing, inspect the relevant auth routing, session handling,
password reset flow, and existing redirect tests. Identify affected callers,
failure modes, and regression coverage. Make the smallest safe change.
After editing, summarize files changed, tests run, and remaining risks.
```

Controls:

- `Copy Prompt`
- `Send to Active Editor`
- `Save to Task History`

### Screen 3: Diff Review

Purpose:
Review current Git diff for system-level risk.

Sections:

- Risk score
- Changed files
- Findings
- Missing checks
- Suggested next commands

Example:

```text
Risk: High

Findings:
1. Auth routing changed.
   Why it matters: redirect behavior may affect login, password reset,
   onboarding, and expired-session flows.

2. Shared session helper changed.
   Why it matters: this helper is likely used outside the visible task.

3. No matching test update found.
   Why it matters: redirect regressions are easy to miss manually.

Suggested checks:
- Run auth route tests.
- Search callers of the changed session helper.
- Add password reset redirect regression coverage.
```

### Screen 4: Rules Editor

Purpose:
Let users edit repo-specific behavior without touching JSON manually.

Fields:

- Sensitive paths
- Required checks
- Agent behavior rules
- Test expectations
- Files to ignore
- Critical command patterns

### Screen 5: Decision Log

Purpose:
Capture important decisions made during AI-assisted development.

Example entry:

```text
2026-04-28
Task: Fix password reset redirect
Decision: Keep redirect logic inside auth router instead of session helper.
Reason: Session helper is shared by onboarding and mobile deep-link flows.
Verification: Added regression test for reset-token login.
```

## 11. UX Copy Style

The product should use short, direct text.

Good:

- `Shared code changed`
- `No test update found`
- `Auth flow risk`
- `Rules are out of sync`
- `Architecture notes need detail`

Avoid:

- `AI-powered holistic codebase governance optimization`
- `Leverage intelligent autonomous compliance`
- `Revolutionary agent orchestration`

The extension should sound like a useful engineer, not a pitch deck.

## 12. Visual Design

### Style

- Native VS Code look and feel
- Compact panels
- Minimal decoration
- Clear risk badges
- Good empty states
- Strong keyboard command support

### Colors

Use VS Code theme tokens instead of hardcoded colors where possible.

Risk badges:

- Low: success/green token
- Medium: warning/yellow token
- High: error/orange-red token
- Critical: error/red token with stronger border

### Components

- Sidebar sections with small headings
- Textarea for task input
- Primary and secondary buttons
- Status rows
- Finding list
- Collapsible details
- CodeLens or diagnostics for inline findings

### What it should not look like

- Not a landing page
- Not card-heavy marketing UI
- Not a chat clone
- Not a giant form
- Not an AI assistant competing with Codex or Claude

## 13. Risk Analysis Logic

### Inputs

- Git diff
- Changed file paths
- File extensions
- Inserted/deleted line counts
- Existing risk rules
- Presence or absence of tests
- Agent protocol and conventions

### MVP heuristics

High risk if changed paths include:

- `auth`
- `session`
- `payment`
- `billing`
- `permissions`
- `security`
- `schema`
- `migration`
- `infra`
- `deploy`
- `config`
- `secrets`

Medium risk if:

- shared utilities changed
- package or lock files changed
- public API files changed
- many files changed
- generated files changed
- tests are absent

Low risk if:

- isolated UI component changed
- matching tests changed
- docs-only change
- small localized patch

Critical risk if:

- destructive command detected
- production config changed
- secrets are added
- migration lacks rollback notes
- auth or permission logic changed with no tests

## 14. Finding Model

```ts
type Finding = {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  body: string;
  file?: string;
  line?: number;
  whyItMatters: string;
  suggestedAction?: string;
  accepted?: boolean;
};
```

## 15. Rule Model

```ts
type RiskRule = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  matchPaths: string[];
  message: string;
  suggestedAction?: string;
  requireTests?: boolean;
};
```

Example:

```json
{
  "id": "auth-change-requires-tests",
  "title": "Auth flow changed",
  "severity": "high",
  "matchPaths": ["**/*auth*", "**/*session*", "**/login/**"],
  "message": "Authentication changes can affect login, reset, onboarding, and permissions.",
  "suggestedAction": "Add or update regression tests for the changed auth flow.",
  "requireTests": true
}
```

## 16. Technical Architecture

### Extension structure

```text
src/
  extension.ts
  commands/
    initializeRepo.ts
    generatePrompt.ts
    reviewDiff.ts
    syncRules.ts
    openDashboard.ts
  services/
    gitService.ts
    workspaceService.ts
    ruleService.ts
    riskAnalyzer.ts
    promptBuilder.ts
    syncService.ts
    diagnosticService.ts
  webview/
    dashboardProvider.ts
    dashboardHtml.ts
    messageTypes.ts
  types/
    findings.ts
    rules.ts
    repoStatus.ts
  templates/
    agent-protocol.md
    architecture.md
    conventions.md
    AGENTS.md
    CLAUDE.md
    cursor-rule.mdc
    copilot-instructions.md
```

### Core services

`gitService`
Reads changed files and diffs.

`ruleService`
Loads and validates `.codegrip/risk-rules.json`.

`riskAnalyzer`
Turns diffs and rules into findings.

`promptBuilder`
Generates agent-specific prompts.

`syncService`
Writes compatible rules into Codex, Claude, Cursor, and Copilot files.

`diagnosticService`
Shows inline warnings in VS Code.

`dashboardProvider`
Renders sidebar UI.

## 17. Agent Architecture

CodeGrip should not feel like a group chat between bots. The product should feel like one calm VS Code companion with a clear point of view.

The recommended model is:

```text
Single calm interface outside.
Specialized checks and agents inside.
```

### MVP architecture

The MVP should use normal extension services, not visible multi-agent chat.

```text
VS Code Extension
  ├─ Prompt Builder
  ├─ Diff Risk Analyzer
  ├─ Rule Sync
  ├─ Repo Context Loader
  └─ Dashboard
```

This keeps the first version simple, fast, and useful. The user should see CodeGrip as one tool, not as several AI personalities.

### Future internal agent model

Later versions can internally use specialized agents or agent-like modules:

```text
CodeGrip Orchestrator
  ├─ Context Agent
  ├─ Risk Agent
  ├─ Prompt Agent
  ├─ Sync Agent
  ├─ Review Agent
  └─ Command Guard Agent
```

### Internal roles

`Context Agent`
Reads repo structure, architecture notes, conventions, and relevant files.

`Risk Agent`
Analyzes diffs for risky paths, missing tests, shared-code changes, config changes, and blast radius.

`Prompt Agent`
Turns rough user tasks into strong system-aware prompts for Codex, Claude, Cursor, Copilot, or a generic agent.

`Sync Agent`
Keeps `AGENTS.md`, `CLAUDE.md`, Cursor rules, Copilot instructions, and `.codegrip/` files aligned.

`Review Agent`
Summarizes findings, suggested checks, remaining risks, and task outcomes.

`Command Guard Agent`
Reviews terminal commands for destructive or high-risk actions.

### How this should appear in the UI

Show the results as checks, not as chatting agents.

Good:

```text
CodeGrip Checks

✓ Repo context loaded
✓ Agent rules synced
⚠ Shared code changed
⚠ No matching test update found
✓ Prompt ready
```

Avoid:

```text
Risk Agent says...
Context Agent says...
Prompt Agent says...
```

The user should feel that CodeGrip has checked the system, not that several bots are debating in the sidebar.

### When visible multi-agent mode might make sense

A future Pro version could include an optional `Agent Council` mode for complex changes. That mode could ask several specialized reviewers to evaluate architecture, tests, security, and rollout risk separately.

This should be advanced and optional. It should not be the default experience.

### Product rule

MVP:
One product, no visible agent swarm.

Beta:
Specialized internal agents, still presented as checks.

Future Pro:
Optional multi-agent review for complex PRs.

The default product feeling should remain:

```text
CodeGrip has checked the system.
```

## 18. Implementation Milestones

### Milestone 1: Prototype

Goal:
A working local extension that initializes files, generates prompts, and reviews diffs in an output panel.

Tasks:

- Scaffold VS Code TypeScript extension.
- Add activity bar contribution.
- Add command: `Initialize Repo`.
- Create `.codegrip/` files from templates.
- Add command: `Generate System-Aware Prompt`.
- Add command: `Review Current Git Diff`.
- Implement basic Git diff reading.
- Implement path-based risk scoring.
- Show review output in VS Code output channel.

Done when:

- User can install extension locally.
- User can initialize a repo.
- User can generate a prompt.
- User can review a diff.

Estimated time:
4-6 hours.

### Milestone 2: MVP

Goal:
A pleasant daily-use tool with sidebar dashboard and rule sync.

Tasks:

- Build sidebar dashboard webview.
- Show repo initialization status.
- Show current task input.
- Show system readiness checklist.
- Show current diff risk summary.
- Add rule sync for `AGENTS.md`, `CLAUDE.md`, Cursor, and Copilot.
- Add configurable risk rules.
- Add test-detection heuristic.
- Add status badges.
- Add docs.

Done when:

- User can operate the product mostly from the sidebar.
- Agent rule files stay in sync.
- Diff review produces actionable findings.

Estimated time:
1-2 days.

### Milestone 3: Beta

Goal:
Make the extension feel polished and trustworthy.

Tasks:

- Add inline diagnostics.
- Add finding accept/dismiss flow.
- Add decision log command.
- Add architecture map editor.
- Add better pattern matching.
- Add workspace settings.
- Add extension tests.
- Add packaged `.vsix` build.
- Add README screenshots.
- Add privacy notes.

Done when:

- The extension can be shared with users.
- Findings appear inline and in the Problems tab.
- Configuration is understandable.
- False positives can be managed.

Estimated time:
1 week.

### Milestone 4: Pro Product

Goal:
Turn the extension into a serious product.

Tasks:

- Add optional LLM-powered review.
- Add local/remote provider settings.
- Add team policy packs.
- Add CI integration.
- Add audit log export.
- Add terminal command risk detection.
- Add multi-root workspace support.
- Add org templates.
- Add marketplace publishing.
- Add telemetry opt-in.
- Add onboarding docs and videos.

Done when:

- Teams can standardize AI agent behavior across repos.
- The product has a clear free/pro split.
- It is ready for public release.

Estimated time:
3-6 weeks.

## 19. MVP Todo List

### Project setup

- [x] Create VS Code extension scaffold.
- [x] Configure TypeScript.
- [x] Configure ESLint or repo-standard linting.
- [x] Add build script.
- [x] Add package metadata.
- [x] Add activity bar icon placeholder.

### Commands

- [x] Register `Initialize Repo`.
- [ ] Register `Generate System-Aware Prompt`.
- [ ] Register `Review Current Git Diff`.
- [ ] Register `Sync Agent Rule Files`.
- [x] Register `Open Dashboard`.

### Templates

- [x] Create `agent-protocol.md` template.
- [x] Create `architecture.md` template.
- [x] Create `conventions.md` template.
- [x] Create `risk-rules.json` template.
- [x] Create `AGENTS.md` template.
- [x] Create `CLAUDE.md` template.
- [x] Create Cursor rule template.
- [x] Create Copilot instructions template.

### Git and diff analysis

- [x] Detect workspace root.
- [x] Detect whether workspace is a Git repo.
- [ ] Read changed files.
- [ ] Read current diff.
- [ ] Count changed files and line changes.
- [ ] Detect test files.
- [ ] Detect risky paths.
- [ ] Generate risk score.
- [ ] Generate findings.

### Prompt generation

- [ ] Read task input.
- [ ] Read protocol file.
- [ ] Read conventions file.
- [ ] Build generic prompt.
- [ ] Build Codex prompt variant.
- [ ] Build Claude prompt variant.
- [ ] Build Cursor prompt variant.
- [ ] Copy prompt to clipboard.
- [ ] Show prompt in output panel.

### Sidebar dashboard

- [ ] Build webview provider.
- [ ] Add current task textarea.
- [ ] Add primary action buttons.
- [ ] Add system readiness section.
- [ ] Add current diff risk section.
- [ ] Add agent file sync section.
- [ ] Add recent decision section.
- [ ] Wire webview messages to commands.

### Rule sync

- [ ] Write/update `AGENTS.md`.
- [ ] Write/update `CLAUDE.md`.
- [ ] Write/update `.cursor/rules/codegrip.mdc`.
- [ ] Write/update `.github/copilot-instructions.md`.
- [ ] Detect out-of-sync files.
- [x] Avoid overwriting user content without preserving custom sections.

### Diagnostics

- [ ] Convert findings to VS Code diagnostics.
- [ ] Add Problems tab integration.
- [ ] Clear diagnostics when diff changes.
- [ ] Add command to open review details.

### Quality

- [ ] Add unit tests for risk analyzer.
- [ ] Add unit tests for prompt builder.
- [ ] Add unit tests for sync service.
- [ ] Add manual extension host test checklist.
- [x] Package local `.vsix`.
- [x] Write README.

## 20. Super User-Friendly Details

### Make setup instant

Do not start with a long configuration wizard. Give the user one button: `Initialize Repo`.

### Make warnings explain themselves

Every finding should include:

- what happened
- why it matters
- what to do next

### Make copying prompts effortless

Generated prompts should have a big `Copy Prompt` action and should also open in an editable document.

### Make rules editable as Markdown first

Most developers prefer editing text files in the repo. Use JSON for machine rules, but keep human-facing guidance in Markdown.

### Respect existing files

If `CLAUDE.md`, `AGENTS.md`, or Copilot instructions already exist, append a clearly marked section instead of replacing the file.

### Keep the product quiet when things are fine

For low-risk diffs, show a small success state:

```text
Risk: Low
No system-level issues found.
```

### Give next steps, not lectures

Bad:

```text
Your implementation may be insufficiently systemic.
```

Good:

```text
Shared session helper changed. Check callers before landing.
```

## 21. Final Product Experience

The final product should feel like this:

1. I open my repo.
2. I see whether my agent rules are ready.
3. I type the task I want an agent to do.
4. I get a high-quality system-aware prompt.
5. I run Codex or Claude.
6. CodeGrip watches the result.
7. It tells me the real risks.
8. It suggests the right tests or checks.
9. It keeps my repo instructions synced across AI tools.
10. Over time, the repo becomes easier for any agent to understand.

The emotional end state:

The user feels faster without feeling reckless.

## 22. Success Metrics

### Individual user metrics

- Time from install to first useful prompt under 2 minutes
- Prompt generation used repeatedly in the same repo
- Diff review produces at least one useful action per meaningful change
- User keeps generated rule files in version control

### Team metrics

- Reduced repeated PR comments on AI-generated code
- More consistent agent behavior across tools
- Fewer missing-test issues in agent changes
- Fewer accidental broad changes
- Faster onboarding into AI-assisted repos

## 23. Open Questions

- Should the first version include any LLM calls, or stay fully local?
- Should terminal command monitoring be in MVP or beta?
- Should the extension create `AGENTS.md` automatically or ask first if it already exists?
- Should risk rules be per-repo only, or also global across the user machine?
- Should accepted findings be written to task history?
- Should the product eventually include a cloud team dashboard?
- Should the optional future `Agent Council` mode be local-only, LLM-powered, or both?

## 24. Recommended Build Order

1. Build local extension scaffold.
2. Implement repo initialization.
3. Implement prompt generation.
4. Implement basic diff review.
5. Add dashboard.
6. Add rule sync.
7. Add diagnostics.
8. Add tests and packaging.
9. Add optional LLM review later.

This order creates value early and avoids getting trapped in complicated integrations before the core workflow is proven.

## 25. Sprint Plan

Assumption:
Use one-week sprints after a short setup sprint. Each sprint should produce a usable slice of the VS Code extension, not just design artifacts.

### Sprint 0: Project Foundation

Length:
1-2 days.

Goal:
Create the extension shell and make local development repeatable.

Tasks:

- Scaffold VS Code TypeScript extension.
- Configure TypeScript, build script, and linting.
- Add package metadata, activation events, and command contributions.
- Add activity bar icon placeholder.
- Create initial folder structure under `src/`.
- Add a basic output channel named `CodeGrip`.
- Add a manual extension host launch configuration.
- Write a short local development section in the README.

Done when:

- The extension launches locally in the VS Code Extension Development Host.
- A placeholder `CodeGrip: Open Dashboard` command runs without errors.
- Build and lint commands are available.

### Sprint 1: Repo Initialization Prototype

Length:
1 week.

Goal:
Let a user initialize a repo and create the core CodeGrip files.

Tasks:

- Implement workspace root detection.
- Detect whether the workspace is writable.
- Add command: `CodeGrip: Initialize Repo`.
- Create `.codegrip/` folder.
- Add templates for `agent-protocol.md`, `architecture.md`, `conventions.md`, `risk-rules.json`, and `decision-log.md`.
- Add templates for `AGENTS.md`, `CLAUDE.md`, Cursor rules, and Copilot instructions.
- Preserve existing user files with clearly marked CodeGrip sections.
- Show created/skipped/updated files in the output channel.
- Add basic error messages for missing workspace, permissions, or invalid repo state.

Done when:

- A fresh repo can be initialized from the command palette.
- Existing agent instruction files are not overwritten.
- The user can inspect all generated files in the workspace.

### Sprint 2: Prompt Builder And Git Diff Review

Length:
1 week.

Goal:
Deliver the first useful daily loop: describe task, generate prompt, review current diff.

Tasks:

- Add command: `CodeGrip: Generate System-Aware Prompt`.
- Read `.codegrip/agent-protocol.md` and `.codegrip/conventions.md`.
- Support agent targets: Generic, Codex, Claude, Cursor, and Copilot.
- Copy generated prompt to clipboard.
- Show generated prompt in the output channel or an editable document.
- Add command: `CodeGrip: Review Current Git Diff`.
- Implement Git repo detection.
- Read changed files and current diff.
- Count changed files and line changes.
- Detect risky path keywords from `risk-rules.json`.
- Detect whether matching tests changed.
- Generate low, medium, high, or critical risk score.
- Render findings with title, severity, why it matters, and suggested action.

Done when:

- A user can generate a useful prompt from a rough task.
- A user can run diff review and receive actionable findings.
- Risk scoring works without external LLM calls.

### Sprint 3: Sidebar Dashboard MVP

Length:
1 week.

Goal:
Move the core workflow into the sidebar so CodeGrip feels like a compact control center.

Tasks:

- Build `dashboardProvider`.
- Add dashboard webview HTML and message types.
- Show repo name and initialization status.
- Add current task textarea.
- Add `Generate Prompt`, `Review Diff`, and `Sync Rules` buttons.
- Show system readiness checklist.
- Show current diff risk summary.
- Show agent file sync status.
- Wire dashboard actions to existing commands.
- Add empty states for uninitialized repo, no current diff, and no task entered.
- Use VS Code theme tokens for styling.

Done when:

- A user can operate the MVP from the sidebar.
- Dashboard state refreshes after initialization, prompt generation, review, and sync.
- The UI remains compact and native-feeling.

### Sprint 4: Rule Sync And Configuration

Length:
1 week.

Goal:
Make CodeGrip reliable across multiple coding agents and configurable per repo.

Tasks:

- Add command: `CodeGrip: Sync Agent Rule Files`.
- Implement `syncService`.
- Detect out-of-sync `AGENTS.md`, `CLAUDE.md`, Cursor rules, and Copilot instructions.
- Update only the marked CodeGrip-managed section in each file.
- Add config loading and validation for `.codegrip/risk-rules.json`.
- Improve default risk rules for auth, payments, security, migrations, infra, config, and shared utilities.
- Add clear validation errors for malformed JSON.
- Show sync state in the dashboard.
- Add unit tests for rule loading and sync section replacement.

Done when:

- Agent instruction files can be regenerated safely.
- User-authored content outside CodeGrip sections is preserved.
- Risk rules can be changed without editing extension code.

### Sprint 5: Diagnostics, Decisions, And Review Workflow

Length:
1 week.

Goal:
Make findings visible where developers already work and add a lightweight memory layer.

Tasks:

- Convert findings to VS Code diagnostics.
- Add Problems tab integration.
- Clear diagnostics when the diff changes or review is rerun.
- Add command: `CodeGrip: Open Agent Protocol`.
- Add command: `CodeGrip: Add Decision Log Entry`.
- Add command: `CodeGrip: Mark Finding Accepted`.
- Persist accepted findings in task history or decision log notes.
- Add review detail view or output document for the latest review.
- Add suggested next commands to diff review output.
- Add tests for diagnostic generation.

Done when:

- Findings appear both in CodeGrip UI and VS Code Problems.
- Accepted findings can be recorded without disappearing silently.
- Important AI-assisted decisions can be captured locally.

### Sprint 6: Beta Hardening And Packaging

Length:
1 week.

Goal:
Prepare the extension for sharing with early users.

Tasks:

- Add extension tests for initialization, prompt builder, risk analyzer, and sync service.
- Add manual extension host test checklist.
- Add packaged `.vsix` build.
- Write README with install, setup, and daily workflow.
- Add screenshots or GIF placeholders.
- Add privacy notes explaining local-first behavior.
- Add workspace settings for default agent target and review strictness.
- Improve error handling for no Git repo, binary files, huge diffs, and multi-root workspaces.
- Run build, lint, and tests.

Done when:

- The extension can be installed from a local `.vsix`.
- The README lets an early user try the full workflow.
- Core services have focused test coverage.

### Sprint 7: Pro Foundations

Length:
1 week.

Goal:
Start the future Pro surface without weakening the local-first MVP.

Tasks:

- Add command: `CodeGrip: Configure LLM Review`.
- Add provider settings model for local or remote review.
- Add feature flag for LLM-powered review.
- Add review prompt template that includes diff summary, rules, and repo context.
- Add team policy pack data model.
- Add command: `CodeGrip: Create Team Policy Pack`.
- Add audit log export format.
- Define free/pro feature boundaries in docs.
- Keep all LLM features optional and disabled by default.

Done when:

- Pro features have a clean configuration path.
- Local-only review still works exactly as before.
- Team policy packs have a concrete file format.

### Sprint 8: Team Release Readiness

Length:
1-2 weeks.

Goal:
Prepare CodeGrip for broader team use and public release.

Tasks:

- Add CI integration design and first implementation path.
- Add terminal command risk detection prototype.
- Improve multi-root workspace support.
- Add org template support.
- Add marketplace packaging metadata.
- Add telemetry opt-in copy and implementation plan.
- Add onboarding docs and short demo script.
- Add release checklist.
- Run dogfooding on at least two real repos.
- Collect false positive examples and tune default rules.

Done when:

- CodeGrip has a credible path from solo local extension to team product.
- Public release requirements are explicit.
- Known beta risks are documented with owners or next actions.

### Sprint 9: Cinematic Risk Visualization

Length:
1 week.

Goal:
Give CodeGrip a distinctive visual review layer that makes diff risk, blast radius, and next actions legible at a glance without weakening the compact VS Code feel.

Visual principles:

- Every visual must be backed by deterministic CodeGrip review data.
- Visuals should clarify findings, not replace textual explanations.
- Use VS Code theme tokens and respect reduced-motion preferences.
- Keep charts compact, keyboard-accessible, and screen-reader friendly.
- Avoid decorative graphs that do not change the user's decision.

Tasks:

- Add a visualization data model derived from `GitDiffSnapshot`, `RiskReview`, changed files, findings, and suggested checks.
- Add a Risk Storyboard: `Files touched -> Risk triggers -> Missing checks -> Suggested action`.
- Add a Blast Radius Map showing changed files connected to risk zones such as auth, config, shared utilities, tests, docs, and deployment.
- Add a Risk Heat Strip beside changed files using low, medium, high, and critical severity.
- Add empty states for no diff, low-risk diff, and findings without file paths.
- Keep the existing findings list visible as the source of truth.
- Add tests for visualization data derivation.
- Add manual dashboard checks for theme contrast, reduced motion, and keyboard navigation.

Done when:

- A user can understand the riskiest part of a diff within a few seconds.
- The Blast Radius Map and Risk Storyboard match the textual findings.
- The dashboard still feels like a native developer tool, not a marketing page.

### Sprint 10: Readiness And Release Analytics

Length:
1 week.

Goal:
Turn repo readiness, terminal command risk, release readiness, and dogfooding feedback into local-first charts that help teams decide what to do next.

Tasks:

- Add an Agent Readiness Radar for protocol, architecture, conventions, risk rules, synced agent files, and test signal.
- Add a Release Readiness Board for compile, lint, tests, VSIX packaging, smoke test, dogfooding, screenshots, license, and changelog.
- Add a Command Danger Meter for `CodeGrip: Review Terminal Command`.
- Add a local False Positive Trend view using accepted findings and dogfooding notes where available.
- Add local-only chart summaries to review details or dashboard state without sending telemetry.
- Add screenshot/demo updates that show the new visual analytics.
- Document how teams should interpret readiness charts without treating them as hard gates.

Done when:

- Repo readiness and release state are visible without reading the full checklist.
- Command risk has an immediate visual state and specific matched findings.
- False-positive trends remain local, inspectable, and useful for rule tuning.
- No analytics or chart data leaves the workspace.

### Sprint Backlog Rules

- Keep each sprint shippable.
- Do not add LLM dependencies before the local MVP loop is useful.
- Prioritize workflow speed over advanced configuration.
- Prefer repo-local files over hidden extension state.
- Treat false positives as product bugs, not just rule tuning.
- Treat cinematic visuals as product comprehension tools, not decoration.
