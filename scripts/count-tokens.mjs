#!/usr/bin/env node
// Counts byte size and (optionally) real tokens for skills, references, and agents.
// Modes:
//   default                 byte count + bytes/4 estimate
//   --tokenizer             include real Claude + GPT token counts (requires optionalDependencies)
//   --markdown              output a Markdown table (for docs/token-budget.md)
//   --json                  output JSON
// Usage: node scripts/count-tokens.mjs [--tokenizer] [--markdown|--json]

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SKILLS_DIR = join(ROOT, 'skills');
const AGENTS_DIR = join(ROOT, 'agents');

const args = process.argv.slice(2);
const useTokenizer = args.includes('--tokenizer');
const markdown = args.includes('--markdown');
const json = args.includes('--json');

const BUDGET_BYTES = 16 * 1024;

let countClaude = null;
let countGpt = null;
if (useTokenizer) {
  try {
    const claudeMod = await import('@anthropic-ai/tokenizer');
    const tiktokenMod = await import('js-tiktoken');
    countClaude = (text) => claudeMod.countTokens(text);
    const gptEnc = tiktokenMod.encodingForModel('gpt-4');
    countGpt = (text) => gptEnc.encode(text).length;
  } catch (err) {
    console.error('Tokenizer mode requires optional dependencies:');
    console.error('  npm install @anthropic-ai/tokenizer js-tiktoken');
    console.error('Falling back to byte-count estimates.');
    countClaude = null;
    countGpt = null;
  }
}

function listFiles() {
  const files = [];
  for (const skill of readdirSync(SKILLS_DIR)) {
    const skillDir = join(SKILLS_DIR, skill);
    if (!statSync(skillDir).isDirectory()) continue;
    const skillMd = join(skillDir, 'SKILL.md');
    if (existsSync(skillMd)) files.push({ kind: 'skill', name: skill, path: skillMd });
    const refsDir = join(skillDir, 'references');
    if (existsSync(refsDir)) {
      for (const ref of readdirSync(refsDir).filter(n => n.endsWith('.md'))) {
        files.push({ kind: 'reference', name: `${skill}/${ref}`, path: join(refsDir, ref) });
      }
    }
  }
  if (existsSync(AGENTS_DIR)) {
    for (const a of readdirSync(AGENTS_DIR).filter(n => n.endsWith('.md'))) {
      files.push({ kind: 'agent', name: a.replace(/\.md$/, ''), path: join(AGENTS_DIR, a) });
    }
  }
  return files;
}

const rows = [];
for (const f of listFiles()) {
  const text = readFileSync(f.path, 'utf8');
  const bytes = Buffer.byteLength(text.replace(/\r\n/g, '\n'), 'utf8');
  const estTokens = Math.round(bytes / 4);
  const claude = countClaude ? countClaude(text) : null;
  const gpt = countGpt ? countGpt(text) : null;
  const overBudget = f.kind === 'skill' && bytes >= BUDGET_BYTES;
  rows.push({ kind: f.kind, name: f.name, path: relative(ROOT, f.path).replace(/\\/g, '/'), bytes, estTokens, claude, gpt, overBudget });
}

rows.sort((a, b) => b.bytes - a.bytes);

if (json) {
  console.log(JSON.stringify({ rows, budgetBytes: BUDGET_BYTES }, null, 2));
} else if (markdown) {
  console.log('| Kind | Name | Bytes | KB | Est. tokens | Claude | GPT | Status |');
  console.log('|---|---|---:|---:|---:|---:|---:|---|');
  for (const r of rows) {
    const status = r.kind !== 'skill' ? '—' : (r.overBudget ? '⚠️ over budget' : '✓ under budget');
    console.log(`| ${r.kind} | ${r.name} | ${r.bytes} | ${(r.bytes/1024).toFixed(1)} | ${r.estTokens} | ${r.claude ?? '—'} | ${r.gpt ?? '—'} | ${status} |`);
  }
} else {
  const header = useTokenizer
    ? 'Kind        Name                                    Bytes    KB   Est.tok  Claude    GPT  Status'
    : 'Kind        Name                                    Bytes    KB   Est.tok  Status';
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const r of rows) {
    const status = r.kind !== 'skill' ? '' : (r.overBudget ? 'OVER' : 'ok');
    const kb = (r.bytes/1024).toFixed(1).padStart(5);
    const name = r.name.padEnd(38);
    const bytes = String(r.bytes).padStart(7);
    const est = String(r.estTokens).padStart(7);
    if (useTokenizer) {
      const cl = String(r.claude ?? '—').padStart(6);
      const gp = String(r.gpt ?? '—').padStart(6);
      console.log(`${r.kind.padEnd(11)} ${name} ${bytes} ${kb} ${est} ${cl} ${gp}  ${status}`);
    } else {
      console.log(`${r.kind.padEnd(11)} ${name} ${bytes} ${kb} ${est}  ${status}`);
    }
  }
  const overCount = rows.filter(r => r.overBudget).length;
  console.log('-'.repeat(header.length));
  console.log(`Total files: ${rows.length}. Skills over ${BUDGET_BYTES/1024} KB budget: ${overCount}.`);
}
