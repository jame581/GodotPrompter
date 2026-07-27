# GodotPrompter Agent Integration Test Plan

Run these tests in a **fresh Claude Code session** with GodotPrompter installed.
Record results in `RESULTS.md` after each test.

---

## Category 1: Cold Start (Installation & Discovery)

### Test 1.1: Plugin loads

**Setup:** Fresh Claude Code session with GodotPrompter installed.

**Prompt:** "What Godot skills are available from GodotPrompter?"

**Expected:**
- Agent loads `using-godot-prompter` skill (or reads it)
- Lists skill categories: Core/Process, Architecture, Gameplay, UI, Multiplayer, Build, C#
- Mentions at least 10 specific skill names

**Pass criteria:** Agent shows awareness of the skill catalog, not generic Godot advice.

---

### Test 1.2: Skill content access

**Prompt:** "What does the state-machine skill cover? Show me the approaches."

**Expected:**
- Agent reads `skills/state-machine/SKILL.md`
- Describes 3 approaches: enum-based, node-based, resource-based
- Shows the comparison table from the skill

**Pass criteria:** Response matches skill content, not generic FSM knowledge.

---

### Test 1.3: Cross-reference navigation

**Prompt:** "The state-machine skill mentions related skills. What are they?"

**Expected:**
- Agent finds the Related Skills line: player-controller, ai-navigation, resource-pattern
- Can describe what each related skill covers

**Pass criteria:** Agent navigates cross-references correctly.

---

## Category 2: Skill Discovery (Open-Ended Prompts)

### Test 2.1: State machine request

**Prompt:** "I need to add a state machine to my player character in Godot 4."

**Expected skill:** `state-machine`

**Expected behavior:**
- Loads the skill (not generic advice)
- Asks about complexity to recommend enum vs node vs resource approach
- Shows GDScript example from the skill
- Mentions C# equivalent

**Pass criteria:** Uses skill content, not generic FSM tutorial.

---

### Test 2.2: Project setup request

**Prompt:** "I'm starting a new Godot 4.3 project. How should I organize it?"

**Expected skill:** `godot-project-setup`

**Expected behavior:**
- Shows the split layout directory structure from the skill
- Recommends autoloads (GameManager, EventBus)
- Shows .gitignore template

**Pass criteria:** Directory structure matches skill exactly.

---

### Test 2.3: Enemy AI request

**Prompt:** "I want enemies that patrol waypoints and chase the player when they get close."

**Expected skill:** `ai-navigation`

**Expected behavior:**
- Shows NavigationAgent2D setup
- Provides patrol pattern with waypoints
- Shows chase behavior with state transitions
- References state-machine skill for FSM integration

**Pass criteria:** Uses NavigationAgent2D (not custom pathfinding), shows patrol code from skill.

---

### Test 2.4: Save/load request

**Prompt:** "Help me set up a save/load system for my Godot game."

**Expected skill:** `save-load`

**Expected behavior:**
- Shows strategy comparison table (ConfigFile, JSON, Resource)
- Recommends JSON for game saves
- Shows SaveManager autoload pattern
- Mentions version migration

**Pass criteria:** Shows the comparison table, recommends JSON with reasoning.

---

### Test 2.5: Code review request

**Prompt:** "Review this GDScript for common Godot issues."

**Sample script to paste with the prompt:**

```gdscript
extends CharacterBody2D

var health = 100
var speed = 200

func _process(delta):
    var player = get_node("/root/Main/Player")
    if player:
        var dir = (player.position - position).normalized()
        position += dir * speed * delta

func take_damage(amount):
    health -= amount
    if health <= 0:
        get_parent().remove_child(self)
        queue_free()
```

**Expected skill:** `godot-code-review`

**Expected behavior:**
- Flags: untyped variables, using `_process` instead of `_physics_process` for movement
- Flags: hardcoded node path `/root/Main/Player` (use groups instead)
- Flags: `position +=` instead of `move_and_slide()` on CharacterBody2D
- Flags: `remove_child` before `queue_free` (unnecessary)
- Uses the checklist structure from the skill

