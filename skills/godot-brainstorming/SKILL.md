---
name: godot-brainstorming
description: Use when designing a new Godot feature or system — guides scene tree planning, node type selection, and architectural decisions
---

# Godot Brainstorming

A structured design process for Godot 4.3+ features and systems — from blank slate to a clear scene tree, signal map, and data flow before you write a single line of implementation code.

> **Related skills:** **scene-organization** for scene tree composition patterns, **component-system** for component-based architecture, **event-bus** for signal-based communication design.

---

## Process: How to Brainstorm

Do NOT jump straight to designing. Follow these steps:

### Step 1: Understand the request
Ask **one clarifying question at a time** to understand what the user wants to build. Focus on:
- What kind of game/system is this? (genre, perspective, scope)
- What are the core mechanics? (movement, combat, progression)
- What already exists? (existing code, scenes, assets)
- What are the constraints? (platform, performance, team size)

### Step 2: Propose 2-3 approaches
Once you understand the request, propose architectural options with trade-offs. For example:
- "Enum FSM vs Node FSM for your state machine — here's when each fits"
- "EventBus vs direct signals for your systems — here's the trade-off"
Lead with your recommendation and explain why.

### Step 3: Design with approval
Present the design section by section (scene tree, signal map, data flow). Ask "does this look right?" after each section before continuing.

### Step 4: Prepare for implementation

After the design is approved:

1. **Offer the agent instructions section** — Ask whether to add the GodotPrompter integration section to the file this project already uses for agent instructions (see Agent Instructions Injection below). It is what tells subagents and future sessions to use GodotPrompter skills. Skip silently if a `## GodotPrompter` section already exists in any of them, or if the user has declined before. Never add it without agreement.

2. **Create implementation plan** — If a planning skill is available (e.g., `superpowers:writing-plans`), use it. If not, break the design into ordered tasks yourself and save to `docs/godot-prompter/plans/` in the user's project.

3. **Annotate each task with skills** — Every task in the plan that involves a Godot system MUST list which `godot-prompter:*` skill(s) to invoke during implementation. Example:

   - [ ] **Task 3: Player movement** — Create CharacterBody3D with walk, sprint, jump.
     Skills: `godot-prompter:player-controller`, `godot-prompter:input-handling`

   This ensures that even when another plugin executes the plan, the implementing agent knows which GodotPrompter skills to load.

---

## 1. When to Use

Start here whenever you are:

- **Adding a new feature** — a chest, a dialogue system, a crafting bench, a skill tree
- **Creating a new scene** — you need to decide what nodes it contains and how they communicate
- **Choosing between approaches** — inheritance vs. composition, Autoload vs. Resource, 2D vs. 3D
- **Feeling stuck on structure** — the code works but the scene tree feels wrong
- **Onboarding someone** — you need to explain the design of an existing system

If you already know exactly what nodes you need and how they connect, skip this skill and build. Use it when uncertainty is slowing you down.

---

## 2. Scene Tree Planning

Sketch the scene tree on paper (or in a comment block) before opening the Godot editor. The goal is to answer three questions for every node:

1. **What does this node own?** (data, child nodes, visual representation)
2. **What does this node do?** (its single responsibility)
3. **How does it talk to neighbors?** (signals up, method calls down, EventBus sideways)

### Planning Steps

1. Name the root node and its type — this defines the scene's contract with the world.
2. List immediate children by responsibility group, not by Godot node type.
3. Assign a Godot node type to each entry.
4. Identify every signal the scene emits and every signal it consumes.
5. Mark which nodes should be separate `.tscn` files (reuse candidates).

### Example: Planning a "Chest" Interactable

**Step 1 — Name and root type**

A `Chest` is a world object the player walks up to and opens. It is not a physics body; it does not move. Root: `StaticBody2D` or `Node2D`.

**Step 2 — Responsibility groups**

- Visual representation (sprite, animation)
- Collision / interaction trigger (detect player proximity)
- Loot data (what items are inside)
- UI feedback (prompt label, open animation trigger)
- State (is it open or closed?)

**Step 3 — Assign node types**

```
Chest (StaticBody2D)
├── Sprite2D                  # closed/open frame, or swap texture on open
├── AnimationPlayer           # open animation
├── CollisionShape2D          # physical body shape (blocks player)
├── InteractionArea (Area2D)  # detect when player is close enough
│   └── CollisionShape2D      # slightly larger than body shape
├── PromptLabel (Label3D or Label) # "Press F to open"
└── LootTable (Node)          # holds @export var items: Array[ItemData]
```

**Step 4 — Signal map**

