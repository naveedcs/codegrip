# False Positive Examples

Use this log to tune deterministic rules from real dogfooding, not guesses.

## Current Tuning

- The default configuration rule now targets `**/*.config.*`, `**/config/**`, `**/settings/**`, and `**/.env*` instead of every filename containing `config`. This keeps runtime configuration changes high risk while avoiding routine service files such as `configService.ts`.

## Examples To Collect

| Date | Repo | Finding | Why It Was Noisy | Action |
| --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD |

## Tuning Rules

- Keep auth, permissions, payments, migrations, deployment, config, secrets, and shared utilities high-signal.
- Tune broad path globs before lowering severity.
- Prefer adding an explanation or suggested check over hiding a finding.
- Treat repeated false positives as product bugs.
