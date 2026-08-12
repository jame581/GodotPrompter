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
  // The suite may itself run under Claude Code or Copilot, both of which export a project dir.
  // Left in place it would become the hook's SESSION_ROOT and silently steer the CLAUDE.md probe
  // at this repo instead of the fixture.
  delete env.CLAUDE_PROJECT_DIR;
  delete env.COPILOT_PROJECT_DIR;
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

// A repo whose Godot project lives in a SUBDIRECTORY (the common "source/", "game/", "godot/"
// layout). The session starts at the repo root, so the upward walk alone never sees it.
function makeNestedProject(subpath, features = 'PackedStringArray("4.5", "Forward Plus")') {
  const base = mkdtempSync(join(tmpdir(), 'gp-nested-'));
  const projectDir = join(base, ...subpath.split('/'));
  mkdirSync(projectDir, { recursive: true });
  writeFileSync(join(projectDir, 'project.godot'), `config/features=${features}\n`);
  return { base, projectDir };
}

function ctxOf(out) { return JSON.parse(out).hookSpecificOutput.additionalContext; }

// The one clause every shape of the instructions-section offer carries. Matching on it rather
// than on a file name keeps these tests honest now that the offer names AGENTS.md too.
const OFFER = /Subagents do not receive this card/;

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

// --- descending search: the Godot project is a subdirectory of the session root -------------
// Regression: a repo like ChivalricQuest keeps project.godot in source/ and the session opens at
// the repo root. The upward-only walk found nothing and the hook exited silently.

test('finds a Godot project one level below the session root', () => {
  const { base } = makeNestedProject('source');
  assert.match(ctxOf(runHook(base)), /GodotPrompter is active/);
  rmSync(base, { recursive: true, force: true });
});

test('finds a Godot project three levels below the session root', () => {
  const { base } = makeNestedProject('apps/game/godot');
  assert.match(ctxOf(runHook(base)), /GodotPrompter is active/);
  rmSync(base, { recursive: true, force: true });
});

// Unbounded descent would make SessionStart walk the whole disk on a large repo.
test('does not descend past three levels', () => {
  const { base } = makeNestedProject('a/b/c/d');
  assert.equal(runHook(base).trim(), '');
  rmSync(base, { recursive: true, force: true });
});

// Vendored demo projects ship their own project.godot. Picking one would report the wrong engine
// version and point mentor state at a directory the user never edits.
test('ignores project.godot inside addons/ and dot-directories', () => {
  const base = mkdtempSync(join(tmpdir(), 'gp-noise-'));
  for (const p of ['addons/some_plugin/demo', '.godot/imported', 'node_modules/pkg']) {
    const d = join(base, ...p.split('/'));
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'project.godot'), 'config/features=PackedStringArray("4.2")\n');
  }
  assert.equal(runHook(base).trim(), '');
  rmSync(base, { recursive: true, force: true });
});

test('prefers the shallowest project when several are present', () => {
  const { base } = makeNestedProject('game', 'PackedStringArray("4.5", "Forward Plus")');
  const deep = join(base, 'tools', 'sample', 'fixture');
  mkdirSync(deep, { recursive: true });
  writeFileSync(join(deep, 'project.godot'), 'config/features=PackedStringArray("4.2", "Mobile")\n');
  const ctx = ctxOf(runHook(base));
  assert.match(ctx, /Godot 4\.5/);
  assert.doesNotMatch(ctx, /Godot 4\.2/);
  rmSync(base, { recursive: true, force: true });
});

// The upward walk must keep winning: a session opened INSIDE a project must resolve to that
// project, never to a fixture nested under it. This also pins the mentor state key.
test('prefers an enclosing project over one nested below the cwd', () => {
  const { base, cwd } = makeProject();
  const nested = join(cwd, 'tests', 'fixture');
  mkdirSync(nested, { recursive: true });
  writeFileSync(join(nested, 'project.godot'), 'config/features=PackedStringArray("4.2", "Mobile")\n');
  const ctx = ctxOf(runHook(cwd));
  assert.match(ctx, /Godot 4\.5/);
  assert.doesNotMatch(ctx, /Godot 4\.2/);
  rmSync(base, { recursive: true, force: true });
});

