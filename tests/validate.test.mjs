import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillDir = path.join(repoRoot, 'reliable-agent-workflow');

test('skill validates against local compatibility rules', () => {
  const output = execFileSync(process.execPath, ['scripts/validate-skill.mjs', 'reliable-agent-workflow'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.match(output, /Skill validation passed/);
});

test('skill frontmatter stays compatible with Codex/Pi/Claude/Grok', () => {
  const markdown = readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(match, 'frontmatter must exist');
  const keys = match[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(':')[0]);
  assert.deepEqual(keys.sort(), ['description', 'name']);
  assert.match(match[1], /name: reliable-agent-workflow/);
});

test('skill encodes required reliability patterns from the source note', () => {
  const markdown = readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8').toLowerCase();
  const required = [
    'orchestrate first',
    'persistent artifacts',
    'loop until zero open issues',
    'verify independently',
    'harness adapter',
    'role-specific model routing',
    'gpt-series',
    'model_reasoning_effort',
    'subagents.agentoverrides',
    'grok inspect',
    'grok:',
    'pi:',
    'claude code:',
    'codex:',
    'phase 1: requirements and design',
    'phase 3: review and repair loop',
    'phase 4: independent verification',
    'memory capture',
    'best-of-n variant',
    'compaction and resume rules',
    'hard stop conditions',
  ];
  for (const needle of required) {
    assert.ok(markdown.includes(needle), `missing pattern: ${needle}`);
  }
});
