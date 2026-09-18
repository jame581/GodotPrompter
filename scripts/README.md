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

## sync-codex-agents.mjs

Regenerates `.codex/agents/godot-prompter/*.toml` from the canonical Markdown agent sources in
`agents/*.md`, or checks that the mirrors are current.

```bash
node scripts/sync-codex-agents.mjs --write
node scripts/sync-codex-agents.mjs --check
```

## generate-skill-index.mjs

Builds the machine-readable skill and agent catalog at `skills/index.json`.

```bash
node scripts/generate-skill-index.mjs --write
node scripts/generate-skill-index.mjs --check
```

## validate-platform-metadata.mjs

Checks that `tests/agent-integration/host-smoke-matrix.json` covers every supported host and only
references files that exist.

```bash
node scripts/validate-platform-metadata.mjs
```

## Release workflow

`.github/workflows/release.yml` runs automatically on tag pushes matching `v*.*.*`. It:

1. Verifies version consistency between the tag, `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.cursor-plugin/plugin.json`, and `plugin.json`
2. Runs `validate-skills.mjs`
3. Runs hook, validator, and metadata tests
4. Creates the GitHub release using the matching CHANGELOG section as the body
5. Opens marketplace PRs against `skillsmith` and `godot-prompter-marketplace` (requires `MARKETPLACE_TOKEN` secret)

If `MARKETPLACE_TOKEN` is not set, the marketplace step logs a warning and is skipped — the release itself still succeeds. Bump the marketplaces manually per `CONTRIBUTING.md` in that case.

### Setting up MARKETPLACE_TOKEN

Create a fine-grained PAT with `pull_requests:write` and `contents:write` scoped to `jame581/skillsmith` and `jame581/godot-prompter-marketplace`. Add it as the repo secret `MARKETPLACE_TOKEN` under Settings → Secrets and variables → Actions.

## lib/frontmatter.mjs

Shared YAML frontmatter parser used by `sync-codex-agents.mjs` and `generate-skill-index.mjs`.
Unlike the presence-checking parser inside `validate-skills.mjs`, these two write their output to
disk, so block scalars must round-trip verbatim — blank lines are paragraph breaks and relative
indentation is Markdown list nesting. `tests/validator/frontmatter.test.mjs` pins that behaviour;
the generators' own `--check` tests compare generated output against generated output and cannot
catch a parser that silently drops content.
