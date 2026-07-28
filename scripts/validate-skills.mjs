#!/usr/bin/env node
// Validates skills/*/SKILL.md and agents/*.md for structure and resolvable cross-references.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SKILLS_DIR = join(ROOT, 'skills');
const AGENTS_DIR = join(ROOT, 'agents');

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const includeFixtures = args.includes('--include-fixtures');

// Token-budget rule: skills must keep SKILL.md under 16 KB (error — fails CI).
// An advisory warning fires at >= 15.5 KB so authors get a signal before the hard wall.
// References (skills/<name>/references/*.md) are unrestricted because they only load on demand.
const TOKEN_BUDGET_BYTES = 16 * 1024;
const TOKEN_BUDGET_APPROACHING_BYTES = 15.5 * 1024;

// Skills that are intentionally GDScript-only by design. Their sections still emit
// a `csharp-parity-accepted` warning (so the count is visible) but do NOT count as
// deferred parity debt.
// 'beehave' is a GDScript-only addon (no official C# API), so its sections are accepted, not debt.
const GDSCRIPT_ONLY_BY_DESIGN = new Set(['gdscript-patterns', 'gdscript-advanced', 'beehave', 'popochiu']);

// Card rule: the SessionStart hook injects the region delimited by
// <!-- <NAME>-START --> / <!-- <NAME>-END --> from these skills. The region is a slice of the
// skill itself (never a copy) so it cannot drift. It is injected on every session start AND
// every compaction, so it is capped.
const CARD_BUDGET_BYTES = 3 * 1024;
const CARD_SPECS = [
  { skill: 'using-godot-prompter', marker: 'SESSION-CARD' },
  { skill: 'godot-mentor', marker: 'MENTOR-CARD' },
];

const errors = [];
const warnings = [];

function record(list, file, rule, message) {
  list.push({ file: file.replace(ROOT + (process.platform === 'win32' ? '\\' : '/'), '').replace(/\\/g, '/'), rule, message });
}

// Minimal YAML frontmatter parser — handles flat key: value pairs and `key: |` block scalars.
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return { data: null, body: content };
  const block = match[1];
  const data = {};
  const lines = block.split(/\r?\n/);
  let currentKey = null;
  let blockBuffer = [];
  for (const line of lines) {
    const blockStart = line.match(/^([a-zA-Z_-]+):\s*\|\s*$/);
    const flat = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (blockStart) {
      if (currentKey) data[currentKey] = blockBuffer.join('\n').trim();
      currentKey = blockStart[1];
      blockBuffer = [];
    } else if (currentKey && /^\s+/.test(line)) {
      blockBuffer.push(line.replace(/^\s+/, ''));
    } else if (flat) {
      if (currentKey) { data[currentKey] = blockBuffer.join('\n').trim(); currentKey = null; blockBuffer = []; }
      data[flat[1]] = flat[2].trim();
    }
  }
  if (currentKey) data[currentKey] = blockBuffer.join('\n').trim();
  return { data, body: content.slice(match[0].length) };
}

function listSkills() {
  return readdirSync(SKILLS_DIR)
    .filter(name => statSync(join(SKILLS_DIR, name)).isDirectory())
    .map(name => ({ name, path: join(SKILLS_DIR, name, 'SKILL.md') }))
    .filter(s => existsSync(s.path));
}

const skillNames = new Set(listSkills().map(s => s.name));

// Cross-reference detection sources:
//   1. The "Related skills" line — extract every **name** between the colon and the period.
//   2. Phrases of the form `see **<name>** skill` or `(see **<name>** skill)` anywhere in the body.
// Bare **emphasis** elsewhere is intentionally NOT parsed (too noisy — e.g., **collision_mask**).
function extractCrossRefs(body) {
  const refs = [];
  const relatedLine = body.match(/^\s*>\s*\*\*Related skills:\*\*([^\n]+)/m);
  if (relatedLine) {
    for (const m of relatedLine[1].matchAll(/\*\*([a-z][a-z0-9-]+)\*\*/g)) {
      refs.push({ name: m[1], context: 'related-skills-line' });
    }
  }
  for (const m of body.matchAll(/\(?\s*see\s+\*\*([a-z][a-z0-9-]+)\*\*\s+skill\s*\)?/gi)) {
    refs.push({ name: m[1], context: 'see-X-skill' });
  }
  return refs;
}

