# Superpowers Coexistence Fix — Implementation Plan

**Status:** shipped in v1.4.1 (2026-04-09)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make GodotPrompter skills reliably invoked during Godot development even when Superpowers drives the workflow, by asserting skill priority in the bootstrap, injecting CLAUDE.md rules, and annotating plan tasks with skill references.

**Architecture:** Three targeted edits to existing skill files — no new files, no new dependencies. The bootstrap gets a coexistence section, brainstorming gets a rewritten Step 4 with CLAUDE.md injection, and project-setup gets a checklist item.

**Tech Stack:** Markdown skill files (SKILL.md)

**Design Spec:** `docs/superpowers/specs/2026-04-09-superpowers-coexistence-design.md`

---

## File Map

| File | Responsibility |
|---|---|
| `skills/using-godot-prompter/SKILL.md` | Bootstrap skill — add coexistence section after "How to Access Skills" |
| `skills/godot-brainstorming/SKILL.md` | Brainstorming skill — rewrite Step 4, add CLAUDE.md injection reference |
| `skills/godot-project-setup/SKILL.md` | Project setup skill — add CLAUDE.md checklist item |

---

### Task 1: Add Coexistence Section to Bootstrap

**Files:**
- Modify: `skills/using-godot-prompter/SKILL.md:18` (insert after "How to Access Skills" section, before "Workflow: From Idea to Working Game")

- [ ] **Step 1: Insert coexistence section**

After line 18 (end of "How to Access Skills" section, before the blank line preceding "## Workflow"), insert:

```markdown
## Coexistence with Other Plugins (e.g., Superpowers)

When another plugin (like Superpowers) is handling workflow (brainstorming, planning, execution), GodotPrompter skills STILL APPLY during implementation. They are not replaced — they are domain-specific guidance that workflow plugins cannot provide.

**RULE: Before implementing ANY Godot system, you MUST check for a matching godot-prompter skill and invoke it.**

This is not optional. Workflow plugins handle HOW you work. GodotPrompter handles WHAT you build. Both are needed.

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

**For subagents:** If you are a subagent executing a plan task in a Godot project, check this table before writing code. The skill provides Godot-specific patterns, node types, and checklists you cannot derive from general knowledge.
```

- [ ] **Step 2: Verify the file reads correctly**

Read `skills/using-godot-prompter/SKILL.md` and confirm:
- The coexistence section appears between "How to Access Skills" and "Workflow: From Idea to Working Game"
- The table renders with all 20 rows
- No duplicate headings or broken markdown

- [ ] **Step 3: Commit**

```bash
git add skills/using-godot-prompter/SKILL.md
git commit -m "feat: add coexistence section to bootstrap skill

Ensures GodotPrompter skills are checked during implementation even
when Superpowers or another workflow plugin drives the session."
```

---

### Task 2: Rewrite Brainstorming Step 4 and Add CLAUDE.md Injection

**Files:**
- Modify: `skills/godot-brainstorming/SKILL.md:34-41` (replace Step 4 and add injection reference)

- [ ] **Step 1: Replace Step 4**

Replace the existing Step 4 (lines 34-41):

```markdown
### Step 4: Create implementation plan
After the design is approved, break it into ordered implementation tasks. Each task should:
- Reference the specific GodotPrompter skills to follow
- List exact files to create
- Be small enough to implement in one session

Save the plan to `docs/godot-prompter/plans/` in the user's project.
```

With this new Step 4:

```markdown
### Step 4: Prepare for implementation

After the design is approved:

1. **Inject CLAUDE.md** — Add the GodotPrompter integration section to the project's CLAUDE.md (see CLAUDE.md Injection section below). This ensures all subagents and future sessions know to use GodotPrompter skills. Skip if the `## GodotPrompter` section already exists.

2. **Create implementation plan** — If a planning skill is available (e.g., `superpowers:writing-plans`), use it. If not, break the design into ordered tasks yourself and save to `docs/godot-prompter/plans/` in the user's project.

3. **Annotate each task with skills** — Every task in the plan that involves a Godot system MUST list which `godot-prompter:*` skill(s) to invoke during implementation. Example:

   - [ ] **Task 3: Player movement** — Create CharacterBody3D with walk, sprint, jump.
     Skills: `godot-prompter:player-controller`, `godot-prompter:input-handling`

   This ensures that even when another plugin executes the plan, the implementing agent knows which GodotPrompter skills to load.
```

- [ ] **Step 2: Add CLAUDE.md Injection section at the end of the file**

Append after the "Design Checklist" section (after line 382):

```markdown

---

## CLAUDE.md Injection

When preparing for implementation (Step 4), add the following section to the project's CLAUDE.md. Check for an existing `## GodotPrompter` heading first — if present, skip.

If CLAUDE.md does not exist, create it with a project overview header and this section.

```markdown
## GodotPrompter

This is a Godot project with GodotPrompter skills available. Before implementing any game system, you MUST check for a matching `godot-prompter:*` skill and invoke it. This applies to all agents, subagents, and sessions working in this repository.

Key skills: `player-controller`, `state-machine`, `event-bus`, `scene-organization`, `component-system`, `resource-pattern`, `godot-ui`, `hud-system`, `ai-navigation`, `camera-system`, `audio-system`, `save-load`, `inventory-system`, `godot-testing`.

For the full skill list, invoke `godot-prompter:using-godot-prompter`.
```

- [ ] **Step 3: Verify the file reads correctly**

Read `skills/godot-brainstorming/SKILL.md` and confirm:
- Step 4 is titled "Prepare for implementation" (not "Create implementation plan")
- Step 4 has three numbered sub-steps: Inject CLAUDE.md, Create implementation plan, Annotate each task
- CLAUDE.md Injection section appears at the end after Design Checklist
- No broken markdown or duplicate sections

- [ ] **Step 4: Commit**

```bash
git add skills/godot-brainstorming/SKILL.md
git commit -m "feat: rewrite brainstorming Step 4 with CLAUDE.md injection

Step 4 now injects a GodotPrompter section into project CLAUDE.md
and requires skill annotations on every implementation plan task.
This prevents other workflow plugins from dropping GodotPrompter
during plan execution."
```

---

### Task 3: Add CLAUDE.md Checklist Item to Project Setup

**Files:**
- Modify: `skills/godot-project-setup/SKILL.md:459` (insert before the last checklist item)

- [ ] **Step 1: Add checklist item**

Insert after line 458 (`- [ ] Initial commit on `main` branch before adding game content`), before the CI pipeline item:

```markdown
- [ ] `CLAUDE.md` contains `## GodotPrompter` section with skill invocation rule (see `godot-prompter:godot-brainstorming` for content)
```

- [ ] **Step 2: Verify the file reads correctly**

Read `skills/godot-project-setup/SKILL.md` and confirm:
- The new checklist item appears between "Initial commit" and "CI pipeline"
- The checklist now has 14 items (was 13)
- No broken markdown

- [ ] **Step 3: Commit**

```bash
git add skills/godot-project-setup/SKILL.md
git commit -m "feat: add CLAUDE.md GodotPrompter section to setup checklist

Ensures new projects get the GodotPrompter integration rule in
CLAUDE.md during initial scaffolding."
```
