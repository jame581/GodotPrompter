# Contributing to GodotPrompter

Thanks for your interest in contributing! GodotPrompter is an open-source skills framework for Godot 4.x. Please review our [Code of Conduct](CODE_OF_CONDUCT.md) before participating. Here's how to add skills and improve existing ones.

## Adding a New Skill

### 1. Create the skill folder

```
skills/<skill-name>/
  SKILL.md          # Required — main skill document
  *.md              # Optional — supporting references
```

Use **kebab-case** for folder names (e.g., `my-new-skill`).

### 2. Write SKILL.md with frontmatter

Every `SKILL.md` must start with YAML frontmatter:

```yaml
---
name: my-new-skill
description: Use when [specific trigger] — [brief scope]
---
```

- `name` must match the folder name
- `description` should start with "Use when" to help agents decide when to load it

### 3. Structure your content

Follow this general structure:

1. **Title and intro** — What this skill covers, when to use it
2. **Related skills** — `> **Related skills:** **skill-a** for X, **skill-b** for Y.`
3. **Numbered sections** — Each major concept or pattern
4. **Code examples** — GDScript first, then C# equivalent
5. **Checklist** — Implementation checklist at the end

### 4. Code examples

- Include **both GDScript and C#** where applicable
- GDScript comes first, C# follows
- Use ` ```gdscript ` and ` ```csharp ` language tags (never `gd` or `cs`)
- Target **Godot 4.3+** APIs only — no deprecated methods
- Follow Godot style: snake_case for GDScript, PascalCase for C#

### 5. Cross-references

Add a related skills line after the intro paragraph:

```markdown
> **Related skills:** **event-bus** for decoupled communication, **component-system** for composition patterns.
```

Keep to 3-5 references max. Only link genuinely related skills.

## Improving Existing Skills

- Fix incorrect API references or deprecated methods
- Add missing C# examples where GDScript-only
- Add cross-references to related skills
- Expand checklist items
- Fix typos or unclear wording

## Testing Skills

Before submitting:

1. **Read through** — Does the skill make sense for someone new to Godot?
2. **Try the code** — Open Godot 4.3+ and verify examples compile and run
3. **Check C# parity** — Every GDScript example should have a C# equivalent (unless language-specific)
4. **Verify cross-refs** — Referenced skills must exist

## Adding Agents

Agent definitions go in `agents/<agent-name>.md` with YAML frontmatter:

```yaml
---
name: my-agent
description: |
  When to use this agent, with examples.
model: inherit
---

Agent system prompt goes here.
```

## Releasing a New Version

When publishing a new version (e.g., v1.8.1):

1. **Make changes** in the GodotPrompter repo.
2. **Regenerate the token-budget docs page** (added in v1.7.0):
   ```bash
   npm install                                                # one-time, installs optional tokenizer deps
   node scripts/count-tokens.mjs --tokenizer --markdown
   ```
   Replace the contents between the `<!-- BEGIN-TOKEN-TABLE -->` / `<!-- END-TOKEN-TABLE -->` markers in `docs/token-budget.md` with the new output. Commit alongside the version bump.
3. **Bump version across all manifests** using the helper script:
   ```bash
   node scripts/bump-version.mjs 1.8.1
   ```
   This updates five in-repo manifests in one shot:
   - `package.json`
   - `.claude-plugin/plugin.json`
   - `.claude-plugin/marketplace.json` (the `godot-prompter` plugin entry)
   - `.cursor-plugin/plugin.json`
   - `plugin.json` (at root, for Antigravity CLI)

   It also attempts to bump sibling marketplaces when present at known relative paths:
   - `../skillsmith/.claude-plugin/marketplace.json` (or `../../AI/skillsmith/.claude-plugin/marketplace.json`)
   - `../godot-prompter-marketplace/.claude-plugin/marketplace.json`
4. **Update `CHANGELOG.md`** by adding a `## [1.8.1]` section.
5. **Validate skills**:
   ```bash
   node scripts/validate-skills.mjs
   ```
6. **Commit and tag:**
   ```bash
   git add -A
   git commit -m "chore: bump version to 1.8.1"
   git tag -a v1.8.1 -m "v1.8.1 — description of changes"
   git push origin master --tags
   ```
7. **Let GitHub Actions publish the release** (`.github/workflows/release.yml`):
   - Verifies tag and manifest versions are consistent
   - Runs `scripts/validate-skills.mjs`
   - Creates the GitHub Release from the matching `CHANGELOG.md` section
   - Opens marketplace bump PRs when `MARKETPLACE_TOKEN` is configured
8. **If marketplace PRs are skipped** (missing `MARKETPLACE_TOKEN`), manually bump:
   - `skillsmith/.claude-plugin/marketplace.json` (primary distribution)
   - `godot-prompter-marketplace/.claude-plugin/marketplace.json` (legacy)

Users update with:
```bash
claude plugins update godot-prompter          # Claude Code
copilot plugin update godot-prompter          # Copilot CLI
agy plugin update godot-prompter              # Antigravity CLI
```

## Conventions

- Skills must be self-contained and independently useful
- One skill per folder under `skills/`
- GDScript follows [Godot style guide](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_styleguide.html)
- C# follows [Godot C# conventions](https://docs.godotengine.org/en/stable/tutorials/scripting/c_sharp/c_sharp_style_guide.html)
- Target Godot 4.3+ minimum
- YAML frontmatter is required on every SKILL.md

## Questions?

Open an issue on GitHub or check existing skills for examples of the expected format.