// A session opened in a sibling directory (docs/, scripts/) sees the project through neither the
// upward walk nor a descent from cwd. The host-supplied session root is the last resort.
test('falls back to the host session root when cwd sees nothing', () => {
  const { base } = makeNestedProject('source');
  const elsewhere = join(base, 'docs');
  mkdirSync(elsewhere, { recursive: true });
  assert.equal(runHook(elsewhere).trim(), '', 'precondition: cwd alone must not find it');
  const ctx = ctxOf(runHook(elsewhere, { CLAUDE_PROJECT_DIR: base }));
  assert.match(ctx, /GodotPrompter is active/);
  rmSync(base, { recursive: true, force: true });
});

// `find` tests the starting directory against the prune list too, so a session opened in a
// directory whose own name is pruned (build/, target/, any dot-dir) found nothing at all.
test('finds a project when the session root itself has a pruned name', () => {
  for (const rootName of ['build', 'target', '.tools']) {
    const base = mkdtempSync(join(tmpdir(), 'gp-pruned-'));
    const root = join(base, rootName);
    mkdirSync(join(root, 'src'), { recursive: true });
    writeFileSync(join(root, 'src', 'project.godot'), 'config/features=PackedStringArray("4.5")\n');
    assert.match(ctxOf(runHook(root)), /GodotPrompter is active/, `root named "${rootName}" was pruned`);
    rmSync(base, { recursive: true, force: true });
  }
});

// The session-root fallback must still see a project.godot sitting directly at that root —
// -mindepth 1 skips depth 0, so the root is checked explicitly before the descent.
test('finds a project sitting directly at the host session root', () => {
  const { base, cwd } = makeProject();
  const unrelated = mkdtempSync(join(tmpdir(), 'gp-elsewhere-'));
  const ctx = ctxOf(runHook(unrelated, { CLAUDE_PROJECT_DIR: base }));
  assert.match(ctx, /GodotPrompter is active/);
  rmSync(unrelated, { recursive: true, force: true });
  rmSync(base, { recursive: true, force: true });
  assert.ok(cwd);
});

// Regression: the offer named ${SESSION_ROOT}/CLAUDE.md unconditionally. With no host env var
// SESSION_ROOT falls back to cwd, so a session opened deep inside a project pointed the agent at
// a subdirectory that the host never loads a CLAUDE.md from.
test('names the project CLAUDE.md when the session opened inside the project', () => {
  const { base } = makeNestedProject('source');
  const deep = join(base, 'source', 'scripts', 'deep');
  mkdirSync(deep, { recursive: true });
  const ctx = ctxOf(runHook(deep));
  assert.match(ctx, OFFER);
  assert.doesNotMatch(ctx, /scripts[\\/]deep[\\/]CLAUDE\.md/,
    'must not aim the offer at a subdirectory of the project');
  rmSync(base, { recursive: true, force: true });
});

// The mirror case: the session root really is above the project, so it IS the right file to name.
test('names the session-root CLAUDE.md when the project is nested below it', () => {
  const { base } = makeNestedProject('source');
  const ctx = ctxOf(runHook(base, { CLAUDE_PROJECT_DIR: base }));
  assert.match(ctx, OFFER);
  assert.doesNotMatch(ctx, /source[\\/]CLAUDE\.md/, 'should name the session root, not the project dir');
  rmSync(base, { recursive: true, force: true });
});

