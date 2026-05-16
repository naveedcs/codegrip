# CI Integration Plan

CodeGrip should keep CI lightweight for the public beta.

## First Implementation Path

Run the same checks used locally:

```bash
npm ci
npm run compile
npm run lint
npm test
npm run package
```

## GitHub Actions Draft

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run compile
      - run: npm run lint
      - run: npm test
      - run: npm run package
```

## Release Gate

Before marketplace publication, CI should be required for:

- TypeScript compile.
- ESLint.
- Unit tests.
- VSIX packaging.
- Manual Extension Development Host checklist signoff.

## Future CodeGrip CI Mode

A later CodeGrip CLI or action can run deterministic policy checks on PR diffs, then report risky paths, missing tests, and release checklist gaps without needing an LLM.
