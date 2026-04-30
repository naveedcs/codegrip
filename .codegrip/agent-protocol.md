# CodeGrip Agent Protocol

Use this protocol when a coding agent works in this repository.

## Working Rules

- Inspect the relevant files before editing.
- Keep changes scoped to the user task.
- Prefer existing project patterns over new abstractions.
- Explain risky changes before making broad edits.
- Do not overwrite user work or unrelated files.
- Summarize files changed, tests run, and remaining risks.

## Before Editing

- Identify the affected feature, module, and likely callers.
- Check architecture notes and conventions.
- Look for nearby tests or examples.
- Call out missing context instead of guessing silently.

## After Editing

- Run the smallest useful verification.
- Mention any tests that could not be run.
- Note follow-up risks if the change touches shared code, auth, payments, security, migrations, deployment, or config.
