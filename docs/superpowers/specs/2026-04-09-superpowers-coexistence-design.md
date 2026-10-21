# GodotPrompter — Superpowers Coexistence Fix

**Status:** shipped in v1.4.1 (2026-04-09)

**Problem:** When GodotPrompter and Superpowers are both installed, Superpowers' aggressive workflow (brainstorming → writing-plans → executing-plans) takes over the entire session. GodotPrompter's domain-specific skills are never invoked during implementation, even when the user explicitly requests them. This was observed in the DooGoo project (April 9, 2026) where all 35 commits used only Superpowers skills despite GodotPrompter being available.

**Root cause:** Three handoff gaps:
1. `using-godot-prompter` bootstrap is passive — it describes skills but doesn't assert priority alongside other plugins
2. `godot-brainstorming` Step 4 says "create implementation plan" without specifying how, so `superpowers:writing-plans` takes over
3. Subagents spawned during plan execution don't know about GodotPrompter because nothing persists the instruction

**Goal:** Make GodotPrompter skills reliably invoked during Godot development regardless of which workflow plugin drives the session, without modifying Superpowers.

**Approach:** Assertive bootstrap + CLAUDE.md injection + plan task annotation.

---

## Change 1: Assertive Bootstrap (`using-godot-prompter`)

Add a "Coexistence with Other Plugins" section near the top of `skills/using-godot-prompter/SKILL.md`, after the "How to Access Skills" section.

### Content

```markdown
## Coexistence with Other Plugins (e.g., Superpowers)

When another plugin (like Superpowers) is handling workflow (brainstorming, planning,
execution), GodotPrompter skills STILL APPLY during implementation. They are not
replaced — they are domain-specific guidance that workflow plugins cannot provide.

**RULE: Before implementing ANY Godot system, you MUST check for a matching
godot-prompter skill and invoke it.**

This is not optional. Workflow plugins handle HOW you work. GodotPrompter handles
WHAT you build. Both are needed.

| Implementing...         | MUST invoke skill                                      |
|-------------------------|--------------------------------------------------------|
| Player movement         | `godot-prompter:player-controller`                     |
| State machine / FSM     | `godot-prompter:state-machine`                         |
| Signals / EventBus      | `godot-prompter:event-bus`                             |
| Scene tree structure    | `godot-prompter:scene-organization`                    |
| UI / HUD                | `godot-prompter:godot-ui`, `godot-prompter:hud-system` |
| Inventory               | `godot-prompter:inventory-system`                      |
| Save/Load               | `godot-prompter:save-load`                             |
| Enemy AI / navigation   | `godot-prompter:ai-navigation`                         |
| Camera                  | `godot-prompter:camera-system`                         |
| Audio                   | `godot-prompter:audio-system`                          |
| Weapons / combat        | `godot-prompter:component-system`                      |
| Resources / data        | `godot-prompter:resource-pattern`                      |
| Input handling          | `godot-prompter:input-handling`                        |
| Animation               | `godot-prompter:animation-system`                      |
| Testing                 | `godot-prompter:godot-testing`                         |
| Project scaffolding     | `godot-prompter:godot-project-setup`                   |
| Shaders / VFX           | `godot-prompter:shader-basics`, `godot-prompter:particles-vfx` |
| Physics                 | `godot-prompter:physics-system`                        |
| Multiplayer             | `godot-prompter:multiplayer-basics`                    |
| Export / deploy         | `godot-prompter:export-pipeline`                       |

**For subagents:** If you are a subagent executing a plan task in a Godot project,
check this table before writing code. The skill provides Godot-specific patterns,
node types, and checklists you cannot derive from general knowledge.
```

### Rationale

Mirrors the assertive language of `superpowers:using-superpowers` ("even 1% chance → MUST invoke") but scoped to Godot implementation tasks. The lookup table removes ambiguity — Claude doesn't need to guess which skill applies.

---

## Change 2: CLAUDE.md Injection

Both `godot-brainstorming` and `godot-project-setup` will inject a GodotPrompter section into the project's CLAUDE.md. This ensures subagents and future sessions inherit the instruction.

### Injected Content

