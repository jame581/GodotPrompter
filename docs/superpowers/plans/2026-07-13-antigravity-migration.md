# Antigravity CLI & 2.0 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate GodotPrompter configuration and documentation from legacy Gemini CLI to modern Google Antigravity CLI (`agy`) and Antigravity 2.0.

**Architecture:** We will rename `gemini-extension.json` to `plugin.json` at the repository root, update the release version bump scripts and GitHub Actions workflows to target `plugin.json` instead, and rewrite documentation references from `gemini` commands to their modern `agy` equivalents.

**Tech Stack:** Node.js, GitHub Actions (YAML), Git, Antigravity CLI (`agy`).

---

### Task 1: Setup Feature Branch

**Files:**
- Modify: Git repository state

- [ ] **Step 1: Create and checkout feature branch**

Run:
```bash
git checkout -b migration/antigravity-cli
```
Expected: Switched to a new branch 'migration/antigravity-cli'

---

### Task 2: Manifest Migration

**Files:**
- Rename: `gemini-extension.json` -> `plugin.json`

- [x] **Step 1: Rename manifest file via Git**

Run:
```bash
git mv gemini-extension.json plugin.json
```

- [x] **Step 2: Update `plugin.json` content**

Overwrite [plugin.json](../../../plugin.json) with:
```json
{
  "$schema": "https://antigravity.google/schemas/v1/plugin.json",
  "name": "godot-prompter",
  "description": "Agentic skills framework for Godot 4.x — 51 domain-specific skills for GDScript and C#",
  "version": "1.11.1",
  "contextFileName": "GEMINI.md"
}
```

- [x] **Step 3: Validate the plugin structure**

Run:
```bash
agy plugin validate .
```
Expected output:
```
  [ok]    C:\Users\jakub.hubacek\source\repos\GodotPrompter
          ✔ skills      : 51 processed
          ✔ agents      : 9 processed
```

- [x] **Step 4: Dry-run local installation**

Run:
```bash
agy plugin install .
```
Expected: Plugin is registered successfully.

Run:
```bash
agy plugin list
```
Expected: Lists `godot-prompter` as imported.

- [x] **Step 5: Uninstall test registration**

Run:
```bash
agy plugin uninstall godot-prompter
```
Expected: Uninstalled plugin "godot-prompter".

- [x] **Step 6: Commit changes**

Run:
```bash
git add plugin.json
git commit -m "chore: migrate gemini-extension.json to plugin.json"
```

---

### Task 3: Update Version Bump Script

**Files:**
- Modify: `scripts/bump-version.mjs`

- [ ] **Step 1: Modify bump script manifest target**

In [bump-version.mjs](../../../scripts/bump-version.mjs), update line 37:
```javascript
  { path: resolve(ROOT, 'plugin.json'), key: 'version', descKey: 'description' },
```

- [ ] **Step 2: Test version bump dry-run**

Run:
```bash
node scripts/bump-version.mjs 1.11.2
```
Expected: Correctly bumps version in `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.cursor-plugin/plugin.json`, and `plugin.json`.

Revert version bump changes for testing:
```bash
git checkout -- package.json .claude-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/plugin.json plugin.json
```

- [ ] **Step 3: Commit changes**

Run:
```bash
git add scripts/bump-version.mjs
git commit -m "chore: update version bumper script to target plugin.json"
```

---

### Task 4: Update CI Release Workflow

**Files:**
- Modify: `.github/workflows/release.yml`

- [ ] **Step 1: Update version check variables in release workflow**

In [.github/workflows/release.yml](../../../.github/workflows/release.yml), update lines 29-31:
```yaml
          ANTIGRAVITY=$(node -p "require('./plugin.json').version")
          echo "tag=$TAG  package.json=$PKG  .claude-plugin/plugin.json=$PLUGIN  marketplace.json=$MARKET  .cursor-plugin/plugin.json=$CURSOR  plugin.json=$ANTIGRAVITY"
          if [ "$TAG" != "$PKG" ] || [ "$TAG" != "$PLUGIN" ] || [ "$TAG" != "$MARKET" ] || [ "$TAG" != "$CURSOR" ] || [ "$TAG" != "$ANTIGRAVITY" ]; then
```

- [ ] **Step 2: Commit changes**

Run:
```bash
git add .github/workflows/release.yml
git commit -m "ci: update release verification to check plugin.json version"
```

---

### Task 5: Update Developer and User Documentation

**Files:**
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `skills/using-godot-prompter/SKILL.md`

- [ ] **Step 1: Update CONTRIBUTING.md manifests**

In [CONTRIBUTING.md](../../../CONTRIBUTING.md) line 111, change:
```markdown
    - `gemini-extension.json`
```
to:
```markdown
    - `plugin.json` (at root, for Antigravity CLI)
```

- [ ] **Step 2: Update README.md platform commands**

In [README.md](../../../README.md), replace lines 63-67:
```markdown
### Antigravity CLI (`agy`)

```bash
git clone https://github.com/jame581/GodotPrompter
cd GodotPrompter && agy plugin install .
```
```

And in the "Supported Platforms" table on line 158:
```markdown
| Antigravity CLI (`agy`) | Supported | `git clone https://github.com/jame581/GodotPrompter && cd GodotPrompter && agy plugin install .` |
```

- [ ] **Step 3: Update using-godot-prompter SKILL.md**

In [SKILL.md](../../../skills/using-godot-prompter/SKILL.md) lines 18-20, update the Gemini CLI reference:
```markdown
**In Gemini CLI:** Deprecated (succeeded by Antigravity CLI).
```

In the Antigravity section on lines 26-57:
Update it to add the `agy plugin install` method:
```markdown
**In Antigravity (2.0, IDE, CLI):** Skills activate automatically when your prompt matches a skill's `description` frontmatter — no tool call needed. Install the plugin using:
```bash
git clone https://github.com/jame581/GodotPrompter
cd GodotPrompter && agy plugin install .
```
For manual, workspace, or cross-project installations:
... [keep existing instructions for workspace junctions and global symlinks as fallback references]
```

- [ ] **Step 4: Commit changes**

Run:
```bash
git add README.md CONTRIBUTING.md skills/using-godot-prompter/SKILL.md
git commit -m "docs: update install commands and reference docs to Antigravity CLI"
```
