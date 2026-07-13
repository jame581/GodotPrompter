# Antigravity CLI & 2.0 Migration Design

This design specifies the migration of the GodotPrompter skills framework plugin from the deprecated Gemini CLI to the modern Google Antigravity (AGY) CLI and Antigravity 2.0 desktop platform.

## Background

The Gemini CLI was deprecated and succeeded by Google Antigravity (AGY). The legacy installation path and config file (`gemini-extension.json`) are no longer recognized by the `agy` CLI or Antigravity 2.0 desktop/IDE platform. Instead, the platform requires a `plugin.json` manifest file at the root of the plugin directory to successfully process and import custom skills and agents.

## Design Requirements

1. **Manifest Relocation:** Replace `gemini-extension.json` with `plugin.json` at the root of the repository.
2. **Version Parity:** Keep `plugin.json`'s version field in sync with the repository version (via version bump scripts and GitHub release workflows).
3. **Antigravity CLI Support:** Make installation work natively using `agy plugin install`.
4. **Documentation Alignment:** Update instructions in `README.md`, `CONTRIBUTING.md`, and `skills/using-godot-prompter/SKILL.md` to reference the Antigravity CLI and 2.0 platform.

---

## Detailed Changes

### 1. Root Manifest (`plugin.json`)
The file `gemini-extension.json` is renamed to `plugin.json` at the repository root.
```json
{
  "$schema": "https://antigravity.google/schemas/v1/plugin.json",
  "name": "godot-prompter",
  "version": "1.11.1",
  "description": "Agentic skills framework for Godot 4.x — 51 domain-specific skills for GDScript and C#",
  "contextFileName": "GEMINI.md"
}
```

### 2. Version Bump Script (`scripts/bump-version.mjs`)
We redirect the file targeting of the version bumper from `gemini-extension.json` to `plugin.json`.
```diff
-  { path: resolve(ROOT, 'gemini-extension.json'), key: 'version', descKey: 'description' },
+  { path: resolve(ROOT, 'plugin.json'), key: 'version', descKey: 'description' },
```

### 3. Release Verification Workflow (`.github/workflows/release.yml`)
The workflow tag verification is updated to parse `plugin.json` instead of `gemini-extension.json`:
```diff
-          GEMINI=$(node -p "require('./gemini-extension.json').version")
-          echo "tag=$TAG  package.json=$PKG  plugin.json=$PLUGIN  marketplace.json=$MARKET  .cursor-plugin/plugin.json=$CURSOR  gemini-extension.json=$GEMINI"
-          if [ "$TAG" != "$PKG" ] || [ "$TAG" != "$PLUGIN" ] || [ "$TAG" != "$MARKET" ] || [ "$TAG" != "$CURSOR" ] || [ "$TAG" != "$GEMINI" ]; then
+          ANTIGRAVITY=$(node -p "require('./plugin.json').version")
+          echo "tag=$TAG  package.json=$PKG  .claude-plugin/plugin.json=$PLUGIN  marketplace.json=$MARKET  .cursor-plugin/plugin.json=$CURSOR  plugin.json=$ANTIGRAVITY"
+          if [ "$TAG" != "$PKG" ] || [ "$TAG" != "$PLUGIN" ] || [ "$TAG" != "$MARKET" ] || [ "$TAG" != "$CURSOR" ] || [ "$TAG" != "$ANTIGRAVITY" ]; then
```

### 4. Developer / Contributor Docs (`CONTRIBUTING.md`)
In `CONTRIBUTING.md`, manifest listings are updated:
```diff
     This updates five in-repo manifests in one shot:
     - `package.json`
     - `.claude-plugin/plugin.json`
     - `.claude-plugin/marketplace.json` (the `godot-prompter` plugin entry)
     - `.cursor-plugin/plugin.json`
-    - `gemini-extension.json`
+    - `plugin.json`
```

### 5. Setup & Usage Docs (`README.md`)
Replace legacy Gemini CLI install headers with Antigravity instructions:
```diff
-### Gemini CLI
-
-```bash
-gemini extensions install https://github.com/jame581/GodotPrompter
-```
+### Antigravity CLI (`agy`)
+
+```bash
+git clone https://github.com/jame581/GodotPrompter
+cd GodotPrompter && agy plugin install .
+```
```
And replace the table row:
```diff
-| Gemini CLI | Supported | `gemini extensions install https://github.com/jame581/GodotPrompter` |
+| Antigravity CLI (`agy`) | Supported | `git clone https://github.com/jame581/GodotPrompter && cd GodotPrompter && agy plugin install .` |
```

### 6. Skill Bootstrap Instructions (`skills/using-godot-prompter/SKILL.md`)
Update the skill catalog instructions:
- Update references of "Gemini CLI" to "Antigravity CLI".
- Document `agy plugin install` as the modern, recommended way to install global/workspace plugins rather than manually symlinking.

---

## Verification Plan

1. **Local Rename Validation:**
   - Execute `git mv gemini-extension.json plugin.json`
   - Run `agy plugin validate .` to confirm the plugin structures, skills (51), and agents (9) are successfully detected.
2. **Local Installation Validation:**
   - Run `agy plugin install .` to confirm installation succeeds and is correctly registered.
   - Run `agy plugin list` to check for active load of `godot-prompter`.
3. **Version Bump Dry-Run:**
   - Test `node scripts/bump-version.mjs 1.11.2` (and then revert) to ensure the bumper correctly updates `plugin.json` version and description fields without errors.
4. **Skills/Agent Verification:**
   - Check if the imported skills and agents load into the active environment without warning.
