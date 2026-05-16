# Release Checklist

Use this before sharing a beta VSIX or preparing marketplace publication.

## Code Verification

- [ ] `npm ci`
- [ ] `npm run compile`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run package`
- [ ] Review package warnings.

## Manual Verification

- [ ] Complete `docs/manual-extension-host-checklist.md`.
- [ ] Install the generated VSIX in a normal VS Code window.
- [ ] Test one single-root workspace.
- [ ] Test one multi-root workspace.
- [ ] Test one folder without Git metadata.

## Product Verification

- [ ] README install flow is current.
- [ ] Privacy notes are current.
- [ ] Demo script still matches the UI.
- [ ] Known limitations are documented.
- [ ] False-positive examples have owners or next actions.

## Marketplace Readiness

- [ ] Confirm publisher ID.
- [ ] Confirm repository URL.
- [ ] Choose final license before public redistribution.
- [ ] Add final icon and screenshots.
- [ ] Add changelog.
- [ ] Decide whether telemetry remains absent or ships behind opt-in.

## Release Notes Template

```text
CodeGrip <version>

Highlights:
- 

Verification:
- npm run compile
- npm run lint
- npm test
- npm run package
- Extension Host smoke test

Known risks:
- 
```
