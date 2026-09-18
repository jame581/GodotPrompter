#!/usr/bin/env node
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './lib/frontmatter.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SKILLS_DIR = join(ROOT, 'skills');
const AGENTS_DIR = join(ROOT, 'agents');
const OUT = join(SKILLS_DIR, 'index.json');
const args = new Set(process.argv.slice(2));
const writeMode = args.has('--write');
const checkMode = args.has('--check') || !writeMode;

function listFiles(dir, predicate) {
  return readdirSync(dir)
    .filter(name => predicate(name, join(dir, name)))
    .sort();
}

function extractTitle(body) {
  return body.match(/^#\s+(.+)$/m)?.[1] ?? null;
}

function extractRelatedSkills(body) {
  const line = body.match(/^\s*>\s*\*\*Related skills:\*\*([^\n]+)/m)?.[1] ?? '';
  return [...line.matchAll(/\*\*([a-z][a-z0-9-]+)\*\*/g)].map(match => match[1]);
}

function extractAddonLine(body) {
  return body.match(/^\s*>\s*\*\*Addon:\*\*\s*(.+)$/m)?.[1] ?? null;
}

function buildIndex() {
  const skillDirs = listFiles(SKILLS_DIR, (_, fullPath) => statSync(fullPath).isDirectory() && existsSync(join(fullPath, 'SKILL.md')));
  const skills = skillDirs.map(name => {
    const skillPath = join(SKILLS_DIR, name, 'SKILL.md');
    const content = readFileSync(skillPath, 'utf8');
    const { data, body } = parseFrontmatter(content);
    const refsDir = join(SKILLS_DIR, name, 'references');
    const references = existsSync(refsDir)
      ? listFiles(refsDir, (_, fullPath) => statSync(fullPath).isFile() && fullPath.endsWith('.md')).map(file => `skills/${name}/references/${file}`)
      : [];
    return {
      name,
      title: extractTitle(body),
      description: data.description,
      relatedSkills: extractRelatedSkills(body),
      addon: extractAddonLine(body),
      references,
      source: `skills/${name}/SKILL.md`,
    };
  });

  const agents = listFiles(AGENTS_DIR, name => name.endsWith('.md')).map(file => {
    const content = readFileSync(join(AGENTS_DIR, file), 'utf8');
    const { data } = parseFrontmatter(content);
    return {
      name: data.name,
      description: data.description,
      source: `agents/${file}`,
      codexMirror: `.codex/agents/godot-prompter/${file.replace(/\.md$/, '.toml')}`,
    };
  });

  return {
    schemaVersion: 1,
    generatedBy: 'scripts/generate-skill-index.mjs',
    summary: {
      skillCount: skills.length,
      agentCount: agents.length,
    },
    skills,
    agents,
  };
}

const rendered = `${JSON.stringify(buildIndex(), null, 2)}\n`;
const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;

if (writeMode && current !== rendered) {
  mkdirSync(SKILLS_DIR, { recursive: true });
  writeFileSync(OUT, rendered);
  console.log(`wrote skills/index.json`);
}

if (checkMode) {
  if (current !== rendered) {
    console.error('skills/index.json is out of date. Run: node scripts/generate-skill-index.mjs --write');
    process.exit(1);
  }
  console.log('skills/index.json is up to date.');
}