function validateSkill({ name, path }) {
  const content = readFileSync(path, 'utf8');
  const { data, body } = parseFrontmatter(content);

  if (!data) {
    record(errors, path, 'frontmatter-missing', 'No YAML frontmatter found');
    return;
  }
  if (!data.name) record(errors, path, 'frontmatter-name-missing', 'Frontmatter missing required key: name');
  if (!data.description) record(errors, path, 'frontmatter-description-missing', 'Frontmatter missing required key: description');
  if (data.name && data.name !== name) record(errors, path, 'frontmatter-name-mismatch', `Frontmatter name "${data.name}" does not match folder name "${name}"`);

  // Cross-references must resolve
  const refs = extractCrossRefs(body);
  for (const ref of refs) {
    if (!skillNames.has(ref.name)) {
      record(errors, path, 'cross-ref-broken', `Cross-reference "${ref.name}" (${ref.context}) does not match any skill folder`);
    }
  }

  // Warning: missing "Related skills" line in the expected position (after H1, before first numbered section)
  const headerMatch = body.match(/^#\s+[^\n]+\n([\s\S]*?)^##\s+/m);
  if (headerMatch && !headerMatch[1].includes('**Related skills:**')) {
    record(warnings, path, 'related-skills-line-missing', 'No "**Related skills:**" line found between H1 and first numbered section');
  }

  // Warning: GDScript blocks without paired C# blocks in the same numbered section.
  // Mask `## ...` lines that occur INSIDE fenced code blocks (e.g., GDScript doc-comments)
  // before splitting, so they aren't treated as section boundaries.
  const lines = body.split('\n');
  let inFence = false;
  const masked = lines.map(line => {
    if (/^```/.test(line)) inFence = !inFence;
    return inFence && /^##\s+/.test(line) ? '__MASKED_FENCE_HEADER__' : line;
  }).join('\n');
  const sections = masked.split(/^##\s+/m).slice(1);
  // Determine whether this skill is on the gdscript-only-by-design allowlist.
  // The skill name is the parent folder name of SKILL.md.
  const skillName = path.split(/[\\/]/).slice(-2, -1)[0];
  const isGdscriptOnly = GDSCRIPT_ONLY_BY_DESIGN.has(skillName);

  for (const section of sections) {
    const hasGd = /```gdscript[\s\S]*?```/m.test(section);
    const hasCs = /```csharp[\s\S]*?```/m.test(section);
    if (hasGd && !hasCs) {
      const sectionTitle = section.split('\n', 1)[0].slice(0, 60);
      const rule = isGdscriptOnly ? 'csharp-parity-accepted' : 'csharp-parity-missing';
      const msg = isGdscriptOnly
        ? `Section "${sectionTitle}" is GDScript-only by design (allowlisted skill)`
        : `Section "${sectionTitle}" has GDScript but no C# block`;
      record(warnings, path, rule, msg);
    }
  }

  // Warning: implementation checklist at end (look for `- [ ]` within the last ~40 lines)
  const tail = body.split('\n').slice(-40).join('\n');
  if (!/-\s*\[\s*\]/.test(tail)) {
    record(warnings, path, 'checklist-missing', 'No implementation checklist (`- [ ]` items) found near end of file');
  }

  // Token-budget rule: error at >= 16 KB (fails CI), advisory warning at >= 15.5 KB.
  // Measured on LF-normalized bytes so Windows (CRLF) checkouts match CI — see v1.10.1 CRLF caveat.
  // Restructure long skills using Pattern X (core SKILL.md + references/<topic>.md).
  const sizeBytes = Buffer.byteLength(content.replace(/\r\n/g, '\n'), 'utf8');
  const kb = (sizeBytes / 1024).toFixed(1);
  if (sizeBytes >= TOKEN_BUDGET_BYTES) {
    record(errors, path, 'token-budget-exceeded', `SKILL.md is ${kb} KB (budget: ${TOKEN_BUDGET_BYTES / 1024} KB) — split into references/*.md (Pattern X)`);
  } else if (sizeBytes >= TOKEN_BUDGET_APPROACHING_BYTES) {
    record(warnings, path, 'token-budget-approaching', `SKILL.md is ${kb} KB (>= ${TOKEN_BUDGET_APPROACHING_BYTES / 1024} KB) — approaching the ${TOKEN_BUDGET_BYTES / 1024} KB budget`);
  }
}

function validateAgent(path) {
  const content = readFileSync(path, 'utf8');
  const { data, body } = parseFrontmatter(content);
  if (!data) {
    record(errors, path, 'agent-frontmatter-missing', 'No YAML frontmatter found');
    return;
  }
  if (!data.name) record(errors, path, 'agent-frontmatter-name-missing', 'Frontmatter missing required key: name');
  if (!data.description) record(errors, path, 'agent-frontmatter-description-missing', 'Frontmatter missing required key: description');

  // Cross-references in agents (look for `skills/<name>/SKILL.md` paths and **name** mentions in skill lists)
  for (const m of body.matchAll(/skills\/([a-z][a-z0-9-]+)\/SKILL\.md/g)) {
    if (!skillNames.has(m[1])) {
      record(errors, path, 'agent-skill-path-broken', `Agent references skills/${m[1]}/SKILL.md but no such skill exists`);
    }
  }
}

function validateCard(path, markerName, budgetBytes) {
  const content = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  const start = `<!-- ${markerName}-START -->`;
  const end = `<!-- ${markerName}-END -->`;
  const si = content.indexOf(start);
  const ei = content.indexOf(end);

  if (si === -1 || ei === -1) {
    const missing = [si === -1 ? start : null, ei === -1 ? end : null].filter(Boolean).join(' and ');
    record(errors, path, 'card-marker-missing', `Missing ${missing} — the SessionStart hook injects this region`);
    return;
  }
  if (ei < si) {
    record(errors, path, 'card-marker-malformed', `${end} appears before ${start}`);
    return;
  }
  // The hook extracts the FIRST region only. A second pair — e.g. a fenced example documenting
  // the markers above the real card — would silently become the injected payload.
  if (content.indexOf(start, si + start.length) !== -1 || content.indexOf(end, ei + end.length) !== -1) {
    record(errors, path, 'card-marker-duplicate', `${markerName} markers appear more than once — the hook extracts the first region only`);
    return;
  }
  const raw = content.slice(si + start.length, ei);
  if (raw.trim().length === 0) {
    record(errors, path, 'card-empty', `Region between ${start} and ${end} is empty — the hook would inject nothing`);
    return;
  }
  // Measure what the hook ACTUALLY injects, not a trimmed view of it. hooks/session-start emits
  // every line strictly between the markers, each with its newline — blank padding lines included.
  // Trimming here would under-count the payload and let an oversized card past CI.
  const injected = raw.replace(/^\r?\n/, '');
  const bytes = Buffer.byteLength(injected, 'utf8');
  if (bytes > budgetBytes) {
    record(errors, path, 'card-oversized', `${markerName} region is ${(bytes / 1024).toFixed(1)} KB (cap: ${budgetBytes / 1024} KB) — it is injected on every session start and compaction`);
  }
}

// Run
const targets = listSkills();
if (includeFixtures) {
  const fixturesDir = join(ROOT, 'scripts', 'fixtures');
  if (existsSync(fixturesDir)) {
    for (const name of readdirSync(fixturesDir)) {
      const path = join(fixturesDir, name, 'SKILL.md');
      if (existsSync(path)) targets.push({ name, path });
    }
  }
}
for (const t of targets) validateSkill(t);

// Card regions injected by the SessionStart hook.
for (const spec of CARD_SPECS) {
  const cardPath = join(SKILLS_DIR, spec.skill, 'SKILL.md');
  if (!existsSync(cardPath)) {
    record(errors, cardPath, 'card-skill-missing', `CARD_SPECS names skills/${spec.skill} but no SKILL.md exists there`);
    continue;
  }
  validateCard(cardPath, spec.marker, CARD_BUDGET_BYTES);
}
if (includeFixtures) {
  const cardFixtures = join(ROOT, 'scripts', 'fixtures');
  if (existsSync(cardFixtures)) {
    for (const name of readdirSync(cardFixtures).filter(n => n.startsWith('session-card-'))) {
      const cardPath = join(cardFixtures, name, 'SKILL.md');
      if (existsSync(cardPath)) validateCard(cardPath, 'SESSION-CARD', CARD_BUDGET_BYTES);
    }
  }
}

// Orphan-reference check: every skills/<name>/references/*.md must be linked from its parent SKILL.md.
function validateOrphanReferences() {
  for (const t of targets) {
    const skillDir = t.path.replace(/[\\/]SKILL\.md$/, '');
    const refsDir = join(skillDir, 'references');
    if (!existsSync(refsDir)) continue;
    const skillContent = readFileSync(t.path, 'utf8');
    for (const ref of readdirSync(refsDir).filter(n => n.endsWith('.md'))) {
      // Look for a relative link from SKILL.md to the reference file.
      // Accept both `references/<file>.md` and `./references/<file>.md`.
      const pattern = new RegExp(`references[\\\\/]${ref.replace('.', '\\.')}`);
      if (!pattern.test(skillContent)) {
        record(warnings, join(refsDir, ref), 'orphan-reference', `References file is not linked from skills/${t.name}/SKILL.md`);
      }
    }
  }
}
validateOrphanReferences();

if (existsSync(AGENTS_DIR)) {
  for (const name of readdirSync(AGENTS_DIR).filter(n => n.endsWith('.md'))) {
    validateAgent(join(AGENTS_DIR, name));
  }
}

if (jsonMode) {
  console.log(JSON.stringify({ errors, warnings, summary: { errors: errors.length, warnings: warnings.length } }, null, 2));
} else {
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`OK — ${targets.length} skills + agents/, no issues.`);
  } else {
    if (errors.length) {
      console.log(`\nERRORS (${errors.length}):`);
      for (const e of errors) console.log(`  [${e.rule}] ${e.file}: ${e.message}`);
    }
    if (warnings.length) {
      console.log(`\nWARNINGS (${warnings.length}):`);
      for (const w of warnings) console.log(`  [${w.rule}] ${w.file}: ${w.message}`);
    }
    console.log(`\n${errors.length} error(s), ${warnings.length} warning(s).`);
  }
}

process.exit(errors.length > 0 ? 1 : 0);
