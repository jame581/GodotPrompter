import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPT = join(ROOT, 'scripts', 'build-directory-bundle.mjs');

test('directory bundle stays within the plugin directory limits', () => {
  const out = execFileSync('node', [SCRIPT, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(out, /Directory bundle OK/);
});

test('directory bundle ships the plugin and leaves development material out', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gp-bundle-test-'));
  try {
    execFileSync('node', [SCRIPT, dir, '--ref', 'v0.0.0'], { cwd: ROOT, encoding: 'utf8' });
    for (const p of ['.claude-plugin/plugin.json', 'skills/using-godot-prompter/SKILL.md',
      'hooks/hooks.json', 'hooks/session-start', 'README.md', 'LICENSE']) {
      assert.ok(existsSync(join(dir, p)), `${p} should ship`);
    }
    for (const p of ['CLAUDE.md', 'evals', 'docs', 'tests', '.github', 'scripts',
      '.claude-plugin/marketplace.json', 'package.json']) {
      assert.ok(!existsSync(join(dir, p)), `${p} should not ship`);
    }
    if (process.platform !== 'win32') {
      assert.ok(statSync(join(dir, 'hooks/session-start')).mode & 0o100, 'hook stays executable');
    }
    const readme = readFileSync(join(dir, 'README.md'), 'utf8');
    assert.match(readme, /\]\(https:\/\/github\.com\/jame581\/GodotPrompter\/blob\/v0\.0\.0\/CONTRIBUTING\.md\)/);
    assert.match(readme, /\]\(LICENSE\)/, 'links to shipped files stay relative');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
