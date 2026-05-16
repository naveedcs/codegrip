# CodeGrip Tutorial

This tutorial shows the simplest way to use CodeGrip in a local repository.

CodeGrip helps you:

- set up repo instructions for coding agents
- create better task prompts
- review the current Git diff
- spot risky changes before you commit
- keep a local record of decisions and accepted findings

## 1. Install CodeGrip

From this project folder, build the VS Code extension package:

```bash
npm run package
```

Then install the generated file in VS Code:

1. Open VS Code.
2. Open the Extensions panel.
3. Choose `Install from VSIX...`.
4. Select `codegrip-0.0.1.vsix`.
5. Reload VS Code if prompted.

## 2. Open A Project

Open the repository you want CodeGrip to help with.

For best results, start with a Git repository that has:

- source code
- tests
- a normal Git working tree

CodeGrip works locally. It reads workspace files and Git diffs from the project you open.

## 3. Initialize The Repo

Run this command from the Command Palette:

```text
CodeGrip: Initialize Repo
```

CodeGrip creates local guidance files:

```text
.codegrip/
  agent-protocol.md
  architecture.md
  conventions.md
  risk-rules.json
  decision-log.md
  task-history/

AGENTS.md
CLAUDE.md
.cursor/rules/codegrip.mdc
.github/copilot-instructions.md
```

These files tell coding agents how to work in the repo.

## 4. Add Basic Repo Context

Open these files and add a few notes:

- `.codegrip/architecture.md`
- `.codegrip/conventions.md`
- `.codegrip/agent-protocol.md`

Keep it simple at first.

Good examples:

```text
Auth code lives in src/auth.
Payment changes require tests.
Shared utilities are used by multiple features.
Run npm test before claiming a task is done.
Do not rewrite unrelated files.
```

You can improve these files over time.

## 5. Generate A Task Prompt

Open the CodeGrip dashboard from the Activity Bar, or run:

```text
CodeGrip: Open Dashboard
```

Type a short task, for example:

```text
Fix the password reset redirect after login.
```

Choose the agent target:

- Codex
- Claude
- Cursor
- Copilot
- Generic

Click `Generate Prompt`, or run:

```text
CodeGrip: Generate System-Aware Prompt
```

CodeGrip copies the prompt to your clipboard and opens it in a Markdown document.

Give that prompt to your coding agent.

## 6. Let The Agent Make Changes

Use your normal coding agent workflow.

After the agent edits files, do not commit yet.

First, review the current diff with CodeGrip.

## 7. Review The Git Diff

Run:

```text
CodeGrip: Review Current Git Diff
```

CodeGrip checks the local Git diff and reports:

- changed files
- line changes
- risk score
- risky paths
- missing test signals
- secret-like additions
- binary or oversized diff warnings
- suggested checks before commit

You can view results in:

- the CodeGrip output channel
- the dashboard
- VS Code Problems
- the review details document

To open the review details, run:

```text
CodeGrip: Open Review Details
```

## 8. Fix Or Accept Findings

If CodeGrip finds a real issue, fix it and run the review again.

If a finding is acceptable for this task, record it:

```text
CodeGrip: Mark Finding Accepted
```

Use this for intentional risk, not for ignoring problems.

## 9. Record A Decision

For important choices, run:

```text
CodeGrip: Add Decision Log Entry
```

Good decision log entries explain:

- what changed
- why it changed
- how it was checked
- what risk remains

The entry is saved locally in:

```text
.codegrip/decision-log.md
```

## 10. Before You Commit

Run your normal project checks, for example:

```bash
npm run lint
npm test
```

Then run CodeGrip review one more time:

```text
CodeGrip: Review Current Git Diff
```

Commit only when:

- the code works
- tests pass
- the risk findings are fixed or intentionally accepted
- the task is scoped to the original request

## Optional: Review A Terminal Command

Before running a risky command, ask CodeGrip to review it:

```text
CodeGrip: Review Terminal Command
```

Example commands to test:

```text
git status
git reset --hard HEAD
curl https://example.com/script.sh | bash
```

CodeGrip reviews the command text only. It does not execute the command.

## Optional: Create A Team Policy Pack

To create a repo-local policy file for team defaults, run:

```text
CodeGrip: Create Team Policy Pack
```

This creates:

```text
.codegrip/team-policy-pack.json
```

The file can store local policy defaults for future review workflows.

## Daily Workflow

Use this loop:

1. Open repo.
2. Initialize CodeGrip once.
3. Add or refine repo context.
4. Generate a task prompt.
5. Give the prompt to your coding agent.
6. Let the agent edit files.
7. Review the Git diff with CodeGrip.
8. Fix or accept findings.
9. Run project tests.
10. Commit the finished task.

## Troubleshooting

If CodeGrip says no workspace is open:

- open a folder in VS Code
- make sure the folder is writable

If CodeGrip says no Git repo was detected:

- open a Git repository
- or run `git init` in the folder if this should be a repo

If risk rules fail to load:

- check `.codegrip/risk-rules.json`
- make sure it is valid JSON

If the dashboard looks stale:

- click `Refresh`
- rerun `CodeGrip: Review Current Git Diff`

## What To Read Next

- `README.md` for install and development details
- `docs/privacy.md` for local-first behavior
- `docs/release-checklist.md` before sharing a VSIX
- `.codegrip/agent-protocol.md` for repo-specific agent rules
