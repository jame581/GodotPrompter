# Prose audit — claims not tied to a version — 2026-10-21

v1.16.0, Task 5. The v1.15.0 and v1.15.1 audits checked editor click-paths and version callouts;
this pass checks the rest of the engine-behaviour prose: statements that can be confirmed or
refuted in the engine source or class reference.

**Scope (what counts as a claim):** a statement about engine behaviour that can be checked in the
source or class reference: class/method/property/signal/constant names, default values, enum
members, project-setting paths, "X runs on / requires Y" statements, threading and ordering
guarantees. Out of scope: advice and opinion, editor click-paths (audited in v1.15.0), version
callouts (audited in v1.15.1), and the three skills new in v1.16.0 (`web-services`,
`rendering-pipeline`, `web-export`, checked when written).

**Sources:**

- Godot source at tag `4.7.2-stable` (`ed1daf0b`) and `4.3-stable` (for claims in skills that say
  "4.3+"): class reference XML in `doc/classes/` and `modules/*/doc_classes/`, `GLOBAL_DEF`
  registrations, the GDScript module, and the C# glue and source generators in `modules/mono/`.
  Paths below are relative to the repository root at the tag named.
- `godot` 4.7.2 run headless (`--script` with `ClassDB` queries or small behaviour tests, and
  `--check-only` to re-parse edited GDScript).
- C#: small test projects built against `Godot.NET.Sdk` 4.3.0 and the Task 4 harness
  (`Godot.NET.Sdk` 4.7.2) to rebuild edited blocks.
- Addon skills: the addon's repository at the version the skill names.

**Method:** each batch lists the checkable claims per SKILL.md and reference, checks each against
the sources, and records a verdict. A claim is **wrong** only with a cited source; one with no
source either way is **unverifiable** and is softened rather than deleted. A claim true on 4.7.2
but false on 4.3, in a skill that says "4.3+", is wrong and gets a version qualifier. Every
correction is swept: `skills/`, `agents/` and `.codex/` are grepped for the claim's key nouns and
every instance is fixed, including in other batches' skills.

## Batch A — core

Skills: `gdscript-patterns`, `gdscript-advanced`, `csharp-godot`, `csharp-signals`,
`scene-organization`, `resource-pattern`, `dependency-injection`, `event-bus`, `component-system`,
plus `godot-code-review` (process skill). Every SKILL.md and every reference file was read in full.

| Skill | Claims checked (SKILL.md + references) | Wrong | Softened |
|---|---|---|---|
| `gdscript-patterns` | 22 + 22 | 6 | 0 |
| `gdscript-advanced` | 24 + 14 | 13 | 3 |
| `csharp-godot` | 30 + 5 | 7 | 0 |
| `csharp-signals` | 20 + 14 | 6 | 0 |
| `scene-organization` | 8 | 2 | 0 |
| `resource-pattern` | 14 + 20 | 8 | 0 |
| `dependency-injection` | 8 + 10 | 3 | 0 |
| `event-bus` | 8 + 10 | 2 | 0 |
| `component-system` | 10 | 1 | 1 |
| `godot-code-review` | 15 | 2 | 0 |
| **Total** | **254** | **50** | **4** |

The worst error was structural: `scene-organization` grouped an enemy's `Sprite2D` and
`CollisionShape2D` under plain `Node` containers. A plain `Node` breaks transform inheritance, and
a `CollisionShape2D` only shapes its direct parent, so that tree gives a body with no shape and a
sprite that does not move with it.

