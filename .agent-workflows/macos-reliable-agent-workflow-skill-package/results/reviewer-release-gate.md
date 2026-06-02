## Review

**Verdict: FAIL — keep `npm publish` blocked for the workflow release gate.**

Technical macOS package validation now has passing reviewer-run evidence (below), but the workflow's own release artifacts are still not integrated/finalized: `.agent-workflows/macos-reliable-agent-workflow-skill-package/workflow.json` is `state: pending_approval`, release approval is `pending`, `results/evidence/verification` arrays are empty, and `finalVerdict` is `pending` (`workflow.json`:9,49-52,127-130). `final-report.md` is also still `pending` with no accepted results or verification evidence (`final-report.md`:3-17,21). Do not publish until the owner integrates the evidence, updates the final report, and grants the release gate.

- Correct: Current package metadata exposes the expected bin/scripts and version `0.3.1` (`package.json`:1-21). The macOS Pi/Homebrew package-root E2E issue appears addressed: `tests/cli-discovery.test.mjs` now follows `realpathSync(piCommand)`, tries the real package root, old bin-adjacent lookup, and `npm root -g`, then imports `dist/core/skills.js` (`tests/cli-discovery.test.mjs`:53-72,114-123).
- Correct: Local reviewer-run macOS evidence was collected on Darwin arm64/macOS 26.4 with Node `v26.0.0` and npm `11.12.1`. Local CLIs were present: Codex `0.133.0`, Grok `0.2.14`, Pi `0.78.0`, Claude Code `2.1.153`, Gemini `0.43.0`, Agy `1.0.4`.
- Correct: `npm run validate` passed: `Skill validation passed: /Users/yxhpy/reliable-agent-workflow-skill/reliable-agent-workflow`.
- Correct: `npm test` passed 14/14 with `fail 0`, `skipped 0`; it included the packed-bin E2E test `published npm bin installs using the package default source`.
- Correct: `npm run e2e` passed 10/10 with `fail 0`, `skipped 0`.
- Correct: Reviewer-run tarball smoke passed in `/tmp`: `npm pack --json --pack-destination <tmp>` produced `reliable-agent-workflow-skill-0.3.1.tgz` with 8 package entries; `npm install --prefix <tmp>/prefix <tarball>` created `.bin/install-reliable-agent-workflow`; executing that bin with `--agent codex --home <tmp>/home --dry-run` printed the expected temp install target. Although `npm pack --dry-run` reports script file mode `0644`, npm install chmodded the installed script target to `-rwxr-xr-x` and the bin executed successfully.
- Blocker: Workflow artifact state still blocks release. The plan requires verification records to prove the final verdict (`plan.md`:7-12), but `workflow.json` remains pending and unintegrated (`workflow.json`:9,49-52,127-130) and `final-report.md` has no accepted results/evidence (`final-report.md`:3-17). Publishing now would bypass the explicit release gate.
- Blocker: Likely local macOS E2E safety bug if harness home env vars are set. The installer intentionally gives `CODEX_HOME`, `CLAUDE_HOME`, `GROK_HOME`, and `PI_CODING_AGENT_DIR` precedence over `--home` (`scripts/install.mjs`:94-105). But `tests/e2e-install.test.mjs` inherits `process.env` (`tests/e2e-install.test.mjs`:17-22) and several tests call the installer with `--home <temp> --force` while asserting temp-home installs (`tests/e2e-install.test.mjs`:60-67,87-94,142-162). A dry-run proof showed `CODEX_HOME=<tmp-codex> node scripts/install.mjs --home <tmp-home> --agent codex --dry-run` prints `<tmp-codex>/skills/reliable-agent-workflow`, not `<tmp-home>/.codex/...`. This contradicts the README claim that tests do not install into real agent homes (`README.md`:98) unless the release runner unsets those env vars or the tests sanitize them.
- Note: Root `/Users/yxhpy/reliable-agent-workflow-skill/plan.md` and `/Users/yxhpy/reliable-agent-workflow-skill/progress.md` requested by the task do not exist; the actual workflow plan reviewed is `.agent-workflows/macos-reliable-agent-workflow-skill-package/plan.md`.
- Note: Current working tree is dirty (`CHANGELOG.md`, `README.md`, `package.json`, `tests/cli-discovery.test.mjs`, plus workflow artifacts). The changelog claims full local macOS verification before publish (`CHANGELOG.md`:11-12); the reviewer-run evidence above supports that claim technically, but the owner still needs to integrate it into the workflow final report before release.

### Commands run by reviewer

```bash
sw_vers && uname -a
node -v && npm -v
for cmd in codex grok pi claude gemini agy; do command -v "$cmd" && "$cmd" --version; done
npm run validate
npm test
npm run e2e
npm pack --dry-run --json
# temp tarball install/bin smoke:
TMP=$(mktemp -d /tmp/raw-review-pack-XXXXXX)
npm pack --json --pack-destination "$TMP"
npm install --prefix "$TMP/prefix" "$TMP"/*.tgz
"$TMP/prefix/node_modules/.bin/install-reliable-agent-workflow" --agent codex --home "$TMP/home" --dry-run
rm -rf "$TMP"
```

### Commands to run before unblocking publish

Run from repo root on the publishing Mac, with real harness homes protected:

```bash
sw_vers && uname -a
node -v && npm -v
for cmd in codex grok pi claude gemini agy; do
  command -v "$cmd" && "$cmd" --version
 done

npm run validate
( unset CODEX_HOME CLAUDE_HOME GROK_HOME PI_CODING_AGENT_DIR; npm test )
( unset CODEX_HOME CLAUDE_HOME GROK_HOME PI_CODING_AGENT_DIR; npm run e2e )

TMP=$(mktemp -d /tmp/reliable-agent-workflow-pack-XXXXXX)
npm pack --json --pack-destination "$TMP"
npm install --prefix "$TMP/prefix" "$TMP"/reliable-agent-workflow-skill-*.tgz
"$TMP/prefix/node_modules/.bin/install-reliable-agent-workflow" --agent codex --home "$TMP/home" --force
test -f "$TMP/home/.codex/skills/reliable-agent-workflow/SKILL.md"
rm -rf "$TMP"
```

After those pass, update `.agent-workflows/macos-reliable-agent-workflow-skill-package/final-report.md` and `workflow.json` with accepted results/verification/release approval before `npm publish`.