// CLAUDE.md is read from the session root, not from the nested project directory — so the offer
// must consult the session root or it nags on every start of an already-wired repo.
test('honours a CLAUDE.md at the session root above the nested project', () => {
  const { base } = makeNestedProject('source');
  writeFileSync(join(base, 'CLAUDE.md'), '# Game\n\n## GodotPrompter\n\nAlready wired.\n');
  assert.doesNotMatch(ctxOf(runHook(base)), OFFER);
  rmSync(base, { recursive: true, force: true });
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
// Meaningful on Linux/macOS only: Git Bash repopulates HOME from USERPROFILE, so on Windows this
// exercises the ordinary path. It is CI (Ubuntu) that makes it a real test — do not trust a local
// pass as evidence the HOME-less branch works.
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

// --- Copilot CLI executes the hook command through PowerShell on Windows --------------------
// Regression: with only a `command` key, Copilot ran `"C:\...\run-hook.cmd" session-start` in
// PowerShell, where a leading quoted string is an expression, not a command:
//   ParserError: Unexpected token 'session-start' in expression or statement.
// The hook died with exit 1 at every session start. Copilot's schema takes per-shell keys
// (`bash` / `powershell`), and picks them over `command`; Claude Code reads `command`.

function hookEntry() {
  const cfg = JSON.parse(readFileSync(join(ROOT, 'hooks', 'hooks.json'), 'utf8'));
  return cfg.hooks.SessionStart[0].hooks[0];
}

test('hooks.json ships a PowerShell-safe command for Copilot CLI', () => {
  const entry = hookEntry();
  assert.ok(entry.powershell, 'hooks.json must carry a powershell key for Copilot on Windows');
  assert.match(entry.powershell, /^&\s+"/,
    'PowerShell needs the call operator (&) before a quoted path, or it parses it as a string');
  assert.match(entry.powershell, /run-hook\.cmd" session-start$/);
});

test('hooks.json keeps a bash key and a cross-platform command fallback', () => {
  const entry = hookEntry();
  assert.ok(entry.bash, 'Copilot on Linux/macOS selects the bash key');
  assert.doesNotMatch(entry.bash, /^&/, 'a leading & is a syntax error in bash');
  assert.ok(entry.command, 'Claude Code reads command');
  assert.doesNotMatch(entry.command, /^&/, 'a leading & is a syntax error in bash and cmd.exe');
});

// Every key must resolve the plugin root through the host's ${VAR} substitution. Copilot expands
// ${CLAUDE_PLUGIN_ROOT} before handing the string to PowerShell; a bare $env: form would be
// evaluated by PowerShell instead and silently resolve to empty under other hosts.
test('every hook command form references the plugin root the same way', () => {
  const entry = hookEntry();
  for (const key of ['command', 'bash', 'powershell']) {
    assert.match(entry[key], /\$\{CLAUDE_PLUGIN_ROOT\}/, `${key} must use \${CLAUDE_PLUGIN_ROOT}`);
  }
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

// --- subagent reach: the instructions-section offer -------------------------------------------

test('offers the section when no instructions file has one', () => {
  const { base, cwd } = makeProject();
  assert.match(ctxOf(runHook(cwd)), OFFER);
  rmSync(base, { recursive: true, force: true });
});

test('stays quiet when CLAUDE.md already has the GodotPrompter section', () => {
  const { base, cwd } = makeProject();
  writeFileSync(join(base, 'CLAUDE.md'), '# Game\n\n## GodotPrompter\n\nAlready wired.\n');
  assert.doesNotMatch(ctxOf(runHook(cwd)), OFFER);
  rmSync(base, { recursive: true, force: true });
});

// Issue #15: a repo that keeps agent instructions in AGENTS.md (Codex, Copilot, Cursor,
// OpenCode) is documented. Probing CLAUDE.md alone nagged it at every single session start.
test('stays quiet when another agent instructions file has the section', () => {
  for (const file of ['AGENTS.md', 'GEMINI.md', '.github/copilot-instructions.md',
                      '.claude/CLAUDE.md', 'CLAUDE.local.md', '.cursor/rules/godot.md']) {
    const { base, cwd } = makeProject();
    const target = join(base, ...file.split('/'));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, '# Game\n\n## GodotPrompter\n\nAlready wired.\n');
    assert.doesNotMatch(ctxOf(runHook(cwd)), OFFER, `${file} was not honoured`);
    rmSync(base, { recursive: true, force: true });
  }
});

test('honours an AGENTS.md at the session root above the nested project', () => {
  const { base } = makeNestedProject('source');
  writeFileSync(join(base, 'AGENTS.md'), '# Game\n\n## GodotPrompter\n\nAlready wired.\n');
  assert.doesNotMatch(ctxOf(runHook(base)), OFFER);
  rmSync(base, { recursive: true, force: true });
});

// A near-miss must not silence the offer: the heading has to be the real one.
test('does not accept a passing mention of GodotPrompter as the section', () => {
  const { base, cwd } = makeProject();
  writeFileSync(join(base, 'AGENTS.md'), '# Game\n\nWe use GodotPrompter here.\n');
  assert.match(ctxOf(runHook(cwd)), OFFER);
  rmSync(base, { recursive: true, force: true });
});

// Where the offer points: the file the repo already maintains, not a CLAUDE.md it chose not to
// have. With no instructions file at all, CLAUDE.md stays the default.
test('names AGENTS.md when the repo keeps its instructions there', () => {
  const { base, cwd } = makeProject();
  writeFileSync(join(base, 'AGENTS.md'), '# Game\n\nNo section here yet.\n');
  const offerLine = ctxOf(runHook(cwd)).split('\n').find(l => OFFER.test(l));
  assert.ok(offerLine, 'expected an offer line');
  assert.match(offerLine, /AGENTS\.md/);
  assert.doesNotMatch(offerLine, /add it to `[^`]*CLAUDE\.md`/);
  rmSync(base, { recursive: true, force: true });
});

test('names CLAUDE.md when the repo has one, even alongside AGENTS.md', () => {
  const { base, cwd } = makeProject();
  writeFileSync(join(base, 'AGENTS.md'), '# Game\n');
  writeFileSync(join(base, 'CLAUDE.md'), '# Game\n');
  const offerLine = ctxOf(runHook(cwd)).split('\n').find(l => OFFER.test(l));
  assert.ok(offerLine, 'expected an offer line');
  assert.match(offerLine, /CLAUDE\.md/);
  rmSync(base, { recursive: true, force: true });
});

// The detection set and the target set have to agree, or the fix just moves #15 to another host:
// a Copilot-only repo keeping .github/copilot-instructions.md, or one keeping .claude/CLAUDE.md,
// was still told to start a root CLAUDE.md it does not maintain.
test('names whichever instructions file the repo actually keeps', () => {
  for (const file of ['.github/copilot-instructions.md', '.claude/CLAUDE.md', 'GEMINI.md']) {
    const { base, cwd } = makeProject();
    const target = join(base, ...file.split('/'));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, '# Game\n\nNo section here yet.\n');
    const offerLine = ctxOf(runHook(cwd)).split('\n').find(l => OFFER.test(l));
    assert.ok(offerLine, 'expected an offer line');
    assert.ok(offerLine.includes(`${canonicalPath(base)}/${file}`),
      `expected the offer to name ${file}, got: ${offerLine}`);
    rmSync(base, { recursive: true, force: true });
  }
});

// Claude Code does load .claude/CLAUDE.md, so the "@import it" remark would be a false claim.
test('omits the @import remark when the target is a CLAUDE.md location', () => {
  const { base, cwd } = makeProject();
  mkdirSync(join(base, '.claude'));
  writeFileSync(join(base, '.claude', 'CLAUDE.md'), '# Game\n');
  assert.doesNotMatch(ctxOf(runHook(cwd)), /Claude Code itself loads/);
  rmSync(base, { recursive: true, force: true });
});

test('names CLAUDE.md when the project has no instructions file at all', () => {
  const { base, cwd } = makeProject();
  const offerLine = ctxOf(runHook(cwd)).split('\n').find(l => OFFER.test(l));
  assert.ok(offerLine, 'expected an offer line');
  assert.match(offerLine, /CLAUDE\.md/);
  rmSync(base, { recursive: true, force: true });
});

// The agent is told to WRITE this path. Under Git Bash the project root is "/c/Users/you/game"
// and a native session root concatenates into "D:\game/CLAUDE.md" — neither is writable by the
// Node-based tools the agent reaches for.
test('names the file to write in a canonical path spelling', () => {
  const { base, cwd } = makeProject();
  const offerLine = ctxOf(runHook(cwd)).split('\n').find(l => OFFER.test(l));
  assert.ok(offerLine, 'expected an offer line');
  assert.ok(offerLine.includes(`${canonicalPath(base)}/CLAUDE.md`),
    `expected ${canonicalPath(base)}/CLAUDE.md in: ${offerLine}`);
  rmSync(base, { recursive: true, force: true });
});

// The #15 shape as it actually arrives on Windows: the host hands back a native path and the
// instructions live at the session root, above the nested project.
test('honours a session-root AGENTS.md given a native host project dir', () => {
  const { base } = makeNestedProject('source');
  writeFileSync(join(base, 'AGENTS.md'), '# Game\n\n## GodotPrompter\n\nAlready wired.\n');
  const elsewhere = join(base, 'docs');
  mkdirSync(elsewhere, { recursive: true });
  assert.doesNotMatch(ctxOf(runHook(elsewhere, { CLAUDE_PROJECT_DIR: base })), OFFER);
  rmSync(base, { recursive: true, force: true });
});

// Claude Code loads CLAUDE.md, not AGENTS.md. The remark is true only there; on Cursor and
// Copilot it would be noise about a file the host never opens. Most fragile of the new branches.
test('adds the @AGENTS.md remark on Claude Code only', () => {
  const { base, cwd } = makeProject();
  writeFileSync(join(base, 'AGENTS.md'), '# Game\n\nNo section here yet.\n');
  const remark = /containing `@AGENTS\.md`/;
  assert.match(ctxOf(runHook(cwd)), remark, 'missing on Claude Code');
  const cursor = JSON.parse(runHook(cwd, { CURSOR_PLUGIN_ROOT: ROOT })).additional_context;
  assert.doesNotMatch(cursor, remark, 'leaked into Cursor output');
  const copilot = JSON.parse(runHook(cwd, { COPILOT_CLI: '1' })).additionalContext;
  assert.doesNotMatch(copilot, remark, 'leaked into Copilot output');
  rmSync(base, { recursive: true, force: true });
});

// "Offer once" was unenforceable: SessionStart fires on every start, resume, clear and compact,
// and nothing recorded the refusal — so a user who said no was asked again forever.
test('suppresses the offer when the state file records a decline', () => {
  const { base, cwd } = makeProject();
  const sf = stateFileFor(base);
  mkdirSync(dirname(sf), { recursive: true });
  writeFileSync(sf, JSON.stringify({ project: base, section_offer: 'declined' }));
  try {
    assert.doesNotMatch(ctxOf(runHook(cwd)), OFFER);
  } finally {
    rmSync(sf, { force: true });
    rmSync(base, { recursive: true, force: true });
  }
});

test('tells the agent where to record a decline', () => {
  const { base, cwd } = makeProject();
  const offerLine = ctxOf(runHook(cwd)).split('\n').find(l => OFFER.test(l));
  assert.ok(offerLine, 'expected an offer line');
  assert.match(offerLine, /section_offer/);
  assert.ok(offerLine.includes(canonicalPath(stateFileFor(base))),
    'must name the state file to write, in a spelling the agent can write to');
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
    // Named in a spelling the agent can actually write to. Under Git Bash $HOME is "/c/Users/you",
    // which every non-bash tool the agent might reach for fails on.
    assert.ok(ctx.includes(canonicalPath(sf)), `card must name ${canonicalPath(sf)}`);
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
