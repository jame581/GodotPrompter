import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PLUGIN = join(ROOT, '.opencode', 'plugins', 'godot-prompter.js');
const SKILLS = join(ROOT, 'skills');

const plugin = await import(pathToFileURL(PLUGIN).href);

const skillDirs = readdirSync(SKILLS, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(SKILLS, e.name, 'SKILL.md')))
  .map((e) => e.name);

// OpenCode 2.x rejects anything else with "Plugin must export a default definition
// with an id and an effect or setup function" (#38).
test('default export is an OpenCode 2.x definition', () => {
  assert.equal(typeof plugin.default, 'object');
  assert.equal(typeof plugin.default.id, 'string');
  assert.ok(plugin.default.id.length > 0);
  assert.equal(typeof plugin.default.setup, 'function');
});

test('OpenCode 1.x entrypoints stay in place', () => {
  assert.equal(typeof plugin.default.server, 'function');
  assert.equal(typeof plugin.GodotPrompterPlugin, 'function');
});

function fakeV2Context() {
  const skills = new Map();
  const transforms = [];
  const hooks = {};
  const editor = {
    list: () => [...skills.values()],
    get: (id) => skills.get(id),
    add: (skill) => skills.set(skill.id, { ...skill }),
    update: () => {},
    remove: (id) => skills.delete(id),
  };
  return {
    skills,
    hooks,
    runTransforms: () => transforms.forEach((cb) => cb(editor)),
    ctx: {
      skill: { transform: async (cb) => { transforms.push(cb); return { dispose: async () => {} }; } },
      session: { hook: async (name, cb) => { hooks[name] = cb; return { dispose: async () => {} }; } },
    },
  };
}

test('setup registers every skill the way OpenCode 2.x discovers them', async () => {
  const fake = fakeV2Context();
  await plugin.default.setup(fake.ctx);
  fake.runTransforms();

  assert.deepEqual([...fake.skills.keys()].sort(), [...skillDirs].sort());
  const skill = fake.skills.get('save-load');
  assert.equal(skill.name, 'save-load');
  assert.ok(skill.description.length > 0);
  assert.equal(basename(skill.path), 'SKILL.md');
  assert.ok(!skill.content.startsWith('---'), 'frontmatter is stripped');
});

test('setup leaves a same-id skill from another source alone', async () => {
  const fake = fakeV2Context();
  fake.skills.set('save-load', { id: 'save-load', name: 'save-load', path: '/elsewhere/SKILL.md', content: 'mine' });
  await plugin.default.setup(fake.ctx);
  fake.runTransforms();
  assert.equal(fake.skills.get('save-load').content, 'mine');
});

test('context hook injects the bootstrap once', async () => {
  const fake = fakeV2Context();
  await plugin.default.setup(fake.ctx);
  const event = { system: [{ type: 'text', text: 'host prompt' }], messages: [] };
  fake.hooks.context(event);
  fake.hooks.context(event);

  const injected = event.system.filter((p) => p.text.includes('You have GodotPrompter'));
  assert.equal(injected.length, 1);
  assert.equal(injected[0].type, 'text');
  assert.ok(injected[0].text.includes('Tool Mapping for OpenCode'));
});

test('OpenCode 1.x hooks register the skills path and bootstrap', async () => {
  const hooks = await plugin.default.server({ client: {}, directory: ROOT });
  const config = {};
  await hooks.config(config);
  assert.deepEqual(config.skills.paths, [SKILLS]);

  const output = { messages: [{ info: { role: 'user' }, parts: [{ type: 'text', text: 'hi' }] }] };
  await hooks['experimental.chat.messages.transform']({}, output);
  assert.ok(output.messages[0].parts[0].text.includes('You have GodotPrompter'));
});
