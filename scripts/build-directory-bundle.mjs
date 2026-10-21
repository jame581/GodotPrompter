#!/usr/bin/env node
// Builds the plugin-only tree on the `plugin-bundle` branch (published by release.yml on every
// tag). Anthropic's plugin directory and both marketplaces (skillsmith, godot-prompter-marketplace)
// install from that branch, so Claude Code and Copilot CLI marketplace installs get this tree.
//
// The directory counts every file in the plugin folder, and this repo's root is the plugin
// folder: evals/, docs/, tests/ and the CI workflows pushed it past the 512-file limit, which
// holds every version for a reviewer (BINARIES_NOT_INSPECTED). Master keeps its layout because
// Cursor, Codex, OpenCode, Antigravity, Grok and local-clone installs read it directly. Copilot CLI
// reads `.claude-plugin/plugin.json`, skills/, agents/ and hooks/, all of which the bundle keeps.
//
// Usage:
//   node scripts/build-directory-bundle.mjs <out-dir> [--ref <git-ref>]
//   node scripts/build-directory-bundle.mjs --check
//
// <out-dir> must not exist or be empty. --ref sets the ref README links to files left out of
// the bundle point at (default: master). --check builds into a temp dir, enforces the
// directory's limits, and removes it.

import { execFileSync } from 'node:child_process';
import {
  chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync,
  rmSync, statSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_URL = 'https://github.com/jame581/GodotPrompter';

// What Claude Code loads, plus what the directory listing requires (README, license). Paths are
// prefixes of git-tracked files. Everything else on master is development material or another
// host's manifest.
const INCLUDE = [
  '.claude-plugin/plugin.json',
  '.claude-plugin/icon.png',
  'skills/',
  'agents/',
  'hooks/hooks.json',
  'hooks/run-hook.cmd',
  'hooks/session-start',
  'README.md',
  'LICENSE',
  'PRIVACY.md',
  'SECURITY.md',
];
const EXCLUDE = [/(^|\/)\.gitkeep$/];

// Limits from the directory's pre-submission checklist ("Files in the plugin folder").
const MAX_FILES = 512;
const MAX_TEXT_BYTES = 256 * 1024;
const IMAGE = /\.(png|jpe?g|gif|webp|svg|ttf|otf|woff2?)$/i;

// Shipped hook scripts must keep LF on every checkout of the bundle branch too. Only `text eol`
// attributes: the directory refuses export-ignore, export-subst and filter.
const GITATTRIBUTES = `* text=auto eol=lf
hooks/session-start text eol=lf
*.cmd text eol=lf
*.png binary
`;

function trackedFiles() {
  // -s for the mode: hooks/session-start and run-hook.cmd are tracked 100755.
  const out = execFileSync('git', ['ls-files', '-s', '-z'], { cwd: ROOT, encoding: 'utf8' });
  return out.split('\0').filter(Boolean).map((line) => {
    const [meta, path] = line.split('\t');
    return { path, executable: meta.startsWith('100755') };
  });
}

function selected() {
  return trackedFiles().filter(({ path }) =>
    INCLUDE.some((p) => (p.endsWith('/') ? path.startsWith(p) : path === p))
    && !EXCLUDE.some((re) => re.test(path)));
}

// README links to docs/, evals/, tests/ etc. would dangle in the bundle; point them at GitHub.
function rewriteReadme(text, shipped, ref) {
  return text.replace(/\]\((?!https?:|#|mailto:)([^)\s]+)\)/g, (match, target) => {
    const [path, anchor = ''] = target.split(/(?=#)/);
    const clean = path.replace(/^\.\//, '');
    if (shipped.has(clean)) return match;
    const kind = clean.endsWith('/') ? 'tree' : 'blob';
    return `](${REPO_URL}/${kind}/${ref}/${clean}${anchor})`;
  });
}

export function build(outDir, { ref = 'master' } = {}) {
  if (existsSync(outDir) && readdirSync(outDir).length > 0) {
    throw new Error(`${outDir} is not empty`);
  }
  const files = selected();
  const shipped = new Set(files.map((f) => f.path));
  for (const { path, executable } of files) {
    const dest = join(outDir, path);
    mkdirSync(dirname(dest), { recursive: true });
    if (path === 'README.md') {
      writeFileSync(dest, rewriteReadme(readFileSync(join(ROOT, path), 'utf8'), shipped, ref));
    } else {
      copyFileSync(join(ROOT, path), dest);
    }
    if (executable) chmodSync(dest, 0o755);
  }
  writeFileSync(join(outDir, '.gitattributes'), GITATTRIBUTES);
  return [...shipped, '.gitattributes'];
}

export function check(outDir, paths) {
  const problems = [];
  if (paths.length > MAX_FILES) {
    problems.push(`${paths.length} files, over the directory's ${MAX_FILES}-file limit`);
  }
  for (const p of paths) {
    const size = statSync(join(outDir, p)).size;
    if (!IMAGE.test(p) && size >= MAX_TEXT_BYTES) {
      problems.push(`${p} is ${size} bytes; non-image files must stay under ${MAX_TEXT_BYTES}`);
    }
  }
  for (const required of ['.claude-plugin/plugin.json', 'README.md', 'LICENSE', 'hooks/hooks.json']) {
    if (!paths.includes(required)) problems.push(`${required} is missing from the bundle`);
  }
  if (paths.includes('CLAUDE.md')) problems.push('CLAUDE.md must not ship (plugins do not load it)');
  return problems;
}

function main(argv) {
  const refIdx = argv.indexOf('--ref');
  const ref = refIdx >= 0 ? argv[refIdx + 1] : 'master';
  const isCheck = argv.includes('--check');
  const positional = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--ref');
  const outDir = isCheck ? mkdtempSync(join(tmpdir(), 'gp-bundle-')) : positional[0];
  if (!outDir) {
    console.error('usage: build-directory-bundle.mjs <out-dir> [--ref <git-ref>] | --check');
    return 2;
  }
  try {
    const paths = build(resolve(outDir), { ref });
    const problems = check(resolve(outDir), paths);
    for (const p of problems) console.error(`error: ${p}`);
    if (problems.length) return 1;
    console.log(`Directory bundle OK: ${paths.length} files (limit ${MAX_FILES})${isCheck ? '' : ` in ${outDir}`}`);
    return 0;
  } finally {
    if (isCheck) rmSync(outDir, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
