#!/usr/bin/env node
// Bumps version across in-repo files and (if present) sibling marketplace repos.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const newVersion = process.argv[2];

if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('Usage: node scripts/bump-version.mjs <major.minor.patch>');
  process.exit(1);
}

// In multi-plugin marketplaces (e.g. skillsmith), find the godot-prompter entry by name
// instead of relying on array position — sibling marketplaces may add other plugins.
const PLUGIN_NAME = 'godot-prompter';

const SKILLS_DIR = resolve(ROOT, 'skills');

// Count skill folders (subdirectories of skills/ that contain a SKILL.md) so the manifest
// description strings ("N domain-specific skills") stay in sync with reality. This mirrors how
// validate-skills.mjs enumerates skills. Without this, descriptions drift (e.g. stuck at "48").
function countSkills() {
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(resolve(SKILLS_DIR, d.name, 'SKILL.md')))
    .length;
}

// `descKey` (optional) points at a description string carrying a skill count to keep current.
const inRepoTargets = [
  { path: resolve(ROOT, 'package.json'), key: 'version' },
  { path: resolve(ROOT, '.claude-plugin/plugin.json'), key: 'version', descKey: 'description' },
  { path: resolve(ROOT, '.claude-plugin/marketplace.json'), key: `plugins[name=${PLUGIN_NAME}].version`, descKey: `plugins[name=${PLUGIN_NAME}].description` },
  // Platform-specific manifests — easily missed before v1.7.1 because they live outside .claude-plugin/.
  { path: resolve(ROOT, '.cursor-plugin/plugin.json'), key: 'version', descKey: 'description' },
  { path: resolve(ROOT, 'plugin.json'), key: 'version', descKey: 'description' },
];

// Sibling marketplaces. Tries each candidate path in order; first existing one wins per label.
// skillsmith historically lives at multiple locations across maintainers' machines, so check both.
const siblingTargets = [
  {
    label: 'skillsmith',
    paths: [
      resolve(ROOT, '..', 'skillsmith', '.claude-plugin', 'marketplace.json'),
      resolve(ROOT, '..', '..', 'AI', 'skillsmith', '.claude-plugin', 'marketplace.json'),
    ],
    key: `plugins[name=${PLUGIN_NAME}].version`,
  },
  {
    label: 'godot-prompter-marketplace',
    paths: [
      resolve(ROOT, '..', 'godot-prompter-marketplace', '.claude-plugin', 'marketplace.json'),
    ],
    key: `plugins[name=${PLUGIN_NAME}].version`,
  },
].map(t => ({ ...t, descKey: `plugins[name=${PLUGIN_NAME}].description` }));

const SKILL_COUNT = countSkills();

// Replace the leading number in "<n> [domain-specific ]skill(s)" with the current skill count.
// Returns the new count if the description changed, else null.
function updateDescriptionCount(json, descKey) {
  if (!descKey) return null;
  const desc = getByPath(json, descKey);
  if (typeof desc !== 'string') return null;
  const updated = desc.replace(/\b\d+(\s+(?:domain-specific\s+)?skills?\b)/i, `${SKILL_COUNT}$1`);
  if (updated === desc) return null;
  setByPath(json, descKey, updated);
  return SKILL_COUNT;
}

// Path syntax: "a.b.c" walks objects; "a[name=X].b" finds the array element where .name === X.
// The matchKey accepts hyphens and underscores so keys like "display-name" or "plugin_id" work.
function resolveStep(node, step) {
  const arrayMatch = step.match(/^(.+?)\[([\w-]+)=(.+)\]$/);
  if (arrayMatch) {
    const [, arrayKey, matchKey, matchVal] = arrayMatch;
    const arr = node?.[arrayKey];
    if (!Array.isArray(arr)) return undefined;
    return arr.find(item => item?.[matchKey] === matchVal);
  }
  if (/^\d+$/.test(step)) return node?.[Number(step)];
  return node?.[step];
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, k) => (acc == null ? acc : resolveStep(acc, k)), obj);
}

function setByPath(obj, path, value) {
  const parts = path.split('.');
  const last = parts.pop();
  // The leaf step must be a plain object key (no array selector at the end).
  // Without this guard, a path like "plugins[name=foo]" would silently write
  // a property literally named "plugins[name=foo]" on the root object.
  if (/[\[\]]/.test(last)) {
    throw new Error(`Leaf step '${last}' must be a plain key, not an array selector. Append '.<field>' to the path.`);
  }
  const parent = parts.reduce((acc, k) => resolveStep(acc, k), obj);
  if (parent == null) throw new Error(`Path ${path} did not resolve to a parent`);
  parent[/^\d+$/.test(last) ? Number(last) : last] = value;
}

function bump(target) {
  const json = JSON.parse(readFileSync(target.path, 'utf8'));
  const current = getByPath(json, target.key);
  if (!current) throw new Error(`No version at ${target.key} in ${target.path}`);
  setByPath(json, target.key, newVersion);
  const descUpdated = updateDescriptionCount(json, target.descKey);
  writeFileSync(target.path, JSON.stringify(json, null, 2) + '\n');
  return { current, descUpdated };
}

// Verify in-repo versions are in sync before bumping
const inRepoCurrent = inRepoTargets.map(t => ({ ...t, current: getByPath(JSON.parse(readFileSync(t.path, 'utf8')), t.key) }));
const distinct = [...new Set(inRepoCurrent.map(t => t.current))];
if (distinct.length > 1) {
  console.error('In-repo version drift detected:');
  for (const t of inRepoCurrent) console.error(`  ${t.path}: ${t.current}`);
  console.error('Fix drift before bumping.');
  process.exit(1);
}

console.log(`Bumping ${distinct[0]} -> ${newVersion} (skill count: ${SKILL_COUNT})`);

for (const t of inRepoTargets) {
  const { current: prev, descUpdated } = bump(t);
  console.log(`  ${t.path}: ${prev} -> ${newVersion}${descUpdated ? ` (description synced to ${descUpdated} skills)` : ''}`);
}

for (const t of siblingTargets) {
  const found = t.paths.find(p => existsSync(p));
  if (found) {
    const { current: prev, descUpdated } = bump({ path: found, key: t.key, descKey: t.descKey });
    console.log(`  [${t.label}] ${found}: ${prev} -> ${newVersion}${descUpdated ? ` (description synced to ${descUpdated} skills)` : ''}`);
  } else {
    console.log(`  [${t.label}] not found at any of: ${t.paths.join(', ')} — bump manually after the release tag`);
  }
}

console.log('\nDone. Update CHANGELOG.md, then commit and tag.');
