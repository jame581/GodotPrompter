#!/usr/bin/env node
// Rewrites the skill and agent counts in the skillsmith and godot-prompter-marketplace READMEs.
// Each README marks its counts with <!-- godot-prompter-skills -->N<!-- /godot-prompter-skills -->
// and the same pair for godot-prompter-agents. Run by release.yml's marketplace PR steps and by
// bump-version.mjs for local sibling clones, so the READMEs stop drifting (they sat at 41/44 skills
// while the manifests said 56).
//
// Usage: node scripts/sync-marketplace-readme.mjs <README.md>...
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

// Mirrors validate-skills.mjs: a skill is a skills/ subdirectory holding a SKILL.md.
export function countSkills(root = ROOT) {
  const dir = resolve(root, 'skills');
  return readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(resolve(dir, d.name, 'SKILL.md')))
    .length;
}

export function countAgents(root = ROOT) {
  return readdirSync(resolve(root, 'agents')).filter(f => f.endsWith('.md')).length;
}

// Returns { text, found } where found lists the marker names present in the input.
export function syncCounts(text, counts) {
  const found = [];
  for (const [name, value] of Object.entries(counts)) {
    const re = new RegExp(`(<!-- godot-prompter-${name} -->)\\d+(<!-- /godot-prompter-${name} -->)`, 'g');
    if (re.test(text)) found.push(name);
    text = text.replace(re, `$1${value}$2`);
  }
  return { text, found };
}

export function syncReadme(path, counts = { skills: countSkills(), agents: countAgents() }) {
  const before = readFileSync(path, 'utf8');
  const { text, found } = syncCounts(before, counts);
  if (text !== before) writeFileSync(path, text);
  return { changed: text !== before, found };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    console.error('Usage: node scripts/sync-marketplace-readme.mjs <README.md>...');
    process.exit(1);
  }
  const counts = { skills: countSkills(), agents: countAgents() };
  for (const p of paths) {
    const { changed, found } = syncReadme(p, counts);
    if (found.length === 0) {
      console.warn(`::warning::${p} has no godot-prompter count markers — counts not updated`);
    } else {
      console.log(`${p}: ${changed ? 'updated' : 'already current'} (${counts.skills} skills, ${counts.agents} agents)`);
    }
  }
}
