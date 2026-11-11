import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REFS = join(ROOT, 'skills', 'godot-mentor', 'references');
const NAV = join(REFS, 'editor-navigation.md');
const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

test('editor-navigation.md has every required section', () => {
  assert.ok(existsSync(NAV), 'editor-navigation.md is missing');
  const text = read(NAV);
  for (const h of ['Main screens', 'Docks', 'Bottom panels', 'Project Settings tabs',
                   'Top menus', 'Version notes']) {
    assert.match(text, new RegExp(`^## ${h}$`, 'm'), `missing section "${h}"`);
  }
  assert.match(text, /\]\(\.\.\/SKILL\.md\)/, 'no back-link to SKILL.md');
});

// Editor references are click-paths, not code. A fenced gdscript block here would pull the
// file into C# parity checking and signals that code drifted into the wrong file.
test('editor-navigation.md contains no code fences', () => {
  assert.doesNotMatch(read(NAV), /^```/m);
});

const RECIPES = join(REFS, 'editor-recipes.md');
const DIGEST = join(ROOT, 'docs', 'superpowers', 'notes', '2026-10-05-godot-editor-research.md');

const recipeSections = () => read(RECIPES).split(/^## /m).slice(1)
  .map((s) => ({ title: s.split('\n')[0].trim(), body: s }));

test('editor-recipes.md has exactly 20 recipes, each with steps and an outcome', () => {
  assert.ok(existsSync(RECIPES), 'editor-recipes.md is missing');
  const sections = recipeSections();
  assert.equal(sections.length, 20, `expected 20 recipes, found ${sections.length}`);
  for (const { title, body } of sections) {
    assert.match(body, /^1\. /m, `"${title}" has no numbered steps`);
    assert.match(body, /^\*\*You should see:\*\*/m, `"${title}" has no outcome line`);
  }
  assert.ok(sections.some((s) => s.title === 'Register an autoload'),
    'the autoload recipe is required by the mentor card and TEST_PLAN 5.2');
});

test('editor-recipes.md contains no code fences', () => {
  assert.doesNotMatch(read(RECIPES), /^```/m);
});

// Review Focus 1: a flagged step must cover 4.3-4.8 with no gap, or a learner on the
// uncovered version gets no instruction at all. A flag is a line starting "- **4.x".
const VERSIONS = ['4.3', '4.4', '4.5', '4.6', '4.7', '4.8'];
function covered(flag) {
  const range = flag.match(/^(4\.\d)(?:\s*[-–]\s*(4\.\d)|(\+))?$/);
  assert.ok(range, `unparseable version flag "${flag}"`);
  const from = VERSIONS.indexOf(range[1]);
  const to = range[3] ? VERSIONS.length - 1 : range[2] ? VERSIONS.indexOf(range[2]) : from;
  return VERSIONS.slice(from, to + 1);
}
const FLAG_LINE = /^ {0,6}- \*\*(4\.\d[^*:]*):\*\* \S.*$/;
test('version-flagged alternatives cover 4.3 to 4.8 with no gap or overlap', () => {
  for (const { title, body } of recipeSections()) {
    // Consecutive flag lines form one group of alternatives; any other line ends the group.
    const groups = [];
    let current = null;
    for (const line of body.split('\n')) {
      const m = line.match(FLAG_LINE);
      if (!m) { current = null; continue; }
      if (!current) groups.push(current = []);
      current.push(m[1].trim());
    }
    for (const g of groups) {
      assert.deepEqual(g.flatMap(covered).sort(), VERSIONS,
        `"${title}": flags ${JSON.stringify(g)} do not cover 4.3-4.8 exactly once`);
    }
  }
});

// The coverage test only sees flags written in the one agreed layout. A flag written any other
// way (inline, on the numbered step, wrapped, a `*` bullet) would slip past it with its gap
// undetected, so every bold version in the file must be the start of a flag line.
test('every bold version flag uses the one checked layout', () => {
  for (const line of read(RECIPES).split('\n')) {
    if (!/\*\*4\.\d/.test(line)) continue;
    assert.match(line, FLAG_LINE, `off-format version flag: "${line.trim()}"`);
    assert.equal(line.match(/\*\*4\.\d/g).length, 1, `two flags on one line: "${line.trim()}"`);
  }
});

// Every recipe must trace to the digest, so the next author can see what was verified.
test('every recipe title appears in the research digest', () => {
  const digest = read(DIGEST);
  for (const { title } of recipeSections()) {
    assert.ok(digest.includes(title), `digest does not mention recipe "${title}"`);
  }
});

const SKILL = join(ROOT, 'skills', 'godot-mentor', 'SKILL.md');
const card = () => {
  const t = read(SKILL);
  return t.slice(t.indexOf('<!-- MENTOR-CARD-START -->'), t.indexOf('<!-- MENTOR-CARD-END -->'));
};

// The hook injects the card alone, without the SKILL.md body. Whatever the agent needs in
// order to find the references and to refuse an uncovered path has to be inside the card.
test('mentor card points at both references and keeps the refusal', () => {
  const c = card();
  // After /clear the agent holds the card but not the skill's directory, so a bare relative path
  // is unresolvable. The card must say which skill to invoke to reach the references.
  assert.match(c, /invoke `godot-prompter:godot-mentor`/);
  assert.match(c, /references\/editor-recipes\.md/);
  assert.match(c, /references\/editor-navigation\.md/);
  assert.match(c, /name the panel only if `editor-navigation\.md` lists it/, 'Review Focus 2: no fallback for uncovered paths');
  assert.match(c, /not\s+covered, and stop/);
  assert.match(c, /never from memory/, 'the prohibition itself is gone');
  assert.match(c, /anything they\s+click, press, or read on screen/, 'the gate no longer covers every on-screen label');
  assert.match(c, /keyboard shortcut/);
  assert.doesNotMatch(c, /Editor beat boundary \(v1\.13\.0\)/, 'old boundary paragraph still present');
  assert.ok(Buffer.byteLength(c, 'utf8') < 3072, 'card over the 3 KB cap');
});

// The two references link to each other and back to SKILL.md; a renamed or moved file would
// leave a learner-facing pointer aimed at nothing.
test('relative Markdown links in both references resolve to existing files', () => {
  for (const file of [NAV, RECIPES]) {
    const targets = [...read(file).matchAll(/\]\(([^)#\s]+\.md)(?:#[^)]*)?\)/g)].map((m) => m[1])
      .filter((t) => !/^[a-z][a-z0-9+.-]*:/i.test(t));
    assert.ok(targets.length > 0, `${file} has no relative links to check`);
    for (const t of targets) {
      assert.ok(existsSync(resolve(dirname(file), t)), `${file}: link target "${t}" does not exist`);
    }
  }
});

test('SKILL.md section 7 says click-paths are allowed only from the references', () => {
  const t = read(SKILL);
  assert.match(t, /\]\(references\/editor-recipes\.md\)/);
  assert.match(t, /\]\(references\/editor-navigation\.md\)/);
  assert.match(t, /only ones copied from these two files/);
});

test('no-menu-paths graders are identical across the five mentor cases', () => {
  const dirs = ['01-teach-double-dash', '02-guide-health-bar', '03-understand-signals',
                '04-learning-3d-pickup', '05-csharp-learner-save'];
  const bodies = dirs.map((d) => read(join(ROOT, 'evals', d, 'graders', 'no-menu-paths.md')));
  for (const b of bodies) assert.equal(b, bodies[0]);
  assert.match(bodies[0], /^type: llm$/m, 'grader is still the blanket regex');
});
