# Result: 02-implementation

## Status
success

## Summary
Applied local macOS/E2E release-readiness fixes.

## Changed Files
- `tests/cli-discovery.test.mjs`: resolves the real Homebrew/npm-global Pi CLI package root by following the `pi` symlink and falling back to `npm root -g`.
- `tests/e2e-install.test.mjs`: sanitizes agent-home environment variables during temp-home installer tests and packed-bin execution so ambient `CODEX_HOME`, `CLAUDE_HOME`, `GROK_HOME`, and `PI_CODING_AGENT_DIR` cannot redirect test installs into real configured homes.
- `package.json`: bumped version to `0.3.1`.
- `CHANGELOG.md`: added 0.3.1 macOS verification/fix notes.
- `README.md`: added direct npm install instructions.

## Blockers
None for implementation.
