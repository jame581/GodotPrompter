/**
 * GodotPrompter plugin for OpenCode.ai
 *
 * Supports both plugin APIs from one entrypoint:
 * - OpenCode 2.x reads the default export's `id` + `setup`: skills are added
 *   through a skill transform, the bootstrap through the session context hook.
 * - OpenCode 1.x calls `server` (1.18.29+) or the named export (older): skills
 *   are registered via the config hook, the bootstrap via a messages transform.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const extractAndStripFrontmatter = (content) => {
  const match = content.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };

  const body = match[2];
  const frontmatter = {};

  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: body };
};

const godotPrompterSkillsDir = path.resolve(__dirname, '../../skills');

const getBootstrapContent = () => {
  const skillPath = path.join(godotPrompterSkillsDir, 'using-godot-prompter', 'SKILL.md');
  if (!fs.existsSync(skillPath)) return null;

  const fullContent = fs.readFileSync(skillPath, 'utf8');
  const { content } = extractAndStripFrontmatter(fullContent);

  const toolMapping = `**Tool Mapping for OpenCode:**
When skills reference tools you don't have, substitute OpenCode equivalents:
- \`TodoWrite\` → \`todowrite\`
- \`Task\` tool with subagents → Use OpenCode's subagent system (@mention)
- \`Skill\` tool → OpenCode's native \`skill\` tool
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → Your native tools

Use OpenCode's native \`skill\` tool to list and load skills.`;

  return `<IMPORTANT>
You have GodotPrompter — Godot 4.x game development skills.

**The using-godot-prompter skill is included below. It is ALREADY LOADED — do NOT reload it.**

${content}

${toolMapping}
</IMPORTANT>`;
};

// Mirrors OpenCode 2.x's own directory loader: id is the skill's folder name,
// path is the SKILL.md (the host lists sibling files such as references/ from it).
const readSkills = () => {
  if (!fs.existsSync(godotPrompterSkillsDir)) return [];
  const skills = [];
  for (const entry of fs.readdirSync(godotPrompterSkillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(godotPrompterSkillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;
    const { frontmatter, content } = extractAndStripFrontmatter(fs.readFileSync(skillPath, 'utf8'));
    skills.push({
      id: entry.name,
      name: frontmatter.name || entry.name,
      ...(frontmatter.description ? { description: frontmatter.description } : {}),
      path: skillPath,
      content,
    });
  }
  return skills;
};

// OpenCode 1.x
export const GodotPrompterPlugin = async ({ client, directory }) => {
  return {
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(godotPrompterSkillsDir)) {
        config.skills.paths.push(godotPrompterSkillsDir);
      }
    },

    'experimental.chat.messages.transform': async (_input, output) => {
      const bootstrap = getBootstrapContent();
      if (!bootstrap || !output.messages.length) return;
      const firstUser = output.messages.find(m => m.info.role === 'user');
      if (!firstUser || !firstUser.parts.length) return;
      if (firstUser.parts.some(p => p.type === 'text' && p.text.includes('GodotPrompter'))) return;
      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    }
  };
};

// OpenCode 2.x. Transforms must be synchronous, so files are read before registering.
const setup = async (ctx) => {
  const skills = readSkills();
  const bootstrap = getBootstrapContent();

  await ctx.skill.transform((editor) => {
    for (const skill of skills) {
      if (!editor.get(skill.id)) editor.add(skill);
    }
  });

  if (bootstrap) {
    await ctx.session.hook('context', (event) => {
      if (event.system.some(p => p.type === 'text' && p.text.includes('You have GodotPrompter'))) return;
      event.system.push({ type: 'text', text: bootstrap });
    });
  }
};

export default {
  id: 'godot-prompter',
  setup,
  server: GodotPrompterPlugin,
};
