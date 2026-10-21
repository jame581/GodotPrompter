# GodotPrompter Agent Integration Test Plan

Run these tests in a **fresh Claude Code session** with GodotPrompter installed.
Record results in `RESULTS.md` after each test. For cross-host release smoke coverage, also consult `host-smoke-matrix.json`.

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

### Test 2.6: HTTP request to a backend

**Prompt:** "My game needs to fetch a player's leaderboard from a REST API and show it. How do I do the HTTP call in Godot?"

**Expected skill:** `web-services`

**Expected behavior:**
- Uses an `HTTPRequest` node with `await` on `request_completed`, one node per in-flight request
- Distinguishes the transport result from the HTTP status code
- Parses JSON with `JSON.parse_string()` and notes that numbers arrive as floats
- Sets a `timeout` and mentions the INTERNET permission on Android and CORS on Web
- Does not reach for `HTTPClient` for an ordinary REST call

**Pass criteria:** Uses the skill's single-request or autoload client pattern and names at least two of the pitfalls (float numbers, `ERR_BUSY` on reuse, no timeout, CORS).

---

### Test 2.7: Renderer and FSR choice

**Prompt:** "I want to use FSR to upscale my 3D game so it runs faster on weaker GPUs. Which renderer do I need and how do I turn it on?"

**Expected skill:** `rendering-pipeline`

**Expected behavior:**
- States that FSR 1 and FSR 2 need the Forward+ renderer, not Mobile or Compatibility
- Sets `scaling_3d_mode` and `scaling_3d_scale` (below `1.0` to gain speed)
- Offers the renderer trade-off (Forward+ vs Mobile vs Compatibility) instead of assuming one
- Does not suggest FSR on Web (Compatibility only)

**Pass criteria:** Correctly ties FSR to Forward+ and names the `scaling_3d_*` settings.

---

### Test 2.8: Web export with threads

**Prompt:** "I exported my game to the web and want to use threads for loading. It's going on GitHub Pages. What do I need to know?"

**Expected skill:** `web-export`

**Expected behavior:**
- Explains that thread support is a preset option (`variant/thread_support`), off by default
- Names the COOP/COEP headers (cross-origin isolation) that threads require
- Notes GitHub Pages cannot send custom headers, and offers the no-threads build or the PWA cross-origin isolation workaround
- Warns that `Thread` and `WorkerThreadPool` do not run in the background without threads
- Does not mention C# as an option for Web

**Pass criteria:** Names the header requirement and a workable GitHub Pages path.

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

**Expected:** the agent reads `godot-mentor`'s `references/editor-recipes.md` and gives the
"Register an autoload" steps for the project's Godot version, using the reference's wording.
It does **not** add toolbar positions, dock coordinates, shortcuts, or any step the reference
does not contain.

**Follow-up prompt:** "and where do I click to bake a lightmap?" (not covered by the
references)

**Expected:** names the node or panel involved and stops; no numbered click-path.

**Pass criteria:** every click-path in both answers appears in the editor references. A path
that is absent from them is fabricated, even if it happens to be correct.

---

### Test 5.2b: Click-paths are for beginner level (v1.15.1)

**Setup:** mentor mode active with `"level": "intermediate"` in the state file.

**Prompt:** "walk me through making a coin that tells the score label when it's collected"

**Expected:** Beat 2 names what to set up (the coin's nodes, the `player` group, an autoload if
one is used) without numbered click-by-click steps for adding a group, registering an autoload or
connecting a signal in the Signals dock. A click-path appears only where the step differs between
Godot versions, or if the user then asks "where is that?".

**Pass criteria:** no editor walkthrough of basics an intermediate user knows. Repeat with
`"level": "beginner"`: the click-paths from the editor references are expected there.

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

### Test 5.6: Subagent reach via the agent instructions file

**Setup:** Godot project whose instructions files have no `## GodotPrompter` section.

**Prompt:** "build me an inventory system" — then let the agent dispatch subagents.

**Expected:**
- The agent offers once to add the `## GodotPrompter` section, and waits for agreement
- It does **not** add it silently
- After the section exists, a dispatched subagent implementing a Godot system invokes the
  matching skill

**Pass criteria:** this is the only test covering subagents. The SessionStart hook does not reach
them; the instructions file is the mechanism.

---

### Test 5.6b: The offer respects an agent-agnostic repo (#15)

**Setup:** Godot project with an `AGENTS.md` and no `CLAUDE.md`.

**Variant A** — `AGENTS.md` already contains a `## GodotPrompter` section.

**Expected:** no offer at all, on this session or any later one.

**Variant B** — `AGENTS.md` has no such section. Decline the offer, then restart the session.

**Expected:**
- The offer names `AGENTS.md`, not a `CLAUDE.md` the repo does not keep
- On Claude Code it may mention that a `CLAUDE.md` containing `@AGENTS.md` would load it here too,
  as a suggestion only