**Pass criteria:** Finds at least 3 of the 4 issues, uses skill checklist format.

---

## Category 3: Full Workflow (End-to-End Build)

### Test 3.1: Project + Player

**Setup:** Empty directory, no existing Godot project.

**Prompt:** "Create a new Godot 4.3 project with a player that can move with WASD and attack with Space."

**Expected skills:** `godot-project-setup`, `player-controller`, `state-machine`

**Expected behavior:**
- Scaffolds project with directory structure from godot-project-setup
- Creates player with CharacterBody2D top-down movement from player-controller
- Adds FSM (idle/move/attack) from state-machine
- Sets up input actions

**Pass criteria:** All 3 skills used, project structure matches skill patterns.

---

### Test 3.2: Add Enemy

**Prompt:** "Add an enemy with patrol AI that chases the player and attacks."

**Expected skills:** `ai-navigation`, `state-machine`, `component-system`

**Expected behavior:**
- Creates enemy with NavigationAgent2D
- Uses patrol pattern from ai-navigation
- Adds FSM (idle/patrol/chase/attack) from state-machine
- Uses HitboxComponent/HurtboxComponent/HealthComponent from component-system

**Pass criteria:** Navigation-based patrol, component-based damage.

---

### Test 3.3: Add HUD

**Prompt:** "Add a health bar HUD that shows the player's health."

**Expected skills:** `hud-system`, `event-bus`

**Expected behavior:**
- Creates CanvasLayer HUD from hud-system
- Uses EventBus pattern from event-bus for health updates
- Health bar uses tween animation from hud-system

**Pass criteria:** CanvasLayer HUD, EventBus-driven updates.

---

### Test 3.4: Code Review

**Prompt:** "Review all the code we just wrote for Godot best practices."

**Expected skill:** `godot-code-review`

**Expected behavior:**
- Works through the skill's checklist sections
- Checks node architecture, style, performance, input, signals, resources
- Produces structured review output

**Pass criteria:** Uses checklist format from skill, not ad-hoc review.

---

### Test 3.5: Save/Load

**Prompt:** "Set up save/load for player position and health. F5 to save, F9 to load."

**Expected skill:** `save-load`

**Expected behavior:**
- Creates SaveManager autoload with JSON serialization
- Implements save_game/load_game functions
- Wires to input actions
- Includes version migration pattern

**Pass criteria:** JSON save with version field, matches skill's SaveManager pattern.

---

## Category 4: Third-Party Addon Skills

These skills only apply when the corresponding addon is installed in the user's project. Each test
checks that the agent reaches for the addon skill (not generic Godot advice, and not the core skill it
sits next to) and answers with the addon's real API.

### Test 4.1: Popochiu (adventure framework)

**Prompt:** "I'm building a point-and-click adventure with the Popochiu addon. How do I script a cutscene where the character walks to a door and the room changes?"

**Expected skill:** `popochiu`

**Expected behavior:**
- Uses `E.queue([...])` cutscene scripting with `queue_*` variants inside the array
- Room change via `R.goto_room(...)` (NOT `E.goto_room` — that does not exist)
- Character movement via the `C` autoload

**Pass criteria:** Answer is grounded in Popochiu's one-letter autoloads and the queue model, not hand-rolled Godot code or the generic `dialogue-system` skill.

---

### Test 4.2: Dialogue Manager (branching dialogue, C# path)

**Prompt:** "Using the Dialogue Manager addon, write a .dialogue file with a branching choice and show how to run it from C#."

**Expected skill:** `dialogue-manager`

**Expected behavior:**
- Valid `.dialogue` syntax: `~ title`, `- response` options, `=> jump` / `=> END`
- C# runtime call using `DialogueManagerRuntime` namespace and `GetNextDialogueLine` / balloon API
- End of dialogue treated as `null` (not an empty dictionary)

**Pass criteria:** Both the `.dialogue` snippet and the C# are addon-real, not invented.

---

### Test 4.3: Phantom Camera (camera switching)

**Prompt:** "With Phantom Camera, how do I switch between two cameras when the player enters an area?"

