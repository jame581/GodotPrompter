import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HOOK = join(ROOT, 'hooks', 'session-start');

// On Windows, `bash` on PATH is usually C:\Windows\System32\bash.exe — the WSL launcher,
// which cannot resolve C:\... paths. Prefer Git for Windows bash, matching run-hook.cmd.
const BASH = process.platform === 'win32'
  ? ['C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files (x86)\\Git\\bin\\bash.exe'].find(existsSync) ?? 'bash'
  : 'bash';

function runHook(cwd, extraEnv = {}) {
  const env = { ...process.env, CLAUDE_PLUGIN_ROOT: ROOT };
  delete env.CURSOR_PLUGIN_ROOT;
  delete env.COPILOT_CLI;
  Object.assign(env, extraEnv);
  return execFileSync(BASH, [HOOK], { cwd, env, encoding: 'utf8' });
}

function makeProject(depth = 0, features = 'PackedStringArray("4.5", "Forward Plus")') {
  const base = mkdtempSync(join(tmpdir(), 'gp-hook-'));
  writeFileSync(
    join(base, 'project.godot'),
    features ? `config/features=${features}\n` : '[application]\nconfig/name="X"\n'
  );
  let cwd = base;
  for (let i = 0; i < depth; i++) { cwd = join(cwd, `sub${i}`); mkdirSync(cwd); }
  return { base, cwd };
}

function ctxOf(out) { return JSON.parse(out).hookSpecificOutput.additionalContext; }

test('emits nothing outside a Godot project', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gp-empty-'));
  assert.equal(runHook(dir).trim(), '');
  rmSync(dir, { recursive: true, force: true });
});

test('injects the session card inside a Godot project', () => {
  const { base, cwd } = makeProject();
  const parsed = JSON.parse(runHook(cwd));
  assert.equal(parsed.hookSpecificOutput.hookEventName, 'SessionStart');
  const ctx = parsed.hookSpecificOutput.additionalContext;
  assert.match(ctx, /GodotPrompter is active/);
  assert.match(ctx, /Red flags/);
  assert.equal(parsed.additional_context, undefined);
  assert.equal(parsed.additionalContext, undefined);
  rmSync(base, { recursive: true, force: true });
});

// Guards against an escaper regression collapsing the payload to one line.
// A JSON.parse + substring check alone would pass against a fully mangled card.
test('decoded card keeps real newlines and intact table rows', () => {
  const { base, cwd } = makeProject();
  const ctx = ctxOf(runHook(cwd));
  assert.ok(ctx.split('\n').length > 15, `expected a multi-line card, got ${ctx.split('\n').length} lines`);
  assert.match(ctx, /^\| Building… \| Start with \|$/m);
  assert.match(ctx, /^\| Thought \| Reality \|$/m);
  rmSync(base, { recursive: true, force: true });
});

test('walks up to depth 4 but no further', () => {
  const ok = makeProject(4);
  assert.notEqual(runHook(ok.cwd).trim(), '');
  rmSync(ok.base, { recursive: true, force: true });
  const tooDeep = makeProject(6);
  assert.equal(runHook(tooDeep.cwd).trim(), '');
  rmSync(tooDeep.base, { recursive: true, force: true });
});

test('emits Cursor-shaped output when CURSOR_PLUGIN_ROOT is set', () => {
  const { base, cwd } = makeProject();
  const parsed = JSON.parse(runHook(cwd, { CURSOR_PLUGIN_ROOT: ROOT }));
  assert.ok(parsed.additional_context);
  assert.equal(parsed.hookSpecificOutput, undefined);
  rmSync(base, { recursive: true, force: true });
});

test('emits SDK-standard output for Copilot CLI', () => {
  const { base, cwd } = makeProject();
  const parsed = JSON.parse(runHook(cwd, { COPILOT_CLI: '1' }));
  assert.ok(parsed.additionalContext);
  assert.equal(parsed.hookSpecificOutput, undefined);
  rmSync(base, { recursive: true, force: true });
});