- After the refusal, `~/.godot-prompter/state/<hash>.json` carries `"section_offer": "declined"`,
  any mentor keys in it survive, and the restarted session does not ask again

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

---

## Category 6: Decision-first design (v1.14.0)

### Test 6.1: Off-ramp mid-grill

**Setup:** Godot project with no existing decisions or ADR directory, and no project
instructions (`CLAUDE.md`, `AGENTS.md`, …) naming one.

**Prompt:** "grill me on an inventory system" — answer round 1, then reply "just build it".

**Expected:**
- Round 1 asks scope first, numbered, each question with a ➡️ recommendation
- After "just build it": no further questions; assumptions for the open decisions are listed; a
  decision record exists — in an existing decisions/ADR directory if the project has one,
  otherwise wherever the agent asked to put it (suggesting `docs/decisions/`), or at
  `docs/decisions/<date>-inventory.md` if it could not ask — with the settled rows and the
  assumptions under **Open / deferred**, marked **assumed**

**Pass criteria:** no question asked after the off-ramp, and every open decision appears as a
listed assumption.

---

### Test 6.2: The record shortens the grill

**Setup:** the project from 6.1, with its decision record committed.

**Prompt:** "grill me on adding equipment slots to the inventory"

**Expected:** no question re-asks a row in the existing record (scope, item data home, bag
model); round 1 starts at equipment-specific decisions.

**Pass criteria:** zero re-asked recorded decisions. Re-asking any one is a FAIL.

---

### Test 6.3: No grill for a bug fix

**Prompt:** "I ported my player to Godot 4 and `velocity = move_and_slide(velocity)` now errors"

**Expected:** a direct diagnosis — `move_and_slide()` takes no arguments in Godot 4 — with no
questioning round.

**Pass criteria:** the card's "Known change, explicit ask, bug fix" row wins; `godot-grill` is
not invoked.

---

### Test 6.4: The card's gate row routes a plain request

**Setup:** a real Godot project (so the SessionStart hook injects the card), mentor mode off, no
existing decision record.

**Prompt:** "Add a basic inventory system to my Godot 4 game."

**Expected:** the gate row ("New system, or the requirements are unclear") routes the request to
`godot-grill`, which opens a bounded scope-first round rather than building immediately.

**Pass criteria:** the grill is invoked without the user naming it or asking to be grilled. Eval
case `grill-05-plain-request-in-project` now exercises this path by scaffolding a `project.godot`
(run with `--scaffold`); it fired in about 4 of 5 runs, so repeat this test before concluding it
fails.

---

### Test 6.5: A report never ends on its own questions (v1.15.1)

**Setup:** as 6.4.

**Prompt:** "Add a basic inventory system to my Godot 4 game."

**Expected:** one of two shapes, never a mix. Either the agent invokes `godot-grill` and asks a
numbered round with a ➡️ recommendation on every question, or it reports the pattern it picked
and the alternative it rejected, lists its assumptions, and builds. It does **not** write a design
proposal and then append "GDScript or C#?"-style questions of its own.

**Pass criteria:** no question outside a `godot-grill` round. A proposal that ends on
un-numbered or recommendation-less questions is a FAIL.

---

### Test 6.6: The grill sentence stays scoped to design decisions (v1.15.1)

**Setup:** as 6.4, with a player script that has a bug whose fix depends on one missing fact.

**Prompt:** "My player falls through one-way platforms sometimes — fix it." (do not say whether the
platforms are `StaticBody2D` or `AnimatableBody2D`)

**Expected:** the agent reads the project to find the missing fact, or asks that one factual
question directly. `godot-grill` is **not** invoked, there is no scope-first round, and no
decision record is written.

**Pass criteria:** `godot-grill` is not invoked for a bug fix, even one that needs a fact. No eval
case covers this path.

---

## How to Run

Use `host-smoke-matrix.json` as the machine-readable release checklist for Claude Code, GitHub Copilot CLI, Cursor, Codex, Antigravity, OpenCode, and Grok Build. The numbered steps below remain the detailed Claude-first workflow.

1. Start a fresh Claude Code session
2. Install GodotPrompter: `claude plugins marketplace add ./GodotPrompter` then `claude plugins install godot-prompter@godot-prompter-marketplace`
3. Navigate to an empty test directory
4. Run each test sequentially, recording results in RESULTS.md
5. For Category 3, keep the same session (tests build on each other)
6. Categories 5 and 6 need a Godot project (a `project.godot`) so the SessionStart card is injected

**Note on Category 4:** a newly added skill is not in the installed plugin cache until the release ships,
so pre-release runs test the skill *as it exists in the working tree* (agent reads `skills/<name>/SKILL.md`)
rather than plugin-cache routing. Re-run Category 4 against the installed plugin after release to
validate description-based routing end to end.
