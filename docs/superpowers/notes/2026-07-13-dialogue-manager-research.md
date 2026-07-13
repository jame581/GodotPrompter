# Dialogue Manager — Godot 4.x Research Digest (for the `dialogue-manager` skill)

> Gathered 2026-07-13 by fetching raw docs at tag **v3.10.4** via
> `https://raw.githubusercontent.com/nathanhoad/godot_dialogue_manager/v3.10.4/docs/<file>`
> (`Basic_Dialogue.md`, `Conditions_Mutations.md`, `Using_Dialogue.md`, `CSharp.md`, `Settings.md`,
> `Translations.md`, plus `API.md`, `Dialogue_Balloons.md`, `README.md` for cross-checking, and the
> GitHub Releases API for the tag's Godot-version banner). No shallow clone was needed — all fetches
> succeeded on the first attempt. There is no `Syntax.md` in this repo; syntax lives in `Basic_Dialogue.md`
> and `Conditions_Mutations.md`.

## 1. Release metadata

| Field | Value |
|---|---|
| **Version** | 3.10.4 (`addons/dialogue_manager/plugin.cfg`: `version="3.10.4"`) |
| **Godot version** | GitHub release title for this tag is **"v3.10.4 for Godot 4.6"** — the repo-wide `README.md` banner says "for Godot 4.4+" (that's the floor for the v3.x line in general), but this specific pinned tag is built/tested against **4.6**. Use 4.6 in the skill header, per the release metadata for the exact pinned tag. |
| **License** | MIT (`LICENSE` file, standard MIT text; author Nathan Hoad) |
| **Repo** | https://github.com/nathanhoad/godot_dialogue_manager |
| **Language** | GDScript core, with an official C# convenience wrapper (`docs/CSharp.md`) — namespace `DialogueManagerRuntime` |
| **Plugin name (Project Settings)** | "Dialogue Manager" |

## 2. Install

1. Godot AssetLib → search "Dialogue Manager" → Download → enable in **Project → Project Settings → Plugins**.
   Or download the release zip / clone the repo and copy `addons/dialogue_manager/` into `res://addons/dialogue_manager/`.
2. Enabling the plugin adds a **"Dialogue"** tab to the bottom editor panel and a **Dialogue Manager** section
   at the bottom of **Project Settings → General**.
3. C# projects: no extra NuGet package — the wrapper (`DialogueManagerRuntime.DialogueManager`) ships as GDScript-visible
   static-style calls; `using DialogueManagerRuntime;` is enough (confirmed verbatim in `docs/CSharp.md`).
4. Global autoload `DialogueManager` is registered automatically by the plugin (no manual autoload step needed).

## 3. `.dialogue` file syntax digest (from `Basic_Dialogue.md` + `Conditions_Mutations.md`)

### Lines and characters
```
This is some dialogue.
Nathan: This is me talking.
Nathan: I'll say this first.
Nathan: Then I'll say this line.
```
Line format is `Character: text` or just bare `text` (narrator/no speaker).

### BBCode extras (beyond stock RichTextLabel BBCode)
- `[[This|Or this|Or even this]]` — pick one option at random inline (double `[[`).
- `[wait=N]` — pause typing N seconds; `[wait="ui_accept"]` waits for an input action (string); `[wait=["ui_accept","ui_cancel"]]` waits for any of a list; `[wait]` waits for any action.
- `[speed=N]` — multiply typing speed by N.
- `[next=N]` — auto-advance after N seconds; `[next=auto]` picks a duration from text length.

### Responses (`- `)
```
Nathan: How many projects have you started and not finished?
- Just a couple
	Nathan: That's not so bad.
- A lot
	Nathan: Maybe you should finish one before starting another one.
```
Nesting is via indentation (tabs in upstream examples); nests indefinitely.

Responses with a condition — wrap in `[if ...]`:
```
- This is a normal response
- This is a conditional response [if SomeGlobal.some_property == true]
```
Response + jump — jump goes last:
```
- Another one [if SomeGlobal.some_method()] => another_title
- Nothing => END
```

### Titles and jumps
```
~ this_is_a_title       # title marker (no spaces in the name)
=> this_is_a_title      # jump to a title
=> END                  # end current flow
=> END!                 # force end of conversation regardless of nested jump-and-returns
=><  some_title         # "jump and return" — continues after this line once the jumped flow hits END
```
Expression jumps: `=> {{SomeGlobal.some_property}}` — compiler cannot verify the target exists; use with caution.

Imports: `import "res://snippets.dialogue" as snippets`, then jump into it with `=>< snippets/banter`.

### Conditions (`if` / `elif` / `else`, `match`, `while`)
```
if SomeGlobal.some_property >= 10
    Nathan: That property is greater than or equal to 10
elif SomeGlobal.some_other_property == "some value"
    Nathan: Or we might be in here.
else
    Nathan: If neither are true, I'll say this.
```
Boolean composition: `and` / `or`, grouped with `(` `)`.
Inline conditions: `Nathan: I have done this [if already_done]once again[/if]`, with `[else]` supported:
`Nathan: You have {{num_apples}} [if num_apples == 1]apple[else]apples[/if], nice!`
`match`:
```
match SomeGlobal.some_property
    when 1
        Nathan: It is 1.
    when > 5
        Nathan: It is less than 5 (but not 1).
    else
        Nathan: It was something else.
```
`while` (loops while true):
```
while SomeGlobal.some_property < 10
    Nathan: The property is still less than 10 - specifically, it is {{SomeGlobal.some_property}}.
    do SomeGlobal.some_property += 1
Nathan: Now, we can move on.
```

### Mutations (`set` / `do`)
```
if SomeGlobal.has_met_nathan == false
    do SomeGlobal.animate("Nathan", "Wave")
    Nathan: Hi, I'm Nathan.
    set SomeGlobal.has_met_nathan = true
```
Inline mutations: `Nathan: I'm not sure we've met before [do wave()]I'm Nathan.` — inline mutations using `await`
pause typing until resolved; suppress the wait with `[do! something()]`.
Signals: `do SomeGlobal.some_signal.emit("some argument")`.
Special built-ins: `do wait(float)` (no effect inline), `do debug(...)` (prints to Output).
Null coalescing: `if some_node_reference?.name == "SomeNode"` — avoids a crash when the left side is null.

### Locals and extra game states
`locals.<name>` — temporary per-conversation variables, set via `set locals.x = true` — a convention
implemented by the *example balloon*, not a Dialogue Manager core feature.
Extra game states are objects/nodes/dictionaries passed in the `extra_game_states` array param of
`get_next_dialogue_line` — referenced directly by name (no `locals.` prefix), and mutations persist
after the conversation ends (e.g. `do game.hello()`, `set game.pirate_name = "delilah"`).
State autoload shortcuts (Project Settings → Dialogue Manager → Runtime) let you drop the autoload
prefix project-wide; per-file the same effect is `using SomeGlobal` at the top of a `.dialogue` file.

### Randomised lines (`%`)
```
Nathan: I will say this.
% Nathan: And then I might say this
% Nathan: Or maybe this
```
Weighted: `%3 Nathan: ...` / `%2 Nathan: ...` (relative weight). Blank line separates groups. Whole
indented blocks can be randomised with a bare `%` header line. Randomised jump lines: `% => some_title`,
conditioned: `% [if SomeGlobal.some_condition] => another_title`.

### Variables in text
`Nathan: The value of some property is {{SomeGlobal.some_property}}.` — double-curly interpolation;
also usable as the character name: `{{SomeGlobal.some_character_name}}: My name was provided by the player.`

### Tags
`Nathan: [#happy, #surprised] Oh, Hello!` → `DialogueLine.tags == ["happy", "surprised"]`.
Valued tags: `Nathan: [#mood=happy] Oh, Hello!` → `tags == ["mood=happy"]`,
`line.get_tag_value("mood") == "happy"`.

### Concurrent lines (`| `)
```
Nathan: This is a regular line of dialogue.
| Coco: And I'll say this line at the same time!
```
Exposed via `DialogueLine.concurrent_lines`. Not implemented in the example balloon.

### Static translation IDs
`Nathan: Hi! I'm Nathan. [ID:HI_IM_NATHAN]` — see §6.

## 4. Runtime API — verbatim from `API.md`, `Using_Dialogue.md`, `CSharp.md`

### `DialogueManager` (GDScript autoload/global)

Signals:
- `dialogue_started(resource: DialogueResource)`
- `passed_title(title: String)`
- `got_dialogue(line: DialogueLine)`
- `mutated(mutation: Dictionary)`
- `dialogue_ended(resource: DialogueResource)`

Methods:
```gdscript
func show_dialogue_balloon(resource: DialogueResource, title: String = "", extra_game_states: Array = []) -> Node
func show_dialogue_balloon_scene(balloon_scene: Node | String, resource: DialogueResource, title: String = "", extra_game_states: Array = []) -> Node
func get_next_dialogue_line(resource: DialogueResource, key: String = "", extra_game_states: Array = [], mutation_behaviour: MutationBehaviour = MutationBehaviour.Wait) -> DialogueLine  # MUST be called with `await`
func show_example_dialogue_balloon(resource: DialogueResource, title: String = "", extra_game_states: Array = []) -> CanvasLayer
func create_resource_from_text(text: String) -> DialogueResource  # runs text through the compiler; fails on syntax errors
```
`resource.get_next_dialogue_line(title)` also works directly on a loaded `DialogueResource` (equivalent to
calling the autoload method with that resource).

`MutationBehaviour` enum: `Wait` (default — await mutation lines), `DoNotWait` (run but
don't await), `Skip` (skip mutations entirely). *The example balloon only supports `Wait`.*

> **Correction 2026-07-14:** this enum lives on **`DMConstants`** (`constants.gd:1,8` — `class_name
> DMConstants`), not on the `DialogueManager` autoload: `dialogue_manager.gd:90` types the param as
> `DMConstants.MutationBehaviour`. GDScript must write `DMConstants.MutationBehaviour.Wait`; in C# the
> enum is namespace-level in `DialogueManagerRuntime`, so it is plain `MutationBehaviour.Wait`.
> `DialogueManager.MutationBehaviour` does not resolve. Same applies to `TranslationSource` (§ below).

`DialogueManager.get_current_scene` — a `Callable` property; override it if your game manages "current scene"
differently than `get_tree().current_scene`.

### `DialogueLine` (returned by `get_next_dialogue_line`)

| Field | Type | Notes |
|---|---|---|
| `id` | `String` | ID of this line |
| `next_id` | `String` | ID of the next line |
| `character` | `String` | speaker name, or `""` |
| `text` | `String` | the line body |
| `tags` | `PackedStringArray` | tag list |
| `translation_key` | `String` | translation key (ID or full text) |
| `responses` | `Array[DialogueResponse]` | see below, `[]` if none |
| `concurrent_lines` | `Array[DialogueLine]` | lines spoken at the same time |

`DialogueLine.get_tag_value(name: String) -> String` — resolves a `#name=value` tag.

`DialogueResponse` fields: `id`, `next_id`, `is_allowed: bool`, `condition_as_text: String`, `character`, `text`,
`tags`, `translation_key`.

If there is no next line, `get_next_dialogue_line` returns **`null`**. The tag's `API.md` prose claims
"an empty dictionary (`{}`)", but that is **stale at v3.10.4** — verified against the actual source
(`addons/dialogue_manager/dialogue_manager.gd` fetched at the tag): the method is typed
`-> DialogueLine`, the public wrapper does `if line == null: dialogue_ended.emit(resource)`, and every
end-of-dialogue path in `_get_next_dialogue_line` does `return null`. Detect dialogue end with a falsy
check (`if not line:` / `while line:`) in GDScript and `line != null` in C# — never `line == {}`, which
can never be true.

### `DialogueLabel` (extends `RichTextLabel`)

Exports: `seconds_per_step: float = 0.02`, `pause_at_characters: String = ".?!"`,
`skip_pause_at_character_if_followed_by: String = ")\""`,
`skip_pause_at_abbreviations: Array = ["Mr", "Mrs", "Ms", "Dr", "etc", "ex"]`,
`seconds_per_pause_step: float = 0.3`.

Signals: `spoke(letter: String, letter_index: int, speed: float)`, `started_typing()`, `skipped_typing()`,
`finished_typing()`. (`Using_Dialogue.md` also mentions a `paused_typing(duration)` signal on the label.)

Methods: `type_out() -> void`, `skip_typing() -> void`. Assign `dialogue_line` on the label to feed it a line.

### C# wrapper — verbatim from `docs/CSharp.md`

Namespace:
```csharp
using DialogueManagerRuntime;
```

Static-style calls on `DialogueManager` (same class name as the GDScript autoload, called statically from C#):
```csharp
var dialogue = GD.Load<Resource>("res://example.dialogue");
DialogueManager.ShowExampleDialogueBalloon(dialogue, "start");
DialogueManager.ShowDialogueBalloon(dialogue, "start");
var line = await DialogueManager.GetNextDialogueLine(dialogue, "start");
```
Resource creation: `DialogueManager.CreateResourceFromText("~ title\nCharacter: Hello!")` — doc text also
has a typo `CreateResoureFromString` in one prose sentence, but the actual code sample uses
`CreateResourceFromText` consistently; treat `CreateResourceFromText` as authoritative (matches the GDScript
method name `create_resource_from_text`).

State visibility: C# properties must carry `[Export]` to be visible to Dialogue Manager as state
(autoloads, current scene, and `extraGameStates` array param — camelCase param name in C# call sites per
the doc prose, though the method signature mirrors GDScript's `extra_game_states`).

Mutations — C# mutation methods are typically `async Task` (or `async Task<Variant>` to return a value
instead of mutating a property in place):
```csharp
[Export] string PlayerName = "Player";

public async Task AskForName()
{
  var nameInputDialogue = GD.Load<PackedScene>("res://path/to/some/name_input_dialog.tscn").Instantiate() as AcceptDialog;
  GetTree().Root.AddChild(nameInputDialogue);
  nameInputDialogue.PopupCentered();
  await ToSignal(nameInputDialogue, "confirmed");
  PlayerName = nameInputDialogue.GetNode<LineEdit>("NameEdit").Text;
  nameInputDialogue.QueueFree();
}
```
Called from dialogue as `do AskForName()`, referenced as `{{PlayerName}}`.

Signals — two ways to connect from C#:
```csharp
// 1. Event handlers (DialogueManager only):
DialogueManager.DialogueStarted += (Resource dialogueResource) => { };
DialogueManager.DialogueEnded += (Resource dialogueResource) => { };
DialogueManager.PassedTitle += (string title) => { };
DialogueManager.GotDialogue += (DialogueLine line) => { };
DialogueManager.Mutated += (Godot.Collections.Dictionary mutation) => { };

// 2. Connect + Callable (needed for nodes like the built-in responses menu):
responsesMenu.Connect("response_selected", Callable.From((DialogueResponse response) => { }));
```
These event names (`DialogueStarted`, `DialogueEnded`, `PassedTitle`, `GotDialogue`, `Mutated`) are the
PascalCase C# counterparts of the GDScript signals `dialogue_started`, `dialogue_ended`, `passed_title`,
`got_dialogue`, `mutated` — verbatim from the doc's code block.

## 5. Settings (Project Settings → General → Dialogue Manager)

Runtime: **State Autoload Shortcuts** (array of autoload names usable without prefix in dialogue),
**Warn about method property or signal name conflicts** (Advanced; debug-build only),
**Balloon Path** (scene used by `show_dialogue_balloon`), **Ignore Missing State Values** (Advanced).

Editor: **Wrap Long Lines**, **New File Template**, **Missing Translations Are Errors**,
**Include Characters in Translatable Strings List**, **Default Csv Locale**,
**Include Character in Translation Exports** (Advanced), **Include Notes in Translation Exports** (Advanced),
**Dialogue Processor Path** (Advanced — a `DMDialogueProcessor` subclass), **Custom Test Scene Path**
(Advanced — must extend `BaseDialogueTestScene`), **Extra Auto Complete Script Sources** (Advanced).

## 6. Translations

- By default all dialogue/response text passes through Godot's `tr()`.
- `DialogueManager.translation_source` — the *property* is on the autoload, but its enum **type** is
  `DMConstants.TranslationSource` (GDScript) / namespace-level `TranslationSource` (C#), per
  `dialogue_manager.gd:54`; `DialogueManager.TranslationSource` does not resolve. Values: `None`, `CSV`,
  `PO`, `Guess` [default]. `Guess` inspects the locale project settings (PO file present → PO, else CSV).
- Static per-line translation keys: `Nathan: Hi! I'm Nathan. [ID:HI_IM_NATHAN]` — becomes the
  `translation_key` on `DialogueLine`/`DialogueResponse`, and the POT context for that line.
- All `.dialogue` files are auto-registered in the POT Generation list (Project Settings → Localization).
- Translator notes: a `##` comment line before a dialogue line becomes a `#. TRANSLATORS:` note in the
  generated PO/POT (Godot-native behavior, not Dialogue Manager–specific).
- CSV workflow: "Export as CSV" / "Import CSV" from the dialogue editor's Translations menu; matches by
  static ID when present, otherwise by literal text; merges into an existing CSV rather than overwriting.
- Character names are translated by the game (dialogue files are prompted separately) — an option in the
  Translations menu exports character names to CSV; they get POT context `"dialogue"`.
- Runtime tags/BBCode (`[next=auto]`, `[wave]`, etc.) are part of the line and must be included in translations.

## 7. Gotchas / things to flag in the skill

1. **Godot-version banner mismatch.** The repo README says "for Godot 4.4+" project-wide, but the
   v3.10.4 GitHub release is explicitly titled "v3.10.4 for Godot 4.6" — the skill pins **4.6** because
   that's what this exact tag targets (confirmed via the Releases API, not just the README).
2. **`get_next_dialogue_line` must be awaited** — it is a coroutine; forgetting `await` yields a
   `GDScriptFunctionState`/`Signal` rather than a `DialogueLine`.
3. **End-of-dialogue return is `null` — the tag's `API.md` prose is stale.** `API.md` says "an empty
   dictionary (`{}`)", but the v3.10.4 source (`addons/dialogue_manager/dialogue_manager.gd`) types the
   method `-> DialogueLine` and every end-of-dialogue path does `return null` (the public wrapper even
   checks `if line == null` to emit `dialogue_ended`). Teaching the `{}` sentinel would produce a
   `line == {}` check that never fires (in GDScript `null == {}` is `false`) → infinite dialogue loop.
   Detect end with a falsy check (`if not line:` / `while line:`) in GDScript, `line != null` in C#.
4. **`locals.*` is example-balloon convention, not a core Dialogue Manager feature** — don't imply it's a
   built-in special namespace; a custom balloon that doesn't set up an `extra_game_states` entry named
   `locals` won't have it.
5. **Response + jump ordering** — `[if ...]` condition must come before `=> target`; the parser expects the
   jump last on a response line.
6. **Inline `do`/`await` pauses typing** — inline mutations that `await` internally block the typewriter
   until they resolve; use `do!` to fire-and-forget when that's not wanted.
7. **`extra_game_states` objects must be instances**, not classes — `GameStateClass.new()`, never the bare
   class, or property/method lookups will fail silently or error.
8. **C# doc has a one-off prose typo** (`CreateResoureFromString`) that doesn't match any real method name;
   the actual C# method is `CreateResourceFromText` (confirmed by the code sample and by symmetry with the
   GDScript `create_resource_from_text`) — the skill must use the correct spelling.
9. **C# state visibility requires `[Export]`** on any property you want Dialogue Manager to see as game
   state (current scene, autoloads, or `extraGameStates`) — a plain C# field/property without `[Export]`
   is invisible to dialogue conditions/mutations.
10. **Import/jump-and-return syntax is easy to typo**: `=><` (jump-and-return) vs `=>` (plain jump) vs
    `=> END!` (force-end past nested returns) are three distinct directives.
11. **C# end-of-dialogue check: `while (line != null)`.** `CSharp.md` only shows a single
    `var line = await DialogueManager.GetNextDialogueLine(dialogue, "start");` call, no traversal loop —
    but since the GDScript source returns `null` at end of dialogue (gotcha #3), the null check is the
    verified-correct pattern, not an inference.
12. **Condition + jump on one response line is documented upstream.** The exact form
    `- Another one [if SomeGlobal.some_method()] => another_title` appears verbatim in
    `Conditions_Mutations.md` at the tag (with the accompanying rule "If using a condition and a goto on
    a response line, make sure the goto is provided last") — the skill's §3 snippet is doc-verbatim, not
    an authored composition.

## Skill-authoring implications

- **Section coverage target:** when-to-use vs `dialogue-system`/full frameworks → install → `.dialogue`
  syntax (titles, responses, conditions, mutations, jumps) → runtime API + balloon example (GDScript **and**
  C#) → signals & typed access → translations → checklist, per the task brief.
- **C# parity is full-skill, not Pattern X** — every section with a GDScript block needs a C# block; the
  verbatim names in §4 (`DialogueManagerRuntime` namespace, `ShowDialogueBalloon`, `GetNextDialogueLine`,
  `CreateResourceFromText`, event names `DialogueStarted`/`DialogueEnded`/`PassedTitle`/`GotDialogue`/`Mutated`)
  are the source of truth — do not invent additional C# surface not shown in `CSharp.md`.
- **No `Syntax.md` exists at this tag** — `.dialogue` syntax facts are sourced from `Basic_Dialogue.md` and
  `Conditions_Mutations.md` only.
- **Do not reference `popochiu` or `phantom-camera`** in the skill — those cross-refs are wired in a later
  task; this skill's related-skills line is fixed to `dialogue-system` + `localization` only.
