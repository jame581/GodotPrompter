// YAML frontmatter parser for the generator scripts.
//
// Unlike the presence-checking parser in validate-skills.mjs, the generators write this output
// straight to disk, so block scalars must survive verbatim: blank lines are paragraph breaks and
// relative indentation is Markdown list nesting. Stripping either corrupts the generated artifact.
export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error('Missing YAML frontmatter');
  const lines = match[1].split(/\r?\n/);
  const data = {};
  let currentKey = null;
  let block = [];

  const flush = () => {
    if (currentKey) data[currentKey] = dedent(block).replace(/\s+$/, '');
    currentKey = null;
    block = [];
  };

  for (const line of lines) {
    const blockStart = line.match(/^([a-zA-Z_-]+):\s*\|\s*$/);
    if (blockStart) {
      flush();
      currentKey = blockStart[1];
      continue;
    }
    // A blank line inside a block scalar is content, not a terminator.
    if (currentKey && (line.trim() === '' || /^\s/.test(line))) {
      block.push(line);
      continue;
    }
    const flat = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (flat) {
      flush();
      data[flat[1]] = flat[2].trim();
    }
  }
  flush();
  return { data, body: match[2].replace(/^\n/, '') };
}

// Strips the block's common indent only, so nested list indentation is preserved.
function dedent(lines) {
  const indents = lines
    .filter(line => line.trim() !== '')
    .map(line => line.match(/^[ \t]*/)[0].length);
  const common = indents.length ? Math.min(...indents) : 0;
  return lines.map(line => (line.trim() === '' ? '' : line.slice(common))).join('\n');
}
