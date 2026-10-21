# scripts/

Local helpers for the GodotPrompter repo. All scripts are Node.js 20+ ES modules using only Node's standard library, with one exception: `count-tokens.mjs --tokenizer` needs the tokenizer packages declared in `scripts/package.json` (`npm ci --prefix scripts`). The repository root deliberately has no dependencies or lockfile.

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

Also syncs the live skill count into the "N domain-specific skills" text of each manifest description. If sibling marketplace repos are present at `../skillsmith` and `../godot-prompter-marketplace`, also bumps their `.claude-plugin/marketplace.json` (version and description) and syncs the skill and agent counts in their `README.md` via `sync-marketplace-readme.mjs`. Otherwise prints manual instructions.

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

## build-directory-bundle.mjs

Builds the plugin-only tree that Anthropic's plugin directory follows: skills, agents, the SessionStart hook, the manifest and icon, README, LICENSE, PRIVACY and SECURITY. The repository root is the plugin folder, and its `evals/`, `docs/`, `tests/` and workflows push it past the directory's 512-file limit.

```bash
node scripts/build-directory-bundle.mjs <out-dir> [--ref <git-ref>]   # --ref: where README links to omitted files point (default master)
node scripts/build-directory-bundle.mjs --check                       # build to a temp dir, enforce file-count and size limits, clean up
```

## sync-marketplace-readme.mjs

Rewrites the skill and agent counts in the marketplace repos' READMEs, between the `godot-prompter-skills` / `godot-prompter-agents` comment markers.

```bash
node scripts/sync-marketplace-readme.mjs ../skillsmith/README.md ../godot-prompter-marketplace/README.md
```

## count-tokens.mjs

Reports byte size and token cost for every skill, reference and agent. `--tokenizer` adds real Claude and GPT token counts (run `npm ci --prefix scripts` first); `--markdown` prints the table pasted between the `TOKEN-TABLE` markers in `docs/token-budget.md`; `--json` is machine-readable.

```bash
node scripts/count-tokens.mjs --tokenizer --markdown
```

## Release workflow

`.github/workflows/release.yml` runs automatically on tag pushes matching `v*.*.*`. It:

1. Verifies version consistency between the tag, `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.cursor-plugin/plugin.json`, and `plugin.json`
2. Runs `validate-skills.mjs`
3. Runs hook, validator, and metadata tests
4. Creates the GitHub release using the matching CHANGELOG section as the body
5. Builds the plugin-only bundle (`build-directory-bundle.mjs`) and commits it to the `plugin-bundle` branch (the `directory-bundle` job), which Anthropic's plugin directory and both marketplaces install from
6. After the bundle job, opens marketplace PRs against `skillsmith` and `godot-prompter-marketplace` that point the entry at `"ref": "plugin-bundle"`, with the skill and agent counts in their READMEs synced by `sync-marketplace-readme.mjs` (requires `MARKETPLACE_TOKEN` secret)

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
