---
name: authoring-godot-prompter-skills
description: Use when writing or editing a SKILL.md or an agent definition in this repo — required frontmatter, section ordering, and the GDScript-then-C# example convention.
---

# Authoring GodotPrompter skills and agents

File format templates for this repo. See the root `CLAUDE.md` for the conventions
and size budget that govern the content itself.

## SKILL.md format

Every skill must start with YAML frontmatter:

```yaml
---
name: skill-name
description: Use when [trigger] — [brief scope]
---
```

Followed by:
1. Title and intro
2. Related skills line: `> **Related skills:** **skill-a** for X, **skill-b** for Y.`
3. Numbered sections with patterns and examples
4. GDScript first, then C# equivalent (use `gdscript` and `csharp` language tags)
5. Implementation checklist at the end

## Agent format

Agent definitions in `agents/<name>.md` use YAML frontmatter:

```yaml
---
name: agent-name
description: |
  When to use, with <example> blocks.
model: inherit
---
```

## Before you finish

Run `node scripts/validate-skills.mjs` — it enforces frontmatter, cross-references,
and the 16 KB size budget.