| Signal | Emitted by | Connected to | Purpose |
|---|---|---|---|
| `body_entered(body)` | `InteractionArea` | `Chest._on_area_body_entered` | Show prompt when player enters range |
| `body_exited(body)` | `InteractionArea` | `Chest._on_area_body_exited` | Hide prompt when player leaves |
| `opened(loot: Array[ItemData])` | `Chest` | `InventorySystem` or `EventBus` | Deliver loot to whoever owns the inventory |
| `animation_finished(name)` | `AnimationPlayer` | `Chest._on_animation_finished` | Lock chest after open animation completes |

**Step 5 — Reuse candidates**

`LootTable` is likely reused by barrels, enemies, and shop crates — extract it as a separate `.tscn` component.

For the resulting GDScript and C# `Chest` sketches, plus the four-part design entry (Scene Tree, Node Responsibilities, Signal Map, Data Flow) used to document this design, see [references/example-chest.md](references/example-chest.md).

---

## 3. Node Type Selection Guide

| Need | Node (2D) | Node (3D) | Notes |
|---|---|---|---|
| Player / NPC movement | `CharacterBody2D` | `CharacterBody3D` | Use `move_and_slide()` for collision response |
| Physics objects (crates, balls) | `RigidBody2D` | `RigidBody3D` | Engine controls movement; apply forces/impulses |
| Static world geometry | `StaticBody2D` | `StaticBody3D` | Walls, floors, platforms that never move |
| Detect overlap without physics | `Area2D` | `Area3D` | Triggers, pickups, interaction zones |
| UI elements | `Control` subclasses | `Control` subclasses | `Label`, `Button`, `TextureRect`, `VBoxContainer` |
| World-space UI / labels | `Label` | `Label3D` | `Label3D` floats in 3D world space |
| Sprite / image | `Sprite2D` | `MeshInstance3D` | Use `StandardMaterial3D` for 3D surfaces |
| Timed events | `Timer` | `Timer` | Call `start()`, connect `timeout` signal |
| Keyframe animation | `AnimationPlayer` | `AnimationPlayer` | Animates any property on any node |
| Blend-tree / locomotion animation | `AnimationTree` | `AnimationTree` | Pairs with `AnimationPlayer` |
| Audio (non-positional) | `AudioStreamPlayer` | `AudioStreamPlayer` | Music, UI sounds |
| Audio (positional) | `AudioStreamPlayer2D` | `AudioStreamPlayer3D` | Footsteps, explosions in world space |
| Pathfinding | `NavigationAgent2D` | `NavigationAgent3D` | Requires a `NavigationRegion` in the scene |
| Tile-based levels | `TileMapLayer` | — | Godot 4.3+: one layer per `TileMapLayer` node |
| Particle effects | `GPUParticles2D` | `GPUParticles3D` | Use `CPUParticles` for low-end targets |
| Camera | `Camera2D` | `Camera3D` | Only one active camera per viewport |
| Canvas / screen overlay | `CanvasLayer` | `CanvasLayer` | HUDs, pause menus, always-on-top UI |
| Spawn point / empty transform | `Marker2D` | `Marker3D` | No visual; just a named position |

---

## 4. 2D vs. 3D Decision

### Choose 2D when

- The game is a platformer, top-down RPG, puzzle game, or visual novel
- Pixel art or hand-drawn assets are the intended aesthetic
- The team has limited 3D art / modeling capacity
- Performance targets include low-end mobile hardware
- Collision and navigation are simpler in screen space

### Choose 3D when

- The game requires first/third-person perspective or free camera rotation
- Lighting and shadow depth are central to the visual design
- Levels are navigated in all three axes (not just X/Y)
- You are building a racing game, FPS, open-world game, or 3D platformer

### Hybrid 2.5D Approaches

| Technique | How | Use Case |
|---|---|---|
| 3D world + 2D sprites | `Sprite3D` or `MeshInstance3D` with billboard material | Classic RPG look in 3D world |
| 2D world + 3D UI elements | `SubViewport` with 3D scene rendered into a `TextureRect` | Item previews, character portraits |
| Orthographic 3D | `Camera3D` with `projection = ORTHOGONAL` | Isometric or flat-shaded 3D that reads as 2D |
| 3D with 2D HUD | `CanvasLayer` overlaid on a 3D viewport | Any 3D game with screen-space UI |

### Performance Considerations

- 2D scenes are cheaper to render; use 2D unless 3D is required by design
- `TileMapLayer` is highly optimized — prefer it over manually placing hundreds of `Sprite2D` nodes
- In 3D, use `LOD` (Level of Detail) on `MeshInstance3D` for distant objects
- `GPUParticles` runs on the GPU and is fast; use `CPUParticles` only when GPU access is restricted (some mobile targets)
- Minimize `_process` overrides — use signals and timers to trigger behavior instead of polling every frame

---

## 5. Questions to Ask Before Building

Work through this checklist before creating your first node.

