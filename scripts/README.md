# scripts/

Local helpers for the GodotPrompter repo. All scripts are Node.js 20+ ES modules with no external dependencies (stdlib only).

## validate-skills.mjs

Validates `skills/*/SKILL.md` and `agents/*.md` for required structure and resolvable cross-references.

```bash
node scripts/validate-skills.mjs            # human-readable report
node scripts/validate-skills.mjs --json     # machine-readable for CI
```

Exit code: 1 if any errors, 0 otherwise (warnings do not fail).

## bump-version.mjs

Bumps the version string across all in-repo files that track it:
- `package.json`
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
- `.cursor-plugin/plugin.json`
- `plugin.json` (at root, for Antigravity CLI)

If sibling marketplace repos are present at `../skillsmith` and `../godot-prompter-marketplace`, also bumps their `.claude-plugin/marketplace.json`. Otherwise prints manual instructions.

```bash
node scripts/bump-version.mjs 1.5.0
```

Verifies current versions match before bumping; errors out on drift.

## Release workflow

`.github/workflows/release.yml` runs automatically on tag pushes matching `v*.*.*`. It:

1. Verifies version consistency between the tag, `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.cursor-plugin/plugin.json`, and `plugin.json`
2. Runs `validate-skills.mjs`
3. Creates the GitHub release using the matching CHANGELOG section as the body
4. Opens marketplace PRs against `skillsmith` and `godot-prompter-marketplace` (requires `MARKETPLACE_TOKEN` secret)

If `MARKETPLACE_TOKEN` is not set, the marketplace step logs a warning and is skipped — the release itself still succeeds. Bump the marketplaces manually per `CONTRIBUTING.md` in that case.

### Setting up MARKETPLACE_TOKEN

Create a fine-grained PAT with `pull_requests:write` and `contents:write` scoped to `jame581/skillsmith` and `jame581/godot-prompter-marketplace`. Add it as the repo secret `MARKETPLACE_TOKEN` under Settings → Secrets and variables → Actions.