test('reports the detected Godot version and renderer', () => {
  const { base, cwd } = makeProject();
  const ctx = ctxOf(runHook(cwd));
  assert.match(ctx, /Godot 4\.5/);
  assert.match(ctx, /Forward Plus/);
  rmSync(base, { recursive: true, force: true });
});

// The regression the first draft would have shipped: Godot inserts "C#" as a feature tag
// between the version and the renderer, so token 2 is NOT the renderer.
test('does not mistake the C# feature tag for the renderer', () => {
  const { base, cwd } = makeProject(0, 'PackedStringArray("4.5", "C#", "Forward Plus")');
  const ctx = ctxOf(runHook(cwd));
  assert.match(ctx, /Forward Plus renderer/);
  assert.doesNotMatch(ctx, /C# renderer/);
  rmSync(base, { recursive: true, force: true });
});

test('flags a C# project so examples lead with C#', () => {
  const { base, cwd } = makeProject(0, 'PackedStringArray("4.5", "C#", "Forward Plus")');
  assert.match(ctxOf(runHook(cwd)), /C# project/);
  rmSync(base, { recursive: true, force: true });
});

test('does not mistake the Double Precision tag for the renderer', () => {
  const { base, cwd } = makeProject(0, 'PackedStringArray("4.5", "Double Precision", "Mobile")');
  const ctx = ctxOf(runHook(cwd));
  assert.match(ctx, /Mobile renderer/);
  assert.doesNotMatch(ctx, /Double Precision renderer/);
  rmSync(base, { recursive: true, force: true });
});

test('handles a version-only features array', () => {
  const { base, cwd } = makeProject(0, 'PackedStringArray("4.6")');
  const ctx = ctxOf(runHook(cwd));
  assert.match(ctx, /Godot 4\.6/);
  // Scope the negative to the version line — the routing card legitimately contains other
  // prose, so asserting over the whole context would fail for unrelated reasons.
  const versionLine = ctx.split('\n').find(l => l.includes('targets **Godot'));
  assert.ok(versionLine, 'expected a version line');
  assert.doesNotMatch(versionLine, /renderer/);
  rmSync(base, { recursive: true, force: true });
});

// A sanitized environment must cost the mentor lookup, never the session card.
test('still emits the session card when HOME is unset', () => {
  const { base, cwd } = makeProject();
  const env = { ...process.env, CLAUDE_PLUGIN_ROOT: ROOT };
  delete env.HOME;
  delete env.CURSOR_PLUGIN_ROOT;
  delete env.COPILOT_CLI;
  const out = execFileSync(BASH, [HOOK], { cwd, env, encoding: 'utf8' });
  assert.match(ctxOf(out), /GodotPrompter is active/);
  rmSync(base, { recursive: true, force: true });
});

// The polyglot wrapper is the least portable part of the release and the plan explicitly
// warns against "fixing" its heredoc. Guard it.
test('the polyglot wrapper dispatches to the hook', () => {
  const { base, cwd } = makeProject();
  const out = execFileSync(BASH, [join(ROOT, 'hooks', 'run-hook.cmd'), 'session-start'], {
    cwd, env: { ...process.env, CLAUDE_PLUGIN_ROOT: ROOT }, encoding: 'utf8',
  });
  assert.match(ctxOf(out), /GodotPrompter is active/);
  rmSync(base, { recursive: true, force: true });
});

test('survives a project.godot with no config/features line', () => {
  const { base, cwd } = makeProject(0, '');
  assert.match(ctxOf(runHook(cwd)), /GodotPrompter is active/);
  rmSync(base, { recursive: true, force: true });
});

test('shipped hook scripts contain no CR bytes', () => {
  for (const f of ['hooks/session-start', 'hooks/run-hook.cmd']) {
    const buf = readFileSync(join(ROOT, f));
    assert.equal(buf.includes(0x0d), false, `${f} contains CR bytes — bash will fail on a CR`);
  }
});

// The CR test above reads the working tree, and CI checks out LF regardless of .gitattributes —
// so on the runner it is vacuous. This asserts the *rule* that protects Windows contributors,
// which is what can actually regress.
test('.gitattributes pins the hook scripts to LF', () => {
  for (const f of ['hooks/session-start', 'hooks/run-hook.cmd']) {
    const attrs = execFileSync('git', ['check-attr', 'text', 'eol', '--', f],
      { cwd: ROOT, encoding: 'utf8' });
    assert.match(attrs, new RegExp(`${f}: text: set`), `${f} is not marked text in .gitattributes`);
    assert.match(attrs, new RegExp(`${f}: eol: lf`), `${f} is not pinned to eol=lf`);
  }
});

// --- subagent reach: the CLAUDE.md offer -----------------------------------------------------

test('offers the CLAUDE.md section when the project has none', () => {
  const { base, cwd } = makeProject();
  assert.match(ctxOf(runHook(cwd)), /CLAUDE\.md has no/);
  rmSync(base, { recursive: true, force: true });
});

test('stays quiet when CLAUDE.md already has the GodotPrompter section', () => {
  const { base, cwd } = makeProject();
  writeFileSync(join(base, 'CLAUDE.md'), '# Game\n\n## GodotPrompter\n\nAlready wired.\n');
  assert.doesNotMatch(ctxOf(runHook(cwd)), /CLAUDE\.md has no/);
  rmSync(base, { recursive: true, force: true });
});

// --- mentor mode: state lives in the user's HOME, never in the game repo ---------------------

// Canonical state key: absolute, forward slashes, native drive letter (C:/Users/x/game).
// Must match hooks/session-start's canonical_path() — bash and Node see the same directory
// under different path spellings on Windows, so the raw path is not a usable key.
function canonicalPath(p) {
  return resolve(p).replace(/\\/g, '/');
}

function stateFileFor(projectPath) {
  const hash = createHash('sha256').update(canonicalPath(projectPath)).digest('hex').slice(0, 16);
  return join(homedir(), '.godot-prompter', 'state', `${hash}.json`);
}

test('injects the mentor contract when state enables mentor mode', () => {
  const { base, cwd } = makeProject();
  const sf = stateFileFor(base);
  mkdirSync(dirname(sf), { recursive: true });
  writeFileSync(sf, JSON.stringify({ project: base, mode: 'mentor', level: 'beginner' }));
  try {
    const ctx = ctxOf(runHook(cwd));
    assert.match(ctx, /Mentor mode is ACTIVE/);
    // The off-ramp tells the agent to set mode:normal in "the state file". After a /clear the
    // agent has the card but not the skill, so the card must name the path.
    assert.match(ctx, /Mentor state file for this project:/);
    assert.ok(ctx.includes('.godot-prompter'), 'card must name the state file path');
  } finally {
    rmSync(sf, { force: true });
    rmSync(base, { recursive: true, force: true });
  }
});

test('does not false-positive on a non-mode key containing "mentor"', () => {
  const { base, cwd } = makeProject();
  const sf = stateFileFor(base);
  mkdirSync(dirname(sf), { recursive: true });
  writeFileSync(sf, JSON.stringify({ project: base, mode: 'normal', last_mode: 'mentor' }));
  try {
    assert.doesNotMatch(ctxOf(runHook(cwd)), /Mentor mode is ACTIVE/);
  } finally {
    rmSync(sf, { force: true });
    rmSync(base, { recursive: true, force: true });
  }
});

test('omits the mentor contract when no state file exists', () => {
  const { base, cwd } = makeProject();
  assert.doesNotMatch(ctxOf(runHook(cwd)), /Mentor mode is ACTIVE/);
  rmSync(base, { recursive: true, force: true });
});

// The README promises the hook writes *nothing* — snapshot the whole tree, not just one path.
test('writes nothing into the user project', () => {
  const { base, cwd } = makeProject();
  const before = readdirSync(base).sort().join(',');
  runHook(cwd);
  const after = readdirSync(base).sort().join(',');
  assert.equal(after, before, `hook modified the project directory: "${before}" -> "${after}"`);
  assert.equal(existsSync(join(base, '.godot-prompter')), false, 'hook must not write into the game repo');
  rmSync(base, { recursive: true, force: true });
});
