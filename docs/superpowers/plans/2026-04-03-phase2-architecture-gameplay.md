# GodotPrompter Phase 2 (Architecture & Gameplay) Implementation Plan

**Status:** shipped in v1.0.0 (2026-04-06)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 10 Phase 2 skills covering Godot-specific brainstorming, debugging, architectural patterns (event bus, components, resources, DI), and gameplay systems (inventory, dialogue, AI navigation, cameras).

**Architecture:** Same as Phase 1 — independent markdown skill documents at `skills/<name>/SKILL.md` with YAML frontmatter. GDScript + C# examples (GDScript first). Godot 4.3+ minimum.

**Tech Stack:** Markdown with YAML frontmatter. Godot 4.3+ API (GDScript + C#).

---

## File Map

| File | Responsibility |
|------|---------------|
| `skills/godot-brainstorming/SKILL.md` | Godot-specific design exploration — scene tree planning, node selection, 2D vs 3D decisions |
| `skills/godot-debugging/SKILL.md` | Debugging techniques — remote debugger, print_debug, signals, common error patterns |
| `skills/event-bus/SKILL.md` | Signal-based decoupling — global EventBus autoload, typed signals, when to use vs direct signals |
| `skills/component-system/SKILL.md` | Composition over inheritance — reusable node components, interfaces, component communication |
| `skills/resource-pattern/SKILL.md` | Custom Resources — data containers, editor integration, resource-based configuration |
| `skills/dependency-injection/SKILL.md` | Autoloads, service locators, @export node injection, scene injection patterns |
| `skills/inventory-system/SKILL.md` | Resource-based inventory — items as Resources, slots, stacking, UI binding |
| `skills/dialogue-system/SKILL.md` | Dialogue trees — data structures, branching, conditions, UI presentation |
| `skills/ai-navigation/SKILL.md` | NavigationAgent2D/3D, steering behaviors, behavior trees, patrol patterns |
| `skills/camera-system/SKILL.md` | Camera2D/3D — smooth follow, screen shake, camera zones, transitions |

---

### Task 1: godot-brainstorming skill

**Files:**
- Create: `skills/godot-brainstorming/SKILL.md`

Frontmatter: `name: godot-brainstorming`, `description: Use when designing a new Godot feature or system — guides scene tree planning, node type selection, and architectural decisions`

Sections:
- When to Use (new feature, new scene, choosing between approaches)
- Scene Tree Planning: how to sketch a scene tree before building (list nodes, responsibilities, communication)
- Node Type Selection Guide: table mapping common needs to Godot nodes (movement→CharacterBody, UI→Control, timer→Timer, etc.)
- 2D vs 3D Decision: when to use each, hybrid approaches (2.5D)
- Questions to Ask Before Building: checklist (What data does this need? Who owns it? How does it communicate? Can it be reused? Does it need persistence?)
- Common Architecture Decisions: table of "If you need X, consider Y" patterns
- Output Format: how to document a design decision (scene tree sketch, node responsibilities, signal map)

### Task 2: godot-debugging skill

**Files:**
- Create: `skills/godot-debugging/SKILL.md`

Frontmatter: `name: godot-debugging`, `description: Use when debugging Godot projects — remote debugger, print techniques, signal tracing, common error patterns and fixes`

Sections:
- Print Debugging: print(), print_rich(), push_error(), push_warning() — when to use each (GDScript + C#)
- Breakpoints & Remote Debugger: how to use Godot's built-in debugger, remote scene inspector
- Signal Debugging: how to trace signal connections, common signal issues (connected but not firing, wrong arguments)
- Common Error Patterns table: "Node not found" (path wrong or not ready), "Null instance" (node freed), "Can't change state while flushing queries" (physics in wrong callback), etc. with fixes
- Performance Debugging: Profiler, Monitors, draw calls, physics ticks
- Scene Tree Debugging: print_tree_pretty(), remote scene tree, node groups
- GDScript-specific: @tool for live testing, _get_configuration_warnings()
- Debugging Checklist: systematic approach (reproduce, isolate, trace, fix, verify)

### Task 3: event-bus skill

**Files:**
- Create: `skills/event-bus/SKILL.md`

Frontmatter: `name: event-bus`, `description: Use when implementing decoupled communication between nodes — global EventBus autoload with typed signals`

Sections:
- What is an Event Bus: global signal hub autoload for cross-system communication
- When to Use vs Direct Signals: table (same parent→direct, unrelated nodes→event bus, UI updates→event bus, parent-child→direct)
- Basic EventBus implementation (GDScript + C#): autoload with typed signals (player_died, score_changed, level_completed, etc.)
- Connecting to Events (GDScript + C#): how consumers connect in _ready()
- Emitting Events (GDScript + C#): how producers emit
- Typed Signal Parameters: passing data with signals (health_changed(new_health, max_health))
- Anti-patterns: using event bus for everything (over-decoupling), event bus with side effects, circular event chains
- Testing Event Bus: how to test signal emission/reception
- Checklist

### Task 4: component-system skill

**Files:**
- Create: `skills/component-system/SKILL.md`

Frontmatter: `name: component-system`, `description: Use when building reusable node components — composition patterns, component communication, and interface design`

Sections:
- Why Components: reuse, separation of concerns, mix-and-match behavior
- Component Design Rules: one responsibility, communicate via signals, don't reach into siblings
- Common Components table: HealthComponent, HitboxComponent, HurtboxComponent, InteractableComponent, StateMachineComponent
- Full HitboxComponent example (GDScript + C#): Area2D-based, signal on hit, damage amount, cooldown
- Full HurtboxComponent example (GDScript + C#): Area2D-based, connects to HealthComponent
- Component Communication: diagram (Hitbox→signal→Hurtbox→calls→HealthComponent)
- Wiring Components in Scenes: @export NodePath vs direct child access
- Finding Components at Runtime: get_node(), groups, utility function
- Checklist

### Task 5: resource-pattern skill

**Files:**
- Create: `skills/resource-pattern/SKILL.md`

Frontmatter: `name: resource-pattern`, `description: Use when creating data containers in Godot — custom Resources for configuration, items, stats, and editor integration`

Sections:
- What Are Resources: shared data objects, saved as .tres, editable in Inspector
- When to Use: configuration data, item definitions, character stats, ability definitions, level data
- Basic Custom Resource (GDScript + C#): ItemData with name, description, icon, value exports
- Editor Integration: @export, @export_range, @export_enum, @export_group, @export_category
- Resource as Configuration: EnemyStats resource with health, speed, damage, drop_table
- Resource Collections: Array[Resource] exports, ResourcePreloader
- Resource vs Node: table comparing when to use each
- Sharing vs Unique: make_unique(), resource instances in editor
- Saving Custom Resources: ResourceSaver, .tres format
- Anti-patterns: mutable shared Resources without make_unique(), Resources with game logic (keep logic in nodes)
- Checklist

### Task 6: dependency-injection skill

**Files:**
- Create: `skills/dependency-injection/SKILL.md`

Frontmatter: `name: dependency-injection`, `description: Use when managing dependencies between systems — autoloads, service locators, @export injection, and scene injection patterns`

Sections:
- The Problem: tight coupling between systems, hard to test, hard to swap implementations
- Approach Comparison table: Autoloads (simplest, global), @export injection (editor-wired), Service Locator (registered at runtime), Scene Injection (parent provides to children)
- Autoloads as Singletons (GDScript + C#): when appropriate (truly global state), dangers (hidden dependencies, test difficulty)
- @export Node Injection (GDScript + C#): inject dependencies via editor, most Godot-idiomatic approach
- Service Locator Pattern (GDScript + C#): ServiceLocator autoload with register/get, typed retrieval
- Scene Injection: parent sets dependencies on children in _ready()
- Testing with DI: swapping implementations for tests, mock-friendly design
- When to Use What: decision guide
- Anti-patterns: autoload for everything, deep dependency chains, circular dependencies
- Checklist

### Task 7: inventory-system skill

**Files:**
- Create: `skills/inventory-system/SKILL.md`

Frontmatter: `name: inventory-system`, `description: Use when building inventory systems — Resource-based items, slot management, stacking, and UI binding`

Sections:
- Architecture Overview: Items (Resources) + Inventory (Node/Resource) + UI (Control)
- ItemData Resource (GDScript + C#): name, description, icon, max_stack, item_type enum, use() method
- Inventory class (GDScript + C#): Array of slots, add_item(), remove_item(), has_item(), get_item_count(), signals (inventory_changed)
- InventorySlot: item reference + quantity, stack/unstack logic
- Equipment Extension: equipment slots, equip/unequip, stat bonuses
- UI Binding: InventoryUI scene, slot buttons, drag-and-drop basics, tooltip
- Serialization: how to save/load inventory (item IDs + quantities, not full Resources)
- Checklist

### Task 8: dialogue-system skill

**Files:**
- Create: `skills/dialogue-system/SKILL.md`

Frontmatter: `name: dialogue-system`, `description: Use when implementing dialogue — data structures for branching dialogue, conditions, and UI presentation`

Sections:
- Architecture Overview: DialogueData (Resource) + DialogueManager (autoload) + DialogueUI (Control)
- DialogueLine Resource (GDScript + C#): speaker, text, choices array, conditions, next_line_id
- DialogueData Resource: dictionary of lines keyed by ID, start_line_id
- Simple Dialogue Manager (GDScript + C#): start_dialogue(), advance(), choose(), signals (dialogue_started, line_displayed, dialogue_ended)
- Branching: choice nodes with conditions (check inventory, check flags)
- Dialogue UI: RichTextLabel for text, VBoxContainer for choices, typewriter effect
- External Formats: brief mention of JSON dialogue files, Dialogue Nodes addon
- Variable Interpolation: inserting player name, item names into dialogue text
- Checklist

### Task 9: ai-navigation skill

**Files:**
- Create: `skills/ai-navigation/SKILL.md`

Frontmatter: `name: ai-navigation`, `description: Use when implementing AI movement — NavigationAgent2D/3D, steering behaviors, behavior trees, and patrol patterns`

Sections:
- Navigation Setup: NavigationRegion2D/3D, NavigationMesh baking, navigation layers
- NavigationAgent2D basic usage (GDScript + C#): set target, get next path position, move toward it, velocity_computed signal for avoidance
- NavigationAgent3D basic usage (GDScript + C#): same pattern for 3D
- Steering Behaviors: seek, flee, arrive, wander — simple implementations (GDScript)
- Patrol Patterns (GDScript + C#): waypoint array, patrol loop, wait at points
- Behavior Tree Concept: simple node-based BT (Selector, Sequence, Action nodes) — lightweight GDScript implementation
- Chase + Attack Pattern: combining navigation with state machine (detect→chase→attack→return)
- Common Pitfalls: navigation not baked, agent radius mismatch, avoidance jitter
- Checklist

### Task 10: camera-system skill

**Files:**
- Create: `skills/camera-system/SKILL.md`

Frontmatter: `name: camera-system`, `description: Use when implementing cameras — smooth follow, screen shake, camera zones, and transitions for 2D and 3D`

Sections:
- Camera2D Basics: position_smoothing, drag margins, limits, zoom
- Smooth Follow (GDScript + C#): following a target with configurable smoothing, look-ahead
- Screen Shake (GDScript + C#): offset-based shake with intensity decay, trauma system
- Camera Zones/Rooms (GDScript): Area2D triggers that change camera limits/position for room transitions
- Camera3D Patterns: third-person follow (SpringArm3D), orbit camera, first-person (covered in player-controller, reference it)
- Transitions: smooth transition between cameras using tween
- Split Screen: multiple viewports for local multiplayer
- Checklist
