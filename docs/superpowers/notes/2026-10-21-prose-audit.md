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
| `particles-vfx` | 21 + 37 | 9 | 1 |
| `animation-system` | 16 + 27 | 4 | 0 |
| `tween-animation` | 19 + 13 | 5 | 0 |
| **Total** | **315** | **38** | **1** |

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

**Softened (no source either way):** `particles-vfx` `references/performance-and-pitfalls.md:72`: the flicker row "`fixed_fps` set to 0 causes mobile flicker" no longer asserts a cause. 4.7.2 `GPUParticlesCollision3D.xml:12` recommends `fixed_fps = 0` (or at/above the frame rate) to reduce stutter with moving colliders, so the row now reads "stutter or look uneven" and suggests testing against the default.

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

## Batch D — systems

Skills: `physics-system`, `ai-navigation`, `audio-system`, `multithreading`, `procedural-generation`,
`localization`, `godot-optimization`. Every SKILL.md and every reference file was read in full
(prose and code comments; code bodies were read for the engine APIs they call).
`godot-optimization/references/cpu-bottlenecks.md` was sampled only, because batch A had already
corrected it. A claim repeated in a reference is counted once, under SKILL.md.

| Skill | Claims checked (SKILL.md + references) | Wrong | Softened |
|---|---|---|---|
| `physics-system` | 40 + 74 | 7 | 1 |
| `ai-navigation` | 26 + 12 | 4 | 0 |
| `audio-system` | 34 + 16 | 10 | 1 |
| `multithreading` | 22 + 12 | 4 | 0 |
| `procedural-generation` | 14 + 10 | 2 | 0 |
| `localization` | 30 + 20 | 7 | 1 |
| `godot-optimization` | 30 + 40 | 13 | 1 |
| **Total** | **380** | **47** | **4** |

The worst errors were advice that does the opposite of what it promises:
- `godot-optimization` told readers to wrap sprites in a `CanvasGroup` so they batch. A
  `CanvasGroup` does not batch. It draws its children into a backbuffer and then draws that once
  with its own material, which adds a copy and breaks the batch. 2D batching is automatic.
- The same skill's "RIGHT" material example duplicated the shared material for each instance, so
  it cost exactly what the "WRONG" example did.
- `ai-navigation` fixed "agent can't fit through doorways" by lowering the agent's `radius`, which
  is used only for avoidance and has no effect on paths.
- `localization`'s RTL recipe used a `[ltr]` BBCode tag that does not exist, so it printed literally.