| Skill file | Was | Is | Source |
|---|---|---|---|
| `gdscript-patterns` SKILL.md:90-91 | `UNSAFE_CAST` "unsafe `as` casts"; `UNSAFE_CALL_ARGUMENT` "wrong type" | casting a `Variant` value; an argument whose type is a supertype of the parameter's | 4.3 `modules/gdscript/gdscript_warning.h:68-69` |
| `gdscript-patterns` SKILL.md:334 | `@onready` initialized "when node enters tree" | when the node is ready, just before `_ready()` | 4.3 `modules/gdscript/gdscript.cpp:2022-2026` (implicit ready runs on the `_ready` call) |
| `gdscript-patterns` SKILL.md:350 | typed array rejects items "that don't match exactly (no implicit upcasting)" | subclass elements are accepted and `int` → `float` converts; what fails is assigning an untyped `Array` or `Array[Subclass]` to an `Array[Type]` variable | 4.7.2 run: `Array[Node].append(Node2D.new())` ok; "Trying to assign an array of type "Array" to a variable of type "Array[Node]""; parse error for `Array[Node2D]` → `Array[Node]` |
| `gdscript-patterns` `references/lambda-functions.md:56` | `var doubled: Array[int] = numbers.map(...)` | `var doubled: Array = …` — `map()` returns an untyped `Array`, so the typed assignment fails at runtime | 4.3 `core/variant/array.cpp:528-530`; 4.7.2 `array.cpp:633-635`; 4.7.2 run (`is_typed()` false) |
| `gdscript-patterns` `references/super-in-virtual-methods.md:73` | missing `super()` leaves the parent's `@onready` vars null | parent `@onready` vars are initialized for every class in the chain; only the parent's `_ready()` body is skipped | 4.3 `modules/gdscript/gdscript.cpp:2011-2018`; 4.7.2 run |
| `gdscript-advanced` SKILL.md:85 | deferred calls run "on the next frame's idle phase" | at the end of the current frame | 4.3 `doc/classes/Callable.xml:117` |
| `gdscript-advanced` SKILL.md:98 | `call("queue_free")` "is a free crash" | `call("free")` lets the data delete the object (`queue_free` does not crash) | — (wording; `queue_free` is deferred: `Node.xml`) |
| `gdscript-advanced` SKILL.md:127 | `NOTIFICATION_PARENTED` listed as an editor lifecycle notification | removed — it is a general `Node` notification | 4.3 `doc/classes/Node.xml:1118` |
| `gdscript-advanced` SKILL.md:135 | `create_timer()` fails because the "editor has no main loop in some contexts" | `get_tree()` in a `@tool` setter during scene load returns `null` with an error — exported values are set before tree entry | 4.3 `scene/main/node.h:445-447` |
| `gdscript-advanced` SKILL.md:209 | a connected lambda's captures "forever"; freed captures give "warnings" | a lambda that does not use `self` belongs to the script, so freeing the node does not disconnect it | 4.3 `modules/gdscript/gdscript_lambda_callable.cpp:73-75, 197-199`; `core/object/object.cpp:2097-2104` |
| `gdscript-advanced` SKILL.md:218, 220 | `Object.get_node`; `CharacterBody.move_and_slide` | `Node.get_node`; `CharacterBody2D/3D.move_and_slide` | class reference |
| `gdscript-advanced` SKILL.md:221 | "GDScript GC spikes" | GDScript has no GC (reference counting); allocation spikes | `core/object/ref_counted.h` |
| `gdscript-advanced` SKILL.md:251 | static vars persist "for the lifetime of the engine" | while the script stays loaded; `@static_unload` lets it free them | `@static_unload` annotation |
| `gdscript-advanced` `references/metaprogramming-recipes.md:63` | `other.queue_free()` "NOT safe inside collision callback" | `queue_free()` is already deferred; the unsafe case is changing physics state (`disabled = true` → `set_deferred`) | 4.3 `servers/physics_2d/godot_physics_server_2d.cpp:42, 650` |
| `gdscript-advanced` `references/tool-script-recipes.md:77` | `DebugDraw.draw_sphere` presented without comment | marked as an addon — Godot has no built-in debug-draw API | ClassDB: no `DebugDraw` class |
| `gdscript-advanced` `references/tool-script-recipes.md:82` | editor freeze from "a setter that triggers itself" | assigning a property inside its own setter does not recurse (two setters that set each other do) | 4.3 `modules/gdscript/gdscript_compiler.cpp:1297, 1353` |
| `gdscript-advanced` `references/tool-script-recipes.md:83` | "Crash" on add to scene | `get_tree()` / `get_viewport()` return `null` with an error | 4.3 `scene/main/node.h:445-447` |
| `csharp-godot` SKILL.md:107-111, 285 | missing `partial` gives CS0260, "or the class compiles but signals and `[Export]` silently fail" | build error GD0001 | 4.3 `modules/mono/editor/Godot.NET.Sdk/Godot.SourceGenerators/Common.cs:11-18` (severity Error); `Godot.NET.Sdk` 4.3.0 build |
| `csharp-godot` SKILL.md:269 | prefer `Array<T>` for hot paths | `Array<T>` wraps the same engine array; use `T[]` / `List<T>` | 4.3 `modules/mono/glue/GodotSharp/GodotSharp/Core/Array.cs:1069` |
| `csharp-godot` SKILL.md:278 | `(float)someVariant` throws for an `int` | the cast is `AsSingle()`; neither throws; other types yield `0` | 4.3 `…/Core/Variant.cs:413`, `NativeInterop/VariantUtils.cs:392`, `core/variant/variant.cpp:1610-1625` |
| `csharp-godot` SKILL.md:280 | passing `List<T>` "causes runtime error" | does not compile (no conversion to `Variant`) | `Godot.NET.Sdk` 4.3.0 build: CS1503 |
| `csharp-godot` SKILL.md:284 | `GetNode("../UI/Label")` "fails silently" | logs `Node not found` and returns `null` | 4.3 `scene/main/node.cpp:1790-1793` |
| `csharp-godot` SKILL.md:286 | `async void` "swallows exceptions" | Godot logs `async void` exceptions; an un-awaited `async Task` hides them | 4.3 and 4.7.2 `…/Core/Bridge/ScriptManagerBridge.cs:80-89`, `GodotSynchronizationContext.cs` |
| `csharp-godot` `references/gdscript-interop.md:43` | GDScript sets `data.damage` on a C# `[GlobalClass]` | `data.Damage` — C# members keep their C# names | 4.3 `…/Godot.SourceGenerators/ScriptPropertiesGenerator.cs:138-150` |
| `csharp-signals` SKILL.md:45 | allowed parameter list with `GodotDictionary`/`GodotArray`; "generics are not allowed" | `Variant`-compatible types incl. generic `Array<T>`/`Dictionary<TKey,TValue>`; others fail with GD0202 | 4.3 `…/Godot.SourceGenerators/MarshalType.cs:71-72`, `Common.cs:120-128` |
| `csharp-signals` SKILL.md:51 | `SignalName` holds "static string constants" | cached `StringName`s | 4.3 `…/ScriptSignalsGenerator.cs:215` |
| `csharp-signals` SKILL.md:88, 201, 204 | `EmitSignal` validates count and types in debug builds ("Signal parameter mismatch", "Expected N arguments, got M") | no validation; with a wrong count `+=` handlers on a custom signal are skipped silently, `Connect`ed receivers log "Method expected N argument(s), but called with M"; a wrong type is converted or defaulted for C# handlers, while a typed GDScript receiver logs `Cannot convert argument N from X to Y` and is not called | 4.3 `…/ScriptSignalsGenerator.cs:491-495`; `core/object/object.cpp:1200`; `core/variant/variant.cpp:3653` (4.7.2 `object.cpp:1311`, `variant.cpp:3521`) |
| `csharp-signals` SKILL.md:206 | a double `+=` always fires twice | twice on a custom `[Signal]`; on a built-in signal the second `+=` logs "already connected" | 4.3 `modules/mono/editor/bindings_generator.cpp:3081`; `core/object/object.cpp:1402` |
| `scene-organization` SKILL.md:279-293 | `Visuals`, `Collision`, `Components`, `AI` as plain `Node` containers | `CollisionShape2D` stays a direct child; positioned children go under a `Node2D` | 4.3 `scene/main/canvas_item.cpp:514-520`; `scene/2d/physics/collision_shape_2d.cpp:179-181` |
| `scene-organization` SKILL.md:309 | `MarginContainer` "handles safe-area padding"; `CanvasLayer` "always on top" | fixed margins, no safe area; layer `1` over the default `0` | `MarginContainer.xml` theme constants; 4.3 `doc/classes/CanvasLayer.xml:54` |
| `resource-pattern` SKILL.md:22 | Resources "survive scene changes" | only while something still references them (`RefCounted`) | `Resource.xml` (inherits `RefCounted`) |
| `resource-pattern` SKILL.md:24; `references/configuration-pattern.md:43`; `references/sharing-vs-unique.md:53` | `make_unique()` | no such method: `duplicate()` / `resource_local_to_scene`; "Make Unique" is an editor button | 4.3 `doc/classes/Resource.xml` method list |
| `resource-pattern` SKILL.md:103 | `@tool` needed for Resources to be first-class in the Inspector | only when setters must run in the editor | — (`class_name` registration) |
| `resource-pattern` SKILL.md:131 | lifecycle hooks "None (`_init` only)" | no tree callbacks (`_init`, `_setup_local_to_scene`) | 4.3 `doc/classes/Resource.xml:23` |
| `resource-pattern` `references/sharing-vs-unique.md:26, 51` | deep duplicate copies "all nested Resources" | 4.3: never those inside `Array`/`Dictionary`; 4.7: only embedded ones unless `duplicate_deep(DEEP_DUPLICATE_ALL)` | 4.3 `doc/classes/Resource.xml:43-47`; 4.7.2 `Resource.xml:63-64, 195-201` |
| `resource-pattern` `references/sharing-vs-unique.md:42` | C# `Duplicate(subresources: true)` | `Duplicate(true)` — the parameter is `deep` in 4.7, so the named argument breaks | 4.3 `Resource.xml:40`; 4.7.2 `Resource.xml:60` |
| `dependency-injection` SKILL.md:101 | `ServiceLocator.get(name)` | `get_service(name)` (matches the reference; `get` is `Object.get`) | `references/service-locator.md:40` |
| `dependency-injection` SKILL.md:246 | "NullReferenceError" | "Nonexistent function 'play_sfx' in base 'Nil'" | 4.7.2 run |
| `dependency-injection` `references/export-injection.md:12` | hard-coded paths "break silently" | fail with `Node not found` | 4.3 `scene/main/node.cpp:1790-1793` |
| `event-bus` SKILL.md:123 | GDScript connections "are reference-counted" | a connection to a freed node's method is removed | 4.3 `core/object/object.cpp:2097-2104` |
| `event-bus` SKILL.md:173 | `InvalidOperationException` | `ObjectDisposedException` | 4.3 `…/Core/GodotObject.base.cs:78` |
| `component-system` SKILL.md:283 | "@export NodePath" | `@export` node reference (the example is a typed node export) | — |
| `godot-code-review` SKILL.md:268 | `animation_name == "run"` "allocates a new String" | compares characters (String vs StringName); `&"run"` compares pointers | `core/string/string_name.h` `operator==` |
| `godot-code-review` SKILL.md:447 | node paths "break silently" | fail with `Node not found` | 4.3 `scene/main/node.cpp:1790-1793` |

