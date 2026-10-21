# C# method-body check (v1.16.0)

Follows up `2026-10-05-v1.15.0-followups.md` 7(b): in the v1.15.1 pass
(`2026-10-11-godot-4.7-callout-audit.md`, "Example checks") 93 of 494 C# blocks never reached
method bodies, and every "name does not exist" error was filtered as snippet noise.

## Method

Every ```` ```csharp ```` block under `skills/` (`SKILL.md` and `references/*.md`, the new
`web-services` and `rendering-pipeline` skills included; `web-export` has none; `scripts/fixtures/`
skipped) was extracted to its own file and compiled in one project against `Godot.NET.Sdk/4.7.2`
(GodotSharp and GodotSharpEditor 4.7.2, the Godot source generators, Debug so `TOOLS` is defined).

- Blocks that only declare types were compiled as written. Fragments were wrapped: members in a
  `partial` class, statements in a method (with `delta` / `@event` parameters when used). The
  wrapper's base class is the C# name of the GDScript twin's `extends`, else the Godot class
  that defines the members the fragment calls. Each block has its own namespace; a type another
  block of the same skill defines is aliased in.
- `csc` stops before method bodies while any declaration-level error remains, so the build
  carries a deliberate body error as a sentinel. While the sentinel was missing, every block with
  an error was excluded and the build repeated. "Body-checked" means the block was in the final
  build that reached bodies.
- Addon types: Phantom Camera v0.11.0.2 and Dialogue Manager v3.10.4 were compiled from their own
  C# wrapper sources at those tags. gdUnit4 tests compiled against the real `gdUnit4.api` 5.0.0
  package (types also compared with 4.3.1). LimboAI has no C# sources (its C# API is generated in
  the module build), so stubs were generated from its v1.8.0 `doc_classes/*.xml` with a port of
  Godot 4.7.2 `modules/mono/utils/naming_utils.cpp`. The port maps 1,036 of the 1,054 ClassDB
  classes to their GodotSharp names (the other 18 have no C# type), and the LimboAI names it gives (`LimboHsm`, `ANYSTATE`,
  `EVENTFINISHED`) match public C# projects that use the module build.
- User types a snippet uses but its skill never defines got `partial` stubs with only the members
  used. Fragments that assume fields or locals got declarations so the calls on them are checked.
  No `Godot.*` type was stubbed. Global usings for Godot, System, `System.Collections.Generic`,
  `System.Linq` and `System.Threading.Tasks` were added, so missing `using` lines were not checked.
- Every remaining error was triaged, CS0103 included: (a) skill bug, (b) snippet context (a name
  the skill or the reader's project defines elsewhere), (c) cannot check.
- Obsolete-API warnings (CS0618) were kept on for the body pass.

## Counts

- **517 blocks** in 213 files across 53 skills (`web-services` 11, `rendering-pipeline` 6).
- **513 body-checked**, 4 not. Before the fixes, 8 more were held at declarations by skill bugs
  (`GdUnit4.GdUnitTestSuite`, `GdUnitAwaiter`, `LimboHSM`, a bare `Dictionary` return type).
- Not body-checked:
  - `csharp-godot/SKILL.md:116`: the "WRONG — will cause source generator errors" non-`partial` class (CS0260 by design)
  - `godot-project-setup/SKILL.md:410`: the "Wrong — will not register" non-`partial` class (CS0260 by design)
  - `csharp-godot/SKILL.md:174`: pseudo-code with `...` placeholders
  - `godot-project-setup/SKILL.md:422`: three alternative `namespace X;` lines, not one file
- Errors: **(a) 61** (9 declaration-level, 52 in bodies), **(b) 213**, **(c) 11** (10 in the four
  blocks above, plus one fragment, `godot-optimization/references/cpu-bottlenecks.md:195`, that
  declares the same local in its bad and good versions).
- After the fixes, 94 body-checked blocks still carry (b) errors: helper methods, fields and
  autoloads defined elsewhere (CS0103, 175), signals and handlers declared in another block
  (`SignalName.X` / `MethodName.X`, CS0117, 22), and members of user types the skill describes in
  varying shapes (CS1061, CS0246, CS0029). A call on an undefined receiver (`_player.Foo()`) is
  not checked past the receiver.

## Fixed

| Skill file | Was | Is |
|---|---|---|
| `godot-testing` `gdunit4-reference.md`, `references/tdd-workflow.md`, `references/testing-patterns.md`, `SKILL.md` | suites inherit `GdUnit4.GdUnitTestSuite`; `async GdUnitAwaiter` tests; `MonitorSignals`, `AssertSignal(monitor).IsEmitted(…).WithArgs(…)`, `.Exactly(1)`; `Mock<T>()`, `MockProperty`, `Verify`, `Times`, `Spy`; `ISceneRunner.SimulateFrames` as a static call; `AddChild` in a suite; `IsApproximately` | plain `[TestSuite]` classes; `async Task`; `AssertSignal(node).StartMonitoring()` then `await AssertSignal(node).IsEmitted(signal, args…).WithTimeout(ms)`; gdUnit4Net has no mocking API, so a hand-rolled fake (`HealthComponent.TakeDamage` made `virtual`); a `SceneTreeTimer` wait; `((SceneTree)Engine.GetMainLoop()).Root.AddChild`; `IsEqualApprox` |
| `event-bus` `references/testing.md` | `.WithArgs(…)` on `IsEmitted`; `AwaitSignal(SceneTree, "process_frame")`; `IsTrue("message")` | `StartMonitoring()` + `IsEmitted(signal, args…)`; `AwaitIdleFrame()`; `OverrideFailureMessage(…).IsTrue()` |
| `dependency-injection` `references/testing-with-di.md`, `references/autoloads.md` | `StubAudio : Node` assigned to an `AudioManager` property; un-awaited `IsEmitted(…)` | `StubAudio : AudioManager` overriding a now `virtual` `PlaySfx`; `StartMonitoring()` and `await … WithTimeout(100)` |
| `limboai` `SKILL.md`, `references/hsm.md` | `LimboHSM`, `Anystate`, `EventFinished`; `OnBtUpdated(int status)` | `LimboHsm`, `ANYSTATE`, `EVENTFINISHED`; `long status` (C# passes integer signal arguments as `long`) |
| `math-essentials` `SKILL.md` | `Basis.IsOrthonormal()` | GodotSharp 4.7.2 has no such method (GDScript has it since 4.7); `IsEqualApprox(Orthonormalized())` |
| `math-essentials` `references/random-numbers.md` | bare `Dictionary` return type | `Godot.Collections.Dictionary` |
| `audio-system` `references/interactive-music.md` (GDScript too) | `AudioStreamPlaybackSynchronized.set_stream_volume` | the playback class has no methods (4.3 and 4.7.2); tween `AudioStreamSynchronized.set_sync_stream_volume`, which the playback reads on every mix |
| `animation-system` `SKILL.md` | `SpeedScale = 2.0` | `2.0f` (`float` in C#) |
| `dialogue-system` `references/branching-and-conditions.md`, `external-formats.md`, `ui-presentation.md`, `dialogue-manager.md` | `Array<Dictionary>` assigned to the untyped `DialogueLine.Choices` and handlers typed `Array<Dictionary>`; `Array.From(…)` | `Array` and `AsGodotDictionary()`; `expr.Execute(new Array(), this)` |
| `dedicated-server` `references/lobby-management.md` | `match-flow.md` calls `GetPlayerIds()` / `SetPlayerReady()`, which `LobbyManager` did not have | both methods added |
| `godot-optimization` `references/memory-management.md` | `bullet.Direction` on a `Bullet` without it | `Direction` property added |
| `save-load` `references/configfile.md` | `SettingsManager.GetSetting(…)` on an autoload as if static | `GetNode<SettingsManager>("/root/SettingsManager")` |
| `hud-system` `SKILL.md`, `references/notifications.md`, `references/damage-numbers.md` | `EventBus.Instance` (no such member) | `GetNode<EventBus>("/root/EventBus")` |
| `gdextension` `SKILL.md` | `new GDExample()` "available like any Godot type" | no C# type exists for a GDExtension class: `ClassDB.Instantiate("GDExample").As<Node>()` |

Swept with grep over `skills/`, `agents/` and `.codex/` for every changed name; no other
occurrences inside C# blocks. Rebuilt: the 40 touched blocks carry no (a) error. The touched files
were also compiled against `Godot.NET.Sdk/4.3.0` with `gdUnit4.api` 4.3.1 (5.0.0 needs GodotSharp
4.4+): no new errors, apart from two APIs in untouched blocks that the skill already marks 4.4+ and
4.7+ (`AudioStreamWav.LoadFromFile`, `TransitionToTime.PreviousPosition`).

## Not fixed (outside the C# compile check)

- `addon-development` `references/dock-panels.md` and `SKILL.md:238` use `add_control_to_dock` /
  `remove_control_from_docks`, deprecated in 4.6 for `add_dock(EditorDock)`, which 4.3 to 4.5 do
  not have. Needs a version callout, not a rename.
- The gdUnit4 GDScript examples (`monitor_signals`, `with_parameters`, `is_approximately`) and the
  GDScript `StubAudio extends Node` assigned to a typed `AudioManager` export were not checked here.
- `hud-system` still reads `GameState.Score`, and `godot-ui` `GameManager.Instance`, as static
  members of types those skills never define (counted as (b)).