| Skill file | Was | Is | Source |
|---|---|---|---|
| `physics-system` SKILL.md:91-92 | `SeparationRay` and `WorldBoundary` shapes are 2D-only (no 3D column) | both have 3D variants | 4.7.2 ClassDB: `SeparationRayShape3D`, `WorldBoundaryShape3D` exist |
| `physics-system` SKILL.md:93 | `CylinderShape3D` is "Jolt only — unstable on GodotPhysics" | it works on GodotPhysics but has known bugs; prefer Jolt | 4.3 and 4.7.2 `doc/classes/CylinderShape3D.xml:8` |
| `physics-system` SKILL.md:126; `references/raycasting-recipes.md:96` | space queries are "only safe" in `_physics_process()` because "the space is locked during rendering" | the space is locked while the physics step runs, and with physics on a separate thread it can only be reached from `_physics_process()` | 4.3 `servers/physics_2d/godot_step_2d.cpp:129, 295`; `doc/classes/World2D.xml:17` |
| `physics-system` SKILL.md:148 | Jolt wins include an "optional thread-safe mode" and active-edge detection "fixes ghost collisions" | dropped the thread mode, which both engines get from `physics/3d/run_on_separate_thread`; active-edge detection "reduces" ghost collisions | 4.7.2 `modules/jolt_physics/register_types.cpp:43-50`; `ProjectSettings.xml:2709-2711` ("can help alleviate") |
| `physics-system` SKILL.md:158, 170; `references/interpolation-camera.md:9` | physics interpolation and `get_global_transform_interpolated()` were given with no version, in a skill that targets 4.3+ | 4.3 interpolates 2D only; 3D interpolation and `Node3D.get_global_transform_interpolated()` need 4.4+ | 4.3 `ProjectSettings.xml:2321` ("only implemented in the 2D renderer"), no method in 4.3 `Node3D.xml`; 4.4-stable `Node3D.xml:49` |
| `physics-system` `references/rigidbody-recipes.md:54-55` | `rough` uses "max friction instead of geometric mean"; `absorbent` uses "min bounce instead of geometric mean" | the contact uses the lower friction (rough: this body's; both rough: the higher one) and the two bounce values summed (absorbent: this body's is subtracted) | 4.3 `scene/resources/physics_material.h:57-69`; `modules/godot_physics_3d/godot_body_pair_3d.cpp:253-259`; 4.7.2 `modules/jolt_physics/spaces/jolt_space_3d.cpp:154-160` |
| `physics-system` `references/troubleshooting.md:11` | `continuous_cd = true` on a RigidBody | `true` on `RigidBody3D`; `RigidBody2D.continuous_cd` is an enum (`CCD_MODE_CAST_RAY`/`CAST_SHAPE`) | 4.7.2 ClassDB: `RigidBody2D.continuous_cd` hint "Disabled,Cast Ray,Cast Shape" |
| `ai-navigation` SKILL.md:132 | `path_desired_distance` default 1 (2D table) | 20 (1 is the 3D default) | 4.3 `NavigationAgent2D.xml:182`, `NavigationAgent3D.xml:185` |
| `ai-navigation` SKILL.md:283 | agent too wide for doorways: lower `radius` on the NavigationAgent | lower `agent_radius` on the NavigationPolygon/NavigationMesh and rebake; the agent's `radius` is avoidance only | 4.3 `NavigationAgent2D.xml:197-199` |
| `ai-navigation` SKILL.md:287 | empty first path: defer `target_position` "to `_ready()`" | the map synchronizes on the first physics frame; `await get_tree().physics_frame` (or `map_changed`) in `_ready()` first | 4.3 `NavigationServer2D.xml:511`; godot-docs `navigation_introduction_2d.rst:141-146, 221` |
| `ai-navigation` `references/async-baking.md:36-37` | C# connected `BakeFinished` with `+=` while the GDScript twin uses `CONNECT_ONE_SHOT`, so each rebake added a handler | `Connect(..., (uint)ConnectFlags.OneShot)` | the GDScript block at :13 |
| `audio-system` SKILL.md:112 | -6 dB is "~50% perceived volume" | -6 dB is about half amplitude (`db_to_linear(-6.0)` ≈ 0.5) | 4.7.2 run: `db_to_linear(-6.0)` = 0.501 |
| `audio-system` SKILL.md:163 | bus effect `Limiter` | `HardLimiter`; `Limiter` is deprecated | 4.3 `doc/classes/AudioEffectLimiter.xml:2` |
| `audio-system` SKILL.md:191 | 2D players attenuate toward the "nearest `AudioListener2D` (or the Camera2D)" | the current `AudioListener2D`, otherwise the centre of the screen | 4.3 `scene/2d/audio_stream_player_2d.cpp:143-154` |
| `audio-system` SKILL.md:277; `references/music-manager.md:3` | the music manager reference has a "push/pop stack, current-track query" and "layering" | crossfade, fade-out stop and music bus volume (what the file contains) | `references/music-manager.md:14-65` |
| `audio-system` SKILL.md:95, 311, 323; `assets-pipeline` SKILL.md:230 | WAV is stored uncompressed and has zero decode cost | the WAV importer defaults to QOA from 4.4 (PCM, labelled Disabled, on 4.3); pick PCM for zero decode cost | 4.3 `editor/import/resource_importer_wav.cpp:93` (default 0); 4.4-stable `:88` and 4.7.2 `:89` (default 2, QOA) |
| `audio-system` SKILL.md:321, 338; `assets-pipeline` SKILL.md:226, 230, 302 | "Force Mono" for any 3D audio file | Force Mono is a WAV import option only; OGG and MP3 must be mono at the source | 4.3 `resource_importer_wav.cpp:84`; `modules/vorbis/resource_importer_ogg_vorbis.cpp:76-82`, `modules/minimp3/resource_importer_mp3.cpp:76-82` (no mono option) |
| `audio-system` SKILL.md:332 | "no audio heard" caused by a wrong bus name | a missing bus name falls back to `Master` — the sound plays, bypassing your bus; silence means a muted or lowered bus | 4.3 `doc/classes/AudioStreamPlayer.xml:66` |
| `audio-system` SKILL.md:334 | "positional audio has no panning" without an AudioListener or camera | a 3D player with no current `Camera3D`/`AudioListener3D` is silent; 2D falls back to the screen centre | 4.3 `scene/3d/audio_stream_player_3d.cpp:358-382`; `audio_stream_player_2d.cpp:149-151` |
| `audio-system` `references/interactive-music.md:22` | `playlist.bpm = 120.0` | removed: `AudioStreamPlaylist` has no `bpm` property (`get_bpm()` reads the streams) | 4.3 `modules/interactive_music/doc_classes/AudioStreamPlaylist.xml`; 4.7.2 run: "Invalid assignment of property or key 'bpm'" |
| `audio-system` `references/interactive-music.md:14, 148` | `AudioStreamPlaylist` for "intro → loop → outro" | `loop` (default `true`) repeats the whole list, intro included; an intro that plays once is an `AudioStreamInteractive` clip with auto-advance | 4.3 `AudioStreamPlaylist.xml` (`loop`); `AudioStreamInteractive.xml:141, 216-222` |
| `multithreading` SKILL.md:18; `references/pitfalls.md:52` | `Rendering > Driver > Thread Model = Separate` | `Rendering > Driver > Threads > Thread Model`; the value is `Multi-Threaded` on 4.3; marked experimental | 4.3 `core/config/project_settings.cpp:1508`; 4.7.2 `:1775`; `ProjectSettings.xml:2407` (experimental) |
| `multithreading` SKILL.md:19 | `Navigation > Pathfinding > Max Threads` with no version | 4.4+ | absent from 4.3 `ProjectSettings.xml`; 4.4-stable has it; 4.7.2 `:2464` |
| `multithreading` SKILL.md:75 | `Semaphore.post(count := 1)` with no version | `post()`; `count` from 4.4 | 4.3 `doc/classes/Semaphore.xml:18-20` (no parameter); 4.4-stable has `count` |
| `multithreading` `references/pitfalls.md:9` | `ERR_BUSY` example: task A waits on task B "queued behind A" | a task waiting on an older task lower in the same call stack | 4.3 `doc/classes/WorkerThreadPool.xml:113` |
| `procedural-generation` SKILL.md:32-33, 94 | global `randf()` gives "different results on different platforms" | the global generator is randomized at startup and shared with every other caller | 4.3 `doc/classes/@GlobalScope.xml:1083-1084` |
| `procedural-generation` `references/wave-function-collapse.md:199` | addon `AlexeyBond/godot-wfc` with "3D grid WFC" | the repository is `AlexeyBond/godot-constraint-solving` (the old URL returns 404); flat `GridMap` layers only, full 3D not implemented | GitHub API: `repos/AlexeyBond/godot-wfc` 404; the addon's README ("What's not (yet) implemented: 3d map generation") |
| `localization` SKILL.md:54-55 | CSV import: Delimiter "Comma or Tab"; a Translations section to enable or disable locales | Comma, Semicolon or Tab; the other option is Compress — there is no per-locale toggle | 4.3 `editor/import/resource_importer_csv_translation.cpp:71-72`; 4.7.2 `:71-74` |
| `localization` SKILL.md:173-174 | C# `string.Format(Tr("PLAYER_HEALTH"), currentHealth)` | `string.Format` ignores the `%d` in the translation; `Tr(...).Replace("%d", ...)` | the CSV at :47 (`Health: %d`); .NET composite formatting uses `{0}` |
| `localization` SKILL.md:258; `references/rtl-support.md:54` | `NOTIFICATION_TRANSLATION_CHANGED` "defined on `MainLoop`, inherited by `Node`" | `Node` defines its own constant (`Node` derives from `Object`); `MainLoop` has one of the same name | 4.3 `doc/classes/Node.xml:2, 1209`; `MainLoop.xml:106` |
| `localization` SKILL.md:266 | GDScript has "no locale-aware number formatting" | no locale-aware digit grouping; `TextServer.format_number()` converts digits to the locale's numeral system | 4.3 `doc/classes/TextServer.xml:1022-1028` |
| `localization` `references/rtl-support.md:14, 26` | project setting "Internationalization → Rendering → Text Direction → RTL" | `Root Node Layout Direction` → Right-to-Left | 4.3 `core/config/project_settings.cpp:1534` |
| `localization` `references/rtl-support.md:21-23, 33` | `APPLICATION_LOCALE` / `SYSTEM_LOCALE` with no version (skill says 4.3+) | 4.4+; 4.3 has `LOCALE` only | 4.3 `doc/classes/Control.xml:1360-1369`; 4.4-stable has `LAYOUT_DIRECTION_APPLICATION_LOCALE` |
| `localization` `references/rtl-support.md:40-48` | BBCode `[ltr]100/200[/ltr]` | `[lri]100/200[pdi]` (there is no `[ltr]` tag) | 4.3 `scene/gui/rich_text_label.cpp:4390-4423`; 4.7.2 run: `[ltr]` parses as literal text, `[lri]…[pdi]` inserts U+2066/U+2069 |
| `godot-optimization` SKILL.md:71-74, 132, 136-137; `godot-debugging` `references/performance-debugging.md:44-47` | monitors `Render > Total Draw Calls`, `Render > Video RAM`, `Object > Object Count`, `Physics 3D > Active Bodies` | `Raster > Total Draw Calls`, `Video > Video Mem`, `Object > Objects`, `Physics 3D > Active Objects` | 4.3 `main/performance.cpp:116-130`; 4.7.2 `:175-188` |
| `godot-optimization` SKILL.md:98, 100, 132, 164; `references/draw-calls.md:11-20` | wrap sprites in `CanvasGroup` so they batch into one draw call | 2D batching is automatic (Compatibility; Forward+/Mobile from 4.4) while consecutive items share texture, material, filter/repeat and clip; `CanvasGroup` draws its children to a backbuffer with its own material and breaks the batch | 4.3 `doc/classes/CanvasGroup.xml:7-8`; `drivers/gles3/rasterizer_canvas_gles3.cpp:601-624, 812-830`; the RD canvas renderer (`renderer_canvas_render_rd.cpp`) has no batching code in 4.3 (no occurrence of "batch") and 232 occurrences in 4.4-stable |
| `godot-optimization` SKILL.md:122; `references/memory-management.md:88, 127` | `free()` inside a self-emitted signal "will crash" (undefined behaviour) | in the editor and debug exports the call is refused ("Object is locked and can't be freed") and the script stops there; release exports skip that check and free the node mid-emission (undefined behaviour) — use `queue_free()` | 4.3 `core/object/object.cpp:45-63, 757-773` (lock and check under `#ifdef DEBUG_ENABLED`); 4.7.2 `:770-788`; `SConstruct` defines `DEBUG_ENABLED` for editor and `template_debug` only; 4.7.2 run (debug build): the error above |
| `godot-optimization` SKILL.md:133 | move logic to `_physics_process` because it "runs less often" | fixed 60 ticks/s by default — less often only when the frame rate is higher | 4.7.2 `ProjectSettings.get_setting("physics/common/physics_ticks_per_second")` = 60 |
| `godot-optimization` SKILL.md:135 | diagnosed by "Profiler shows `TileMap._process`"; fix: disable `use_parent_material` | `TileMap` has no `_process` to profile (diagnose by draw calls); `use_parent_material` is already `false` by default | 4.3 `doc/classes/TileMap.xml` (no `_process`); `CanvasItem.xml` (`use_parent_material` default `false`) |
| `godot-optimization` SKILL.md:139 | Profiler shows `PackedScene.instantiate` | only with Editor Settings > Debugger > Profile Native Calls on | 4.3 `editor/debugger/editor_profiler.cpp:101` (`debugger/profile_native_calls`) |
| `godot-optimization` `references/draw-calls.md:23-61` | the "RIGHT" example duplicates the shared material per instance | one shared material; the variation goes in an `instance uniform` via `set_instance_shader_parameter()` (GDScript and C#) | 4.3 `doc/classes/GeometryInstance3D.xml:20-28`; godot-docs `optimizing_3d_performance.rst:110-119` (Forward+ auto-instancing needs the same mesh and material) |
| `godot-optimization` `references/draw-calls.md:25, 34-35, 54-55` (review fix) | the corrected example's `instance uniform` given with no version | 3D instance uniforms in the Compatibility renderer need 4.4+; on 4.3 Compatibility the tint is not applied | 4.3 `drivers/gles3/shaders/scene.glsl` has no `instance_offset` and `rasterizer_scene_gles3.cpp` passes none; 4.4-stable `scene.glsl:437, 1000` |
| `godot-optimization` `references/draw-calls.md:64` | `gi_mode = BAKE_STATIC` lets "the engine merge static geometry"; "enable Rendering > Mesh LOD" | `gi_mode` (`GI_MODE_STATIC`) only affects GI baking and nothing merges meshes; use `MultiMeshInstance3D` or merge in the modelling tool | 4.3 `GeometryInstance3D.xml:45-47` |
| `godot-optimization` `references/draw-calls.md:169, 197` | `VisibleOnScreenNotifier3D` "distance thresholds"; enable "Rendering > Mesh LOD"; "Import > Generate LODs" must be enabled | the notifier has no distance setting (use `visibility_range_begin/end`); automatic LOD is on by default (`meshes/generate_lods` = true, `threshold_pixels` 1.0, 0 disables) | 4.3 `GeometryInstance3D.xml:78`; `ProjectSettings.xml:2677-2679`; `editor/import/3d/resource_importer_scene.cpp:2352` |
| `godot-optimization` `references/memory-management.md:57, 69-74` | resources are freed only once "the cache entry is cleared"; eviction by `load_threaded_request` and `OS.gc()` | the cache holds no reference: a resource is freed when its last reference goes and its entry goes with it; `CACHE_MODE_IGNORE` bypasses the cache; `OS.gc()` does not exist | 4.3 `core/io/resource.cpp:571-583`; `ResourceLoader.xml:142-143`; 4.7.2 ClassDB: no `OS.gc` |
| `godot-optimization` `references/memory-management.md:110-113` | C# `ImageTexture` "is freed when it goes out of scope or is set to null" | the C# wrapper holds the reference until the GC finalizes it; `Dispose()` releases it at once | 4.3 `modules/mono/glue/GodotSharp/GodotSharp/Core/GodotObject.base.cs:83-100` |
| `godot-optimization` `references/physics-tuning.md:24-28` | comment `mask = 2 \| 3` written as layer numbers next to code using bit values (`2 \| 3` is layers 1 and 2) | "mask layers 2 + 3", with a note that layer N is bit `1 << (N - 1)` | `references/physics-tuning.md:32-33` |

**Softened (no source either way):**
- `physics-system` SKILL.md:148 and `references/troubleshooting.md:15`: "reliable `CylinderShape3D`" and "fully supported" under Jolt became "without GodotPhysics' known cylinder bugs" and "use Jolt". Neither the Jolt docs page nor the class reference says the Jolt cylinder is bug-free.
- `audio-system` SKILL.md:95, 339: "MP3 adds silence at the start" became "depending on the encoder it can start with padding silence". Neither the importer docs nor the decoder documentation states it.
- `localization` SKILL.md:309: "Label shows key after scene change" is no longer blamed on a translation "not loaded yet". Translations registered with `TranslationServer` are global and outlive scenes. The cause now reads "added at runtime by code that has not run yet in this scene".
- `godot-optimization` SKILL.md:138: the diagnosis "Profiler shows `String` allocation functions; high GC pressure" became "Profiler Self time in string-heavy functions; in C#, frequent GC pauses". The GDScript profiler lists script functions, not allocations, and GDScript has no GC.

**Checked and correct (selection):**
- Physics bodies and areas:
  - `_integrate_forces()` is not called for a sleeping body, because sleeping bodies leave the active list (4.3 `godot_body_2d.cpp:398-403, 621-623`).
  - Contact signals need `contact_monitor` and `max_contacts_reported` (default 0).
  - `Area2D` mask defaults to 1 and `monitoring` to true.
  - Point-gravity and space-override semantics.
  - `ConcavePolygonShape3D` is meant for static bodies (`ConcavePolygonShape3D.xml:9`).
  - An untransformed single shape enables a broad-phase optimization (godot-docs `collision_shapes_3d.rst:121-125`).
  - Create Physical Skeleton assigns `JOINT_TYPE_PIN` (4.3 `skeleton_3d_editor_plugin.cpp:409`).
  - `PhysicalBoneSimulator3D` exists in 4.3, and `influence` defaults to 1.0.
  - `SoftBody3D` `simulation_precision` defaults to 5.
- Jolt:
  - The differences list (Baumgarte, margins, the `world_node` default Node A, face index, unsupported joint properties) matches godot-docs `using_jolt_physics.rst:30-110`.
  - The engine setting is `Jolt Physics`.
  - New projects default to Jolt from 4.6 (`editor_node.cpp:8350`).
- Navigation and threading:
  - `bake_navigation_*` takes `on_thread = true`.
  - `NavigationServer2D.map_get_path` signature.
  - `disable_navigation_3d` is an SCons option (4.7.2 `SConstruct:269`).
  - `WorkerThreadPool` return codes.
  - `Mutex` is reentrant.
  - `load_threaded_get` statuses.
  - The thread-safe API rules match godot-docs `thread_safe_apis.rst`.
- Audio:
  - `AudioStreamPlayer2D` defaults: `max_distance` 2000, `attenuation` 1.0 (exponent, `audio_stream_player_2d.cpp:160`), `max_polyphony` 1.
  - `unit_size` is the 0 dB distance for the inverse models.
  - Adaptive-music class names and `add_transition` parameters.
  - `TRANSITION_TO_TIME_PREVIOUS_POSITION` = 2 (4.7.2).
- Localization:
  - CSV `?context`/`?plural` semantics.
  - `TranslationServer` has no signals.
  - The CSV importer's compress option.
- Optimization:
  - `Performance` monitor constants.
  - Forward+ automatic instancing (godot-docs).
  - `Engine.max_physics_steps_per_frame` defaults to 8.

**Sweep:** each correction's key nouns were grepped in `skills/`, `agents/` and `.codex/`: `CanvasGroup`/batching, monitor names, `free()`/crash, `OS.gc`, `gi_mode`, Mesh LOD, notifier distance, `locked`, Cylinder, thread-safe, ghost collision, `get_global_transform_interpolated`, `rough`/`absorbent`, `continuous_cd`, `SeparationRay`/`WorldBoundary`, `path_desired_distance`, agent `radius`, `MainLoop`, `[ltr]`, `APPLICATION_LOCALE`, `string.Format(Tr`, Text Direction, Delimiter, `Limiter`, Force Mono, WAV decode cost, bus fallback, playlist `bpm`, push/pop, Thread Model, Max Threads, `post(count`, `ERR_BUSY`, `godot-wfc`, global `randf`.

Three hits were outside batch D, and all were fixed:
- `assets-pipeline` SKILL.md:226, 230, 302: Force Mono and WAV decode cost (batch F skill).
- `godot-debugging` `references/performance-debugging.md:44-47`: monitor names (batch F skill).

`godot-debugging` SKILL.md:171 and 236 name the monitors informally ("Video RAM / Object count") and were left as written. `godot-code-review` SKILL.md:393 ("`queue_free()`, not `free()`, to avoid use-after-free crashes") is about use-after-free, not the signal lock, and was left as written. No agent or Codex file repeated a corrected claim.

**Not changed:** version callouts (out of scope); editor click-paths (Create Physical Skeleton, SoftBody attachment steps, Import dock labels). Batch D has no eval-measured content. Other edits, not counted as claims:
- the `procedural-generation` tip renames `var seed` to `level_seed`, so it no longer shadows the global `seed()`, and adds the C# `GD.Hash`;
- an explanatory comment in the C# one-shot connect.

## Batch E — UI + networking

Skills: `godot-ui`, `hud-system`, `responsive-ui`, `multiplayer-basics`, `multiplayer-sync`,
`dedicated-server`. Every SKILL.md and every reference file was read in full (prose, code comments,
and the engine APIs the code calls). A claim repeated in a checklist or a reference is counted once.
Behaviour claims were checked for `#ifdef DEBUG_ENABLED` guards; none of the corrected ones has one
(the RPC rejection and the "not connected" error are plain `ERR_FAIL_COND_MSG`, which also
prints in release exports).

| Skill | Claims checked (SKILL.md + references) | Wrong | Softened |
|---|---|---|---|
| `godot-ui` | 24 + 49 | 14 | 0 |
| `hud-system` | 20 + 23 | 12 | 0 |
| `responsive-ui` | 26 + 29 | 8 | 0 |
| `multiplayer-basics` | 32 + 22 | 12 | 0 |
| `multiplayer-sync` | 24 + 20 | 11 | 0 |
| `dedicated-server` | 26 + 16 | 7 | 0 |
| **Total** | **311** | **64** | **0** |

The worst errors were examples and advice that cannot work as written:
- `multiplayer-basics` set `set_multiplayer_authority()` "on the server" after spawning. The call is
  local and is not replicated, so every client kept the server as the authority and the owning
  client's input guard always returned. The authority is now set inside the `spawn_function`,
  which runs on every peer.
- `multiplayer-sync`'s interpolation connected `synchronized` on the replicated `CharacterBody2D`
  (the signal belongs to the `MultiplayerSynchronizer`, so the connect fails) and blended by
  `Engine.get_physics_interpolation_fraction()`, which restarts every physics tick rather than
  every network update. It also said `delta_interval = 0` disables delta sync; `0` sends every frame.
- `responsive-ui`'s pixel-art script set `content_scale_factor` to the integer scale. In `viewport`
  stretch mode the factor divides the render resolution, so a 4× screen rendered the 320×180 game
  at 80×45. Integer scaling is `content_scale_stretch = CONTENT_SCALE_STRETCH_INTEGER`
  (`display/window/stretch/scale_mode`). The same skill changed the stretch mode at runtime with
  `ProjectSettings.set_setting()`, which the engine reads only at startup.
- `dedicated-server` described a "server export template" that strips rendering from the binary.
  Godot 4 has none: the dedicated-server export uses the regular template and strips resources
  to placeholders. It also listed a `headless` feature tag that does not exist.
- `hud-system`'s minimap set a `cull_mask` on `Camera2D` (2D has no camera cull mask) and never
  shared the main `World2D` with the `SubViewport`, so the minimap showed nothing; its damage-number
  pool freed every label after its first animation and then reused the freed nodes.

| Skill file | Was | Is | Source |
|---|---|---|---|
| `godot-ui` SKILL.md:23 | Control has a `minimum_size` property | `custom_minimum_size` plus a computed minimum (`get_combined_minimum_size()`) | 4.7.2 ClassDB: no `Control.minimum_size`; 4.3 `doc/classes/Control.xml:376` |
| `godot-ui` SKILL.md:36; `references/theme-system.md:80-87` | a null `theme` "walks up the tree to the nearest ancestor with one"; assign the theme "at the root `CanvasLayer`" | every ancestor `Control`/`Window` with a theme is checked, nearest first, and the walk stops at the first parent that is neither; `CanvasLayer` has no `theme` property | 4.3 `scene/theme/theme_owner.cpp:252-287, 428-441`; 4.7.2 ClassDB: no `CanvasLayer.theme` |
| `godot-ui` SKILL.md:39 | UI "directly under the scene root's built-in canvas" is unaffected by camera transforms | the default canvas (layer 0) follows a `Camera2D`, which sets the viewport's canvas transform; use a `CanvasLayer` | 4.3 `scene/2d/camera_2d.cpp:67`; `doc/classes/CanvasLayer.xml:47` (`follow_viewport_enabled`, default `false`) |
| `godot-ui` SKILL.md:101 | `StyleBoxFlat` properties `corner_radius`, `border_width` | `corner_radius_*`, `border_width_*` (per side/corner) | 4.7.2 ClassDB: neither property exists |
| `godot-ui` `references/focus-and-navigation.md:58-59` | `ui_accept` (Enter / A button), `ui_cancel` (Escape / B button) | `ui_accept` is Enter, Kp Enter, Space; `ui_cancel` is Escape; neither has a gamepad button by default | 4.3 `core/input/input_map.cpp:424-438`; 4.7.2 `:458-471`; 4.7.2 run: `InputMap.action_get_events()` |
| `godot-ui` `references/anchors-in-code.md:11-16, 35-40` | `set_anchors_and_offsets_preset(TOP_RIGHT)`, `size = 200×60`, then `offset_right = -16` gives a "fixed 200x60" label | that sequence yields 36×44; `set_anchors_preset()` plus all four offsets (-216, -16, 16, 76) gives 200×60 (GDScript and C#) | 4.7.2 run: both sequences on a 1000×500 parent |
| `godot-ui` `references/signals.md:15-16, 27` | `toggled(button_pressed)`; `TextEdit.text_changed(new_text)`; `gui_input` is "any event within the rect" | `toggled(toggled_on)`; `TextEdit.text_changed` has no argument; `gui_input` also gets key events while focused | 4.3 `doc/classes/BaseButton.xml:100-101`, `TextEdit.xml:1413`, `Control.xml:1094-1097` |
| `godot-ui` `references/ui-patterns.md:14` | `TextureRect — stretch: EXPAND_FIT` | `expand_mode: EXPAND_IGNORE_SIZE`, `stretch_mode: STRETCH_KEEP_ASPECT_COVERED` (no `EXPAND_FIT` constant) | 4.7.2 ClassDB: `TextureRect.ExpandMode`, `StretchMode` |
| `godot-ui` `references/ui-patterns.md:253` | `event.is_action_just_pressed("ui_cancel")` | `event.is_action_pressed(...)` — `InputEvent` has no `is_action_just_pressed()` | 4.7.2 run: "Invalid call. Nonexistent function 'is_action_just_pressed' in base 'InputEventKey'" |
| `hud-system` SKILL.md:18, 320 | `CanvasLayer` with layer `≥ 1` is what keeps the HUD off the camera | any `CanvasLayer` ignores `Camera2D` unless `follow_viewport_enabled`; layer `≥ 1` only draws it above the world | 4.3 `doc/classes/CanvasLayer.xml:7-8, 47, 54-55`; `camera_2d.cpp:67` |
| `hud-system` SKILL.md:49 | world → screen with `get_viewport().get_screen_transform()` | `get_viewport().get_canvas_transform()` (what the damage-number and prompt code use); `get_screen_transform()` maps to the OS window | 4.3 `doc/classes/Viewport.xml:89-92` |
| `hud-system` SKILL.md:62, 321 | `step = 0` avoids "snapping to integer steps" (`ProgressBar.step`) | `TextureProgressBar` defaults `step` to 1, `ProgressBar` to 0.01 | 4.3 `doc/classes/TextureProgressBar.xml:47`, `Range.xml:66` |
| `hud-system` SKILL.md:330; `references/minimap.md:24-29` | the main and minimap `Camera2D`'s `cull_mask`; the SubViewport "renders a separate view of the world" | `Camera2D` has no cull mask: set `visibility_layer` on items and `canvas_cull_mask` on each viewport; share the world with `world_2d = get_viewport().world_2d`, since every viewport creates its own `World2D` | 4.7.2 ClassDB: no `Camera2D.cull_mask`; 4.3 `Viewport.xml:251, 413`; `scene/main/viewport.cpp:4985` |
| `hud-system` `references/minimap.md:77` | `SubViewportContainer` "scales" the 256×256 render to display size | with `stretch` off (default) it shows the texture at the SubViewport's size; `stretch = true` resizes the SubViewport instead | 4.3 `doc/classes/SubViewportContainer.xml:24` |
| `hud-system` `references/minimap.md:80` | `canvas_item_default_texture_filter = TEXTURE_FILTER_NEAREST` | `DEFAULT_CANVAS_ITEM_TEXTURE_FILTER_NEAREST` | 4.7.2 ClassDB: `Viewport.DefaultCanvasItemTextureFilter` |
| `hud-system` `references/interaction-prompts.md:18` | `interaction_prompt.gd` had no `class_name`, while `interactable.gd` returns `InteractionPrompt` | added `class_name InteractionPrompt` | 4.7.2 `--check-only`: "Could not find type "InteractionPrompt" in the current scope" |
| `hud-system` `references/interaction-prompts.md:187` | a world-space `Label` with `top_level = true` floats above the object | a plain child `Label`; `top_level` stops it inheriting the parent's transform | 4.3 `doc/classes/CanvasItem.xml:613-614` |
| `hud-system` `references/notifications.md:10` | the max-visible cap "drops the oldest when the queue overflows" | extra messages wait in the queue (what the code does, and what SKILL.md:296 says) | the code at `:38-40` |
| `hud-system` `references/notifications.md:48, 114` | `get_node("MessageLabel")` | `get_node("MarginContainer/MessageLabel")`, the path in the toast tree at `:145-149` (GDScript and C#) | the tree at `:145-149` |
| `hud-system` `references/damage-numbers.md:10, 52, 92` | the pooled label calls `queue_free()` when its tween ends | `hide()` — the spawner reuses the 20 pooled nodes, so freeing them made the 21st hit use a freed instance | the spawner at `:107-132` |
| `responsive-ui` SKILL.md:18 | keys of `.godot/project.godot` | the `[display]` section of `project.godot` (project root) | — (file location) |
| `responsive-ui` SKILL.md:26, 87, 163; `references/pixel-art-setup.md:15, 28-44, 56-73` | pixel-art integer scaling by `Stretch > Scale` = 2–4 or a script setting `content_scale_factor` | `Stretch > Scale Mode = integer` / `content_scale_stretch = CONTENT_SCALE_STRETCH_INTEGER`; in `viewport` mode the scale factor divides the render resolution | 4.3 `scene/main/window.cpp:1197` (`final_size = viewport_size / content_scale_factor`), `core/config/project_settings.cpp:1515`; `main/main.cpp:3765, 3786` |
| `responsive-ui` SKILL.md:38-49 | `ProjectSettings.set_setting("display/window/stretch/mode", …)` changes the stretch mode at runtime ("takes effect next frame") | read once at startup; at runtime set `get_window().content_scale_mode` | 4.3 `main/main.cpp:3760-3794` |
| `responsive-ui` SKILL.md:58 | `canvas_items`: "rendered at design resolution, then upscaled" | rendered at the window's resolution, 2D and UI scaled from the design size (that description is the `viewport` mode) | 4.3 `doc/classes/Window.xml:851-856`; `window.cpp:1189` |
| `responsive-ui` SKILL.md:60 | `disabled`: "every Control node must handle its own layout" | no scaling; the viewport is the window size (anchors and containers still work) | 4.3 `window.cpp:1105-1110` |
| `responsive-ui` SKILL.md:123 | Project Settings `Size > Test Width/Height` | `Window Width/Height Override` (`display/window/size/window_width_override`); "Test Width" is the Godot 3 name | 4.3 `core/config/project_settings.cpp:1471` |
| `responsive-ui` `references/dpi-scaling.md:12` | `content_scale_factor` "multiplies all UI element sizes" | in `canvas_items` and `disabled` modes; in `viewport` mode it divides the render resolution | 4.3 `window.cpp:1109, 1197` |
| `multiplayer-basics` SKILL.md:39, 299; `references/enet-setup.md:70-76` | "the four `MultiplayerAPI` signals" | five: `server_disconnected` too (added to the signal table) | 4.3 `doc/classes/MultiplayerAPI.xml:130`; 4.7.2 ClassDB |
| `multiplayer-basics` SKILL.md:23, 253, 305; `references/spawning-networked-objects.md:49-55, 85-95`; `references/player-join-flow.md:16` | `set_multiplayer_authority()` "call on the server" after `spawn()` | local and not replicated — call it on every peer; the examples now set it in the `spawn_function` (GDScript and C#) | 4.3 `doc/classes/Node.xml:884-887` ("does not automatically replicate the new authority") |
| `multiplayer-basics` SKILL.md:259, 289 | configure `_spawnable_scenes`; every replicated `add_child` "must go through `MultiplayerSpawner.spawn()`" | `add_spawnable_scene()` / Auto Spawn List replicates a plain `add_child` under `spawn_path`; `spawn()` is only for custom spawns | 4.3 `modules/multiplayer/doc_classes/MultiplayerSpawner.xml:18, 44-45`; `multiplayer_spawner.cpp:73` |
| `multiplayer-basics` SKILL.md:285 | an RPC from the wrong peer is "silently ignored" | the receiver rejects it and logs `RPC '…' is not allowed on node …` (not debug-only) | 4.3 `modules/multiplayer/scene_rpc_interface.cpp:252`; 4.7.2 `:263` |
| `multiplayer-basics` SKILL.md:291, 309 | `rpc()` before a peer is assigned: "crash or silent failure" | the default peer is an `OfflineMultiplayerPeer` (only `call_local` RPCs run, and only locally); the real error is a client calling before it has connected: "Trying to call an RPC via a multiplayer peer which is not connected." | 4.3 `scene_multiplayer.cpp:690`; `scene_rpc_interface.cpp:467, 478-492` (4.7.2 :478); the "not connected yet" text is in `_send_rpc` (:298), reached only after that check |
| `multiplayer-basics` SKILL.md:292 | `export_exclude` | the export preset's exclude filter / Resources export mode (`exclude_filter`) | 4.3 `editor/export/editor_export.cpp:84` |
| `multiplayer-basics` `references/spawning-networked-objects.md:99` | `spawn_path` is relative to the spawner's parent; "packed-scene paths are sent over the network" | resolved from the spawner itself (hence `../Players`); the spawn packet carries the scene's index in the spawnable list, so peers must register the same scenes in the same order | 4.3 `multiplayer_spawner.cpp:195`; `scene_replication_interface.cpp:483, 529` |
| `multiplayer-basics` `references/disconnect-handling.md:12` | ENet timeout "~30 s by default" | 5–30 s depending on round-trip time (`ENetPacketPeer.set_timeout()`); the client also gets `server_disconnected` | 4.3 `thirdparty/enet/enet/enet.h:240-242`; `modules/enet/doc_classes/ENetPacketPeer.xml:101-108`; `scene_multiplayer.cpp:54-66` |
| `multiplayer-basics` `references/disconnect-handling.md:50-58` | retry loop `await multiplayer.connected_to_server` | a failed attempt never emits it, so the loop hung on the first failure; it now polls the new peer's `get_connection_status()` | `scene_multiplayer.cpp:58-61` (failure emits `connection_failed`) |
| `multiplayer-sync` SKILL.md:30, 36 | `replication_interval = 0` means "every physics frame" | every network process frame — the multiplayer API is polled from `SceneTree::process`, not the physics step | 4.3 `MultiplayerSynchronizer.xml:64-65`; `scene/main/scene_tree.cpp:504-514`; 4.7.2 `:688-707` |
| `multiplayer-sync` SKILL.md:37 | `delta_interval = 0` "disabled" | `0` (default) = delta sync every network process frame | 4.3 `MultiplayerSynchronizer.xml:55-56` |
| `multiplayer-sync` SKILL.md:39 | a `visibility_filters` property | no such property; `add_visibility_filter(callable)` | 4.7.2 ClassDB |
| `multiplayer-sync` SKILL.md:21, 45-48; `references/bandwidth-optimization.md:15-29` | full sync sends "all values"; use `replication_interval` as a "full-state heartbeat" next to delta sync | each property is Always (unreliable, every `replication_interval`) or On Change (reliable, `delta_interval`); the intervals govern disjoint sets | 4.3 `SceneReplicationConfig.xml:112-117`; `scene_replication_interface.cpp:747, 764, 837, 852` |
| `multiplayer-sync` SKILL.md:180, 236; `references/interpolation.md:15, 29-50, 67-91` | connect `synchronized` on the replicated node; blend with `Engine.get_physics_interpolation_fraction()` | the signal is on the `MultiplayerSynchronizer`; blend by time since the update over the sync interval (GDScript and C#) | 4.3 `MultiplayerSynchronizer.xml:76-84`; `doc/classes/Engine.xml:114` (fraction between physics ticks) |
| `multiplayer-sync` SKILL.md:223; `references/bandwidth-optimization.md:33` | 16-bit quantization "cuts bytes by 2×" (and "mm" vs the reference's cm) | RPC arguments and synced state compress an int to a type byte + 1/2/4/8 bytes, so a 16-bit int costs 3 bytes; a float falls through to `encode_variant` (4-byte header, type stored in its first byte) and costs 8, or 12 if it is not float32-exact; packing into a `PackedByteArray` is optional and drops the per-value type byte (review fix: the first correction claimed ints cost 4 bytes via plain `encode_variant`) | 4.3 `scene/main/multiplayer_api.cpp:72-137` (`ENCODE_16` at :105, fallback at :132), `modules/multiplayer/scene_rpc_interface.cpp:401, 411`, `scene_replication_interface.cpp:518, 548, 740, 754, 831, 843`, `core/io/marshalls.cpp:1290-1296, 1384-1398`; 4.7.2 `multiplayer_api.cpp:66-131` (`ENCODE_16` at :99), `scene_rpc_interface.cpp:412, 422`, `marshalls.cpp:1380` |
| `multiplayer-sync` `references/bandwidth-optimization.md:109` | "set the channel per `@rpc`" (for `reliable`/`unreliable`) | those are transfer modes; the channel is the optional trailing integer | `@rpc` annotation: mode, sync, transfer mode, channel |
| `dedicated-server` SKILL.md:26, 34, 39, 84, 253, 298 | a "server export template" strips rendering and audio code from the binary | no such template in Godot 4: the "Export as dedicated server" mode uses the regular template, adds the `dedicated_server` tag (which forces the headless display and dummy audio drivers) and exports visual resources as placeholders | 4.3 `editor/plugins/dedicated_server_export_plugin.cpp:72-73, 104-111`; `editor/export/project_export.cpp:788-794, 1329`; `main/main.cpp:1826-1829` |
| `dedicated-server` SKILL.md:30, 33 | a **Linux/X11** (or Linux Server) preset | the platform is named **Linux** | 4.3 `platform/linuxbsd/export/export.cpp:44` |
| `dedicated-server` SKILL.md:85 | `--headless` sets a `headless` feature tag | no such tag; check `DisplayServer.get_name() == "headless"` | 4.7.2 run with `--headless`: `OS.has_feature("headless")` false, display `headless`, audio `Dummy`; 4.3 `core/os/os.cpp:384-440` |
| `dedicated-server` `references/deployment.md:133`; SKILL.md:267, 298 | C#: enable "Include Scripts Content" and install the `dotnet` runtime on the target | C# exports are self-contained: assemblies and runtime go into `data_<project>_<platform>_<arch>` (or the binary with `dotnet/embed_build_outputs`); `include_scripts_content` only ships the `.cs` sources | 4.3 `modules/mono/editor/GodotTools/GodotTools/Export/ExportPlugin.cs:47, 69, 102-110, 212, 224`; `Build/BuildSystem.cs:219-220` |
| `dedicated-server` `references/server-config.md:24-27, 114-118` | CLI args parsed first, then config file, then env — while the comment and SKILL.md:261 say env overrides config and CLI overrides both | order is config → env → CLI (GDScript and C#) | the comment at `:72` |

**Softened (no source either way):** none. Left as written and unverified: the `screen_get_dpi()`
figures in `responsive-ui/references/dpi-scaling.md:76` (192 on Windows at 200 %, 220+ on macOS
Retina — consistent with the macOS formula in 4.3 `display_server_macos.mm:1534-1553`, not run), and
the Dockerfile package list in `dedicated-server/references/deployment.md:19-22`.

**Checked and correct (selection):**
- UI defaults: `Button`/`LineEdit`/`HSlider` `focus_mode` `FOCUS_ALL`, `Label`/`TextureRect`
  `FOCUS_NONE`; `Label.mouse_filter` `IGNORE`, containers `PASS`; `CanvasLayer.layer` 1;
  `SubViewport.render_target_update_mode` default `UPDATE_WHEN_VISIBLE`; `ui_left` etc. carry D-pad and
  left stick; Tab/Shift-Tab are `ui_focus_next`/`ui_focus_prev`.
- `LabelSettings` takes priority over theme properties (4.7.2 `Label.xml:70`); RichTextLabel
  `[outline_size]`/`[outline_color]` tags (4.3 `rich_text_label.cpp:4775, 4941`);
  `FoldableContainer.folding_changed(is_folded)`, `title_alignment`; PopupMenu search-bar defaults and
  the `allow_search` note; `offset_transform_*` defaults.
- `MarginContainer` `margin_*` theme constants; `gui/theme/custom`; `InputMap.action_get_events()`
  returns `Array[InputEvent]`; `as_text_physical_keycode()`.
- `display/window/stretch/aspect` semantics for `keep_width`/`keep_height`/`expand` (4.3
  `window.cpp`); `--resolution`; `get_display_safe_area()`; `screen_set_orientation()` constants;
  `virtual_keyboard_*`; `LineEdit`/`TextEdit` show the keyboard themselves.
- Networking: server is peer 1 and client IDs are random; authority defaults to 1; RPC modes and
  transfer modes; `call_local`; trailing channel argument; `create_server()` returns `Error`;
  `multiplayer_peer = null` is accepted (4.3 `scene_multiplayer.cpp:195`); `public_visibility`
  default `true`; `synchronized`/`delta_synchronized` signals.
- Dedicated server: `--headless` uses the headless display server and dummy audio;
  `RenderingServer.set_render_loop_enabled()`; `_process`/`_physics_process` still run;
  `Engine.physics_ticks_per_second` can be set at runtime; `OS.get_cmdline_args()`.

**Sweep:** each correction's key nouns were grepped in `skills/`, `agents/` and `.codex/`:
`minimum_size`, theme lookup / `CanvasLayer` theme, camera / default canvas, `corner_radius`,
`ui_accept`/`ui_cancel` gamepad, `is_action_just_pressed` on events, `EXPAND_FIT`, `toggled`,
`get_screen_transform`, `step = 0`, `cull_mask`, `world_2d`, `canvas_item_default_texture_filter`,
`top_level`, `.godot/project.godot`, `content_scale_factor` / stretch scale / `scale_mode`,
`ProjectSettings.set_setting("display`, Test Width, four signals, `set_multiplayer_authority`,
`_spawnable_scenes` / `spawn()`, `export_exclude`, `OfflineMultiplayerPeer`, `visibility_filters`,
`delta_interval`, "every physics frame", `get_physics_interpolation_fraction`, `synchronized`,
server template / `dedicated_server` / `headless` tag, Include Scripts Content / .NET runtime.
No hit outside batch E needed a change: `2d-essentials` SKILL.md:71 uses `get_screen_transform()`
correctly (with `get_global_transform_with_canvas()`, for OS-window coordinates);
`camera-system/references/split-screen.md:12` already states that each viewport has its own
`World2D`; `2d-essentials` SKILL.md:31 already describes `CanvasLayer` as independent of the camera.
No agent or Codex file repeated a corrected claim.

**Not changed:** version callouts (out of scope); editor click-paths, except
`dedicated-server` SKILL.md:34-35, whose sentence was rewritten for the template correction and now
names the Resources tab's **Export Mode** (4.3 `project_export.cpp:1329`).
`dedicated-server` SKILL.md:39 (review fix, ruled in scope): custom features were placed in "Project
Settings → Export → Custom Features"; they are the **Custom (comma-separated)** field on the export
preset's **Features** tab (4.3 `editor/export/project_export.cpp:1393-1399`; 4.7.2 `:1845-1851`).
`dedicated-server` SKILL.md has two
`## 7. Checklist` sections (one between §2 and §3) — structure, not a claim. Batch E has no
eval-measured content.

## Batch F — platform + tooling

Skills: `export-pipeline`, `mobile-development`, `xr-development`, `assets-pipeline`,
`addon-development`, `gdextension`, `godot-testing`, `godot-debugging`, `godot-project-setup`.
Every SKILL.md and every reference file was read in full, including `godot-testing`'s two
root-level files (`gut-reference.md`, `gdunit4-reference.md`). Not audited: the Steam/itch release
facts in `export-pipeline` (`steam-release-planning.md`, `distribution-itch-steam.md` — store
policy, not engine behaviour), `mobile-development/references/iap-and-ads.md` (third-party billing
plugin, no version named), and the gdext (Rust) binding page. A claim repeated in a checklist or a
reference is counted once. Behaviour claims were checked for `#ifdef DEBUG_ENABLED` / `TOOLS_ENABLED`
guards; the corrected `print_debug()` and signal-call errors have none (they print in release
exports), while GDExtension reloading is `TOOLS_ENABLED`-only.

Extra sources for this batch: `godot-cpp` branch `4.3` (`tools/godotcpp.py`); GUT `v9.3.0` (the
Godot 4.3 line) and `main` (9.6.1); gdUnit4 `v4.5.0` (the Godot 4.3 line) and `master` (7.0.0);
`godot_openxr_vendors` `master` (5.2.0-rc1); raw files at `4.4-stable`–`4.6-stable` to date three
additions. Edited GDScript was re-parsed on 4.7.2 (`--check-only`; the test examples inside a
project holding GUT 9.6.1 and gdUnit4 7.0.0, since the 4.3-line addons no longer compile on 4.7);
the new `inject_version.gd` was run against a tagged scratch repository.

| Skill | Claims checked (SKILL.md + references) | Wrong | Softened |
|---|---|---|---|
| `export-pipeline` | 39 + 8 | 9 | 0 |
| `mobile-development` | 33 + 16 | 4 | 1 |
| `xr-development` | 33 + 38 | 9 | 1 |
| `assets-pipeline` | 35 + 4 | 5 | 0 |
| `addon-development` | 30 + 45 | 11 | 1 |
| `gdextension` | 25 + 10 | 4 | 0 |
| `godot-testing` | 40 + 70 | 23 | 0 |
| `godot-debugging` | 35 + 25 | 15 | 1 |
| `godot-project-setup` | 25 | 2 | 0 |
| **Total** | **511** | **82** | **4** |

The worst errors were examples that cannot work as written:
- `godot-testing`'s command lines did not exist. gdUnit4 has no `GdUnitRunner.gd --testsuites`
  runner, no `GdUnit4CSharpApiLoader.cs` entry script and no `--add-gdunit-test-runner` flag; it is
  `bin/GdUnitCmdTool.gd -a <dir>`, and it refuses a `--headless` run (exit 103) without
  `--ignoreHeadlessMode`. GUT's CI line passed `-gexit_on_failure`, which GUT rejects as an unknown
  argument and exits 1 before running a test. GUT doubles were used as instances (`double()`
  returns a class; `.new()` is required), and `var x := double(...)` / `mock(...)` fails to parse
  (inference on a Variant is an error by default).
- `xr-development` read the thumbstick with `get_float("primary_x")` (no such input; the action is
  the Vector2 `primary`), looked hand trackers up as `"left_hand"` (they are
  `/user/hand_tracker/left`), and grabbed objects with a joint whose node A was the
  `XRController3D` — not a physics body, so the joint is never created and nothing is held.
- `addon-development` said GDScript `@tool` scripts are left out of exports (they are exported like
  any script) and wrapped a `[Tool] Sprite2D` in `#if TOOLS`, which removes the class from exported
  games; `godot-debugging` did the same to a game node. (Review fix: the unwrapped C# example now notes that `EditorInterface` and other GodotSharpEditor types exist only in the editor build — the package is referenced only for `Configuration == Debug`, 4.3 `Sdk.targets:21`, 4.7.2 `:37` — and `testing-plugins.md:88` no longer calls the load failure silent.) Its gizmo plugin called `get_undo_redo()`,
  which only `EditorPlugin` has, and the C# twin used `EditorInterface.get_editor_undo_redo()`,
  which 4.3 lacks.
- `export-pipeline` ran an `EditorScript` through `godot --script`, which only accepts `SceneTree` /
  `MainLoop` scripts, and named macOS/iOS preset keys (`codesign/enable`, `notarization/enable`,
  `application/provisioning_profile`) that do not exist.

| Skill file | Was | Is | Source |
|---|---|---|---|
| `export-pipeline` SKILL.md:26, 56-57 | `export_presets.cfg` "contains no secrets" while the example lists `codesign/identity` and `codesign/password` | options flagged secret (keystore and codesign paths and passwords, the encryption key) are written to `.godot/export_credentials.cfg`; the two lines are removed from the example and the CI env vars named | 4.3 `editor/export/editor_export.cpp:90-106`; `platform/windows/export/export_plugin.cpp:407-409` (`PROPERTY_USAGE_SECRET`); `platform/android/export/export_plugin.h:47` (`GODOT_ANDROID_KEYSTORE_*`) |
| `export-pipeline` SKILL.md:84 | the file is regenerated "on every editor save" | rewritten (on a timer) whenever a preset changes | 4.3 `editor/export/editor_export_preset.cpp:37-383`, `editor_export.cpp:108-113` |
| `export-pipeline` SKILL.md:97, 254 | Linux: "after export, run `chmod +x`" | the export writes the binary 0755; re-apply only if packaging drops the bit | 4.3 `platform/linuxbsd/export/export.cpp:46`; `editor/export/editor_export_platform_pc.cpp:167` |
| `export-pipeline` SKILL.md:98 | macOS: `codesign/enable`, `notarization/enable`; notarize "post-export via `xcrun notarytool`" | `codesign/codesign` and `notarization/notarization` (enums); the export itself submits for notarization | 4.3 `platform/macos/export/export_plugin.cpp:468-511, 2270` |
| `export-pipeline` SKILL.md:98 | privacy usage descriptions are `application/*` options | `privacy/*` options | 4.3 `platform/macos/export/export_plugin.cpp` (`privacy/camera_usage_description`, …) |
| `export-pipeline` SKILL.md:101 | iOS `codesign/identity`, `application/provisioning_profile` | `application/code_sign_identity_release`, `application/provisioning_profile_uuid_release` | 4.3 `platform/ios/export/export_plugin.cpp`; 4.7.2 `editor/export/editor_export_platform_apple_embedded.cpp` |
| `export-pipeline` SKILL.md:159 | `--quit-after N` quits after N milliseconds | after N main-loop iterations | 4.3 `main/main.cpp:1537` |
| `export-pipeline` SKILL.md:175; `references/versioning.md:38-61` | version injection by an `EditorScript` run with `godot --headless --script` | `--script` accepts only a `SceneTree`/`MainLoop` script; an `EditorScript` fails with "Class 'EditorScript' can only be instantiated by editor" — the tool now extends `SceneTree` (run on 4.7.2) | 4.3 `main/main.cpp:3544-3545`, `core/object/class_db.cpp:521`; 4.7.2 `main.cpp:4384`, run |
| `export-pipeline` `references/ci-cd-github-actions.md:34` | preset `"Linux/X11"` | `"Linux"` (the Godot 3 name) | 4.3 `platform/linuxbsd/export/export.cpp:44` |
| `mobile-development` SKILL.md:269 | the C# iOS "simulator templates are x64-only" | the export builds arm64 + x86_64 simulator assemblies | 4.3 `modules/mono/editor/GodotTools/GodotTools/Export/ExportPlugin.cs:202`; 4.7.2 `:235` |
| `mobile-development` `references/plugins.md:47` | `@tool class MyAndroidExportPlugin extends …` | inner classes inherit the script's `@tool`; the annotation there is a parse error ("must be at the top of the script") | 4.3 `modules/gdscript/gdscript_parser.cpp:1611`; 4.7.2 parse |
| `mobile-development` `references/plugins.md:105` | `android_aar_plugin = true` "ships native code as an Android plugin" | set under `[configuration]` when an AAR plugin already bundles the `.so` files; the export then skips the extension's own Android libraries | 4.3 `editor/plugins/gdextension_export_plugin.h:54-58` |
| `mobile-development` `references/plugins.md:145` | Gradle auto-includes any `.jar`/`.aar` "in the project addons dir" | since 4.4 (not 4.3), and only files directly in `res://addons/` (`include: ['*.jar', '*.aar']`) | 4.7.2 `platform/android/java/app/build.gradle:89-92`; `4.4-stable` same file `:66-69`; absent in 4.3 |
| `xr-development` SKILL.md:18 | enable the `OpenXR` plugin | OpenXR is a built-in module; only `xr/openxr/enabled` | 4.3 `modules/openxr/` (no `plugin.cfg`) |
| `xr-development` SKILL.md:72 | trigger `select_button`, grip `grip_button`, thumbstick `primary_axis` | `trigger`/`trigger_click`, `grip`/`grip_click`, `primary` (Vector2)/`primary_click`; `select_button` is a separate action | 4.3 `modules/openxr/action_map/openxr_action_map.cpp` (default action set) |
| `xr-development` SKILL.md:80 | `XRController3D` nodes "can be configured to track hand joints" | joints come from `XRHandTracker`s (`/user/hand_tracker/left`/`right`) and are applied by `XRHandModifier3D`; the controller gets select/grip through the hand-interaction profile | 4.3 `modules/openxr/extensions/openxr_hand_tracking_extension.cpp:199`; `action_map/openxr_action_map.cpp:513`; `doc/classes/XRHandModifier3D.xml` |
| `xr-development` SKILL.md:104 | `OpenXRInterface.environment_blend_mode = XR_ENVIRONMENT_BLEND_MODE_ALPHA_BLEND` | `XRInterface.XR_ENV_BLEND_MODE_ALPHA_BLEND` | 4.3 `doc/classes/XRInterface.xml:196, 272` |
| `xr-development` SKILL.md:119 | **XR Features → Hand Tracking / Passthrough** in the Android preset | core has only `xr_features/xr_mode`; the two options are the vendors plugin's `meta_xr_features/*`, shown once the matching extension is on | 4.3 `platform/android/export/export_plugin.cpp`; `godot_openxr_vendors` `plugin/src/main/cpp/export/meta_export_plugin.cpp:69, 87, 309-312` |
| `xr-development` `references/controllers-and-input.md:85-86, 102` | `primary` is the thumbstick click; axes via `get_float("primary_x")`/`("primary_y")` | `primary` is the Vector2 (`get_vector2("primary")`), `primary_click` the click; `primary_x/y` do not exist | as above (`OPENXR_ACTION_VECTOR`) |
| `xr-development` `references/hand-tracking.md:25, 45` | `XRServer.get_tracker("left_hand")` | `"/user/hand_tracker/left"` (GDScript and C#) | 4.3 `openxr_hand_tracking_extension.cpp:199`; 4.7.2 `:212` |
| `xr-development` `references/grabbing-objects.md:12-110` | grab with a `Generic6DOFJoint3D` from the controller to the body | `XRController3D` is not a `PhysicsBody3D`, so the joint stays unconfigured ("Node A must be a PhysicsBody3D"); the example now freezes and reparents the body, as SKILL.md §4 describes (GDScript and C#) | 4.3 `scene/3d/physics/joints/joint_3d.cpp:76-94` |
| `assets-pipeline` SKILL.md:73-74 | `Compress > Mode` default VRAM Compressed; mipmaps Off | Lossless (VRAM Compressed in the 3D preset, and a texture detected in 3D is switched to it); mipmaps On in the 3D preset | 4.3 `editor/import/resource_importer_texture.cpp` (`compress/mode`, `mipmaps/generate`, `detect_3d/compress_to`); 4.7.2 `:125-145, 232, 243` |
| `assets-pipeline` SKILL.md:77-78, 86 | import options `Flags > Filter` / `Flags > Repeat`; "per-image in Import dock: Filter → Nearest" | Godot 4 has no such import options; filtering and repeat are `CanvasItem.texture_filter` / `texture_repeat` (or the material sampler) | 4.3 `resource_importer_texture.cpp` option list; `scene/main/canvas_item.cpp:1291-1292` |
| `assets-pipeline` SKILL.md:124 | suffix `-occluder` | `-occ` (`-occonly` drops the mesh); `-occluder` does not match | 4.3 `editor/import/3d/resource_importer_scene.cpp:385-404, 899-924` |
| `assets-pipeline` SKILL.md:128-131 | `Wall-col` becomes a `StaticBody3D` parent of the mesh | the mesh object itself is suffixed: `Wall` (MeshInstance3D) → `StaticBody3D` → `CollisionShape3D` | 4.3 `resource_importer_scene.cpp:840-877` |
| `assets-pipeline` SKILL.md:216 | WAV key settings "Loop Mode, Mix Rate" | Loop Mode, Max Rate (`force/max_rate`); mix rate is not an import option | 4.3 `editor/import/resource_importer_wav.cpp` option list |
| `addon-development` SKILL.md:68-96 | `#if TOOLS` "prevents the class from being included in exported builds" for a `[Tool] Sprite2D`; "GDScript `@tool` scripts are excluded from exports automatically" | `TOOLS` exists only in editor builds, so `#if TOOLS` removes a game node from exports — use it for editor-only classes; `@tool` scripts are exported like any script (wrapper removed from the example) | 4.3 `modules/mono/editor/Godot.NET.Sdk/Godot.NET.Sdk/Sdk/Sdk.props:109-110`; `editor/export/editor_export_platform.cpp` (no tool-script filter) |
| `addon-development` SKILL.md:127, 185 | `add_tool_menu_item` adds to the **Project** menu | **Project → Tools** | 4.3 `doc/classes/EditorPlugin.xml` (`add_tool_menu_item`) |
| `addon-development` SKILL.md:262; `references/testing-plugins.md:49` | a C# build failure shows `Could not find type "Plugin"` | that is a GDScript analyzer error; a broken plugin script gives "Unable to load addon script from path: '…'. This might be due to a code error in that script." | 4.7.2 `modules/gdscript/gdscript_analyzer.cpp:904`; 4.3 `editor/editor_node.cpp:3683` |
| `addon-development` SKILL.md:270, 291-302 | all fields required "except `dependencies` and `installs`"; a "complete example with all optional fields" | those keys do not exist; all five keys are required (a `plugin.cfg` missing one is skipped); the duplicate example is removed | 4.3 `editor/plugins/editor_plugin_settings.cpp:76-83` |
| `addon-development` `references/dock-panels.md:27, 80-83` | `DOCK_SLOT_LEFT_UL` = Scene/Import, `LEFT_BL` = FileSystem; four slots | eight slots; Scene/Import default to `LEFT_UR`, FileSystem to `LEFT_BR`, Inspector/Node to `RIGHT_UL` | 4.3 `doc/classes/EditorPlugin.xml:831-855`; `editor/editor_node.cpp:7418-7433`; 4.7.2 `editor/docks/import_dock.cpp:755`, `filesystem_dock.cpp:4433` |
| `addon-development` `references/inspector-plugins.md:51-53` | `emit_signal("property_changed", …)` from the inspector plugin "so undo/redo works" | `EditorInspectorPlugin` has no signals (`property_changed` belongs to `EditorProperty`); the set is now labelled as not undoable | 4.3 `doc/classes/EditorInspectorPlugin.xml`, `EditorProperty.xml:113` |
| `addon-development` `references/inspector-plugins.md:283` | `_generate_from_path` returning null "falls back to `_generate`" | an override replaces the default (load, then `_generate`); null means no preview — the override is removed from the example | 4.3 `editor/editor_resource_preview.cpp:63-74` |
| `addon-development` `references/gizmos-deep-dive.md:22, 98, 111, 130, 191, 205` | GDScript `get_undo_redo()` inside the gizmo plugin; C# `EditorInterface.Singleton.GetEditorUndoRedo()` | gizmo plugins have no `get_undo_redo()`, and `EditorInterface.get_editor_undo_redo()` is 4.4+; both versions now take the EditorPlugin's `get_undo_redo()` at registration; review fix: the C# do/undo named `"spawn_radius"`, but a C# property keeps its PascalCase name, so it now uses `Spawner3D.PropertyName.SpawnRadius` | 4.3 `doc/classes/EditorNode3DGizmoPlugin.xml`, `EditorInterface.xml` (absent); `4.4-stable` `EditorInterface.xml` (present) |
| `addon-development` `references/testing-plugins.md:74-77` | `godot.exe --editor` shows the OS console | the main `.exe` is a GUI-subsystem program; use the `_console.exe` wrapper | 4.3 `platform/windows/SCsub:61-73` |
| `gdextension` SKILL.md:169; `references/debugging-native.md:7` | `reloadable = true` hot reload in "debug builds only" | editor builds only ("GDExtensions can only be reloaded in an editor build.") | 4.3 `core/extension/gdextension_manager.cpp:90-91` |
| `gdextension` SKILL.md:170 | `compatibility_minimum` "too low and the extension fails to load" | required; an older engine refuses the extension, and a value below 4.1 is rejected | 4.3 `core/extension/gdextension.cpp:938-966` |
| `gdextension` `references/debugging-native.md:19, 28` | `template_debug` binaries "carry debug symbols and assertions"; build symbols via "template_debug / unoptimized" | `template_debug` is optimized (`speed_trace`), defines `DEBUG_ENABLED` and `NDEBUG`, and has no symbols unless `debug_symbols=yes` (`dev_build=yes` for unoptimized) | godot-cpp `4.3` `tools/godotcpp.py:474-499, 527, 537` |
| `godot-testing` SKILL.md:21, 67 | gdUnit4 CLI: "`gdunit4_runner` script", "`--add-gdunit-test-runner` argument" | `runtest.sh` / `runtest.cmd` wrapping `bin/GdUnitCmdTool.gd -a <dir>`; `--ignoreHeadlessMode` under `--headless` | gdUnit4 `v4.5.0` `addons/gdUnit4/runtest.sh`, `bin/GdUnitCmdTool.gd:39-101, 335-358` |
| `godot-testing` SKILL.md:42, 51; `gut-reference.md:270` | GUT config `tests/gut_config.json` | default `res://.gutconfig.json` | GUT `v9.3.0` `addons/gut/cli/gut_cli.gd:91, 115` |
| `godot-testing` SKILL.md:61, 139; `gdunit4-reference.md:40` | gdUnit4 GDScript suites "must start with `test_`" | any name; suites are found by `extends GdUnitTestSuite`, generated ones are `*_test.gd` | gdUnit4 `v4.5.0` `src/core/GdUnitTestSuiteScanner.gd:87-108, 242-255` |
| `godot-testing` SKILL.md:119; `gdunit4-reference.md:193` | `is_approximately(exp, margin)` | `is_equal_approx(exp, margin)` | gdUnit4 `v4.5.0` `src/GdUnitFloatAssert.gd:20` |
| `godot-testing` SKILL.md:120; `references/testing-patterns.md:73`; `gdunit4-reference.md:231` | `assert_signal(m).is_emitted(…)` without `await`; `.with_parameters([...])`, `.exactly(1)` | `is_emitted()` waits on a timer and must be awaited; arguments are its second parameter; there is no `with_parameters`/`exactly` (`wait_until(ms)` sets the timeout) | gdUnit4 `v4.5.0` `src/GdUnitSignalAssert.gd`, `src/asserts/GdUnitSignalAssertImpl.gd:63-90` |
| `godot-testing` `references/running-tests.md:13-47, 105`; `gdunit4-reference.md:366-419`; `godot-debugging` `references/systematic-method.md:105, 113` | `-s addons/gdUnit4/GdUnitRunner.gd -- --testsuites …`, `-s …/GdUnit4CSharpApiLoader.cs`, `--report-dir`, `--verbose`, `--ignore-pause`, `GdUnit4CmdTool.gd`; exit code 1 on failure | `-s -d res://addons/gdUnit4/bin/GdUnitCmdTool.gd -a <dir>`, `-rd`, `-rc`, `-i`, `-c`, `--ignoreHeadlessMode`; the same tool runs C# suites; exit codes 0 / 100 failed / 101 warnings / 103 headless refused | gdUnit4 `v4.5.0` `bin/GdUnitCmdTool.gd:20-24, 39-101, 520-527`; `src/core/GdUnitTestSuiteScanner.gd:90` |
| `godot-testing` `gdunit4-reference.md:217` | `contains_exactly` "exact match, any order" | same order; `contains_exactly_in_any_order` ignores order (added) | gdUnit4 `v4.5.0` `src/GdUnitArrayAssert.gd` |
| `godot-testing` `gdunit4-reference.md:333, 341` | `verify(mock, times(1))`; `assert_eq(...)` in a gdUnit4 suite | `verify(mock, 1)` (no `times()`); `assert_that(...).is_equal(...)` (`assert_eq` is GUT) | gdUnit4 `v4.5.0` `src/GdUnitTestSuite.gd:241` and function list |
| `godot-testing` `references/testing-patterns.md:102, 113`; `gut-reference.md:117, 154` | `double(HealthComponent)` / `partial_double(...)` used as the instance | they return a doubled class; `.new()` makes the instance | GUT `v9.3.0` `addons/gut/test.gd:1367-1379`, `documentation/docs/Stubbing.md:26` |
| `godot-testing` `references/testing-patterns.md:106, 120` | `stub(mock, "current_health").to_return(75)` / `do_return(75).on(mock).current_health` | `current_health` is a property: GUT logs an error, gdUnit4 stubs nothing; both lines replaced by a note (only methods can be stubbed) | GUT `v9.3.0` `test.gd` (`stub` → `_get_bad_method_message`); tdd-workflow's `HealthComponent` (`var current_health`) |
| `godot-testing` `references/testing-patterns.md:113`; `gut-reference.md:141, 247` | `assert_called_with_parameters(...)` | no such GUT assert; `assert_called(double, method, [args])` | GUT `v9.3.0` `test.gd:948` (and `main`) |
| `godot-testing` `gut-reference.md:262-270, 278` | `-gselect` runs one test method; `-gexit_on_failure`; `-goutput_dir` | `-gselect` filters script file names (`-gunit_test_name` filters tests); `-gexit_on_failure` and `-goutput_dir` do not exist — unknown flags make GUT exit 1 before running (`-gexit_on_success` added); `-gexit` exits 1 when a test failed | GUT `v9.3.0` `cli/gut_cli.gd:110-143, 244-246`; `gui/GutRunner.gd:21-22, 123-146` |
| `godot-testing` `references/running-tests.md:13-22`; SKILL.md:67 (review fix) | GUT command lines without `-gexit` | added; without it the run never quits | GUT `v9.3.0` `cli/gut_cli.gd:125` |
| `godot-testing` `references/testing-patterns.md:102, 120`; `gut-reference.md:117, 154`; `gdunit4-reference.md:319, 337` | `var x := double(...)` / `mock(...)` / `spy(...)` | `var x = …`: inferring from a Variant is a parse error by default | 4.7.2 parse (`INFERENCE_ON_VARIANT`) |
| `godot-testing` `gut-reference.md:182` | `get_signal_emit_count` "gets the list of all emitted signals" | returns how many times one signal was emitted | GUT `v9.3.0` `test.gd:779` |
| `godot-debugging` SKILL.md:35, 83, 231 | `print_debug()` "only prints in debug builds; stripped from release exports" | it prints in release too; it adds the calling `file:line` when the debugger is attached — guard verbose output with `OS.is_debug_build()` | 4.3 `modules/gdscript/gdscript_utility_functions.cpp:418-435` (no `DEBUG_ENABLED` guard); 4.7.2 `:348-360` |
| `godot-debugging` SKILL.md:155-156 | Step Out (Shift+F11); Continue (F5) | Continue is F12; Step Out exists from 4.6 and is Alt+F11 | 4.3 `editor/plugins/debugger_editor_plugin.cpp:49-52`; 4.7.2 `editor/debugger/debugger_editor_plugin.cpp:48-52`; absent at `4.5-stable` |
| `godot-debugging` SKILL.md:182 | a wrong handler signature is a "silent miss" | every emit logs `Error calling from signal '…' to callable: …` | 4.3 `core/object/object.cpp:1190-1200` |
| `godot-debugging` SKILL.md:196-200 (error table) | `Cyclic reference`; `Cannot access member without instance` (with a `@static` function); `Stack overflow / Maximum recursion depth reached`; `Already connected` "without `CONNECT_ONE_SHOT`"; `Index out of bounds (index X out of size Y)` | the real messages: `Converting circular structure to JSON.` / `Circular reference to resource being saved found`; `Cannot call non-static function "x()" from the static function "y()".` (`static func`; `@static` does not exist); `Stack overflow. Check for infinite recursion in your script.`; `Signal '…' is already connected to given callable '…' in that object.` unless `CONNECT_REFERENCE_COUNTED`; `Out of bounds get index '…' (on base: '…')` | 4.3 `core/io/json.cpp:95, 117`; `scene/resources/resource_format_text.cpp:1586`; `modules/gdscript/gdscript_analyzer.cpp:3435`; `gdscript_vm.cpp:475, 1100`; `core/object/object.cpp:1396-1402`; 4.7.2 same strings |
| `godot-debugging` SKILL.md:207 | watch `Visible/Per frame` in the Monitors tab | `Raster > Total Draw Calls` (the name batch D used) | batch D monitor row |
| `godot-debugging` `references/signal-tracing.md:74` | connecting a nonexistent signal from C# is a "silent failure" | logs `Attempt to connect nonexistent signal …` and returns `ERR_INVALID_PARAMETER` | 4.3 `core/object/object.cpp:1390` |
| `godot-debugging` `references/performance-debugging.md:52, 68, 83` | `VisibleOnScreenNotifier3D` processing toggle "reduces draw calls"; enable "Rendering > Debug > Draw Calls" in the viewport menu | it saves CPU only (off-screen objects are already culled); the draw-call count is in the 3D viewport's **View Information** overlay | 4.3 `editor/plugins/node_3d_editor_plugin.cpp:2936, 5305` |
| `godot-debugging` `references/scene-tree-debugging.md:102, 115` | `[Tool] EnemySpawner : Node3D` wrapped in `#if TOOLS` | wrapper removed (it would drop the game node from exports) | 4.3 `Sdk.props:109-110` |
| `godot-debugging` `references/systematic-method.md:53` | `set_script(null)`: "node becomes a plain Node" | it keeps its built-in type | `Object.set_script` (script removed, class unchanged) |
| `godot-project-setup` SKILL.md:403 | "the namespace must match across all C# scripts to avoid registration errors" | namespaces are free-form; the class name must match the file name | 4.3 `modules/mono/editor/Godot.NET.Sdk/Godot.SourceGenerators/ScriptPathAttributeGenerator.cs:56, 113-117`; 4.7.2 `:56` |
| `godot-project-setup` SKILL.md:413 | a non-`partial` class "will not register" | build error GD0001 (missing partial modifier) | 4.3 `Godot.SourceGenerators/Common.cs:11-18` |

**Softened (no source either way):**
- `mobile-development` SKILL.md:24, 263: "the iOS simulator supports the Compatibility renderer only"
  → test with Compatibility there; the iOS display code creates a Metal layer for the RD drivers on
  simulators too (4.3 `platform/ios/godot_view.mm:74-82`), so the restriction is not in the source.
- `xr-development` SKILL.md:121: "set minimum API level to 29+" → the level Meta's store requires
  (29+ when written); neither core nor the vendors plugin sets it (vendors `config.gradle:5`, `minSdk 24`).
- `addon-development` `references/testing-plugins.md:86`: a stale custom type is a "`plugin_types`
  cache" entry (no such cache in the source) → usually a missing `remove_custom_type()`.
- `godot-debugging` SKILL.md:200: the quoted `Condition "p_mbuf_current..." is true` (not in either
  tag) → "Audio crackles or drops out (underrun)".

**Checked and correct (selection):**
- Windows preset keys (`codesign/*`, `application/*` incl. `modify_resources`, icon formats
  ICO/PNG/WebP/SVG, native resource editing via `TemplateModifier` in 4.7.2, rcedit in 4.3 — the
  4.5 callout stands); Android `keystore/release*`, `permissions/*`, `package/unique_name`, keystore
  and key password shared (`build.gradle:150-152`); `--headless`, `--export-release/-debug/-pack`;
  `PCKPacker.add_file_from_buffer`; Shader Baker option and per-driver plugins.
- Mobile: notification values 2014–2017, 1007, 2019–2020; `WM_CLOSE_REQUEST` desktop-only; the
  iOS ~5 s note (`Node.xml`); `vibrate_handheld(duration_ms, amplitude)` and its VIBRATE / iOS 13
  notes; `create_proxy`/`create_sam_callback` return null off Android; `AndroidRuntime` methods;
  `.gdip` sections and keys; JDK 17 (`config.gradle:12`).
- XR: `xr/openxr/enabled`, `xr/shaders/enabled`, 4.5–4.7 settings (`foveation_*`, `render_model`,
  `frame_synthesis`, `target_api_version`, `driver.windows`), `OpenXRRenderModelManager`,
  `eye_visibility`, `create_new_anchor(transform, spatial_context, next)`, `XRHandTracker` joints.
- Assets: `-col`/`-convcol`/`-rigid`/`-navmesh`, `fix_alpha_border`/`premult_alpha` defaults,
  `canvas_textures/default_texture_filter`, loop modes, Ogg/MP3 loop/BPM options.
- Editor plugins: `plugin.cfg` script path relative to the plugin folder, required `@tool`/`EditorPlugin`
  base, 4.7 `get_unsaved_scenes`/`ScriptEditor` methods, `create_default_inspector`,
  `CONTEXT_SLOT_INSPECTOR_PROPERTY`, `_can_commit_handle_on_click`, inspector-plugin virtuals.
- GDExtension: `GDREGISTER_CLASS`, `InitObject` API, default `template_debug`, CMake support
  (godot-cpp 4.3), `[icons]`/`[dependencies]`, 4.0 extensions refused.
- Testing: GUT 9.3 asserts (`assert_almost_eq`, `assert_signal_emitted_with_parameters`,
  `assert_call_count`, `wait_for_signal`, …), `add_child_autofree`, lifecycle hooks; gdUnit4 4.5
  asserts, `auto_free`, `monitor_signals`, `await_millis`, `scene_runner`.
- Debugging: `Node not found: "…" (relative to "…")`, `Can't change this state while flushing
  queries`, `Invalid call. Nonexistent function`, `get_signal_connection_list()` keys, F9/F10/F11,
  `print_tree_pretty()` glyphs, `RENDERING_INFO_TOTAL_DRAW_CALLS_IN_FRAME`.

**Sweep:** each correction's key nouns were grepped in `skills/`, `agents/` and `.codex/`:
`export_credentials`/secret options, "regenerates", `chmod`, `codesign/enable`, `notarization/`,
`provisioning_profile`, `--quit-after`, `EditorScript` run via `--script`, `Linux/X11`, simulator,
`android_aar_plugin`, addons `.aar`, `primary_x`/`select_button`/`grip_button`, `left_hand`,
blend-mode constant, `Generic6DOFJoint3D`, `Flags > Filter`/`Repeat`, `-occluder`, Mix Rate, texture
compression default, `#if TOOLS` on non-editor classes, "excluded from exports",
`add_tool_menu_item`, `Could not find type`, `dependencies`/`installs`, `DOCK_SLOT_`,
`property_changed`, `_generate_from_path`, `get_undo_redo`/`GetEditorUndoRedo`, `reloadable`,
`compatibility_minimum`, `template_debug`, `gdunit4_runner`, `GdUnitRunner`, `--testsuites`,
`gut_config`, `is_approximately`, `with_parameters`, `assert_called_with_parameters`,
`-gexit_on_failure`, `double(`/`mock(`/`spy(` declarations, `print_debug`, Step Out, `silent`,
`namespace must match`. Instances outside the batch-F files: none. The `godot-tools-engineer`
agent (and its Codex copy) says to guard editor-only C# with `#if TOOLS`, which is correct, so it
was left. No frontmatter or Related-skills line changed, so no index/Codex regeneration.

**Not changed:** version callouts (out of scope; `addon-development` SKILL.md:238's
`add_control_to_dock()` sentence was not touched, so its deferred 4.6 callout stays open); editor
click-paths (`testing-plugins.md` "Editor → Execute Script" and "Mono → Build Project", the Remote
inspector steps, Profiler column names). Example-code gaps left as written: `assets-pipeline`
`references/runtime-resource-loading.md` never assigns `_loading_path`; `gut-reference.md` stubs
`get_health()`/`is_dead()` on a `HealthComponent` the skill never defines; `controllers-and-input.md`
locomotion has no C# twin (pre-existing; the validator does not flag the reference). Batch F has no
eval-measured content.

## Batch G — addons

Skills: `limboai`, `beehave`, `popochiu`, `dialogue-manager`, `phantom-camera`. Every SKILL.md and
every reference file was read in full. Each addon was checked against its own repository at the
version the skill names — all five name one, so no fallback tag was needed: LimboAI `v1.8.0`
(`3fbd851`), Beehave `v2.9.2` (`f09fdbd`), Popochiu `v2.1.1` (`784d147`), Dialogue Manager `v3.10.4`
(`5487c52`), Phantom Camera `v0.11.0.2` (`e468862`). Paths in the table are relative to the addon
repository at that tag. The source was preferred over the addon's docs where they disagree (LimboAI's
GDExtension limitations, Dialogue Manager's `{}` end-of-dialogue note, Popochiu's `E.active_command`
tutorial snippet). Version callouts were not audited (the skills' Godot-version lines, LimboAI's
compatibility table). Edited GDScript was re-parsed on 4.7.2 (`--check-only`): Beehave inside a project
holding Beehave 2.9.2, LimboAI against stub classes for `BTCondition`/`BTPlayer`/`BT`, since the
extension is not loaded. The LimboAI C# blocks were rebuilt with the Task 4 harness.

| Skill | Claims checked (SKILL.md + references) | Wrong | Softened |
|---|---|---|---|
| `limboai` | 35 + 15 | 6 (one partially) | 0 |
| `beehave` | 40 + 15 | 4 | 1 |
| `popochiu` | 35 + 70 | 13 | 1 |
| `dialogue-manager` | 45 | 3 | 0 |
| `phantom-camera` | 40 + 20 | 4 | 0 |
| **Total** | **315** | **30** | **2** |

The worst errors were in behaviour the examples rely on:
- `limboai`'s `BTCondition` example declared `var in_range := agent.global_position…`, which does not
  parse (`agent` is typed `Node`, so the value has no set type), and typed the blackboard read as
  `Node2D` although §5 of the same file says object reads must stay untyped. The `BTPlayer` example
  called `restart()` to "loop the tree", but an active `BTPlayer` re-runs a finished tree on its next
  update by itself; `restart()` aborts a running one.
- `beehave` said `after_run()` runs when a leaf is interrupted and put the attack action's interrupt
  cleanup there; composites call `interrupt()` instead, so the cleanup never ran on an interrupt.
- `popochiu`'s dialog option table described `disabled` as "shown but not selectable" (it is not
  rendered at all) and `always_on` as immune to `turn_off_options()` (it only stops the option being
  greyed out as used), and said `_option_selected()` runs only when no `_on_option_<id>()` exists (it
  always runs first). `PopochiuInventoryItem` was called a `Node`; it is a `TextureRect`.

| Skill file | Was | Is | Source |
|---|---|---|---|
| `limboai` SKILL.md:22 | "not usable on 4.3–4.5" | v1.8.0 needs 4.6+; the 4.3 line is 1.2.0–1.3.x, which the skill does not cover | `README.md:55-62`; `deps.env` (`GODOT_CPP_API_VERSION=4.6`) |
| `limboai` SKILL.md:32 | enable the plugin under **Project Settings → Plugins** | no `plugin.cfg` exists; the extension registers its editor plugin itself on reload | no `plugin.cfg` in the repository; `register_types.cpp:282` (`EditorPlugins::add_by_type<LimboAIEditorPlugin>()`) |
| `limboai` SKILL.md:50, :393 | GDExtension has no documentation tooltips and no `BBParam` property editor; checklist line "use the module build for `BBParam`" | partially correct: the tooltip half stands (task-palette documentation tooltips are module-only in v1.8.0); the `BBParam` half was wrong — the editor was ported to GDExtension (upstream #287, 2025), though the docs still list it as missing. Checklist line removed. (Review fix: the first pass also claimed the extension shows the class docs; it does not.) | `editor/task_palette.cpp:72-73` (GDExtension returns no tooltip), `:106` ("Documentation tooltips are only available in the module variant"); `editor/limbo_ai_editor_plugin.cpp:1967-1969` (no build guard); `register_types.cpp:273` (`EditorPropertyBBParam` under `LIMBOAI_GDEXTENSION`); docs `doc/source/getting-started/getting-limboai.rst` |
| `limboai` SKILL.md:77, :82-83, :104 | `updated(status)` reacts "when the tree finishes"; `restart()` "loops the tree" (GDScript and C#) | `updated` fires after every update; a finished tree starts over on the next update, so the example now stops it with `active = false` / `Active = false` | `bt/bt_player.cpp:178-199`; `bt/tasks/bt_task.cpp:219-245` (`execute` re-enters when status is not `RUNNING`) |
| `limboai` SKILL.md:162, :165 | `var target: Node2D = blackboard.get_var(…)`; `var in_range := agent.global_position…` | untyped read, as §5 advises (assigning a freed instance to a typed variable is a debug-build error); `var in_range: bool` (the `:=` form is a parse error, run on 4.7.2) | 4.3 `modules/gdscript/gdscript_vm.cpp:1394-1418` (`DEBUG_ENABLED`); `doc_classes/BTTask.xml:214` (`agent: Node`); run |
| `limboai` `references/hsm.md:86-87` | the chained builders (`.Named()`/`.CallOnEnter()`) are GDScript-only | they are bound methods, so the module build's C# API has them; the example's direct signal wiring is kept | `hsm/limbo_state.cpp:238-243` |
| `beehave` SKILL.md:150-153, :163 | `after_run()` runs on success, failure "or is interrupted"; the attack action cleans up in `after_run` "when the tree interrupts this action" | `after_run()` follows only a `SUCCESS`/`FAILURE` tick; the example now cleans up in `interrupt()` and calls `super()` | `addons/beehave/nodes/beehave_node.gd:24-37`; `nodes/composites/sequence.gd` (`running_child.interrupt(...)`) |
| `beehave` SKILL.md:194 | "every method" of `Blackboard` takes `blackboard_name` | `set_value`, `get_value`, `has_value`, `erase_value` do; `keys()` and `get_debug_data()` do not | `addons/beehave/blackboard.gd:21-54` |
| `beehave` `references/custom-nodes.md:142` | no GDScript API for weights; inspector-only | no dedicated method, but `set("Weights/<child>", n)` goes through `_set()` | `addons/beehave/nodes/composites/randomized_composite.gd:98` (`_set`, `WEIGHTS_PREFIX`) |
| `beehave` `references/custom-nodes.md:148` | `RepeaterDecorator.get_class_name()` returns `&"LimiterDecorator"` | it returns an `Array[StringName]` whose last entry is `&"LimiterDecorator"` | `addons/beehave/nodes/decorators/repeater.gd:63` |
| `popochiu` SKILL.md:30 | Game Type "Custom/2D/Pixel"; templates `9 Verb`, `Sierra`, `SimpleClick` | Retro / Pixel Art or Modern / Hi-Res (the custom form: Custom / Pixel Art / High Resolution), setting stretch aspect and pixel-art filtering; templates 9 Verb, the Sierra-style "Action Bar", Simple Click | `editor/popups/setup/setup.gd:12-15, 356-365`; `setup.tscn:111, 123, 474-479`; `engine/objects/gui/templates/*/*_gui_info.tres` (`title`) |
| `popochiu` SKILL.md:31; `references/pipeline.md:7` | PopochiuImporters is enabled separately in Project Settings | Popochiu enables PopochiuImporters and PopochiuGizmo itself | `popochiu_plugin.gd:106-109, 195-199` |
| `popochiu` SKILL.md:141 | emotions map to the `voice_cues` export | the export is `voices` | `engine/objects/character/popochiu_character.gd:76` |
| `popochiu` `references/dialogs.md:14` | `disabled`: shown but not selectable | not rendered; set by `turn_off_forever()`; `turn_on()` has no effect on it | `engine/objects/dialog/popochiu_dialog_option.gd:17-18, 41-56`; `engine/objects/gui/components/dialog_menu/dialog_menu.gd:91` |
| `popochiu` `references/dialogs.md:15` | `always_on`: can't be turned off by `turn_off_options()` | always rendered as not yet used | `popochiu_dialog_option.gd:19-20`; `engine/objects/gui/components/dialog_menu/dialog_menu_option/dialog_menu_option.gd:44` |
| `popochiu` `references/dialogs.md:30, 36` | `_option_selected()` runs only when no `_on_option_<id>()` exists; "both styles equally supported" | `_option_selected()` runs first for every option, then `_on_option_<id>()` if present, which re-shows the options; use one style per tree | `engine/objects/dialog/popochiu_dialog.gd:239-250` |
| `popochiu` `references/inventory.md:3, 9` | `PopochiuInventoryItem extends Node` | `extends TextureRect` | `engine/objects/inventory_item/popochiu_inventory_item.gd:4` |
| `popochiu` `references/inventory.md:41-44` | combining example overrides the public `on_item_used()` (copied from the addon's doc comment), contradicting SKILL.md's "never override the public wrapper" | `_on_item_used()`; the public wrapper also clears `I.active` afterwards | `popochiu_inventory_item.gd:205-226, 285-288` |
| `popochiu` `references/inventory.md:66` | `_on_added_to_inventory()`/`_on_discard()` call `super()` "to preserve default GUI feedback" | all six item virtuals are empty (`pass`) | `popochiu_inventory_item.gd:51-82` |
| `popochiu` `references/pipeline.md:7` | the importer builds `SpriteFrames`/`AnimationLibrary` resources | it builds `AnimationPlayer` animations (in an `AnimationLibrary`) that drive the `Sprite2D`/`TextureRect` frames | `editor/importers/aseprite/animation_creator_base.gd:18, 226-249` |
| `popochiu` `references/pipeline.md:39` | `PLAY_MODE` includes "at least `IN_OUT` and `PLAY_AND_REVERSE`" | `IN`, `OUT`, `IN_OUT` | `engine/objects/transition_layer/popochiu_transition_layer.gd:14-18`; `engine/interfaces/i_transition_layer.gd:34` |
| `popochiu` `references/pipeline.md:56` | room objects auto-persist `position`, `visible`, `modulate`, `clickable`, `baseline`, `interaction_polygon`, … | props, hotspots, regions and walkable areas store their basic-type script variables minus ignore lists (which include `baseline`, `clickable`); the position/visible/modulate list is the characters' | `popochiu_resources.gd:83-121, 482-510`; `engine/objects/room/popochiu_room_data.gd:77-92, 182-212` |
| `popochiu` `references/pipeline.md:57` | custom state is saved if `bool`/`int`/`float`/`String` or `Array`/`Dictionary` of those | `bool`/`int`/`float`/`String`, `Array`, packed string/int/float arrays — a `Dictionary` is skipped | `popochiu_resources.gd:84-89` (`VALID_TYPES`), `:503` |
| `dialogue-manager` SKILL.md:34-35 | the plugin adds a Dialogue tab to the bottom panel | a main-screen tab (beside 2D/3D/Script) | `addons/dialogue_manager/plugin.gd:90-91, 99-100` (`_has_main_screen()`) |
| `dialogue-manager` SKILL.md:218 | `responses` is `Array[DialogueResponse]` | an untyped `Array` | `addons/dialogue_manager/dialogue_line.gd:36` |
| `dialogue-manager` SKILL.md:293 | CSV re-import matches by static ID, "otherwise by literal text" | only lines with a static ID are updated | `addons/dialogue_manager/utilities/translations.gd:246-288` |
| `phantom-camera` SKILL.md:166; `references/follow-modes.md:78-82` | `lookahead` is a shared 2D/3D option ("2D also exposes `lookahead_max`") | `lookahead` and its options are 2D-only; `PhantomCamera3D` has none | `scripts/phantom_camera/phantom_camera_2d.gd:322-360`; no `lookahead` in `phantom_camera_3d.gd` or `PhantomCamera3D.cs` |
| `phantom-camera` SKILL.md:106 | `host_layers` is `@export_flags_2d_render` / `_3d_render` on both the Host and each PCam | 2D render flags on the Host and `PhantomCamera2D`, 3D on `PhantomCamera3D` | `scripts/phantom_camera_host/phantom_camera_host.gd:57`; `phantom_camera_2d.gd:262`; `phantom_camera_3d.gd:323` |
| `phantom-camera` SKILL.md:290 | third-person setters `set_third_person_rotation`/`_degrees`/`_quaternion` | `set_third_person_rotation`, `set_third_person_rotation_degrees`, `set_third_person_quaternion` | `phantom_camera_3d.gd:1888, 1905, 1922` |
| `phantom-camera` `references/follow-modes.md:25` | `THIRD_PERSON` key properties start with `follow_distance` | `spring_length`, `collision_mask`, `shape`, `margin`, the two rotation offsets (the ones shown only in that mode) | `phantom_camera_3d.gd:466-492, 792-800` (`_validate_property`) |

**Softened (no source either way):** `beehave` SKILL.md:223 dropped "(leaf nodes are shared)" — each
tree has its own leaf nodes, and no source says otherwise. `popochiu` `references/dialogs.md:69` — the
tutorial warns against a bare string (`script-your-first-dialogue.md:148`) but does not call it "one of
the most common authoring mistakes".

**Checked and correct (sample):** LimboAI `.gdextension` keys and paths, `BTPlayer` members and
`UpdateMode` (`PHYSICS` default), `behavior_tree_finished` deprecation, `BT.Status` values, task
lifecycle, `res://ai/tasks` and subfolder categories, `Blackboard` methods and `create_blackboard`,
`LimboHSM.add_transition` guard, `ANYSTATE`, `dispatch()` propagation and return, `BTState`
`success_event`/`failure_event` defaults, the C# NuGet step. Beehave composites and decorators (all 16
behaviours), `BeehaveTree` exports and `tick_rate` arithmetic, the two autoloads, the debugger tab name
and `start_detached`, the custom monitor name, the expression leaves. Popochiu autoload set and
signatures, `queue()` string shorthand and pause lengths, `popochiu-skip`, `T`/deprecated
`E.play_transition`, room child nodes, clickable virtuals and command dispatch, GUI template copying,
`D`/`I`/`A` APIs and signals, save slots and paths, `Globals` `on_save`. Dialogue Manager syntax
(`[[…]]`, `[wait]`, `[next=auto]`, `=> END!`, `=><`, `%N`, tags, `?.`, `do!`, locals), the balloon
fallback, `null` at end of dialogue, enums on `DMConstants`, `Guess` (PO/MO), the C# event bridge on
first `Instance` access, `mutated` not firing for assignments. Phantom Camera plugin restart and six
custom types, Host `InterpolationMode` and the first-host warning, priority clamp, signals and
`tween_interrupted` argument, both enums, the untested look-at + follow warning text, the tween
resource enums and `get_tween_duration()` with no resource.

**Sweep:** `voice_cues`, `PLAY_AND_REVERSE`, `lookahead`, `PopochiuImporters`, game type names,
`BBParam`, documentation tooltips, "tick LimboAI", `restart()`, `after_run`, `blackboard_name`, weights,
`LimiterDecorator`, `always_on`, `disabled`, `PopochiuInventoryItem extends`, `on_item_used`,
`SpriteFrames`, bottom panel, literal-text CSV import, `Array[DialogueResponse]`, `host_layers`,
`set_third_person_*` were grepped in `skills/`, `agents/` and `.codex/`. Instances outside the batch-G
files: none (`state-machine`'s "limboai (C++ + HSM, Godot 4.6+)" matches v1.8.0). No frontmatter or
Related-skills line changed, so no index/Codex regeneration.

**Not changed:** version callouts (the skills' Godot-version lines). Left as written: `beehave`
`references/custom-nodes.md`'s `MoveToTargetAction.interrupt()` does not call `super()` (works; only
the debugger's interrupt message is lost); `limboai` `references/hsm.md`'s C# fragments still need
surrounding fields (`_hsm`, `_idle`, `damageInfo`) to compile — the same 8 harness errors as before the
batch. No batch-G fact is measured by an eval grader (`evals/skill-05`–`09` graders check the leaf/task
contracts, `R.goto_room`, the underscore virtuals and Array arguments, all unchanged).