**Softened (no source either way):** `gdscript-advanced` SKILL.md:44 "integer vectors are 30-40%
faster" (now: exact grid math, measure first); SKILL.md:69 "~1µs per `is_instance_valid` call"
(now: an object-database lookup per call); `references/tool-script-recipes.md:84` "`@onready`
doesn't fire reliably in editor" (now: `_ready()` may not run again after a tool-script reload);
`component-system` SKILL.md:292 "hand-written `.tscn` files" leave `@export` nodes null (now:
scenes built in code).

**Checked and correct (selection):** the freed node's own coroutine never resumes
(`gdscript.cpp:2146`); `await` in `_ready()` emits `ready` early; `CONFUSABLE_CAPTURE_REASSIGNMENT`
(4.3) and `CONFUSABLE_TEMPORARY_MODIFICATION` default `WARN` (4.7.2 `gdscript_warning.h:149`);
rest parameter must be untyped `Array` and abstract-class parse rules (4.7.2 `gdscript_analyzer.cpp`);
`is not` parses on 4.3; `EnableGodotDotNetPreview` / `Godot.Bindings` (4.7.2 `Sdk.targets:26`);
custom `[Signal]` `+=` is a backing delegate, so it is not auto-disconnected
(`ScriptSignalsGenerator.cs:272-287`); `SignalAwaiter` returns `Variant[]`; `await Task.Run`
resumes on the main thread (`GodotSynchronizationContext`); C# instance IDs carry validator bits.

**Sweep:** each correction's key nouns were grepped in `skills/`, `agents/`, `.codex/`. One hit
outside batch A was fixed: `godot-optimization` `references/cpu-bottlenecks.md:13` (batch D) said
per-frame allocation "triggers the garbage collector" in GDScript and counted `Vector2`/`Vector3`
constructors as allocations — GDScript has no GC, and `Variant` stores `Vector2`/`Vector3` inline
(4.3 `core/variant/variant.h:253`, `variant.cpp:1116`). A review round found a second: `godot-debugging` `references/signal-tracing.md:89` (batch F)
quoted the missing-argument error as "Expected 1 arguments"; the message is "Method expected 0
argument(s), but called with 1" (4.7.2 run; 4.3 prints "arguments", `core/variant/variant.cpp:3653`).
The review round also replaced `Timer.SignalName.Timeout` with `SceneTreeTimer.SignalName.Timeout`
in `csharp-godot` SKILL.md:201, 237 (same `StringName`, but `CreateTimer` returns a
`SceneTreeTimer`; 4.7.2 `doc/classes/SceneTree.xml:20` uses that form). No agent or Codex file
repeated a corrected claim.

**Not changed:** `dependency-injection` `references/testing-with-di.md` assigns a `StubAudio extends Node` to an
`AudioManager`-typed export — already on the Task 4 deferred list.

## Batch B — gameplay

Skills: `player-controller`, `state-machine`, `ability-system`, `inventory-system`,
`dialogue-system`, `save-load`, `camera-system`, `input-handling`, `math-essentials`. Every
SKILL.md and every reference file was read in full (prose and code comments; code bodies were
read for the engine APIs they call).

