# Addon refresh research (v1.17.0 Task A1)

> Gathered 2026-11-10 for the v1.17.0 addon pass. Each addon was shallow-cloned at **both** tags (the
> pin in the skill's version line and the latest release) and the trees were diffed with `diff -r`;
> release notes come from `gh api repos/<r>/releases`, PR and issue text from `gh pr view` /
> `gh issue view`. Paths are relative to the addon repository at the tag named in each row. The
> source was preferred over the addon's own docs wherever they disagree, and every such
> disagreement is listed as **docs drift**. Nothing was run in Godot: a headless compile of 3.x
> `.dialogue` samples against v4.2.0 was attempted and refused by the session's permission
> classifier, so every "what the compiler does with old syntax" claim below is **from reading the
> source**, and the runtime outcome of an unmatched pattern is marked *unverified*. Task A2 must run it.

| Skill | Pin (confirmed in SKILL.md:10) | Latest (confirmed via releases API on 2026-11-10) | Jump |
|---|---|---|---|
| `dialogue-manager` | `v3.10.4` | `v4.2.0` (2026-10-30, release title "for Godot 4.7") | major |
| `popochiu` | `v2.1.1` | `v2.2.1` (2026-10-18) | minor, **with removals** |
| `phantom-camera` | `v0.11.0.2` | `v0.11.0.4` (2026-10-27) | patch |
| `limboai` | `v1.8.0` | `v1.8.1` (2026-08-20) | patch |
| `beehave` | `v2.9.2` | `v2.9.3` (2026-08-18) | patch |

---

## 1. Godot range and Godot 4.8 evidence

No addon's `plugin.cfg` declares a Godot version (LimboAI has no `plugin.cfg`; its
`.gdextension` says `compatibility_minimum = "4.2"`, which the README overrides). None of the five
repositories states support for Godot 4.8. Task A4 should write "not yet confirmed on 4.8" for all
five, plus the known-issue note where one exists.

