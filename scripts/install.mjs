#!/usr/bin/env node
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = realpathSync(fileURLToPath(import.meta.url));
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const defaultSource = path.join(repoRoot, 'reliable-agent-workflow');
const validAgents = new Set(['codex', 'claude', 'grok', 'pi']);

function usage(exitCode = 0) {
  const text = `Usage: node scripts/install.mjs [options]

Install the reliable-agent-workflow skill into agent skill directories.

Options:
  --agent <name|all>       Agent to install for: codex, claude, grok, pi, all (default: all)
  --agents <list>          Comma-separated agent list
  --source <dir>           Skill directory containing SKILL.md (default: ./reliable-agent-workflow)
  --home <dir>             Home directory used to resolve default agent homes
  --target-dir <dir>       Override the skill base directory for a single --agent install
  --force                  Replace an existing installed skill
  --dry-run                Print planned installs without writing
  --list-targets           Print resolved target directories
  -h, --help               Show this help

Default targets:
  codex   $CODEX_HOME/skills or <home>/.codex/skills
  claude  $CLAUDE_HOME/skills or <home>/.claude/skills
  grok    $GROK_HOME/skills or <home>/.grok/skills
  pi      $PI_CODING_AGENT_DIR/skills or <home>/.pi/agent/skills
`;
  (exitCode === 0 ? console.log : console.error)(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const opts = {
    agents: ['all'],
    source: defaultSource,
    home: homedir(),
    targetDir: undefined,
    force: false,
    dryRun: false,
    listTargets: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) usage(2);
      i += 1;
      return argv[i];
    };

    if (arg === '--agent') opts.agents = [next()];
    else if (arg === '--agents') opts.agents = next().split(',').map((x) => x.trim()).filter(Boolean);
    else if (arg === '--source') opts.source = next();
    else if (arg === '--home') opts.home = next();
    else if (arg === '--target-dir') opts.targetDir = next();
    else if (arg === '--force') opts.force = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--list-targets') opts.listTargets = true;
    else if (arg === '-h' || arg === '--help') usage(0);
    else {
      console.error(`Unknown argument: ${arg}`);
      usage(2);
    }
  }

  opts.source = path.resolve(opts.source);
  opts.home = path.resolve(opts.home);
  if (opts.targetDir) opts.targetDir = path.resolve(opts.targetDir);
  return opts;
}

function expandAgents(values) {
  const expanded = new Set();
  for (const value of values) {
    if (value === 'all') {
      for (const agent of validAgents) expanded.add(agent);
      continue;
    }
    if (!validAgents.has(value)) {
      throw new Error(`Invalid agent '${value}'. Expected one of: ${Array.from(validAgents).join(', ')}, all`);
    }
    expanded.add(value);
  }
  return Array.from(expanded);
}

function targetBase(agent, opts) {
  if (opts.targetDir) return opts.targetDir;

  switch (agent) {
    case 'codex':
      return path.join(process.env.CODEX_HOME || path.join(opts.home, '.codex'), 'skills');
    case 'claude':
      return path.join(process.env.CLAUDE_HOME || path.join(opts.home, '.claude'), 'skills');
    case 'grok':
      return path.join(process.env.GROK_HOME || path.join(opts.home, '.grok'), 'skills');
    case 'pi':
      return path.join(process.env.PI_CODING_AGENT_DIR || path.join(opts.home, '.pi', 'agent'), 'skills');
    default:
      throw new Error(`Unsupported agent: ${agent}`);
  }
}

function validateSource(source) {
  if (!existsSync(path.join(source, 'SKILL.md'))) {
    throw new Error(`Source must be a skill directory containing SKILL.md: ${source}`);
  }

  const rejectSymlinks = (entry) => {
    const stat = lstatSync(entry);
    if (stat.isSymbolicLink()) {
      throw new Error(`Refusing to install source containing symlink: ${entry}`);
    }
    if (!stat.isDirectory()) return;
    for (const child of readdirSync(entry)) {
      rejectSymlinks(path.join(entry, child));
    }
  };

  rejectSymlinks(source);
}

function installOne(agent, opts) {
  const base = targetBase(agent, opts);
  const dest = path.join(base, path.basename(opts.source));
  const plan = { agent, base, dest };

  if (opts.listTargets || opts.dryRun) {
    console.log(`${agent}: ${dest}`);
    return plan;
  }

  mkdirSync(base, { recursive: true });
  if (existsSync(dest)) {
    if (!opts.force) {
      throw new Error(`${agent} target already exists: ${dest}. Re-run with --force to replace it.`);
    }
    rmSync(dest, { recursive: true, force: true });
  }
  cpSync(opts.source, dest, { recursive: true, force: false, dereference: false });
  console.log(`Installed ${path.basename(opts.source)} for ${agent}: ${dest}`);
  return plan;
}

try {
  const opts = parseArgs(process.argv.slice(2));
  const agents = expandAgents(opts.agents);
  if (opts.targetDir && agents.length !== 1) {
    throw new Error('--target-dir can only be used with a single --agent');
  }
  validateSource(opts.source);
  for (const agent of agents) installOne(agent, opts);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
