# Demo Script

Use this short demo for early users or release recordings.

## Setup

1. Install the latest local VSIX.
2. Open a disposable Git repository.
3. Open the CodeGrip activity bar item.

## Flow

1. Run `CodeGrip: Initialize Repo`.
2. Show `.codegrip/agent-protocol.md`, `.codegrip/conventions.md`, and `.codegrip/org-template.json`.
3. Enter a task in the dashboard: `Add validation to the profile form`.
4. Generate a Codex prompt.
5. Make a small source change without tests.
6. Run `CodeGrip: Review Current Git Diff`.
7. Show risk score, findings, suggested checks, Problems diagnostics, review details, and dashboard risk visuals.
8. Show the compact Readiness Pulse in the dashboard.
9. Run `CodeGrip: Mark Finding Accepted` and record a short note.
10. Refresh the dashboard and show the false-positive pulse count change.
11. Run `CodeGrip: Add Decision Log Entry`.
12. Run `CodeGrip: Review Terminal Command` with `git reset --hard HEAD` and show the danger meter without executing the command.
13. Run `CodeGrip: Create Team Policy Pack` and show `.codegrip/team-policy-pack.json`.

## Closing Line

CodeGrip keeps coding agents fast by making repo context, risk, and review expectations visible before changes land.
