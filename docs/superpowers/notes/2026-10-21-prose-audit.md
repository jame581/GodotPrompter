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
| `csharp-signals` SKILL.md:88, 201, 204 | `EmitSignal` validates count and types in debug builds ("Signal parameter mismatch", "Expected N arguments, got M") | no validation; with a wrong count `+=` handlers on a custom signal are skipped silently, `Connect`ed receivers log "Method expected N argument(s), but called with M"; wrong types convert or default | 4.3 `…/ScriptSignalsGenerator.cs:491-495`; `core/object/object.cpp:1200`; `core/variant/variant.cpp:3653` (4.7.2 `object.cpp:1311`, `variant.cpp:3521`) |
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
(4.3 `core/variant/variant.h:253`, `variant.cpp:1116`). No agent or Codex file repeated a
corrected claim.

**Not changed:** five C# blocks await `CreateTimer(...)` with `Timer.SignalName.Timeout` instead of
`SceneTreeTimer.SignalName.Timeout`; both are the `StringName` `"timeout"`, so the code works.
`dependency-injection` `references/testing-with-di.md` assigns a `StubAudio extends Node` to an
`AudioManager`-typed export — already on the Task 4 deferred list.
