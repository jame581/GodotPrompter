# Discussion replies for v1.17.0

Drafts for Jan to post himself, written 2026-11-11. Nothing here has been posted.

## Discussion #18: Skills being over-used

Thanks for the detailed report. I reproduced it in a test RPG scaffold: with an inventory and abilities already in place, asking Claude Code to extend them loaded `inventory-system` / `ability-system` in 5 of 5 runs. The session card said when to load a skill, never when not to.

Fixed in v1.17.0. The card and the bootstrap now say: to change or extend a system the project already has, follow the project's code; docs and repo tooling need no skill. Same prompts after the change: 0 of 5 loads, same graded answer quality.

My test harness only runs Claude Code, so I did not measure Codex. What I can say is that Codex now loads about 40% less bootstrap text every session (15.3 KB down to 9.1 KB), and it carries the same rule.

**Turning off single skills:** the README has a table for every host: https://github.com/jame581/GodotPrompter#using-fewer-skills
- Claude Code: `"permissions": {"deny": ["Skill(godot-prompter:save-load)"]}` in `.claude/settings.json` (checked on Claude Code 2.1.322)
- Codex: link only the skills you want into `~/.agents/skills/`, or disable one in `~/.codex/config.toml`

**If you added a `## GodotPrompter` section to your project instructions earlier**, it still has the old blanket rule. Replace its line with:

```
Invoke the matching `godot-prompter:*` skill before building a new Godot system; to change or extend an existing one, follow the project's code.
```

This ships in v1.17.0, which waits on Godot 4.8-stable for its 4.8 pass, so there's no date yet.

## Discussion #20: Odd install instructions for Codex?

Fair question. The symlink in `~/.agents/skills` is what Codex scans, and other agents that read that folder can see it too, so the skills are already discoverable there. Your point is really about where the clone lives.

Option A (`~/.codex/skills`) is not a location the Codex skills docs list; they name `$HOME/.agents/skills`. Option B can't be a plain clone into `~/.agents/skills/godot-prompter`, because the skill folders sit one level down in `skills/`, so a symlink to that subfolder is needed anyway. The clone then has to live somewhere, and `~/.codex` also holds the optional subagents link. So I'm keeping the layout. If you prefer, clone anywhere (for example `~/.agents/godot-prompter`) and point the symlink at its `skills/` folder; it works the same.