- [ ] **What data does this system need?** — List every piece of state: position, health, item count, flags
- [ ] **Who owns each piece of data?** — Assign one authoritative owner per value; avoid duplicating state
- [ ] **How does it communicate?** — Signals up the tree, method calls down, EventBus for cross-system events
- [ ] **Can it be reused?** — If yes, it should be a separate `.tscn` scene with a clean `@export` interface
- [ ] **Does it need persistence?** — If the data must survive scene changes or game restarts, plan a save system early
- [ ] **What is the scene tree?** — Sketch at least two levels deep before touching the editor
- [ ] **What signals does it emit?** — List every signal name, its arguments, and who connects to it
- [ ] **What are the failure modes?** — What happens if a required node is missing? If a signal fires twice?
- [ ] **What is the minimum viable version?** — Build that first; add complexity only when it is needed

---

## 6. Common Architecture Decisions

| If you need... | Consider... | Why |
|---|---|---|
| Global state accessible anywhere | **Autoload (singleton)** | Registered in Project Settings; available as a named global |
| Data shared between multiple scenes | **Resource (`.tres` / `.res`)** | Saved as an asset; `@export`-able; survives scene reloads |
| Reusable behavior across entity types | **Component scene** | Instantiate as a child; each entity opts in by including the scene |
| Complex entity behavior with many states | **State machine** | Explicit enter/exit per state; prevents if-chain sprawl |
| Events between systems that don't share a parent | **EventBus Autoload** | Decouples sender and receiver; any node can connect |
| Data that must persist across sessions | **Save system with JSON or binary** | Serialize Resource or Dictionary; load on `_ready` |
| Configurable game data (stats, items, levels) | **Resource with `@export` fields** | Edit values in the Inspector; no code change required |
| Spawning scenes at runtime | **`PackedScene` + `instantiate()`** | Store `@export var scene: PackedScene`; call `scene.instantiate()` |
| Running code on a delay or interval | **Timer node** | Cleaner than `_process` frame counters; supports one-shot and loop |
| Gradual transitions (fade, lerp, tween) | **Tween** | `create_tween()` is built-in; no extra node required in Godot 4 |

---

## 7. Design Output Format

Capture your design in a comment block at the top of the root script, or in a `DESIGN.md` file next to the scene. A complete design entry has four parts: a **scene tree ASCII diagram**, a **node responsibilities table**, a **signal map** (signal → source → consumer → payload), and a **data flow** trace showing how a triggering event propagates through the tree.

See [references/example-chest.md](references/example-chest.md) for a fully worked four-part entry built around the `Chest` interactable.

---

## Design Checklist

- [ ] Scene tree sketched at least two levels deep before opening the editor
- [ ] Every node has a single named responsibility
- [ ] All signals listed with name, source, consumer, and payload type
- [ ] Data ownership assigned — no value stored in two places
- [ ] Reuse candidates extracted to separate `.tscn` files
- [ ] Communication pattern chosen: signals up, calls down, EventBus sideways
- [ ] Persistence requirements identified before building data structures
- [ ] Architecture decision table consulted for global state, shared data, and events

---

## Agent Instructions Injection

When preparing for implementation (Step 4), add the following section to the file this project uses for agent instructions. Check for an existing `## GodotPrompter` heading in **all** of `CLAUDE.md`, `CLAUDE.local.md`, `.claude/CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.github/copilot-instructions.md`, and the `.claude/rules/` and `.cursor/rules/` directories — if it is present anywhere, skip.

A previous refusal counts as an answer. The SessionStart hook records one as `"section_offer": "declined"` in this project's `~/.godot-prompter/state/<hash>.json` (`godot-prompter:godot-mentor` documents the file and how the hash is computed) — if that key is set, do not ask again. Record a refusal there yourself, merged into any existing keys, when the user declines here.

Write it to the file the project already maintains, not to a second one:

- `CLAUDE.md` exists → add it there.
- Only `AGENTS.md` or `GEMINI.md` exists → add it there, so the repo stays agent-agnostic. Claude Code reads `CLAUDE.md` only, so if the user wants it loaded there too, a one-line `CLAUDE.md` containing `@AGENTS.md` does that — offer it, do not assume it.
- Nothing exists → create `CLAUDE.md` with a project overview header and this section.

> ## GodotPrompter
>
> This is a Godot project with GodotPrompter skills available. Before implementing any game system, you MUST check for a matching `godot-prompter:*` skill and invoke it. This applies to all agents, subagents, and sessions working in this repository.
>
> Key skills: `player-controller`, `state-machine`, `event-bus`, `scene-organization`, `component-system`, `resource-pattern`, `godot-ui`, `hud-system`, `ai-navigation`, `camera-system`, `audio-system`, `save-load`, `inventory-system`, `godot-testing`.
>
> For the full skill list, invoke `godot-prompter:using-godot-prompter`.
