#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

function usage() {
  console.error('Usage: node scripts/validate-skill.mjs <skill-dir>');
  process.exit(2);
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) throw new Error('SKILL.md must start with YAML frontmatter delimited by ---');

  const frontmatter = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) throw new Error(`Unsupported frontmatter line: ${rawLine}`);
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }

  return { frontmatter, body: markdown.slice(match[0].length) };
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

function validateSkill(skillDir) {
  const errors = [];
  const skillPath = path.join(skillDir, 'SKILL.md');
  assert(existsSync(skillPath), `Missing SKILL.md at ${skillPath}`, errors);
  if (errors.length) return errors;

  const markdown = readFileSync(skillPath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(markdown);
  const keys = Object.keys(frontmatter);

  assert(keys.includes('name'), 'Frontmatter missing required name', errors);
  assert(keys.includes('description'), 'Frontmatter missing required description', errors);
  assert(keys.every((key) => ['name', 'description'].includes(key)), `Frontmatter should only contain name and description for maximum Codex/Pi/Claude/Grok compatibility; found: ${keys.join(', ')}`, errors);

  const name = frontmatter.name || '';
  const description = frontmatter.description || '';
  assert(/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(name), `Invalid skill name: ${name}`, errors);
  assert(!name.includes('--'), 'Skill name must not contain consecutive hyphens', errors);
  assert(description.length > 80, 'Description should be specific enough to trigger correctly', errors);
  assert(description.length <= 1024, 'Description must be <= 1024 characters', errors);
  assert(/Use (for|when)/.test(description), 'Description should include explicit use/trigger guidance', errors);
  assert(!/\[TODO\]|TODO:/i.test(markdown), 'Skill must not contain TODO placeholders', errors);

  const lower = body.toLowerCase();
  const requiredBodyNeedles = [
    '# reliable agent workflow',
    'core contract',
    'harness adapter',
    'loop until zero open issues',
    'persistent artifacts',
    'phase 1: requirements and design',
    'phase 2: implementation',
    'phase 3: review and repair loop',
    'phase 4: independent verification',
    'verdict: pass',
    'verdict: fail',
    'memory capture',
    'best-of-n variant',
    'compaction and resume rules',
    'hard stop conditions',
  ];
  for (const needle of requiredBodyNeedles) {
    assert(lower.includes(needle), `Body missing required workflow concept: ${needle}`, errors);
  }

  const agentNames = ['codex', 'claude', 'grok', 'pi'];
  for (const agent of agentNames) {
    assert(lower.includes(agent), `Body should mention ${agent} compatibility`, errors);
  }

  const openaiYaml = path.join(skillDir, 'agents', 'openai.yaml');
  if (existsSync(openaiYaml)) {
    const yaml = readFileSync(openaiYaml, 'utf8');
    assert(yaml.includes('display_name:'), 'agents/openai.yaml missing interface.display_name', errors);
    assert(yaml.includes('short_description:'), 'agents/openai.yaml missing interface.short_description', errors);
    assert(yaml.includes(`$${name}`), `agents/openai.yaml default_prompt should mention $${name}`, errors);
  }

  return errors;
}

const skillDirArg = process.argv[2];
if (!skillDirArg) usage();
const skillDir = path.resolve(skillDirArg);

try {
  const errors = validateSkill(skillDir);
  if (errors.length) {
    console.error(`Skill validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`Skill validation passed: ${skillDir}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
