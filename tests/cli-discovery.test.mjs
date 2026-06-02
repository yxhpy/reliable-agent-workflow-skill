import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const installScript = path.join(repoRoot, 'scripts', 'install.mjs');
const skillName = 'reliable-agent-workflow';

function makeTempRoot() {
  return mkdtempSync(path.join(tmpdir(), 'raw-cli-e2e-'));
}

function quoteArg(value) {
  const arg = String(value);
  if (process.platform === 'win32') return `"${arg.replace(/"/g, '\\"')}"`;
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}

function run(command, args, options = {}) {
  const resolved = path.isAbsolute(command) ? command : resolveCommand(command);
  const commandLine = [resolved, ...args].map(quoteArg).join(' ');
  return execSync(commandLine, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 25 * 1024 * 1024,
    ...options,
  });
}

function commandAvailable(command) {
  try {
    run(command, ['--version'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function resolveCommand(command) {
  const lookup = process.platform === 'win32' ? 'where.exe' : 'which';
  const out = execFileSync(lookup, [command], { encoding: 'utf8' });
  const candidates = out.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (process.platform === 'win32') {
    return candidates.find((candidate) => /\.(exe|cmd|bat)$/i.test(candidate)) || candidates[0];
  }
  return candidates[0];
}

function installFor(agent, env, extra = []) {
  return execFileSync(process.execPath, [installScript, '--agent', agent, '--force', ...extra], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

test('Codex discovers the installed skill in prompt input', { skip: !commandAvailable('codex') }, () => {
  const root = makeTempRoot();
  const codexHome = path.join(root, 'codex-home');
  try {
    installFor('codex', { CODEX_HOME: codexHome });
    const output = run('codex', ['debug', 'prompt-input', 'noop'], {
      env: { ...process.env, CODEX_HOME: codexHome },
    });
    assert.match(output, /reliable-agent-workflow/);
    assert.match(output, /zero-open-issue|review, repair, and verification|reliable multi-agent/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Grok inspect discovers the installed skill', { skip: !commandAvailable('grok') }, () => {
  const root = makeTempRoot();
  const grokHome = path.join(root, 'grok-home');
  try {
    installFor('grok', { GROK_HOME: grokHome });
    const output = run('grok', ['inspect', '--json'], {
      env: { ...process.env, GROK_HOME: grokHome },
    });
    const data = JSON.parse(output);
    const skill = data.skills.find((item) => item.name === skillName);
    assert.ok(skill, 'grok inspect should list reliable-agent-workflow');
    assert.match(skill.description, /zero-open-issue|reliable multi-agent|independent verification/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Pi skill loader discovers the installed skill', { skip: !commandAvailable('pi') }, async () => {
  const root = makeTempRoot();
  const piAgentDir = path.join(root, 'pi-agent');
  try {
    installFor('pi', { PI_CODING_AGENT_DIR: piAgentDir });
    const piCommand = resolveCommand('pi');
    const piPackageRoot = path.join(path.dirname(piCommand), 'node_modules', '@earendil-works', 'pi-coding-agent');
    const skillsModule = path.join(piPackageRoot, 'dist', 'core', 'skills.js');
    assert.ok(existsSync(skillsModule), `Pi skills module should exist at ${skillsModule}`);
    const { loadSkills } = await import(pathToFileURL(skillsModule).href);
    const result = loadSkills({ cwd: repoRoot, agentDir: piAgentDir, skillPaths: [], includeDefaults: true });
    const skill = result.skills.find((item) => item.name === skillName);
    assert.ok(skill, 'Pi loadSkills should list reliable-agent-workflow');
    assert.match(skill.description, /zero-open-issue|reliable multi-agent|independent verification/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Claude target install works and Claude CLI documents skill resolution', { skip: !commandAvailable('claude') }, () => {
  const root = makeTempRoot();
  const claudeHome = path.join(root, 'claude-home');
  try {
    installFor('claude', { CLAUDE_HOME: claudeHome });
    assert.ok(existsSync(path.join(claudeHome, 'skills', skillName, 'SKILL.md')));
    const help = run('claude', ['--help']);
    assert.match(help, /Skills still resolve|disable.*skills|slash-commands/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
