---
name: releasing-godot-prompter
description: Use when cutting a GodotPrompter release or bumping its version — the version-bump sequence, tag-triggered workflow, and the marketplace manifests that must follow.
---

# Releasing GodotPrompter

Current version: check `package.json` and `.claude-plugin/plugin.json` (must match).
Full command sequence lives in `CONTRIBUTING.md`.

## Sequence

1. `node scripts/bump-version.mjs <version>` — bumps all **five** files
   `release.yml` verifies (`package.json`, the root `plugin.json` (Antigravity),
   `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`,
   `.cursor-plugin/plugin.json`), plus sibling marketplaces if present; also syncs the live
   skill count into the "N domain-specific skills" text of each manifest description.
2. Do the two things the bump script does **not** touch:
   - regenerate the table in `docs/token-budget.md`
     (`npm ci --prefix scripts && node scripts/count-tokens.mjs --tokenizer --markdown`, pasted between the
     `TOKEN-TABLE` markers) and fix the skill/agent counts in the intro above them;
   - set the Grok "pin to a release" example in `README.md` to the new tag — it sat at
     v1.11.0 through three releases.
3. Update `CHANGELOG.md` with the new section.
4. Commit on a `release/v<version>` branch, open a PR and merge it (`master` is protected by the
   "Protect master" ruleset: no direct push). Then tag the merge commit on `master` with an annotated
   tag (`git tag -a v<version>`) and `git push origin v<version>` — `.github/workflows/release.yml`
   then validates, creates the GitHub release, commits the plugin-only bundle to
   the `plugin-bundle` branch (what Anthropic's plugin directory and both marketplaces install
   from), and opens marketplace PRs that point the entry at `"ref": "plugin-bundle"` (when
   `MARKETPLACE_TOKEN` is configured). Merge those PRs only after `plugin-bundle` has the tag's commit.
5. If the workflow's marketplace step is skipped, manually bump
   `skillsmith/.claude-plugin/marketplace.json` (primary) and the legacy
   `godot-prompter-marketplace/.claude-plugin/marketplace.json`.

## Notes

- The root `plugin.json` (Antigravity) must match `package.json` too — step 1
  handles it, but verify before tagging.
- Auto-opened marketplace PRs need manual review approval on the sibling repos.
- Reset local sibling clones before pushing to avoid conflicts.
