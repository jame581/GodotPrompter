// Tests for the per-section C#-parity exemption marker in scripts/validate-skills.mjs.
//
// This rule can FAIL CI: a marker with no reason is recorded as an error, and the validator exits
// non-zero on any error, which blocks the release workflow. It had no coverage at all when it
// landed, so these drive the real script over fixture skills in a temp directory rather than
// re-implementing the regex.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPT = join(ROOT, 'scripts', 'validate-skills.mjs');

const GD = '```gdscript\nvar x := 1\n```';
const CS = '```csharp\nint x = 1;\n```';

// Build a throwaway repo with one skill, run the real validator against it, return its output.
// The validator resolves paths from its own location, so the fixture mirrors the repo layout and
// the script is copied in beside a scripts/ dir.
// CARD_SPECS hard-codes two skill names and errors if they are absent, so the fixture repo has to
// carry stubs for them or every run exits 1 for reasons unrelated to parity.
function writeCardStub(dir, name, marker) {
  const d = join(dir, 'skills', name);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'SKILL.md'), [
    '---', `name: ${name}`, `description: Use when stubbing ${name} for validator tests.`, '---',
    '', `# ${name}`, '', '**Related skills:** none.', '',
    '## Card', '', `<!-- ${marker}-START -->`, `Stub ${marker} region.`, `<!-- ${marker}-END -->`,
    '', '## Checklist', '', '- [ ] done', '',
  ].join('\n'));
}

function runValidator({ skillBody = '', referenceBody = null }) {
  const dir = mkdtempSync(join(tmpdir(), 'gp-val-'));
  const skillDir = join(dir, 'skills', 'fixture-skill');
  mkdirSync(skillDir, { recursive: true });
  mkdirSync(join(dir, 'scripts'), { recursive: true });
  cpSync(SCRIPT, join(dir, 'scripts', 'validate-skills.mjs'));
  writeCardStub(dir, 'using-godot-prompter', 'SESSION-CARD');
  writeCardStub(dir, 'godot-mentor', 'MENTOR-CARD');

  writeFileSync(join(skillDir, 'SKILL.md'), [
    '---', 'name: fixture-skill', 'description: Use when testing the validator — fixture.', '---',
    '', '# Fixture Skill', '', '**Related skills:** none.', '',
    skillBody, '', '## Checklist', '', '- [ ] done', '',
  ].join('\n'));

  if (referenceBody !== null) {
    mkdirSync(join(skillDir, 'references'), { recursive: true });
    writeFileSync(join(skillDir, 'references', 'topic.md'), `# Topic\n\n${referenceBody}\n`);
    // Linked from SKILL.md, or orphan-reference fires and muddies the output.
    writeFileSync(join(skillDir, 'SKILL.md'), [
      '---', 'name: fixture-skill', 'description: Use when testing the validator — fixture.', '---',
      '', '# Fixture Skill', '', '**Related skills:** none.', '',
      'See [Topic](references/topic.md).', '', skillBody, '', '## Checklist', '', '- [ ] done', '',
    ].join('\n'));
  }

  let stdout = '';
  let code = 0;
  try {
    stdout = execFileSync(process.execPath, [join(dir, 'scripts', 'validate-skills.mjs')],
      { cwd: dir, encoding: 'utf8' });
  } catch (e) {
    stdout = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    code = e.status ?? 1;
  }
  rmSync(dir, { recursive: true, force: true });
  return { stdout, code };
}

const MARKER = reason => `<!-- csharp-parity: n/a — ${reason} -->`;

test('a reasoned marker suppresses the missing-C# warning in a reference', () => {
  const { stdout, code } = runValidator({
    referenceBody: `## Only GDScript\n\n${MARKER('no C# counterpart exists')}\n\n${GD}`,
  });
  assert.doesNotMatch(stdout, /csharp-parity-missing-reference/);
  assert.match(stdout, /GDScript-only by design: no C# counterpart exists/);
  assert.equal(code, 0);
});

test('a reasoned marker also works in SKILL.md, as CLAUDE.md documents', () => {
  const { stdout } = runValidator({
    skillBody: `## Only GDScript\n\n${MARKER('GDScript-specific idiom')}\n\n${GD}`,
  });
  assert.doesNotMatch(stdout, /csharp-parity-missing\b/);
  assert.match(stdout, /GDScript-only by design: GDScript-specific idiom/);
});

test('a marker with no reason is an error and fails the run', () => {
  for (const bad of ['<!-- csharp-parity: n/a -->', '<!-- csharp-parity: n/a — -->', '<!-- csharp-parity: n/a-->']) {
    const { stdout, code } = runValidator({ referenceBody: `## S\n\n${bad}\n\n${GD}` });
    assert.match(stdout, /csharp-parity-exempt-no-reason/, `expected an error for ${bad}`);
    assert.equal(code, 1, `validator must exit non-zero for ${bad}`);
  }
});

// Otherwise a reasonless marker lurks on a section that has C# today and only breaks CI later,
// when someone edits that section.
test('a reasonless marker is caught even when the section already has C#', () => {
  const { stdout, code } = runValidator({
    referenceBody: `## Has both\n\n<!-- csharp-parity: n/a -->\n\n${GD}\n\n${CS}`,
  });
  assert.match(stdout, /csharp-parity-exempt-no-reason/);
  assert.equal(code, 1);
});

test('a reason may contain > and < without breaking the match', () => {
  const { stdout, code } = runValidator({
    referenceBody: `## S\n\n<!-- csharp-parity: n/a — depth > 4 per <Control> docs -->\n\n${GD}`,
  });
  assert.match(stdout, /GDScript-only by design: depth > 4 per <Control> docs/);
  assert.equal(code, 0);
});

// A reference that documents the marker must not exempt itself — same self-reference trap the
// card rules guard against.
test('a marker inside a fenced code block does not exempt the section', () => {
  const { stdout } = runValidator({
    referenceBody: `## S\n\nHow to write one:\n\n\`\`\`markdown\n${MARKER('example only')}\n\`\`\`\n\n${GD}`,
  });
  assert.match(stdout, /csharp-parity-missing-reference/);
  assert.doesNotMatch(stdout, /GDScript-only by design: example only/);
});

test('"n/away" is not read as an exemption', () => {
  const { stdout } = runValidator({
    referenceBody: `## S\n\n<!-- csharp-parity: n/away — sneaky -->\n\n${GD}`,
  });
  assert.match(stdout, /csharp-parity-missing-reference/);
});

test('an unmarked GDScript-only section still warns', () => {
  const { stdout, code } = runValidator({ referenceBody: `## S\n\n${GD}` });
  assert.match(stdout, /csharp-parity-missing-reference/);
  assert.equal(code, 0, 'parity gaps are warnings, never errors');
});