**Expected skill:** `phantom-camera`

**Expected behavior:**
- Priority-based switching (`set_priority()` / C# `Priority`), not manual `Camera2D.make_current()`
- Mentions `PhantomCameraHost` as a child of the real camera
- Uses the trigger-area pattern from the skill

**Pass criteria:** Answer uses the addon's priority model rather than the hand-rolled `camera-system` approach.

---

## How to Run

1. Start a fresh Claude Code session
2. Install GodotPrompter: `claude plugins add ./GodotPrompter`
3. Navigate to an empty test directory
4. Run each test sequentially, recording results in RESULTS.md
5. For Category 3, keep the same session (tests build on each other)

**Note on Category 4:** a newly added skill is not in the installed plugin cache until the release ships,
so pre-release runs test the skill *as it exists in the working tree* (agent reads `skills/<name>/SKILL.md`)
rather than plugin-cache routing. Re-run Category 4 against the installed plugin after release to
validate description-based routing end to end.

---

## Category 5: Mentor Mode & Presence (v1.13.0)

### Test 5.1: Mentor mode wraps, never replaces

**Setup:** Godot project with mentor mode activated (state in `~/.godot-prompter/state/`).

**Prompt:** "add a dash to my player"

**Expected:**
- Agent invokes `godot-prompter:player-controller` (visible in the tool call)
- All five beats in order: Concept, Editor, Code, Verify, Next
- Exactly one suggestion in Beat 5

**Pass criteria:** The domain skill is loaded. A five-beat answer with no `player-controller`
invocation is a FAIL — that is the primary anti-pattern.

---

### Test 5.2: Editor beat boundary holds

**Prompt:** "where do I click to add an autoload?"

**Expected:** names the Project Settings → Autoload area at panel level and the fields to fill
in; does **not** invent toolbar positions, dock coordinates, or version-specific UI chrome.

**Pass criteria:** no fabricated click-path. Must keep passing after v1.14.0 relaxes the
constraint — answers get fuller, never fabricated.

---

### Test 5.3: Off-ramp

**Prompt (after 5.1):** "just give me the code"

**Expected:** plain code, no beats; the state file's `mode` becomes `"normal"`.

---

### Test 5.4: Coexistence regression

**Setup:** fresh session in a Godot project with Superpowers also installed.

**Prompt:** "implement a save system for my game"

**Expected:** `godot-prompter:save-load` is invoked during implementation, whether or not
Superpowers drives the workflow.

**Pass criteria:** this is the regression the release exists to fix. Generic serialization advice
with no `save-load` invocation is a FAIL.

---

### Test 5.5: Hook stays silent outside Godot

**Setup:** fresh session in a non-Godot repository.

**Expected:** no GodotPrompter routing card in context; no unprompted mention of Godot skills.

---

### Test 5.6: Subagent reach via CLAUDE.md

**Setup:** Godot project whose `CLAUDE.md` has no `## GodotPrompter` section.

**Prompt:** "build me an inventory system" — then let the agent dispatch subagents.

**Expected:**
- The agent offers once to add the `## GodotPrompter` section, and waits for agreement
- It does **not** add it silently
- After the section exists, a dispatched subagent implementing a Godot system invokes the
  matching skill

**Pass criteria:** this is the only test covering subagents. The SessionStart hook does not reach
them; CLAUDE.md is the mechanism.

---

### Test 5.7: No state written into the game repo

**Setup:** activate mentor mode in a Godot project, then `git status` in that project.

**Expected:** clean. No `.godot-prompter/` directory, no new untracked files.

**Pass criteria:** state belongs in `~/.godot-prompter/state/`.

---

### Test 5.8: C# project leads with C#

**Setup:** Godot project whose `project.godot` has `config/features=PackedStringArray("4.5", "C#", "Forward Plus")`.

**Prompt:** "add a health component"

**Expected:** the C# example leads (the hook detects the `C#` feature tag); the renderer is
reported as Forward Plus, **not** "C#".

**Pass criteria:** guards the token-position parsing bug — see `tests/hooks/`.
