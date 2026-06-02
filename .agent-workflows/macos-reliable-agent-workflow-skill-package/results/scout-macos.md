# Code Context

## Files Retrieved
1. `package.json` (lines 1-35) - package metadata, bin mappings, npm scripts, engine floor, publish file allowlist.
2. `scripts/install.mjs` (lines 1-163) - cross-harness installer, target resolution, symlink rejection, copy behavior.
3. `scripts/validate-skill.mjs` (lines 1-185) - static compatibility checks for frontmatter/body/OpenAI metadata.
4. `tests/e2e-install.test.mjs` (lines 1-166) - installer/package-bin E2E coverage using temp homes and npm pack/install.
5. `tests/cli-discovery.test.mjs` (lines 1-144) - local Codex/Grok/Pi/Claude discovery E2E and current macOS Pi package-root resolver.
6. `tests/validate.test.mjs` (lines 1-106) - Node test assertions for skill frontmatter and required workflow/model-routing text.
7. `README.md` (lines 1-107) - install/upgrade/use/test docs and target directory claims.
8. `CHANGELOG.md` (lines 1-32) - 0.3.0 release notes and no-global-config-mutation claim.
9. `reliable-agent-workflow/SKILL.md` (lines 1-80, 134-172, 371-390) - frontmatter, frontend/Gemini/Agy/Pi routing, verification contract.
10. `reliable-agent-workflow/agents/openai.yaml` (lines 1-6) - optional Codex UI metadata validated by `validate-skill.mjs`.

## Key Code

- Package entry points: `package.json` lines 7-21 maps `install-reliable-agent-workflow` to `scripts/install.mjs`, `validate-reliable-agent-workflow` to `scripts/validate-skill.mjs`, and defines `validate`, `test`, and `e2e` scripts. Engine is Node `>=20` (`package.json` lines 33-35).
- Installer target precedence: `scripts/install.mjs` lines 94-105 uses `CODEX_HOME`, `CLAUDE_HOME`, `GROK_HOME`, and `PI_CODING_AGENT_DIR` before the `--home` default paths. This is correct for real installs, but important for temp-home tests.
- Installer safety: `scripts/install.mjs` lines 111-127 rejects any symlink under the source tree; lines 140-148 create target dirs, optionally remove existing target with `--force`, and copy with `cpSync(..., dereference: false)`.
- E2E temp install risk area: `tests/e2e-install.test.mjs` lines 17-22 inherits `process.env`, and lines 60-63 run `--home <temp> --agents all --force`. If harness home env vars are set, installer env precedence can override the temp home.
- macOS Pi discovery adaptation now present in working tree: `tests/cli-discovery.test.mjs` lines 53-71 follows `realpathSync(piCommand)` and falls back to old bin-adjacent and `npm root -g` package roots before importing `dist/core/skills.js` at lines 119-123. This matches Homebrew `/opt/homebrew/bin/pi` symlink layouts.
- CLI discovery tests skip if a CLI `--version` fails (`tests/cli-discovery.test.mjs` lines 34-41); when commands exist, they verify Codex prompt input, Grok inspect JSON, Pi `loadSkills`, and Claude help text (lines 82-140).

## Architecture

The npm package ships the skill directory plus installer/validator/docs (`package.json` lines 11-17). The installer resolves a source skill dir relative to the real script path, which makes npm `.bin` symlink execution work, then copies `reliable-agent-workflow/` into per-harness skill homes. Validation is static string/frontmatter compatibility checking. E2E has two layers: installer/package-bin behavior in temp dirs, then optional local CLI discovery checks that run only when Codex/Grok/Pi/Claude are on `PATH` and answer `--version`.

## Findings

- Local macOS environment observed: Darwin 25.4.0 arm64, Node v26.0.0, npm 11.12.1. CLIs present and `--version` succeeded: Codex 0.133.0, Grok 0.2.14, Pi 0.78.0, Claude Code 2.1.153, Gemini 0.43.0, Agy 1.0.4.
- Validation already run locally: `npm run validate && npm run e2e` passed 10/10 E2E tests; `npm test` passed 14/14 with 0 skipped. `npm pack --dry-run --json` showed 8 packaged files and no tests in the tarball.
- Main publish/E2E risk: if `CODEX_HOME`, `CLAUDE_HOME`, `GROK_HOME`, or `PI_CODING_AGENT_DIR` are set, `tests/e2e-install.test.mjs` can write to those configured homes despite using `--home <temp>`, because `scripts/install.mjs` intentionally gives env vars precedence. Local scout env had all four unset.
- Worktree note: `git status` showed `tests/cli-discovery.test.mjs` modified with the macOS/Homebrew Pi resolver. Ensure this intended test adaptation is reviewed/committed before final publish workflow.
- Low risk: packaged bin scripts have mode `0644` in `npm pack --dry-run`; npm install still created runnable `.bin` shims and the packed-bin E2E passed. Direct `./scripts/install.mjs` execution from a clone may require `chmod +x`, but README uses `node scripts/install.mjs` for clones.
- CLI E2E caveat: discovery tests have no built-in timeout. On another macOS host, auth-prompting or hanging CLIs could stall/fail; check `--version` first and verify test summary has `skipped 0` if full local coverage is required.

## Suggested validation commands

```bash
node -v && npm -v
for cmd in codex grok pi claude gemini agy; do command -v "$cmd" && "$cmd" --version; done

npm run validate
npm test
( unset CODEX_HOME CLAUDE_HOME GROK_HOME PI_CODING_AGENT_DIR; npm run e2e )
npm pack --dry-run --json
```

## Start Here

Start with `tests/e2e-install.test.mjs` because its temp-home assumptions interact with `scripts/install.mjs` env-var precedence and can affect real macOS harness homes during pre-publish E2E if local env vars are set.
