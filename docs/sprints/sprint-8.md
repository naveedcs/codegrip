# Sprint 8 Report: Team Release Readiness

Status:
Implementation complete. Release validation is tracked in `task-tracker.md` under Release Closure.

Duration:
Implemented as the first Sprint 8 release-readiness slice.

## Sprint Goal

Prepare CodeGrip for broader team use and public release.

## Completed Tasks

- Added `CodeGrip: Review Terminal Command`.
- Added deterministic terminal command risk detection for destructive file commands, destructive Git commands, data/infrastructure deletion, remote script execution, force pushes, production/publish commands, migrations, and dependency installs.
- Kept command review advisory only; CodeGrip does not execute terminal commands.
- Improved multi-root workspace selection by preferring the active editor workspace, then an initialized `.codegrip/` workspace, then the first workspace.
- Added `.codegrip/org-template.json`.
- Added org template loading and validation.
- Team policy packs now use org template policy defaults.
- Added marketplace packaging metadata for repository, bugs, homepage, and keywords.
- Added `codegrip.telemetry.enabled`, disabled by default.
- Added CI integration plan.
- Added onboarding demo script.
- Added release checklist.
- Added dogfooding log.
- Added false-positive example log.
- Tuned the broad default configuration rule so service files such as `configService.ts` are not treated as runtime configuration by filename alone.

## Verification

- `npm run compile`: passed.
- `npm run lint`: passed.
- `npm test`: passed, 35 tests.
- `npm run package`: passed and created `codegrip-0.0.1.vsix`.

## Manual Test Checklist

Use `docs/manual-extension-host-checklist.md` and the Sprint 8 section in `README.md`.

## Known Follow-Ups

- Run dogfooding on at least two real repositories.
- Collect real false-positive examples from dogfooding.
- Decide the final license before public marketplace distribution.
- Add final screenshots and changelog.
- Wire CI from `docs/ci.md` into `.github/workflows/` when ready.
- Complete the consolidated Release Closure Extension Development Host smoke test.