| Addon @ latest | Supported Godot range (source) | Godot 4.8 evidence |
|---|---|---|
| Dialogue Manager v4.2.0 | **4.6+** — `README.md:3,5` ("Dialogue Manager 4 _for Godot 4.6+_"), `docs/Upgrading_Version.md:9` ("Godot 4.6 is now the minimum"); built against 4.7 (release title; `project.godot:20` features `"4.7", "C#"`). 3.x stays the line for 4.4/4.5 (`README.md:47`), 3.3 for 4.3 (`:48`). | No statement. Three closed issues were filed by users running 4.8-dev7 (#1326, #1328, #1329 — all bugs in DM itself, all fixed); no open 4.8 issue. |
| Popochiu v2.2.1 | **4.7** — `README.md:3` badge, `:54` ("Popochiu 2.2.1, which targets Godot 4.7"), `:60-61` table (4.7 → 2.2.1, 4.6 → 2.1.0); `project.godot:19` features `"4.7"`. v2.2.0 notes, Final Notes 6: "Godot 4.7 is now the default target … Popochiu will soon require some of its features". Whether 2.2.1 still loads on 4.6 is *unverified*. | No issue mentions 4.8; no CI (workflows are `deploy-docs.yml`, `release.yml` only). |
| Phantom Camera v0.11.0.4 | **4.4+** — `README.md:7` badge `Godot-4.4+`; runtime version checks at `phantom_camera_host.gd:696-697, 820-821, 1184-1185` (≥4.3/≥4.4 branches). No CI workflows in the repo. | **#694 "Plugin doesn't load in 4.8-beta1" (open, 2026-10-27).** The v0.11.0.4 hotfix (removing `EditorInterface.restart_editor()`) was the maintainer's response; reporters say a manual editor reload after enabling then works, but one reported wrong node labels in the panel. #665 (open) tracks the 4.7.1/4.8-dev autoload-freeing regression, fixed engine-side in 4.7.2 / 4.8-dev3 per the comments. |
| LimboAI v1.8.1 | **GDExtension 4.6+, module build 4.7** — `README.md:57` (`1.8.x` row added in this tag); `deps.env` `GODOT_CPP_API_VERSION=4.6`, `GODOT_REF=4.7-stable`; release notes: engine builds updated to `4.7.2-stable`. | **#477 "Limbo does not work with 4.8's new dock system and editor is unusable" (open, GDExtension variant, 2026-09-11).** KoBeWi (2026-10-08): 4.8's main-screen compatibility code only covers plugins that create the main screen in `NOTIFICATION_ENTER_TREE`; LimboAI adds it in the constructor. |
| Beehave v2.9.3 | README table unchanged from v2.9.2: `README.md:50-52` maps `4.1.x` → `2.9.x` (and `4.5+` → `2.10+`, a version not yet released). CI matrix moved from `["4.5.1"]` to `["4.5.1", "4.6.3", "4.7"]` (`.github/workflows/beehave-ci.yml:40`); demo `project.godot:19` features `"4.7"`. Release notes: "compatible with latest Godot 4.7". Whether 2.9.3 still runs on 4.1–4.4 is *unverified* (CI no longer tests it). | No issue mentions 4.8. |

---

## 2. Dialogue Manager v3.10.4 → v4.2.0

Sources: release notes for v4.0.0–v4.2.0; `docs/Upgrading_Version.md` (new in 4.x; replaces `docs/2to3.md`);
`docs/` diffs; `addons/dialogue_manager/**` diffs. v4.0.0 alone lists 100+ PRs; only the ones that
touch something the skill names, or that the skill should now name, are recorded.

### 2.1 Terminology map (old → new)

| 3.x term / identifier | 4.x | Source @ v4.2.0 |
|---|---|---|
| "title" (`~ name` marker) | **"cue"** (syntax `~ name` unchanged) | `docs/Upgrading_Version.md:13`; `docs/Basic_Dialogue.md:144-151` (## Cues and Jumps); PR #1152 (titles were briefly "labels" between the two) |
| `title` parameter of `show_dialogue_balloon` / `show_example_dialogue_balloon` / `show_dialogue_balloon_scene` | `cue` (positional calls unaffected) | `dialogue_manager.gd` (`func show_dialogue_balloon(resource, cue: String = "", …)`) |
| `DialogueResource.titles`, `first_title`, `get_titles()` | `cues`, `first_cue`, `get_cues()`; `get_next_dialogue_line(title…)` → `(cue…)` | `dialogue_resource.gd:12, 18, 32` |
| signal `passed_title(title)` | `passed_cue(cue)` | `dialogue_manager.gd:9`; `docs/API.md:8` |
| C# `PassedTitle` / `PassedTitleEventHandler` | `PassedCue` / `PassedCueEventHandler` | `DialogueManager.cs:31, 51` (old `v3.10.4 DialogueManager.cs:31, 37`) |
| `DialogueLine.translation_key`, `DialogueResponse.translation_key` | `static_id` | `dialogue_line.gd:27`, `dialogue_response.gd:36`; `docs/Upgrading_Version.md:15`; PR #1163 |
| C# `TranslationKey` | `StaticId` | `DialogueManager.cs:1059, 1205` |
| "static translation key" (`[ID:KEY]`) | "static line ID" (syntax unchanged) | `docs/Translations.md` heading "Static line IDs in dialogue" |
| `set` / `do` mutation lines | `$>` (`set`/`do` still parse, "considered deprecated" — no compiler warning found) | `docs/Conditions_Mutations.md:90`; `compiler/compiler_regex.gd:12` (`MUTATION_REGEX` still matches `$>`, `$>>`, `do`, `do!`, `set`); `grep -ri deprecat` over the addon's `.gd` finds nothing |
| inline `[do x()]` / non-blocking `[do! x()]` | `[$> x()]` / `[$>> x()]` | `docs/Conditions_Mutations.md:106-110` |
| `ERR_*_TITLE*` constants (`ERR_EMPTY_TITLE`, `ERR_UNKNOWN_TITLE`, …) | `ERR_*_CUE*`; `ERR_UNKNOWN_LINE_SYNTAX` (118) → `ERR_UNKNOWN_ERROR` | `constants.gd:73-116` vs `v3.10.4 constants.gd` |
| `DialogueResource.raw_text` | removed (opt-in meta data via setting "Include Raw Text in Dialogue Resource Meta Data") | `docs/Upgrading_Version.md:21`; `docs/Settings.md` (new entry); `settings.gd:44` |
| "POT Generation list" | "Template Generation list" (Godot's localisation template export, PO **or** CSV) | `docs/Translations.md` ("Generating a POT/gettext or CSV file") |

`passed_cue` note: the `$>`-syntax already existed in 3.10.4 (`v3.10.4 compiler/resolved_line_data.gd:39, 63, 84`;
`components/code_edit.gd:10`) — what changed in 4.x is that the docs switched to it and call `set`/`do` deprecated.

### 2.2 3.x syntax and API that 4.x rejects, ignores or renamed

**`.dialogue` syntax**

1. **Response conditions must be self-closing.** `- Text [if cond]` → `- Text [if cond /]`; a jump still
   goes last: `- Text [if cond /] => cue`. The compiler only extracts a response condition when the
   line contains `" /]"` (`compiler/compilation.gd:517`; `WRAPPED_CONDITION_REGEX` =
   `\[if (?<expression>.*) \/\]`, `compiler/compiler_regex.gd:11`; was `\[if (?<expression>.*)\]` at
   `v3.10.4 compiler_regex.gd:11`). A 3.x-style `[if cond]` on a response is therefore **not** treated as
   a response condition: the response is always allowed, and the bracket stays in the response text,
   where the inline-condition pass (`INLINE_CONDITIONALS_REGEX`, `compiler_regex.gd:18`, needs a
   closing `[/if]`) does not match it either. Whether that surfaces as a compile error, as literal
   text in the menu, or as something else is *unverified* (not run). PR #1104 states the reason: so
   that ordinary inline `[if]…[/if]` conditions can appear inside response text.
2. **Weighted-random conditions are self-closing too.** `% [if cond] Line` → `% [if cond /] Line`
   (`WEIGHTED_RANDOM_SIBLINGS_REGEX`, `compiler_regex.gd:14`; was without `/` at `v3.10.4 :14`).
   **Docs drift:** `docs/Conditions_Mutations.md:60` still shows `% [if SomeGlobal.some_condition] => another_cue`
   without `/]`. Trust the regex.
3. **Inline conditions in dialogue lines are unchanged:** `[if cond]text[/if]` with optional `[else]`
   (`INLINE_CONDITIONALS_REGEX`, `compiler_regex.gd:18`; `docs/Conditions_Mutations.md:46`).
4. **Mutations:** `set x = 1` / `do f()` still compile (`compiler_regex.gd:12`) but are documented as
   deprecated (`docs/Conditions_Mutations.md:90`); write `$> x = 1`, `$> f()`, inline `[$> f()]`, non-awaited
   inline `[$>> f()]`. Built-ins become `$> wait(1.0)`, `$> debug(…)` (`:174-175`), signals
   `$> SomeGlobal.some_signal.emit("arg")` (`:149`), locals `$> locals.asked = true` (`docs/State.md:65`).
5. **Unchanged syntax** (re-checked in the v4.2.0 docs): `=> cue`, `=> END`, `=> END!`, `=>< cue`
   (`docs/Basic_Dialogue.md:160-172`), `import "res://x.dialogue" as alias` + `=>< alias/cue` (`:195-208`),
   `[[A|B|C]]`, `[wait=…]`, `[speed=…]`, `[next=…]`, `%`/`%N`, `{{expr}}`, `[#tag, #key=value]`, `[ID:KEY]`,
   `##` translator notes, `?.`, `match`/`when`/`while`. Expression jumps `=> {{expr}}` moved to `docs/State.md:81-89`.
6. **New errors that can fire on 3.x files:** indenting directly after a cue line (PR #1250, v4.0.0
   notes); a "lonely" static ID (`ERR_LONELY_STATIC_ID`, `constants.gd:116`, PR #1169 — the constant
   already existed in 3.10.4, so this may not be new to 4.x; *unverified*).
7. **Behaviour change, not syntax:** conditions short-circuit (`and`/`or` stop once the result is
   known — `dialogue_manager.gd:1238`, PR #1112). `if node and node.prop` no longer errors on a null
   `node`; dialogue that relied on a side effect in the right-hand operand now skips it.
8. **Line IDs can carry a resource reference** (`<uid>@<id>`, PR #1145): `dialogue_line.gd:80-84`,
   `dialogue_manager.gd:210-211, 337-338`. Treat `id`/`next_id` as opaque strings; code that stored or
   parsed 3.x numeric IDs should not assume the format.

**GDScript runtime API**

| 3.10.4 | 4.2.0 | Source |
|---|---|---|
| `DialogueManager.translation_source` + `DMConstants.TranslationSource` (`None`/`CSV`/`PO`/`Guess`) | **removed.** `translate()` now always calls `tr()` — with the static ID as the key and `"dialogue"` as context when **Use Static IDs as Translation Keys** is on (default `true`), otherwise the text as key and the static ID as context | removed from `dialogue_manager.gd` (was `v3.10.4 dialogue_manager.gd:54`) and from `constants.gd`; `dialogue_manager.gd:759-773`; `settings.gd:14`. **Docs drift:** `docs/Translations.md:9` still documents `translation_source`. |
| Dialogue tab → **Translations** menu (CSV export/import, character CSV) | **removed.** Godot's own **Project Settings → Localization → Template Generation** exports PO or CSV; v4.1.0 added **Project → Tools → Dialogue → Simple CSV export…** (PR #1288). No CSV re-import. | `v3.10.4 views/main_view.gd:11-13, 64` (menu ids/button) vs nothing in `v4.2.0 views/main_view.gd`; `plugin.gd:69, 395, 416-419`; `docs/Upgrading_Version.md:20` |
| `DialogueLine.translation_key` / `DialogueResponse.translation_key` | `static_id` | see §2.1 |
| `DialogueLine.conditions` | removed | `dialogue_line.gd` var list vs `v3.10.4` |
| — | `DialogueLine.to_serialized() -> String` / `static DialogueLine.new_from_serialized(data, extra_game_states := []) -> DialogueLine` (**async** — it `await`s `get_next_dialogue_line`, so callers must `await`) | `dialogue_line.gd:105-117`; `docs/API.md:74-78`; PR #1148 |
| — | `DialogueLine.refresh()`, `DialogueResponse.has_tag()` (`DialogueLine.has_tag` existed) | `dialogue_line.gd:79`; `dialogue_response.gd:59` |
| — | signals `waiting_for_input()`, `waited_for_input()` | `dialogue_manager.gd:18, 21` |
| — | `set_default_balloon(balloon_scene) -> Error`, `register_state_context(alias, target)`, `unregister_state_context(alias)`, `reseed_randomizer(seed)`, `include_dialogue_resource_as_self`, `load_from_within_dialogue`, `validate_member_access` | `dialogue_manager.gd:49, 606` and API diff |
| `show_error_for_missing_state_value(message, will_show)` | `(message, extra_game_states, will_show)` | API diff |
| `get_next_dialogue_line(resource, key, extra_game_states, mutation_behaviour)` | unchanged signature; still returns `null` at the end (`dialogue_manager.gd:145-148`; `_get_next_dialogue_line` `return null` paths) | — |
| `DMConstants.MutationBehaviour` (`Wait`/`DoNotWait`/`Skip`) | unchanged | `constants.gd:7` |
| `mutated` signal | unchanged rule: emitted for built-in `wait` and for any mutation that is **not an assignment** — the skill's "(not `set` lines)" should read "not assignments" now that `$>` covers both | `dialogue_manager.gd:1020, 1034-1035` (`_mutation_contains_assignment`) |
| Settings **Balloon Path**, **State Autoload Shortcuts** | unchanged | `settings.gd:31, 33` |
| Main-screen **Dialogue** tab | unchanged | `plugin.gd:106` (`_has_main_screen()`) |

**New nodes (v4.0.0)** — exact class names from source; **docs drift:** `docs/Nodes.md:8` and
`docs/CSharp.md:146` call them `Actionable2D`/`Actionable3D`, the release note does too, but the
classes are **`DialogueActionable2D` / `DialogueActionable3D`**:

| Class | Extends | Members | Source |
|---|---|---|---|
| `DialogueActionable2D` / `3D` | `Area2D` / `Area3D` | signals `actioned()`, `dialogue_ended()` (also fires when another actionable uses the same resource); `@export dialogue_resource`, `@export dialogue_cue`; `dialogue_balloon`; `static var start_dialogue: Callable` (returns `Node`; docs say `Node2D`); `action()`; `static get_nearest_actionable_to(pos)` | `nodes/actionable/dialogue_actionable_2d.gd:9-59`; `docs/Nodes.md:8-51` |
| `DialogueStateContext` | `Node` | `@export alias`, `@export target` — exposes `target` to dialogue under `alias` while the node is in the tree | `nodes/context/dialogue_state_context.gd:6-18`; `docs/State.md:13-24` |
| `DialogueMarker2D` / `3D` | `Marker2D` / `Marker3D` | `@export character_name`; `static all()`, `static find_for_character(name)`, `get_position_in_viewport()` | `nodes/marker/dialogue_marker_2d.gd:6-42` |
| `DialogueResponsesMenu`, `DialogueLabel` | (existed in 3.x) | menu adds nothing the skill names | `nodes/responses_menu/dialogue_responses_menu.gd:4-27` |

`docs/State.md` (new) is the 4.x account of state: autoloads, `DialogueStateContext` nodes, then
`extra_game_states` as "the last resort … the most brittle" (`:7-9`), plus `_to_dialogue_string()` for
`{{}}` interpolation (`:46-48`). The `locals` note (example-balloon feature, not core) is unchanged (`:54`).

### 2.3 C# API changes

Diff of `addons/dialogue_manager/DialogueManager.cs` public surface, v3.10.4 → v4.2.0, plus new files.
"Improve C# autocomplete" (#1114) has no description beyond its title ("This improves the C#
autocompletions") — it concerns the `.dialogue` editor's completions for C# state, not the wrapper API.

| Change | Source @ v4.2.0 |
|---|---|
| Static events are now C# `event`s (`public static event …EventHandler? DialogueStarted;` etc.). `+=`/`-=` from user code still compiles; assigning with `=` or invoking from outside no longer does. | `DialogueManager.cs:46-76` (were plain delegate fields, `v3.10.4 :36-40`) |
| `PassedTitle` → `PassedCue(string cue)`; new `WaitingForInput`, `WaitedForInput` events | `:31-34, 51, 66, 71` |
| Lazy bridging is unchanged: handlers are wired in `InitializeInstance()` on first `Instance` access (`Instance => instance ??= InitializeInstance()`), so the skill's warning still holds | `:125-145` |
| `TranslationSource` **property removed**; the `TranslationSource` enum is still declared but nothing uses it | enum `:20-26`; old property `v3.10.4 :86` |
| New statics: `IncludeDialogueResourceAsSelf`, `IgnoreMissingStateValues`, `LoadFromWithinDialogue`, `ValidateMemberAccess`, `ReseedRandomizer(int)`, `SetDefaultBalloon(Variant) -> Error`, `Translate(string)` | `:176, 221, 285` and API diff |
| `Mutate(...)` returns `Task` (was `async void`) | `:381` |
| `ShowDialogueBalloonScene` has three overloads (`string`, `PackedScene`, `Node`) | `:325, 338, 351` |
| `GetNextDialogueLine` / `ShowDialogueBalloon` / `ShowExampleDialogueBalloon` signatures unchanged (`key` param name) | `:235, 298, 311` |
| `DialogueLine`: `TranslationKey` → `StaticId`; members are now auto-properties (`Responses`, `ConcurrentLines`, `ExtraGameStates` get-only; `Time`, `Speeds`, `InlineMutations`, `Tags` private-set); `HasTag()` | `:1029-1128` |
| `DialogueResponse`: primary-constructor class; `TranslationKey` → `StaticId`; `HasTag()` | `:1180-1218` |
| ThingHas*/Get*Info helpers became `static` (internal plumbing for mutations, overload matching #1207/#1316, statics #1311) | API diff |
| **Native C# node classes** in `namespace DialogueManagerRuntime`: `DialogueActionable2D/3D`, `DialogueStateContext`, `DialogueLabel` (+ `DialogueLabel.tscn`), `DialogueMarker2D/3D`, `DialogueResponsesMenu`. The Create New Node dialog lists the GDScript versions; the C# scripts must be attached by hand. | `nodes/**/*.cs`; `docs/Nodes.md:5-6`; `docs/CSharp.md:146` |
| `DialogueResponsesMenu.cs` declares `[Signal] ResponseSelectedEventHandler(DialogueResponse response)`, so `responsesMenu.ResponseSelected += …` works **when the C# node is used** (the C# example balloon does this). With the GDScript node from the picker, `Connect("response_selected", Callable.From(...))` is still required. | `nodes/responses_menu/DialogueResponsesMenu.cs:9, 19`; `example_balloon/ExampleBalloon.cs:58, 96`; `docs/CSharp.md:135-142` |
| C# state: `[Export]` still required for instance members (`docs/CSharp.md:35`); statics on a `[GlobalClass]` type are reachable by class name when `DialogueManager.IncludeClasses` is on (default) | `docs/CSharp.md:37-57` (PR #1311) |

**Docs drift (C#):** `docs/CSharp.md:119` spells the event `PasssedCue` (three s); the source is `PassedCue`.

The skill's C# blocks (§4 `Npc.cs`, §5 events) use only members whose names did not change
(`ShowDialogueBalloon`, `GetNextDialogueLine`, `Character`, `Text`, `Responses.Count`, `NextId`,
`DialogueStarted`, `DialogueEnded`, `GotDialogue`, `Mutated`, `Tags`), so they should still build;
`PassedTitle` (§5 prose, SKILL.md:277) does not. A `dotnet build` against v4.2.0 is Task A2's job.

### 2.4 Other v4.x changes worth a line

- Godot-4.6 editor API: the Find-in-Dialogue panel is now an `EditorDock` added with `add_dock()`
  (`plugin.gd:21, 216-217`, PR #1317) — consistent with the 4.6 minimum.
- A runtime **Dialogue** tab in the debugger shows available state contexts and globals plus a
  line history (`docs/State.md:11`; PRs #1195, #1257).
- `plugin.cfg` description changed to "A powerful branching dialogue system", `version="4.2.0"`
  (`addons/dialogue_manager/plugin.cfg`).
- `docs/API.md:34` now says `get_next_dialogue_line` "Returns a `DialogueLine` or `null`" — the 3.10.4
  `{}` drift the skill calls out is fixed upstream, so the parenthetical can go.
- Upgrade advice: commit first, delete `.godot/` and restart the editor a couple of times
  (`docs/Upgrading_Version.md:3-5`).

### 2.5 Skill impact — `skills/dialogue-manager/SKILL.md`

| Skill line | Now says | Should say |
|---|---|---|
| :3 (frontmatter) | ".dialogue files with titles, responses…" | "…with cues, responses…" (regenerates `skills/index.json:305`) |
| :10 | `v3.10.4` · Godot 4.6 | `v4.2.0` · Godot 4.6+ (README:3; built for 4.7). Add a pointer: 3.x is the line for 4.4–4.5. |
| :37-46 | `plugin.cfg` with `description="A powerful nonlinear dialogue system"`, `version="3.10.4"` | `description="A powerful branching dialogue system"`, `version="4.2.0"` |
| :61-75 | "**Titles and jumps** — `~ name` marks a title"; `another_title` | "**Cues and jumps** — `~ name` marks a cue"; `another_cue` |
| :77 | "can carry a condition in `[...]`" | "a self-closing condition `[if cond /]` — put any jump last" |
| :83, :85 | `- A lot [if …]`, `- Another one [if …] => another_title` | `- A lot [if … /]`, `- Another one [if … /] => another_cue` |
| :102-113 | `set`/`do` lines, inline `[do wave()]`, `[do! wave()]`, `do wait`, `do debug`, `do …emit(…)` | `$>` lines, `[$> wave()]`, `[$>> wave()]`, `$> wait(…)`, `$> debug(…)`, `$> …emit(…)`; one clause: `set`/`do` still parse but are deprecated |
| :115 | `set locals.asked = true` | `$> locals.asked = true` |
| :120-127 | random lines | add: a condition on a random line is `% [if cond /]` (regex; the upstream doc example is wrong) |
| :136-140 | null return + parenthetical about `API.md` `{}` | keep the null guidance; drop the parenthetical (fixed upstream, `docs/API.md:34`) |
| :151, :152, :156 | comments/strings say "start" title | "start" cue (code unchanged) |
| :202-206 | other methods | add `set_default_balloon(scene)` / `SetDefaultBalloon`; parameter is `cue` |
| :217-220 | `translation_key` on `DialogueLine` and `DialogueResponse` | `static_id`; mention `to_serialized()` / `await DialogueLine.new_from_serialized(…)` for save games |
| :241 | "fires before a `do`/inline mutation runs (not `set` lines)" | "fires before a non-assignment mutation runs (calls, emits, `wait`) — not assignments" |
| :267-275 | responses menu: only a Godot signal, use `Connect` | true for the GDScript node from the picker; the native C# `DialogueResponsesMenu` exposes `ResponseSelected` as a C# event |
| :277-278 | `passed_title(title)` / `PassedTitle`; "every time a `~ title` marker is crossed" | `passed_cue(cue)` / `PassedCue`; "a `~ cue` marker" |
| :284-287 | `DialogueManager.translation_source`, `DMConstants.TranslationSource` / C# `TranslationSource` | removed in 4.x. Text goes through `tr()`; with **Use Static IDs as Translation Keys** (default on) a line's static ID is the msgid, context `"dialogue"` |
| :289 | "give a stable `translation_key`" | "give a stable `static_id`" |
| :290-293 | POT Generation list; "Export/import CSV from the editor's **Translations** menu (Dialogue tab); re-import only updates lines that carry a static ID" | "Template Generation list (Project Settings → Localization) exports PO or CSV; **Project → Tools → Dialogue → Simple CSV export…** for a quick CSV. There is no CSV re-import in 4.x." |
| :307 (checklist) | "Response lines put `[if condition]` before any `=> target` jump" | "Response conditions are self-closing `[if condition /]`, before any `=> cue` jump" |
| :313 (checklist) | "Inline `do`/`await` mutations use `do!` …" | "Inline mutations use `[$>> …]` when the caller shouldn't block on them" |
| new | — | `DialogueActionable2D/3D` (exact class names) for "press to talk" areas, `DialogueStateContext` for scene state; one short paragraph |

Size: SKILL.md is 13,472 B; the cap for this release is 15,500 B. The renames are roughly
byte-neutral; the migration table below (~700 B) and the nodes paragraph (~500 B) fit, but a full
3→4 guide does not — that goes to `references/`.

### 2.6 Recommendation: a "migrating from 3.x" section

**Yes, keep one — short, in SKILL.md, with the long form in a reference.** Reasons: the default Godot
4.4/4.5 user is still on 3.x (README:47), most published examples and model training data use 3.x
syntax, and the two most damaging differences fail **silently** by source reading (an unclosed
`[if cond]` on a response no longer gates it; `translation_source` assignments target a property that
no longer exists). An agent that only reads the syntax section would still write 3.x on autopilot.

Minimum content for the in-skill section (a 3.x → 4.x table, ~6 rows):

1. Titles → **cues** (`~ start` unchanged; `passed_title` → `passed_cue`, `titles`/`get_titles()` → `cues`/`get_cues()`, C# `PassedTitle` → `PassedCue`).
2. `- Text [if cond]` → `- Text [if cond /]`, and `% [if cond]` → `% [if cond /]` — the old form is not read as a condition.
3. `set` / `do` / `[do!]` → `$>` / `$>` / `[$>>]` (old forms still parse, deprecated).
4. `translation_key` → `static_id` (C# `TranslationKey` → `StaticId`).
5. `translation_source` / `TranslationSource` removed; CSV export/import menu removed (Template Generation / Simple CSV export).
6. Godot 4.6+ required; on 4.4–4.5 stay on 3.x.

Reference file (e.g. `references/migrating-from-3.md`): the full terminology map (§2.1), the API table
(§2.2), the C# table (§2.3), short-circuit and opaque line IDs, the new nodes, and the upgrade
procedure (commit, delete `.godot/`, restart). Keep it out of the SESSION/MENTOR card regions.

### 2.7 Eval case `evals/skill-08-dialogue-manager`

| File | Old term | Fix |
|---|---|---|
| `prompt.md:8` | "Dialogue Manager addon (version 3) on Godot 4.6"; "starts at its \"start\" title" | "(version 4) on Godot 4.7" (or 4.6), "its \"start\" cue". Decide whether a 3.x-on-4.5 variant is also worth keeping. |
| `graders/dm-traversal.md:5` | placeholder `get_next_dialogue_line(resource, title_or_id)` | `cue_or_id` (the method name it checks is unchanged) |
| `graders/dm-end-detection.md`, `dm-ended-signal.md`, `has-*.md`, `trigger-skill.md` | none | none — `dialogue_ended`/`DialogueEnded` and the `null` return are unchanged |

No grader checks `.dialogue` syntax, so no grader would catch an answer that writes `[if cond]`
on a response. If the prompt is touched, consider asking for one conditional choice and adding a
grader that requires `/]`.

### 2.8 Other files that name Dialogue Manager 3

`README.md:320` (pin list), `:327` ("Godot 4.6, GDScript + C#"); `skills/index.json:304-311`
(generated — rebuild, never edit); `CHANGELOG.md:611` (historical, leave). `agents/*.md`,
`.codex/agents/*.toml`, `skills/using-godot-prompter/SKILL.md:99, 242` and
`skills/dialogue-system/**` name the skill only, no 3.x terms.

---

## 3. Popochiu v2.1.1 → v2.2.1

Sources: v2.2.0 and v2.2.1 release notes; `gh api …/compare/v2.2.0...v2.2.1`; diffs of `addons/popochiu/**`;
the migration scripts the addon ships (`addons/popochiu/migration/migrations/popochiu_migration_13.gd`
… `_17.gd`, new since 2.1.1, whose last migration was `_12`). Read v2.2.1 Final Notes 2 first: **a
2.1.x project must open in 2.2.0 first** so its migrations rewrite scripts, because 2.2.1 removes the
methods those scripts may still call.

### 3.1 Changes that touch what the skill names

| Change | Source |
|---|---|
| **`say()` no longer takes an emotion.** `say(dialog, emo := "")` → `say(dialog: String, params: Variant = null)`; `params` is format data (`Array` → `%`, `Dictionary` → `String.format()`), anything else prints "Invalid params type passed to translate()" and is ignored. `say()` does not touch `emotion` any more — set `character.emotion = "annoyed"` before and `""` after (what migration 15 rewrites calls into). `queue_say()` likewise. The queue string shorthand `"Name(emotion): text"` still sets and resets the emotion. | `v2.2.1 engine/objects/character/popochiu_character.gd:727-760`; `engine/popochiu.gd:291-303` (`translate`); `migration/migrations/popochiu_migration_15.gd:6-11, 29-72`; `engine/helpers/popochiu_characters_helper.gd:74-103`; old `v2.1.1 popochiu_character.gd:681-689` |
| `G.show_system_text(msg)` → `(msg: String, params: Variant = null)`; text is translated | `engine/interfaces/i_graphic_interface.gd:94-99` |
| **`E.play_transition()` / `E.queue_play_transition()` removed** (deprecated in 2.1, still present in 2.2.0 at `popochiu.gd:383-399`); `E.stop_camera_shake()` removed too. Use `T.play_transition()`. | absent from `v2.2.1 engine/popochiu.gd`; was `v2.1.1 popochiu.gd:366-382, 431`; v2.2.1 notes, Final Notes 2 |
| **Inventory per character, with quantities.** `add(animate := true)` → `add(quantity := 1, character: PopochiuCharacter = null)`; same shape for `add_as_active`, `queue_add*`; `remove(animate := false)` → `remove(quantity := 0, character := null)` (0 = whole stack); `replace(new_item, character := null)` (removes the whole stack, adds one) | `engine/objects/inventory_item/popochiu_inventory_item.gd:127-235`; migration 13 strips the old `animate` args (`popochiu_migration_13.gd:6-14`) |
| **`discard()` / `queue_discard()` removed** (deprecated in 2.2.0: `v2.2.0 popochiu_inventory_item.gd:239-252`). Nothing in v2.2.1 emits `I.item_discarded` or calls `_on_discard()`, so the `_on_discard()` virtual and `PopochiuProp._on_linked_item_discarded()` / `linked_item_discarded` no longer fire from engine code (grep over `addons/popochiu`; the declarations remain at `i_inventory.gd:55`, `popochiu_inventory_item.gd:97`, `popochiu_prop.gd:17, 143, 458-463`). | as cited |
| New item members: `@export max_quantity := 1`, `quantity_owned`, virtual `_on_quantity_changed(old, new)`; `in_inventory` is deprecated (assigning prints a warning) | `popochiu_inventory_item.gd:29, 34-42, 104, 350-355` |
| `I` API: `clean_inventory(in_bg := false)` → `clean_inventory(character := null)` + `clean_inventory_bg(character := null)`; `is_item_in_inventory(name, character := null)`, `is_full(character := null)`; new `add_item`, `remove_item`, `replace_item`, `is_item_in_any_inventory`, `get_item_quantity(name, character := null)`; `I.items` deprecated (use `C.player.inventory.keys()`, a `Dictionary` on `PopochiuCharacter`); signals `item_added`/`item_add_done`/`item_removed`/`item_remove_done`/`item_replaced` now carry the `character` instead of `animate`; new `item_quantity_updated` | `engine/interfaces/i_inventory.gd:38-86, 104-138, 374-444`; `popochiu_character.gd:58-61, 218` |
| Regions can block walking: `@export var walkable := true` on `PopochiuRegion`, signal `character_blocked(character)`; characters opt out with `@export var ignore_blocking_regions := false` | `engine/objects/region/popochiu_region.gd:14, 25, 169-172`; `popochiu_character.gd:136-137` |
| `R.get_characters() -> Array[PopochiuCharacter]` on the interface (and `C.get_characters() -> Dictionary`) | `engine/interfaces/i_room.gd:108`; `i_character.gd:189` |
| Room `visited` / `visited_first_time` are read-only, derived from `@export visited_times` | `engine/objects/room/popochiu_room_data.gd:15-24` |
| New room virtual `_on_restore_from_savegame()` (migration 16 adds a stub to existing rooms) | `popochiu_migration_16.gd:6-9` |
| Engine-wide translation of game strings (`E.translate`, dialog lines, system text); the `popochiu/dialogs/use_translations` setting is removed by migration 15 | `popochiu.gd:291-303`; `popochiu_migration_15.gd:7-11` |
| Touch input: Popochiu now reads mouse events only; keep **Emulate Mouse From Touch** on for touch devices. `PopochiuUtils.is_click_or_touch*()`/`is_double_click_or_double_tap()`/`get_click_or_touch_index()` deprecated → `is_click*()`, `is_double_click()`, `get_click_button_index()` (proxies removed in 2.3) | v2.2.1 notes, Final Notes 3 and 5; `engine/others/popochiu_utils.gd:28, 86-134` |
| Editor: dock rebuilt on Godot's `Tree` control, monochrome SVG icons; Aseprite importer groups prop animations by tag (`@Door` declares the prop, `:DoorOpen` its animations) | v2.2.0 notes; `editor/main_dock/popochiu_tree_dock.gd` (new), `editor/importers/aseprite/aseprite_tag_grouper.gd` (new) |
| GUI templates reworked internally (components talk through `PopochiuGraphicInterface` + signals); migrations 14/17 rename copied GUI component nodes and hooks under `res://game/gui/` | v2.2.0 notes, Final Notes 5; `popochiu_migration_14.gd`, `_17.gd:6-14` |
| **Unchanged** (signatures re-checked at v2.2.1): `E.queue`, `E.cutscene`, `E.register_command`, `E.current_command`, `E.get_current_command_name`, `E.get_command_name`, `E.register_command_without_id`, `E.command_fallback`, `R.goto_room`, `C.walk_to_clicked`, `C.face_clicked`, `I.set_active_item`, `D.show_inline_dialog`, `A.is_playing_cue`, `T.play_transition` (+ `T.PLAY_MODE` = `IN`, `OUT`, `IN_OUT`), `PopochiuDialog.start/turn_*_options`, all `PopochiuClickable` `_on_*` virtuals, `voices`/`avatars` exports, the six GUI template folders | `popochiu.gd:231, 270, 467, 111`; `i_room.gd:169`; `i_character.gd:60, 89`; `i_transition_layer.gd:51-56`; `objects/transition_layer/popochiu_transition_layer.gd:14-18`; `popochiu_clickable.gd:128-177`; `popochiu_character.gd:90, 122`; `engine/objects/gui/templates/` |

**Docs drift still present at v2.2.1:** `docs/src/the-engine-handbook/gui-commands-and-fallbacks.md:120-124`
still uses `E.active_command` (no such member; `E.current_command` at `popochiu.gd:111`);
`docs/src/the-engine-handbook/await-and-queue-functions.md:297` uses `T.PLAY_MODE.PLAY_AND_REVERSE`,
which the enum does not have.

### 3.2 Skill impact — `skills/popochiu/`

| Skill line | Now says | Should say |
|---|---|---|
| SKILL.md:10 | `v2.1.1` · Godot 4.6 | `v2.2.1` · Godot 4.7 (README:54); on 4.6 use 2.1.x |
| SKILL.md:21 | "Popochiu requires **Godot 4.6**" | "targets **Godot 4.7**" |
| SKILL.md:60 | `G` key signature `show_system_text(msg: String)` | `show_system_text(msg: String, params: Variant = null)` |
| SKILL.md:93-97 | transitions "not the deprecated `E.play_transition()`… (still present in 2.1.1 but print a runtime warning)" | `E.play_transition()` was removed in 2.2.1; only `T.play_transition()` exists |
| SKILL.md:109 | Region "tints/scales a character on enter/exit; does not receive clicks" | add: `walkable = false` makes it block walking (`character_blocked` signal; characters opt out with `ignore_blocking_regions`) |
| SKILL.md:138 | `await C.player.say("What a mess.", "annoyed")` | **breaking**: `C.player.emotion = "annoyed"` / `await C.player.say("What a mess.")` / `C.player.emotion = ""`, or the queue shorthand `"Player(annoyed): What a mess."` |
| SKILL.md:141 | "`say()` sets `emotion` for the duration of the line, then resets it" | only the queue shorthand does that; `say()` reads the current `emotion` and its second argument is format params |
| SKILL.md:165 (checklist) | "not the deprecated `E.play_transition()`" | "not the removed `E.play_transition()`" |
| new (SKILL.md §2 or §6) | — | upgrading from 2.1.x: open the project in **2.2.0** first and run its migrations, then 2.2.1 |
| `references/inventory.md:9` | lists `_on_discard()` among the item virtuals | drop it, or mark it as no longer called (no `discard()` in 2.2.1); add `_on_quantity_changed(old, new)` |
| `inventory.md:14-22` | `clean_inventory(in_bg := false)`; `is_item_in_inventory(item_name)`; `is_full()` | `clean_inventory(character := null)` + `clean_inventory_bg(character := null)`; `is_item_in_inventory(item_name, character := null)`, `is_full(character := null)`; add `get_item_quantity()`, `is_item_in_any_inventory()` |
| `inventory.md:25` | `I.items: Array` | deprecated; `C.player.inventory` (`Dictionary`) |
| `inventory.md:27` | signal list | signals carry `(item, character)`; add `item_quantity_updated`; `item_discarded` is no longer emitted |
| `inventory.md:32-36` | `add(animate := true)`, `add_as_active(animate := true)`, `remove(animate := false)`, `replace(new_item)`, `discard(animate := false)` | `add(quantity := 1, character := null)`, `add_as_active(quantity := 1, character := null)`, `remove(quantity := 0, character := null)` (0 = whole stack), `replace(new_item, character := null)`; `discard()` removed — use `remove()` |
| `inventory.md:66` | "all six are empty" incl. `_on_discard()` | five live virtuals + `_on_quantity_changed`; `_on_discard()` is declared but never called |
| `inventory.md:70` | `_on_linked_item_discarded()` "for when the link breaks (e.g. the item is later discarded…)" | `_on_linked_item_removed()` is the live one; the discarded variant is never triggered in 2.2.1 |
| `references/pipeline.md:56` | rooms track `visited`/`visited_first_time`/`visited_times` | `visited_times` is the stored field; the other two are read-only derived getters (do not assign them). Also the §8 fix below. |
| `references/pipeline.md:28` | `T` "supersedes the deprecated `E.play_transition()`" | "replaced the removed `E.play_transition()`" |
| `references/dialogs.md:40` | "Verified tutorial example (… `script-your-first-dialogue.md`, v2.1.1)" | the same file at v2.2.1 still has the pattern (`docs/src/how-to-develop-a-game/script-your-first-dialogue.md:115-148`); bump the tag |
| `references/gui.md:47` | `E.active_command` drift "in the v2.1.1 engine source" | still drift at v2.2.1 (`gui-commands-and-fallbacks.md:120-124`) |

Evals: `evals/skill-07-popochiu/prompt.md:8` says "Popochiu addon (2.1) on Godot 4.6" — bump to 2.2 / 4.7.
None of the graders (`popochiu-click-virtuals.md`, `-dialog-options.md`, `-room-change.md`) checks a
changed API; `popochiu-click-virtuals.md` requires `await C.player.say("It's locked.")`, which is still
valid. An answer that writes `say("…", "emotion")` would pass every grader while being broken in 2.2;
consider a grader if the prompt gains an emotion.

---

## 4. Phantom Camera v0.11.0.2 → v0.11.0.4

Full diff (addon files only): `plugin.cfg`, `plugin.gd`, `scripts/managers/phantom_camera_manager.gd`,
`scripts/panel/viewfinder/viewfinder.gd`, `scripts/phantom_camera/phantom_camera_3d.gd`, plus a new
`addons/phantom_camera/LICENSE`. No `.cs` file changed, so the C# wrapper is identical.

| Change | Source |
|---|---|
| **Enabling the plugin no longer restarts the editor.** `EditorInterface.restart_editor()` was removed from `_enable_plugin()`; it now only prints the docs link and adds the `PhantomCameraManager` autoload. (The restart lost the plugin's enabled state on 4.8-beta1 — #694.) | `v0.11.0.4 plugin.gd:45-47`; was `v0.11.0.2 plugin.gd:49`; v0.11.0.4 notes |
| `PhantomCameraManager._exit_tree()` now calls `Engine.unregister_singleton(...)` — fix for the Godot 4.7.1 autoload-freeing regression (#665/#669) | `scripts/managers/phantom_camera_manager.gd:84-85`; v0.11.0.3 notes |
| Viewfinder guards against a missing singleton | `scripts/panel/viewfinder/viewfinder.gd:180, 570` |
| `FollowMode.PATH` in 3D honours a rotated `Path3D` (closest point computed in the path's local basis) | `scripts/phantom_camera/phantom_camera_3d.gd:1055-1060`; v0.11.0.3 notes (#638) |
| Duplicate `scene_changed` connection removed from `plugin.gd` (editor-only) | `plugin.gd` diff; v0.11.0.3 notes |

Skill impact (`skills/phantom-camera/`):

| Skill line | Now says | Should say |
|---|---|---|
| SKILL.md:10 | `v0.11.0.2` · Godot 4.4+ | `v0.11.0.4` · Godot 4.4+ (README:7) |
| SKILL.md:37-38 | "**restarts the editor every time `_enable_plugin()` runs** … expected behavior, not a bug" | enabling registers the `PhantomCameraManager` autoload and no longer restarts the editor. Optional, cited to #694 rather than the tag: if the Phantom Camera panel reports a missing `PhantomCameraManager`, reload the project once. |
| SKILL.md:168; `references/follow-modes.md:3` | "shared follow options" | see §7 |
| `references/follow-modes.md:23` (PATH row) | "confined to the closest point on `follow_path`" | still correct; optionally "(3D respects a rotated `Path3D` since 0.11.0.3)" |

Eval `evals/skill-09-phantom-camera`: prompt says "(0.11) … Godot 4.4" — still accurate; no grader
touches the editor restart or PATH mode.

---

## 5. LimboAI v1.8.0 → v1.8.1

Full diff: `hsm/limbo_state.cpp`, `hsm/limbo_state.h`, `limboai_version.py`, `README.md`. Release notes:
engine builds updated to `4.7.2-stable`; "Allow a secondary StateMachine be a child of a LimboState" (#464).

| Change | Source |
|---|---|
| `LimboState::is_root()` now means "parent is not a `LimboHSM`" (was "parent is not any `LimboState`"). A `LimboHSM` placed under a plain `LimboState` is therefore its own root: `initialize()` and `set_active()` work on it instead of failing with "initialize() must be called on the root HSM". Issue #463 (v1.8.0, 4.7.1, GDExtension): docs say a `LimboHSM` only counts as a state when it is a direct child of another `LimboHSM`. | `v1.8.1 hsm/limbo_state.cpp:77-79`, `hsm/limbo_state.h:101`; was `v1.8.0 limbo_state.h:101`; callers `hsm/limbo_hsm.cpp:28, 228, 260-282`; `limbo_state.h:60` (`_should_use_new_scope`) |
| README compatibility table gains the `1.8.x` row: GDExtension "Godot 4.6 or higher", module "Godot 4.7" | `README.md:57` |
| No change to `bt/`, `editor/`, `register_types.cpp` or the GDExtension manifest — the task-palette tooltip limitation (module-only) and the `BTPlayer` behaviour are as in 1.8.0 | diff (only the four files above changed) |

Skill impact (`skills/limboai/`):

| Skill line | Now says | Should say |
|---|---|---|
| SKILL.md:10, :50, :54 | `v1.8.0` (three places) | `v1.8.1`; module build "based on Godot 4.7 (4.7.2-stable builds)" |
| SKILL.md:22 | see §7 | see §7 |
| `references/hsm.md:3` | promises "nested HSMs" | the file has no nested-HSM section (headings `:7-174`). Either add a two-line note — a `LimboHSM` that is a direct child of a `LimboHSM` is a sub-state; one under a plain `LimboState` is a separate root you `initialize()` yourself (works from 1.8.1) — or drop "nested HSMs" from the blurb. |

Eval `evals/skill-05-limboai`: **concern.** `graders/limbo-tree-finished.md` passes only if the
script "restarts with `restart()`". The skill (SKILL.md:77-83, :103) teaches that a finished tree
starts over by itself and stops it with `active = false`; `restart()` aborts a *running* tree and
re-activates (`bt/bt_player.cpp:195-199`). The prompt (`prompt.md:8`) asks for a script that notices
the finish "and starts it over again", so `restart()` is not wrong, only redundant — but the grader
fails an answer that relies on the automatic restart, which is what the skill teaches. Re-read the
grader against the skill when the skill text is touched.

---

## 6. Beehave v2.9.2 → v2.9.3

Addon diff (excluding the vendored `addons/gdUnit4/` test framework): `metrics/beehave_global_metrics.gd`,
`nodes/beehave_tree.gd`, `nodes/composites/simple_parallel.gd`, `nodes/decorators/repeater.gd`,
`plugin.cfg`, `plugin.gd`. Release notes: Godot 4.7 compatibility; lifecycle fixes.

| Change | Source |
|---|---|
| Autoloads `BeehaveGlobalMetrics` / `BeehaveGlobalDebugger` are now added in `_enable_plugin()` and **removed in `_disable_plugin()`** (were added from `_init()` on every editor load) — fixes a singleton conflict on Godot 4.7.1 (#443) | `v2.9.3 plugin.gd:10-12, 31-33`; `v2.9.2 plugin.gd` `_init()` |
| Global monitors `beehave/total_trees`, `beehave/total_enabled_trees` are de-duplicated on register and removed in `_exit_tree()` (#444) | `metrics/beehave_global_metrics.gd:3-29` |
| `actor_node_path`: an empty path means the parent; a non-empty path resolves with `get_node_or_null()`, so a wrong path now leaves `actor` **null** instead of raising a `get_node` error; the setter resolves only when the tree is inside the scene tree (fixes duplicated scenes, #441) | `nodes/beehave_tree.gd:33-37, 115, 142-146` |
| Typed signatures: `SimpleParallelComposite.tick(actor: Node, blackboard: Blackboard) -> int`, `RepeaterDecorator.before_run(...) -> void` (no behaviour change) | `nodes/composites/simple_parallel.gd:36`; `nodes/decorators/repeater.gd:13` |
| `RepeaterDecorator.get_class_name()` still appends `&"LimiterDecorator"` — the known bug is still present | `nodes/decorators/repeater.gd:63-66` |

Skill impact (`skills/beehave/`):

| Skill line | Now says | Should say |
|---|---|---|
| SKILL.md:10 | `v2.9.2` · Godot 4.1+ | `v2.9.3` · Godot 4.1+ per the README table (CI covers 4.5.1, 4.6.3, 4.7) |
| SKILL.md:33 | "Two autoloads are registered" | accurate; optionally "on enable, and removed again on disable" |
| SKILL.md:92 / :218 | `actor_node_path` "(defaults to parent node)" | accurate; optional gotcha: a wrong path now gives a null `actor` silently |
| `references/custom-nodes.md:146` | "Known issues (v2.9.2)" | "Known issues (v2.9.3)" — the `get_class_name()` bug is unchanged |

Eval `evals/skill-06-beehave`: prompt "Beehave addon (2.9) in a Godot 4.4 project" — unchanged; no
grader affected.

---

## 7. Follow-ups carried from `2026-10-22-v1.16.0-followups.md` §8

| Item | Verified at latest tag | Fix |
|---|---|---|
| `limboai` SKILL.md:22 omits 4.4–4.5 | `v1.8.1 README.md:57-63`: 1.8.x and 1.7.x need 4.6+; 1.6.x supports 4.4, 4.5, 4.6; 1.5.x and 1.4.x support 4.4, 4.5; 1.2.0–1.3.x is the 4.3 line. | "LimboAI v1.8.x requires **Godot 4.6+**. On 4.4–4.5 the matching lines are 1.4.x–1.6.x, and on 4.3 it is 1.2.0–1.3.x; this skill covers neither." |
| `limboai` SKILL.md:77-83 restart wording | Behaviour confirmed unchanged in 1.8.1: `BTPlayer::update()` emits `updated(status)` after every update (`bt/bt_player.cpp:178-192`); `BTTask::execute()` re-enters (`_enter()`, children aborted) whenever the previous status was not `RUNNING` (`bt/tasks/bt_task.cpp:219-245`), so a root that returned `SUCCESS`/`FAILURE` starts over on the next update; `restart()` aborts the root and calls `set_active(true)` (`bt_player.cpp:195-199`); `behavior_tree_finished` is deprecated (`doc_classes/BTPlayer.xml:73`). The current comment "A finished tree starts over on the next update by itself; stop it instead" is correct but reads as if stopping were required. | Say what the reader decides: "`updated` fires after every update. A tree that returned `SUCCESS`/`FAILURE` re-enters from the root on the next update, so it loops on its own; set `active = false` here if it should run once. (`restart()` is for aborting a tree that is still running.)" Same in the C# comment at :103. |
| `phantom-camera` SKILL.md:168 and `references/follow-modes.md:3` "shared follow options" | At v0.11.0.4, of the options the reference lists only `follow_axis_lock` exists on both nodes (`phantom_camera_2d.gd:291`, `phantom_camera_3d.gd:378`, the 3D enum adds Z axes); `rotate_with_target` (`phantom_camera_2d.gd:300`) and all `lookahead*` options (`:322-360`) are 2D-only. SKILL.md:166 already says so. | Replace "shared follow options" with "follow options (axis lock on both; rotate-with-target and look-ahead 2D-only)", or simply "the follow options". |
| `popochiu` `references/pipeline.md:56` non-clickable props skipped | Confirmed at v2.2.1: `save_children_states()` skips any `PopochiuProp` whose `clickable` is false (`engine/objects/room/popochiu_room_data.gd:89`; same rule at `v2.1.1 :85`). Ignore lists `popochiu_resources.gd:90-123`, `VALID_TYPES` `:84-89`. | "…props (only those with `clickable` on — a non-clickable prop's state is not saved), hotspots, regions and walkable areas store…"; also make `visited_times` the stored field (§3.2). |
| `popochiu` `references/dialogs.md:29-30` "starts first" | Confirmed at v2.2.1 (`engine/objects/dialog/popochiu_dialog.gd:239-250`, unchanged except the icon): `_on_option_selected()` calls `_option_selected(opt)` **without `await`**, then, if `_on_option_<snake_case_id>()` exists, `await`s it and re-shows the options. So `_option_selected` starts first, but the per-option method begins as soon as `_option_selected` reaches its first `await` — they interleave. | :30 → "called for every picked option, but not awaited: an `_on_option_<id>()` method starts as soon as `_option_selected()` first awaits, so the two run interleaved". :36 "still runs first" → the same point; keep "use one style per tree". |

---

## 8. Open questions and things not verified

1. **What v4.2.0 does with a 3.x response condition `- Text [if cond]`** (error, literal text, or
   silently ungated) — not run; the compile test was refused by the session's permission classifier.
   Task A2 should compile a 3.x sample with `DMCompiler.compile_string()` in a throwaway project.
2. Whether Popochiu 2.2.1 still loads on Godot 4.6, and whether Beehave 2.9.3 still runs on 4.1–4.4 —
   neither repository tests it any more.
3. Which Godot version first exports **CSV** from Template Generation (DM's docs rely on it; DM's own
   minimum is 4.6). Not checked against the engine source here; a skill sentence about it should cite
   the engine or stay version-free.
4. `ERR_LONELY_STATIC_ID` already existed at v3.10.4, although PR #1169 is listed in the v4.0.0 notes;
   whether 3.10.4 raised it is not checked.
5. LimboAI #477 and Phantom Camera #694 are open; their 4.8 status should be re-read when Task A4 runs.
