# CodeGrip LLM Review Prompt

Repository: {{workspaceName}}

## Diff Summary

{{diffSummary}}

## Risk Rules

{{riskRules}}

## Repository Agent Protocol

{{agentProtocol}}

## Repository Architecture Notes

{{architecture}}

## Repository Conventions

{{conventions}}

## Review Instructions

- Review the diff for system-level risk, missing tests, risky paths, and blast radius.
- Treat auth, permissions, payments, migrations, deployment, config, secrets, and shared utilities as higher-risk areas.
- Keep recommendations specific and actionable.
- Do not invent files or behavior that are not visible in the supplied context.
- Return findings with severity, why it matters, and suggested verification.