```markdown
## GodotPrompter

This is a Godot project with GodotPrompter skills available. Before implementing any
game system, you MUST check for a matching `godot-prompter:*` skill and invoke it.
This applies to all agents, subagents, and sessions working in this repository.

Key skills: `player-controller`, `state-machine`, `event-bus`, `scene-organization`,
`component-system`, `resource-pattern`, `godot-ui`, `hud-system`, `ai-navigation`,
`camera-system`, `audio-system`, `save-load`, `inventory-system`, `godot-testing`.

For the full skill list, invoke `godot-prompter:using-godot-prompter`.
```

### Injection Logic

- Check if CLAUDE.md exists in the project root.
  - If yes: check for `## GodotPrompter` heading. If absent, append the section.
  - If no: create CLAUDE.md with a project overview header + this section.
- Idempotent — never duplicate the section.

### Where It's Triggered

- **`godot-brainstorming`** — At the new Step 4, before creating the implementation plan.
- **`godot-project-setup`** — As a required item in the project scaffolding checklist.

---

## Change 3: Rewrite `godot-brainstorming` Step 4

### Current Step 4

```markdown
### Step 4: Create implementation plan
After the design is approved, break it into ordered implementation tasks. Each task should:
- Reference the specific GodotPrompter skills to follow
- List exact files to create
- Be small enough to implement in one session

Save the plan to `docs/godot-prompter/plans/` in the user's project.
```

### New Step 4

```markdown
### Step 4: Prepare for implementation

After the design is approved:

1. **Inject CLAUDE.md** — Add the GodotPrompter integration section to the project's
   CLAUDE.md (see CLAUDE.md Injection below). This ensures all subagents and future
   sessions know to use GodotPrompter skills. Skip if the section already exists.

2. **Create implementation plan** — If a planning skill is available (e.g.,
   superpowers:writing-plans), use it. If not, break the design into ordered tasks
   yourself and save to `docs/godot-prompter/plans/`.

3. **Annotate each task with skills** — Every task in the plan that involves a Godot
   system MUST list which `godot-prompter:*` skill(s) to invoke during implementation.
   Example:

   - [ ] **Task 3: Player movement** — Create CharacterBody3D with walk, sprint, jump.
     Skills: `godot-prompter:player-controller`, `godot-prompter:input-handling`

   This ensures that even when another plugin executes the plan, the implementing
   agent knows which GodotPrompter skills to load.
```

### CLAUDE.md Injection Reference (added to `godot-brainstorming`)

```markdown
### CLAUDE.md Injection

When preparing for implementation, add the following section to the project's CLAUDE.md.
Check for an existing `## GodotPrompter` heading first — if present, skip.

> ## GodotPrompter
>
> This is a Godot project with GodotPrompter skills available. Before implementing any
> game system, you MUST check for a matching `godot-prompter:*` skill and invoke it.
> This applies to all agents, subagents, and sessions working in this repository.
>
> Key skills: `player-controller`, `state-machine`, `event-bus`, `scene-organization`,
> `component-system`, `resource-pattern`, `godot-ui`, `hud-system`, `ai-navigation`,
> `camera-system`, `audio-system`, `save-load`, `inventory-system`, `godot-testing`.
>
> For the full skill list, invoke `godot-prompter:using-godot-prompter`.
```

---

## Change 4: Update `godot-project-setup` Checklist

Add a checklist item to the existing "Project Setup Checklist" in `godot-project-setup`:

```markdown
- [ ] CLAUDE.md contains `## GodotPrompter` section (see godot-brainstorming for content)
```

---

## Files Changed

| File | Change |
|---|---|
| `skills/using-godot-prompter/SKILL.md` | Add "Coexistence with Other Plugins" section after "How to Access Skills" |
| `skills/godot-brainstorming/SKILL.md` | Rewrite Step 4 + add CLAUDE.md Injection reference section |
| `skills/godot-project-setup/SKILL.md` | Add CLAUDE.md checklist item to Project Setup Checklist |

## What This Fixes

- **Session level:** Assertive bootstrap tells Claude to check GodotPrompter skills even when Superpowers is driving
- **Subagent level:** CLAUDE.md injection means every subagent reads the rule on startup
- **Plan level:** Skill annotations on each task mean the executing agent knows exactly which skill to load
- **Future sessions:** CLAUDE.md persists in the repo, so new sessions inherit the rule

## What This Doesn't Change

- No modifications to Superpowers
- GodotPrompter still works standalone (no Superpowers dependency added)
- Existing skill content unchanged — only bootstrap, brainstorming handoff, and project setup are touched
