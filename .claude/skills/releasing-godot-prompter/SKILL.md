---
name: releasing-godot-prompter
description: Use when cutting a GodotPrompter release or bumping its version — the version-bump sequence, tag-triggered workflow, and the marketplace manifests that must follow.
---

# Releasing GodotPrompter

Current version: check `package.json` and `.claude-plugin/plugin.json` (must match).
Full command sequence lives in `CONTRIBUTING.md`.

## Sequence

1. `node scripts/bump-version.mjs <version>` — bumps `package.json`,
   `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, plus sibling
   marketplaces if present; also syncs the live skill count into the
   "N domain-specific skills" text of each manifest description.
2. Update `CHANGELOG.md` with the new section.
3. Commit, tag (`v<version>`), push with tags — `.github/workflows/release.yml`
   then validates, creates the GitHub release, and opens marketplace PRs
   (when `MARKETPLACE_TOKEN` is configured).
4. If the workflow's marketplace step is skipped, manually bump
   `skillsmith/.claude-plugin/marketplace.json` (primary) and the legacy
   `godot-prompter-marketplace/.claude-plugin/marketplace.json`.

## Notes

- The root `plugin.json` (Antigravity) must match `package.json` too — step 1
  handles it, but verify before tagging.
- Auto-opened marketplace PRs need manual review approval on the sibling repos.
- Reset local sibling clones before pushing to avoid conflicts.
