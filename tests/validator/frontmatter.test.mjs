import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter } from '../../scripts/lib/frontmatter.mjs';

// The --check tests for the generators compare generated output against generated output, so a
// parser that drops content passes them happily. These assert the parser itself, against the
// block-scalar shapes agents/*.md and skills/*/SKILL.md actually use.

test('a blank line inside a block scalar is preserved as a paragraph break', () => {
  const { data } = parseFrontmatter('---\ndescription: |\n  Intro line.\n\n  Examples:\n---\nbody\n');
  assert.equal(data.description, 'Intro line.\n\nExamples:');
});

test('nested list indentation inside a block scalar is preserved', () => {
  const { data } = parseFrontmatter('---\ndescription: |\n  - top\n    - nested\n---\nbody\n');
  assert.equal(data.description, '- top\n  - nested');
});

test('only the common indent is stripped, not all leading whitespace', () => {
  const { data } = parseFrontmatter('---\ndescription: |\n      deep\n        deeper\n---\nbody\n');
  assert.equal(data.description, 'deep\n  deeper');
});

test('a flat key after a block scalar ends the block and is parsed', () => {
  const { data } = parseFrontmatter('---\nname: demo\ndescription: |\n  Text.\nmodel: inherit\n---\nbody\n');
  assert.deepEqual(data, { name: 'demo', description: 'Text.', model: 'inherit' });
});

test('the body is returned without the leading blank line', () => {
  const { body } = parseFrontmatter('---\nname: demo\n---\n\n# Title\n');
  assert.equal(body, '# Title\n');
});

test('content missing frontmatter throws rather than yielding empty fields', () => {
  assert.throws(() => parseFrontmatter('# Just a heading\n'), /Missing YAML frontmatter/);
});

test('CRLF frontmatter parses the same as LF', () => {
  const { data } = parseFrontmatter('---\r\ndescription: |\r\n  One.\r\n\r\n  Two.\r\n---\r\nbody\r\n');
  assert.equal(data.description, 'One.\n\nTwo.');
});
