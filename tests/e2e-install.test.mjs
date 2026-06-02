import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const installScript = path.join(repoRoot, 'scripts', 'install.mjs');
const skillName = 'reliable-agent-workflow';

function makeTempHome() {
  return mkdtempSync(path.join(tmpdir(), 'raw-skill-e2e-'));
}

function runInstall(args, options = {}) {
  return execFileSync(process.execPath, [installScript, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options,
  });
}

function runNpm(args, options = {}) {
  if (process.env.npm_execpath && existsSync(process.env.npm_execpath)) {
    return execFileSync(process.execPath, [process.env.npm_execpath, ...args], {
      cwd: repoRoot,
      encoding: 'utf8',
      ...options,
    });
  }
  if (process.platform === 'win32') {
    return execFileSync('cmd.exe', ['/c', 'npm', ...args], {
      cwd: repoRoot,
      encoding: 'utf8',
      ...options,
    });
  }
  return execFileSync('npm', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    ...options,
  });
}

function assertInstalled(home, agent) {
  const bases = {
    codex: path.join(home, '.codex', 'skills', skillName),
    claude: path.join(home, '.claude', 'skills', skillName),
    grok: path.join(home, '.grok', 'skills', skillName),
    pi: path.join(home, '.pi', 'agent', 'skills', skillName),
  };
  const skillDir = bases[agent];
  assert.ok(existsSync(path.join(skillDir, 'SKILL.md')), `${agent} SKILL.md should be installed`);
  const markdown = readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
  assert.match(markdown, /name: reliable-agent-workflow/);
}

test('installer installs the skill into Codex, Claude, Grok, and Pi target directories', () => {
  const home = makeTempHome();
  try {
    const output = runInstall(['--home', home, '--agents', 'all', '--force']);
    for (const agent of ['codex', 'claude', 'grok', 'pi']) {
      assert.match(output, new RegExp(`Installed ${skillName} for ${agent}`));
      assertInstalled(home, agent);
    }
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('installer dry-run prints targets without writing', () => {
  const home = makeTempHome();
  try {
    const output = runInstall(['--home', home, '--agent', 'all', '--dry-run']);
    assert.match(output, /codex:/);
    assert.match(output, /claude:/);
    assert.match(output, /grok:/);
    assert.match(output, /pi:/);
    assert.equal(existsSync(path.join(home, '.codex')), false);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('installer refuses to overwrite without --force', () => {
  const home = makeTempHome();
  try {
    runInstall(['--home', home, '--agent', 'codex']);
    assert.throws(
      () => runInstall(['--home', home, '--agent', 'codex'], { stdio: 'pipe' }),
      /target already exists/,
    );
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('installer supports explicit target-dir for one agent', () => {
  const home = makeTempHome();
  const target = path.join(home, 'custom-skills');
  try {
    runInstall(['--agent', 'codex', '--target-dir', target]);
    assert.ok(existsSync(path.join(target, skillName, 'SKILL.md')));
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('installer rejects symlinks inside a user-provided source tree', (t) => {
  const home = makeTempHome();
  const source = path.join(home, 'source-skill');
  const outsideFile = path.join(home, 'outside-secret.txt');
  const outsideDir = path.join(home, 'outside-dir');
  try {
    mkdirSync(source, { recursive: true });
    writeFileSync(path.join(source, 'SKILL.md'), '---\nname: source-skill\ndescription: Test skill for symlink rejection. Use when testing.\n---\n\n# Source Skill\n');
    writeFileSync(outsideFile, 'do not copy');

    try {
      symlinkSync(outsideFile, path.join(source, 'leak.txt'));
    } catch {
      try {
        mkdirSync(outsideDir);
        symlinkSync(outsideDir, path.join(source, 'leak-dir'), process.platform === 'win32' ? 'junction' : 'dir');
      } catch {
        t.skip('symlink creation is not available in this environment');
        return;
      }
    }

    assert.throws(
      () => runInstall(['--agent', 'codex', '--target-dir', path.join(home, 'target'), '--source', source], { stdio: 'pipe' }),
      /Refusing to install source containing symlink/,
    );
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('published npm bin installs using the package default source', () => {
  const home = makeTempHome();
  try {
    const packOutput = runNpm(['pack', '--json', '--pack-destination', home]);
    const [{ filename }] = JSON.parse(packOutput);
    const tarball = path.join(home, filename);
    const prefix = path.join(home, 'prefix');
    runNpm(['install', '--prefix', prefix, tarball], { stdio: 'pipe' });

    const bin = path.join(
      prefix,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'install-reliable-agent-workflow.cmd' : 'install-reliable-agent-workflow',
    );
    if (process.platform === 'win32') {
      execFileSync('cmd.exe', ['/c', bin, '--agent', 'codex', '--home', home, '--force'], { encoding: 'utf8' });
    } else {
      execFileSync(bin, ['--agent', 'codex', '--home', home, '--force'], { encoding: 'utf8' });
    }
    assertInstalled(home, 'codex');
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
