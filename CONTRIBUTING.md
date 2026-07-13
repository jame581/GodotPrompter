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

## Third-Party Addon Skills

Skills that document a community addon (`limboai`, `beehave`, `popochiu`, `dialogue-manager`,
`phantom-camera`) follow extra rules, because they describe code we don't control:

1. **Pin the version** in a header line under the Related-skills line, with the addon's own minimum Godot
   version — which may be higher than the repo's 4.3+ baseline:

   ```markdown
   > **Addon:** Popochiu · version `v2.1.1` · Godot 4.6 · MIT · source: https://github.com/carenalgas/popochiu · pure GDScript.
   ```

2. **Research against the pinned tag, never the live docs site.** Addon docs sites track `main`/`develop`
   and routinely document APIs that don't exist in the released version. Read the tag's source
   (`git show v<tag>:<path>` on a clone) and record findings in
   `docs/superpowers/notes/<date>-<addon>-research.md` with a source citation per API fact. Real examples
   this caught: Popochiu's docs site shows an `E.active_command` that doesn't exist in v2.1.1 (it's
   `E.current_command`), and Dialogue Manager's `API.md` claims end-of-dialogue returns `{}` when the
   source returns `null`.

3. **Decide C# parity by what the addon actually ships** — not by assumption. If it has an official C#
   API, the skill needs a C# block in every GDScript-bearing section (`dialogue-manager`,
   `phantom-camera`). If it's genuinely GDScript-only, add it to `GDSCRIPT_ONLY_BY_DESIGN` in
   `scripts/validate-skills.mjs` so its sections emit intentional `csharp-parity-accepted` warnings
   instead of parity debt (`beehave`, `popochiu`). **Check for `.cs`/`.csproj` files in the addon before
   deciding** — v1.12.0 shipped `phantom-camera` as "GDScript-only" on a false assumption and had to
   rewrite it mid-release.

4. **Wire it in**: README's Third-Party Addons table, the `using-godot-prompter` index, the routing lines
   in `agents/godot-game-dev.md` + `agents/godot-game-architect.md`, and a bidirectional cross-ref with
   the core skill it sits next to (e.g. `phantom-camera` ↔ `camera-system`).

## Improving Existing Skills

- Fix incorrect API references or deprecated methods
- Add missing C# examples where GDScript-only
- Add cross-references to related skills
- Expand checklist items
- Fix typos or unclear wording

## Token Budget (enforced)

Every `SKILL.md` must stay **under 16 KB** (16,384 bytes). Since v1.12.0 this is a **hard rule**: the
validator raises a `token-budget-exceeded` **error** and CI fails the release. An advisory
`token-budget-approaching` **warning** fires from 15.5 KB (15,872 bytes) so you get a signal before the
wall.

Bytes are measured **LF-normalized**, so a Windows (CRLF) checkout reports the same numbers as CI —
trust `node scripts/validate-skills.mjs` over a raw `wc -c`.

If a skill would exceed the budget, don't cut teaching content — restructure with **Pattern X**: keep the
canonical recipe, key decisions, and anti-patterns in `SKILL.md`, and move deep dives into
`skills/<name>/references/<topic>.md` (unlimited size, loaded only when an agent opens them). Link every
reference file from `SKILL.md` or the validator will flag it as orphaned.

## Testing Skills

Before submitting:

1. **Read through** — Does the skill make sense for someone new to Godot?
2. **Try the code** — Open Godot 4.3+ and verify examples compile and run
3. **Check C# parity** — Every GDScript example should have a C# equivalent (unless language-specific)
4. **Verify cross-refs** — Referenced skills must exist
5. **Run the validator** — `node scripts/validate-skills.mjs` must report **0 errors** (it checks
   frontmatter, cross-references, the token budget, and orphaned reference files)

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