| Skill | Claims checked (SKILL.md + references) | Wrong | Softened |
|---|---|---|---|
| `player-controller` | 14 + 4 | 4 | 1 |
| `state-machine` | 8 + 2 | 0 | 0 |
| `ability-system` | 6 + 15 | 2 | 0 |
| `inventory-system` | 10 + 14 | 6 | 0 |
| `dialogue-system` | 12 + 14 | 8 | 0 |
| `save-load` | 12 + 13 | 2 | 0 |
| `camera-system` | 15 + 13 | 5 | 0 |
| `input-handling` | 30 + 12 | 9 | 0 |
| `math-essentials` | 28 + 10 | 2 | 0 |
| **Total** | **252** | **38** | **1** |

The worst errors were three examples that fail outright. The hand-rolled `DialogueManager` declared
`class_name DialogueManager` and was registered as an autoload of the same name, which is a parse
error. Its condition evaluator could not resolve `GameState.has_item(...)` either, because
`Expression` does not see autoload names. The inventory `ItemRegistry` scanned `res://items/` for
`.tres` files, which an exported build lists as `.tres.remap`, so the registry came up empty in every
export.

| Skill file | Was | Is | Source |
|---|---|---|---|
| `player-controller` SKILL.md:55, 81 | `Input.get_vector()` returns a "normalized 4-directional vector" | an analog vector, length capped at 1 | 4.3 `doc/classes/Input.xml:193` |
| `player-controller` SKILL.md:23 | `CharacterBody2D` row lists FPS | `CharacterBody2D/3D` | — (an FPS controller is `CharacterBody3D`, §4) |
| `player-controller` SKILL.md:372 | "Player sticks to walls" → set `floor_block_on_wall = false` | the property (default `true`) stops floor movement climbing walls and lets the body slide down them; keep it on | 4.3 `doc/classes/CharacterBody2D.xml:150-151`; `scene/2d/physics/character_body_2d.cpp:180-200` |
| `player-controller` SKILL.md:375 | sliding down slopes fixed by `floor_snap_length` > 0 | `floor_stop_on_slope` (default `true`) stops idle sliding; snap keeps the body on slopes going down | 4.3 `CharacterBody2D.xml:160-166` |
| `ability-system` `references/stat-modifiers.md:62` | C# `Operation` "serializes as `operation` (snake_case)" | serializes as `Operation` — C# members keep their C# names | 4.3 `modules/mono/editor/Godot.NET.Sdk/Godot.SourceGenerators/ScriptPropertiesGenerator.cs:138-150` |
| `ability-system` `references/tags-and-conditions.md:556` | `new StringName("…")` in C# avoids per-frame allocations | it allocates on every call; cache in `static readonly StringName` fields | 4.3 `modules/mono/glue/GodotSharp/GodotSharp/Core/StringName.cs:16, 68-72` (sealed class, native string-name per construction) |
| `inventory-system` SKILL.md:93 | equipment by "extending the `Inventory` class"; sums `ItemData.stats` | an `Equipment` node beside the `Inventory`; `stats` is a property you add to `ItemData` | `references/equipment.md:16-17`; `references/core-classes.md:16-31` |
| `inventory-system` SKILL.md:95; `references/equipment.md:3` | `EquipmentSlotType` enum | `SlotType` | `references/equipment.md:21` |
| `inventory-system` SKILL.md:101 | slot widgets are `Panel`s | `Button`s | `references/ui-binding.md:15, 63` |
| `inventory-system` SKILL.md:109, 111; `references/serialization.md:3` | saves keyed by resource path, a `version` field, ConfigFile / JSON variants | `{id, qty}` per slot resolved through `ItemRegistry`; the version field lives in the save file (**save-load**) | `references/serialization.md:48-75` |
| `inventory-system` `references/serialization.md:33-34, 110-111` | registry loads files whose name ends in `.tres` | strip `.remap` first: exported builds list text resources as `name.tres.remap`; `load()` follows the remap | 4.3 `doc/classes/DirAccess.xml:187`; `editor/export/editor_export_platform.cpp:1399`; `core/io/resource_loader.cpp:1064` |
| `inventory-system` `references/equipment.md:141-143` | C# `item.Get("stats")` for a `Stats` property | `item.Get("Stats")` — C# members keep their C# names | 4.3 `ScriptPropertiesGenerator.cs:138-150` |
| `dialogue-system` `references/dialogue-manager.md:17-19`; `references/ui-presentation.md:32-34` | autoload script declares `class_name DialogueManager`; the UI exports a `DialogueManager`-typed field | no `class_name` — the same name as an autoload is a parse error; the UI takes `@onready var manager := DialogueManager` (the autoload) | 4.3 `modules/gdscript/gdscript_analyzer.cpp:373`; 4.7.2 run: `Class "DialogueManager" hides an autoload singleton.`; fixed scripts compile and run with the autoloads |
| `dialogue-system` SKILL.md:189, 227; `references/branching-and-conditions.md:48, 113-118`; `references/dialogue-manager.md:110-114, 238-242` | conditions such as `"GameState.has_item('key')"` evaluated with `GameState` (or `self`) as the base instance | register `GameState` as an input name: `parse(cond, ["GameState"])`, `execute([GameState])`; a base instance only resolves bare calls | 4.3 `core/math/expression.cpp:666-725` (identifier → input or named index on self), `:1326`; 4.7.2 run: "Invalid named index 'GameState' for base type Object" with a base instance, `true` with an input |
| `dialogue-system` `references/branching-and-conditions.md:122-126` | `Expression` is "GDScript-native" and "does not support C# objects as base instances" | `Expression` is a core class and calls C# methods by their C# names; the prefix mapping stays as a typed alternative | 4.3 `core/math/expression.cpp:1457` (`base.callp`) |
| `dialogue-system` SKILL.md:57 | `choices` is an `Array[Dictionary]` | an untyped `Array` of Dictionaries | SKILL.md:76 (`@export var choices: Array = []`) |
| `dialogue-system` SKILL.md:181 | `start(data)`, `advance(choice_index)`, signals `line_changed`, `choices_presented` | `start_dialogue(data)`, `advance()`, `choose(choice_index)`; `dialogue_started`, `line_displayed`, `choice_presented`, `dialogue_ended` | `references/dialogue-manager.md:22-25, 35-52` |
| `dialogue-system` SKILL.md:197 | typewriter driven by a `Tween` | by a `Timer` | `references/ui-presentation.md:22, 243` |
| `dialogue-system` SKILL.md:213 | C# uses `string.Format` with named-tag preprocessing | a `string.Replace` per placeholder | `references/variable-interpolation.md:44-66` |
| `dialogue-system` `references/ui-presentation.md:233` | C# `gs.Get("player_name")` | `gs.Get("PlayerName")` | 4.3 `ScriptPropertiesGenerator.cs:138-150` |
| `save-load` SKILL.md:49 | components declare `save_callable` / `load_callable`, iterated "by ID" | `serialize` / `deserialize` callables, a `save_id`, the `saveable` group | `references/save-architecture.md:39-53` (`save_id`, `serialize`, `deserialize`, `add_to_group("saveable")`) |
| `save-load` `references/json-saves.md:215-306` | C# `Get`/`Set("current_health")` on a C# `HealthComponent` | `"CurrentHealth"` (the repo's C# `HealthComponent`s), with a note for GDScript components | 4.3 `ScriptPropertiesGenerator.cs:138-150`; `scene-organization` SKILL.md:95 |
| `camera-system` SKILL.md:159, 219 | trauma shake sets `rotation` on the `Camera2D` | add `ignore_rotation = false` — it defaults to `true`, so the roll never shows | 4.3 `doc/classes/Camera2D.xml:139-140` |
| `camera-system` SKILL.md:138 | shake script has no `class_name`; the usage snippet casts to `ScreenShakeCamera` | `class_name ScreenShakeCamera` added | — (the C# class is `ScreenShakeCamera`) |
| `camera-system` SKILL.md:285 | transitions tween "the next camera's position/zoom from the current camera's" | tween the current camera to the next camera's values, then `make_current()` | `references/transitions.md:10, 29-40` |
| `camera-system` `references/split-screen.md:12, 37-38, 69-71, 97-98` | each player in its own `SubViewport`; `own_world_3d = true` for a "separate physics world per viewport" | every `Viewport` makes its own `World2D`, so P2 shares P1's `world_2d`; a 3D SubViewport renders its parent's world unless `own_world_3d` is set, so leave it `false` | 4.3 `scene/main/viewport.cpp:4985, 1225-1234, 4377-4388`; `doc/classes/Viewport.xml:301-302` |
| `camera-system` `references/transitions.md:121` | GDScript `await` "only operates on Godot signals" | on signals and GDScript coroutines, not on a C# `Task` | 4.3 `modules/gdscript/gdscript_vm.cpp:2356-2374` |
| `input-handling` SKILL.md:23-31, 39 | `_shortcut_input()` runs after `_input` and before the UI | `_input` → GUI (`_gui_input`) → `_shortcut_input` → `_unhandled_key_input` → `_unhandled_input` | 4.3 `scene/main/viewport.cpp:3253, 3258, 3303, 3309, 3315` |
| `input-handling` SKILL.md:49-64 | `InputEventKey`, mouse, touch and gesture events as direct children of `InputEvent` | under `InputEventFromWindow` / `InputEventWithModifiers` / `InputEventMouse`; `InputEventShortcut` added | 4.7.2 `ClassDB.get_parent_class` run |
| `input-handling` SKILL.md:183 | `get_vector()` returns a normalized vector | length capped at 1 | 4.3 `Input.xml:193` |
| `input-handling` SKILL.md:187, 191, 244; `references/input-buffering.md:3, 10` | `is_action_just_pressed()` in `_physics_process()` "can miss inputs" at a low tick rate; buffering exists so presses "aren't lost between physics frames" | a press is reported on the next physics tick even if already released; only presses inside one tick merge. Buffering keeps an early press (jump before landing) alive | 4.3 `core/input/input.cpp:325-326, 761-763`, `legacy_just_pressed_behavior` default `false` (`:1681`); 4.7.2 run at 10 ticks/s: 20 taps → 20 hits one per tick, 20 taps → 5 hits four per tick |
| `input-handling` SKILL.md:233; `references/event-propagation.md:33, 35` | reverse tree order means "deepest child first"; "move it deeper" to get input first | the node lowest in the Scene dock (last in tree order) first; move it lower | 4.3 `scene/main/scene_tree.cpp:1193` |
| `input-handling` SKILL.md:233 | while paused only `PROCESS_MODE_ALWAYS` nodes receive input | `ALWAYS` or `WHEN_PAUSED` | 4.3 `scene/main/scene_tree.cpp:1203`; `scene/main/node.cpp:857-863` |
| `input-handling` SKILL.md:251 | symptom "Input fires during pause" with cause `INHERIT` | "Pause menu ignores input while paused" (an `INHERIT` node gets none) | same as the row above |
| `input-handling` SKILL.md:265 | Input Map deadzone "default 0.2" | 0.5 on 4.3, 0.2 from 4.4 | 4.3 `editor/project_settings_editor.cpp:393`, `core/input/input_map.h:77`; 4.7.2 `input_map.h:55, 74` (compat for PR 97281) |
| `input-handling` `references/gamepad.md:83` | weak motor = low-frequency, strong = high-frequency | weak = high-frequency, strong = low-frequency | 4.3 `platform/windows/joypad_windows.cpp:511-512` (strong → XInput left motor, the low-frequency one) |
| `math-essentials` SKILL.md:312 | `normalized()` on a zero vector "crashes" | returns `(0, 0)` | 4.3 `core/math/vector2.cpp:52-58`; `Vector2.xml:327` |
| `math-essentials` `references/random-numbers.md:14` | `randi()` returns the "full int range" | 0 to 2^32 - 1 | 4.3 `doc/classes/@GlobalScope.xml:1046` |

**Softened (no source either way):** `player-controller` SKILL.md:374 "Inconsistent jump height"
caused by "fixed velocity ignores frame timing" (in `_physics_process` the step is fixed). Now: "Jump
height can't be varied | Jump sets one fixed velocity", same fix.

**Checked and correct (selection):** `PhysicsBody2D.get_gravity()` exists in 4.3 (`PhysicsBody2D.xml:26`);
`physics/2d/default_gravity` / `physics/3d/default_gravity`; a `Dictionary` keyed by a node's
`StringName` name answers `has()` for the `String` (4.7.2 run); `Camera2D.position_smoothing_speed`
default `5.0` (`Camera2D.xml:165`); `TextureProgressBar` range defaults `0..100`; GDScript has no set
type; `Input.get_vector` / `get_axis`; `emulate_touch_from_mouse` default `false`,
`emulate_mouse_from_touch` `true` (`main/main.cpp:2939, 2947`); `var_to_str` / `str_to_var`
round-trips an `InputEventKey` (4.7.2 run); `angle_difference` / `Mathf.AngleDifference` exist in
4.3; GodotSharp 4.7.2 has no `Basis.IsOrthonormal()`; `user://` paths per platform; `res://` is
read-only in exports.

**Sweep:** each correction's key nouns were grepped in `skills/`, `agents/`, `.codex/`. One hit outside
batch B was fixed: `resource-pattern` `references/collections.md:58-59, 107-108` (batch A) scanned a
folder for `.tres`/`.res` the same way as `ItemRegistry`; it now strips `.remap`. No other skill
rotates a `Camera2D` for shake, uses `own_world_3d` for split screen, declares a `class_name` equal to
an autoload name, or evaluates `Expression` against an autoload name (`beehave` passes its blackboard
as the base instance and calls bare `get_value(...)`, which is correct). The other C# `Get`/`Set`
calls with snake_case names (`gdextension`, `phantom-camera`) target GDExtension or GDScript classes,
where snake_case is right. No agent or Codex file repeated a corrected claim.

**Not changed:** `dialogue-system` `references/variable-interpolation.md` uses `GameState.Instance`
(autoload-as-static) — already on the Task 4 deferred list.

## Batch C — rendering

Skills: `2d-essentials`, `3d-essentials`, `shader-basics`, `particles-vfx`, `animation-system`,
`tween-animation`. Every SKILL.md and every reference file was read in full (prose and code
comments; code bodies were read for the engine APIs they call). A claim repeated in a reference is
counted once, under SKILL.md.

| Skill | Claims checked (SKILL.md + references) | Wrong | Softened |
|---|---|---|---|
| `2d-essentials` | 22 + 43 | 8 | 0 |
| `3d-essentials` | 24 + 60 | 7 | 0 |
| `shader-basics` | 16 + 17 | 5 | 0 |
| `particles-vfx` | 21 + 37 | 9 | 0 |
| `animation-system` | 16 + 27 | 4 | 0 |
| `tween-animation` | 19 + 13 | 5 | 0 |
| **Total** | **315** | **38** | **0** |

The worst errors were two broken examples and two features described as working where they do
nothing. The decal spawner called `look_at()` before `add_child()`, which fails with "Node not inside
tree" and leaves every decal unrotated. The tile lookup passed `global_position` to `local_to_map()`,
which takes local coordinates. `Line2D.antialiased` is stored but never passed to the draw call, so
the skill's "works by generating additional geometry" described an effect that does not exist, and
`3d-essentials` said Compatibility renders decals, which it does not.

| Skill file | Was | Is | Source |
|---|---|---|---|
| `2d-essentials` SKILL.md:24-26 | `z_as_relative` "default: false = global"; the example sets it `true` | default `true` (relative to the parent); the example sets `false` for an absolute `z_index` | 4.3 `doc/classes/CanvasItem.xml:631` |
| `2d-essentials` SKILL.md:44 | `Parallax2D` placed in a `CanvasLayer` (layer −1) with no further setup | `follow_viewport = false` on the `Parallax2D`, to match the layer, which doesn't follow the camera | 4.3 `doc/classes/Parallax2D.xml:17-18`; `scene/2d/parallax_2d.cpp:122-124` |
| `2d-essentials` SKILL.md:112 | `GPUParticles2D` and `CPUParticles2D` "share the same `ParticleProcessMaterial` interface" | `CPUParticles2D` exposes the same parameters as its own properties | 4.3 `doc/classes/CPUParticles2D.xml` (no `process_material`); `references/2d-particles.md:16` |
| `2d-essentials` SKILL.md:167 | `Line2D.antialiased` "works by generating additional geometry — no MSAA needed" | stored but never passed to the draw call, so it has no visible effect; use MSAA 2D or a soft-edged texture | 4.3 `scene/2d/line_2d.cpp:264-270, 280-309` (`canvas_item_add_triangle_array` without the flag); same in 4.7.2 |
| `2d-essentials` `references/parallax.md:12` | `ParallaxBackground`/`ParallaxLayer` "deprecated" (skill says 4.3+) | superseded by `Parallax2D` in 4.3; marked deprecated from 4.5 | 4.3 and 4.4-stable `ParallaxBackground.xml` have no `deprecated`; 4.5-stable and 4.7.2 `ParallaxBackground.xml:2` do |
| `2d-essentials` `references/parallax.md:21` | `scroll_offset` is the "offset for the repeat canvas starting point" | a manual offset the camera does not override; loops when `repeat_size` is set | 4.3 `doc/classes/Parallax2D.xml:39-41` |
| `2d-essentials` `references/tilemap.md:36` | `Use Texture Padding` adds a "1px transparent border" | a 1px border copied from each tile's edge pixels (default on) | 4.3 `scene/resources/2d/tile_set.cpp:5613-5622`; `TileSetAtlasSource.xml:275-276` |
| `2d-essentials` `references/tilemap.md:91, 99` | `local_to_map(global_position)` | `local_to_map(tile_map.to_local(global_position))` (C#: `ToLocal`) | 4.3 `doc/classes/TileMapLayer.xml:160` |
| `3d-essentials` SKILL.md:71 | `StandardMaterial3D` property `normal_map` | `normal_texture` with `normal_enabled` | 4.3 `doc/classes/BaseMaterial3D.xml:290`; 4.7.2 ClassDB has no `normal_map` |
| `3d-essentials` SKILL.md:120; `references/materials-and-lighting-recipes.md:121, 123` | light bake mode default is Disabled | default is Dynamic (indirect baked into lightmaps, direct real-time; VoxelGI/SDFGI update it live) | 4.3 `doc/classes/Light3D.xml:62`; `scene/3d/lightmap_gi.cpp:370, 1029-1042`; `modules/lightmapper_rd/lm_compute.glsl:587` |
| `3d-essentials` SKILL.md:128, 190; `references/environment-and-post.md:89` | AgX listed with the other tonemappers (skill says 4.3+) | AgX from Godot 4.4 | 4.3 `doc/classes/Environment.xml:413-423` (no `TONE_MAPPER_AGX`); 4.4-stable `Environment.xml:431` |
| `3d-essentials` SKILL.md:158; `references/decals.md:84` | "All renderers support decals"; Compatibility "limited by max renderable elements" | Forward+ and Mobile only; Compatibility does not render decals | 4.3 and 4.7.2 `doc/classes/Decal.xml:11` |
| `3d-essentials` `references/materials-and-lighting-recipes.md:87` | drive day/night with `Environment.sun_position` | no such property; tween the light's color and rotation | 4.7.2 ClassDB; no `sun_position` in 4.3 `doc/classes/` |
| `3d-essentials` `references/decals.md:28-75` | decal oriented with `look_at()` before `add_child()` | add it first, then set `global_position` and `look_at()` | 4.3 `scene/3d/node_3d.cpp:939`; 4.7.2 run: "Node not inside tree" before, −Y along −normal after |
| `3d-essentials` `references/global-illumination.md:50` | LightmapGI UV2 "auto-generated on import" | only with the import option Meshes > Light Baking = Static Lightmaps; the default, Static, does not unwrap | 4.3 `editor/import/3d/resource_importer_scene.cpp:2354, 2444, 2518` |
| `shader-basics` SKILL.md:98 | spatial `ALPHA` needs to be enabled "in render mode" | writing it moves the material to the transparent pass | 4.3 `servers/rendering/renderer_rd/forward_clustered/scene_shader_forward_clustered.cpp:113, 418` |
| `shader-basics` SKILL.md:182 | `CompositorEffect` runs "post-tonemap or pre-tonemap" | at five points from before the opaque pass to after the transparent pass, all before the built-in post effects | 4.3 `doc/classes/CompositorEffect.xml:65-79` |
| `shader-basics` `references/compositor-effects.md:103-108` | "Godot uses the Compositor internally for SDFGI, VoxelGI, SSR" | those are part of the renderer; a `Compositor` holds only your effects | 4.3: no engine class derives from `CompositorEffect`; `render_forward_clustered.cpp:1981-2252` calls only the user effects |
| `shader-basics` `references/visual-shaders.md:33` | `ScalarOp` node | `FloatOp` (`IntOp` for integers) | 4.7.2 ClassDB: no `VisualShaderNodeScalarOp` |
| `shader-basics` `references/visual-shaders.md:38` | `Input` (custom) exposes a uniform | `FloatParameter`, `ColorParameter`, … expose uniforms; `Input` reads built-ins | 4.7.2 ClassDB (`VisualShaderNodeParameter` subclasses) |
| `particles-vfx` SKILL.md:25 | use CPU particles "when you need CPU-side particle positions" | neither node exposes per-particle positions | 4.3 `doc/classes/CPUParticles2D.xml` method list |
| `particles-vfx` SKILL.md:188 | sub-emitters fire at "birth, collision, death, manual" via a `subemitter` property | constant rate, collision, death, birth from 4.4; `sub_emitter_mode` + `sub_emitter` | 4.3 `ParticleProcessMaterial.xml` (no `SUB_EMITTER_AT_START`); 4.4-stable `:529` |
| `particles-vfx` SKILL.md:198; `references/attractors-and-collision.md:55` | attractors and colliders "Forward+/Mobile only; no 2D equivalents"; SDF collider "Forward+ only" | Compatibility runs box/sphere attractors and box/sphere/height-field colliders; vector-field attractors and SDF colliders need Forward+/Mobile; `GPUParticles2D` collide with `LightOccluder2D` | 4.3 `drivers/gles3/storage/particles_storage.cpp:648, 681`; `ParticleProcessMaterial.xml:145` |
| `particles-vfx` SKILL.md:206; `references/attractors-and-collision.md:95` | lower `turbulence_noise_scale` = larger swirls; higher values "cheaper but weaker" | higher = smoother, larger features | 4.3 `ParticleProcessMaterial.xml:386-388` |
| `particles-vfx` SKILL.md:220; `references/performance-and-pitfalls.md:10, 72` | set `fixed_fps = 30` as an optimization; flicker when it is "not set" | 30 is the default; `0` updates every frame | 4.3 `GPUParticles2D.xml:75`, `GPUParticles3D.xml:106` |
| `particles-vfx` SKILL.md:222; `references/performance-and-pitfalls.md:64` | a one-shot needs `restart()` before `emitting = true` to re-fire | `emitting = true` is ignored while the last burst's particles live; `restart()` clears them and sets `emitting` | 4.3 `scene/2d/gpu_particles_2d.cpp:46-56, 443-447`; `GPUParticles2D.xml:68` |
| `particles-vfx` SKILL.md:222; `references/performance-and-pitfalls.md:68` | base `color` "overrides" `color_ramp` | it multiplies the ramp; a dark `color` hides it | 4.3 `scene/resources/particle_process_material.cpp:604`; `ParticleProcessMaterial.xml:159` |
| `particles-vfx` `references/attractors-and-collision.md:12, 31`; `references/performance-and-pitfalls.md:70` | `attractor_interaction_enabled` must be turned on first | on by default | 4.3 `ParticleProcessMaterial.xml:133` |
| `particles-vfx` `references/subemitters.md:23, 59` | the sub-emitter is assigned on the `ParticleProcessMaterial` (`SubEmitterNode` slot) | on the parent particles node's `sub_emitter` | 4.3 `scene/3d/gpu_particles_3d.cpp:430-442` |
| `animation-system` SKILL.md:238; `references/bone-constraints.md:11, 19` | `BoneConstraint3D` modifiers reference only another bone | from 4.6 the reference can be a `Node3D` (`REFERENCE_TYPE_NODE`, model space) | 4.5-stable `BoneConstraint3D.xml` (no reference type); 4.6-stable `BoneConstraint3D.xml:144`; 4.7.2 `BoneConstraint3D.xml:145-151` |
| `animation-system` `references/common-pitfalls.md:11` | snapping comes from "using `AnimationPlayer.play()` instead of AnimationTree" | `AnimationPlayer` blend time defaults to 0; set `playback_default_blend_time`, `set_blend_time()` or `play(name, custom_blend)` | 4.7.2 ClassDB: `playback_default_blend_time` default `0.0`, `play(name, custom_blend, …)` |
| `animation-system` `references/common-recipes.md:103` | C# Call Method target "must be public" | private methods are registered too | 4.3 `modules/mono/editor/Godot.NET.Sdk/Godot.SourceGenerators/ScriptMethodsGenerator.cs:128-131` (no accessibility filter) |
| `animation-system` `references/common-recipes.md:35-67` | GDScript combo defines `_on_animation_finished` but never connects it (the C# twin does) | `_ready()` connects `animation_finished` | the C# block at :76-80 |
| `tween-animation` SKILL.md:264; `references/looping-and-signals.md:59` | `loop_finished` fires on each loop | not after the last loop; `finished` fires instead | 4.3 `doc/classes/Tween.xml:450-453` |
| `tween-animation` `references/looping-and-signals.md:60` | `step_finished` fires per tweener | per step: one tweener or a group of parallel tweeners | 4.3 `Tween.xml:456-459` |
| `tween-animation` SKILL.md:272, 316; `references/lifecycle.md:61-66` | `set_ignore_time_scale()` with no version (skill says 4.3+) | Godot 4.4+; on 4.3 compensate with `set_speed_scale(1.0 / Engine.time_scale)` | not in 4.3 `Tween.xml` / `scene/animation/tween.cpp`; 4.4-stable `Tween.xml:231` |
| `tween-animation` SKILL.md:310 | "Tween runs during pause" → `TWEEN_PAUSE_PROCESS` | default `TWEEN_PAUSE_BOUND` follows the bound node's `process_mode`; `STOP` pauses, `PROCESS` keeps running | 4.3 `Tween.xml:253, 470-477` |
| `tween-animation` SKILL.md:311 | `from()` ignored because it was "called after `set_parallel()` changed ordering" | the `from()` value is applied only when that tweener starts | 4.3 `scene/animation/tween.cpp:544-566` |

**Checked and correct (selection):** MSAA 2D is Forward+/Mobile only (`ProjectSettings.xml:2360`);
`LIGHT_VERTEX`/`SHADOW_VERTEX` are writable in canvas `fragment()` (`shader_types.cpp:262-263`);
`physics_quadrant_size` default 16; 8 directional lights in Forward+ (`renderer_scene_render.h:50`);
`max_clustered_elements` 512; Compatibility lights are 8 omni + 8 spot per object
(`rasterizer_scene_gles3.cpp:83-89`); a static light bakes direct and indirect, a dynamic one indirect
only (`lm_compute.glsl:587`); OBJ meshes get no LOD from the OBJ mesh importer; SSAO/SSIL/SSR/SDFGI,
DOF and auto-exposure renderer support (`Environment.xml`, `CameraAttributes*.xml`); the AreaLight3D
defaults and notes (4.7.2 `AreaLight3D.xml`); stencil modes are spatial only (4.7.2
`shader_types.cpp:261-264`); compositor effects run in array order (`compositor_storage.cpp:186`);
`RenderSceneBuffers` typed locals parse when calling `get_internal_size()` (the object is a
`RenderSceneBuffersRD`); trails are absent in Compatibility (`particles_storage.cpp:290`); a system
cannot be its own sub-emitter (`gpu_particles_3d.cpp:434`); `explosiveness` does not apply to
sub-emitted particles (`particles.glsl:388-402`); calling `play()` with the playing animation does
not restart it; `SpringBoneSimulator3D` defaults stiffness 1.0, drag 0.4, gravity 0 (4.7.2 run); the
IK class hierarchy and C# names; `PropertyTweener` re-reads its start each loop, so `as_relative()`
accumulates (`tween.cpp:554-563`); an empty tween errors "Tween without commands, aborting."
(4.7.2 `tween.cpp:83`).

**Sweep:** each correction's key nouns were grepped in `skills/`, `agents/`, `.codex/` (`z_as_relative`,
`follow_viewport`, `ParallaxBackground`, `CPUParticles`, `Line2D`, texture padding, `local_to_map`,
`normal_map`, `sun_position`, bake modes, AgX, decals, `look_at(` on a new node, UV2, `ALPHA`,
tonemap/Compositor, `ScalarOp`, particle positions, attractors and 2D collision, `noise_scale`,
`attractor_interaction`, `fixed_fps`, `restart()`, `color_ramp`, sub-emitter, SDF, snapping,
"must be public", bone-relative, `step_finished`/`loop_finished`, `TWEEN_PAUSE`,
`ignore_time_scale`). Every hit was inside batch C's skills. `rendering-pipeline` SKILL.md:72
("static lights … cost nothing at runtime") agrees with the corrected bake-mode semantics and was
left alone. No agent or Codex file repeated a corrected claim.

**Not changed:** eval-measured text — `animation-system`'s BlendSpace `sync_mode` summary (skill-13)
and `3d-essentials`' volumetric fog legacy-blending warning (skill-15) — was checked against 4.7.2
(`sync_mode` default 0, `use_legacy_blending` default `false`) and left as written. Editor
click-paths (`retargeting.md`'s Import-dock steps, snapping menu paths) are out of scope.
