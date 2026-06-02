# Reliable Agent Workflow Skill

A cross-harness Agent Skill for reliable engineering delivery: design review, implementation review, repair-until-zero-open-issues, independent verification, artifact tracking, Best-of-N variants, and memory capture.

The skill is compatible with Codex, Claude Code, Grok, and Pi skill discovery conventions.

## Install

Install directly from GitHub with npm:

```bash
npm install -g github:yxhpy/reliable-agent-workflow-skill
install-reliable-agent-workflow --agent all --force
```

Or clone the repository, then run the installer:

```bash
git clone https://github.com/yxhpy/reliable-agent-workflow-skill.git
cd reliable-agent-workflow-skill
node scripts/install.mjs --agent all --force
```

Install for one harness only:

```bash
node scripts/install.mjs --agent codex --force
node scripts/install.mjs --agent claude --force
node scripts/install.mjs --agent grok --force
node scripts/install.mjs --agent pi --force
```

Default target directories:

| Harness | Target |
| --- | --- |
| Codex | `$CODEX_HOME/skills/reliable-agent-workflow` or `~/.codex/skills/reliable-agent-workflow` |
| Claude Code | `$CLAUDE_HOME/skills/reliable-agent-workflow` or `~/.claude/skills/reliable-agent-workflow` |
| Grok | `$GROK_HOME/skills/reliable-agent-workflow` or `~/.grok/skills/reliable-agent-workflow` |
| Pi | `$PI_CODING_AGENT_DIR/skills/reliable-agent-workflow` or `~/.pi/agent/skills/reliable-agent-workflow` |

Preview targets without writing:

```bash
node scripts/install.mjs --agent all --dry-run
```

## Upgrade

One-command upgrade for all supported harnesses:

```bash
npm install -g github:yxhpy/reliable-agent-workflow-skill && install-reliable-agent-workflow --agent all --force
```

PowerShell equivalent:

```powershell
npm install -g github:yxhpy/reliable-agent-workflow-skill; install-reliable-agent-workflow --agent all --force
```

## Use

Ask your agent to use `reliable-agent-workflow`, for example:

```text
Use reliable-agent-workflow to implement this refactor with review and e2e verification.
```

The skill triggers on complex coding tasks, refactors, migrations, architecture work, debugging, security-sensitive changes, Best-of-N requests, and verification/check-work requests.

For faster multi-agent runs, the skill includes role-specific model routing guidance with editable GPT-series examples. Configure the actual models in your own Codex, Claude Code, Grok, or Pi settings/agent definitions; the installer does not mutate real global CLI configuration.

## Validate and Test

```bash
npm test
npm run validate
npm run e2e
```

The e2e suite verifies:

- skill metadata and body rules,
- installer behavior for Codex, Claude Code, Grok, and Pi targets,
- Codex prompt-input discovery,
- Grok inspect discovery,
- Pi skill loader discovery,
- Claude target installation plus CLI skill-resolution help text.

Tests use temporary directories and do not install into your real agent homes.

## Repository Layout

```text
reliable-agent-workflow/       # Agent Skill package
  SKILL.md                     # Required skill instructions
  agents/openai.yaml           # Optional Codex UI metadata
scripts/
  install.mjs                  # Cross-harness installer
  validate-skill.mjs           # Compatibility validator
tests/                         # Node test suite
```

## License

MIT
