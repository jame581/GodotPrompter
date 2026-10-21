import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countAgents, countSkills, syncCounts } from '../../scripts/sync-marketplace-readme.mjs';

test('marker-delimited counts are rewritten, everything else is kept', () => {
  const input = 'x <!-- godot-prompter-skills -->41<!-- /godot-prompter-skills --> skills, '
    + '<!-- godot-prompter-agents -->3<!-- /godot-prompter-agents --> agents; 41 elsewhere';
  const { text, found } = syncCounts(input, { skills: 56, agents: 9 });
  assert.equal(text, 'x <!-- godot-prompter-skills -->56<!-- /godot-prompter-skills --> skills, '
    + '<!-- godot-prompter-agents -->9<!-- /godot-prompter-agents --> agents; 41 elsewhere');
  assert.deepEqual(found, ['skills', 'agents']);
});

test('a README without markers is reported, not changed', () => {
  const { text, found } = syncCounts('**41 skills**', { skills: 56, agents: 9 });
  assert.equal(text, '**41 skills**');
  assert.deepEqual(found, []);
});

test('counts come from the repo', () => {
  assert.ok(countSkills() > 0);
  assert.ok(countAgents() > 0);
});
