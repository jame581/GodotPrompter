---
name: dialogue-manager
description: Use when using the Dialogue Manager addon — .dialogue files with titles, responses, conditions and mutations, runtime balloons, and C# support
---

# Dialogue Manager

> **Related skills:** **dialogue-system** for hand-rolled dialogue data structures, **localization** for translating lines, **popochiu** for full adventure-game workflows.

> **Addon:** Dialogue Manager · version `v3.10.4` · Godot 4.6 · MIT · source: https://github.com/nathanhoad/godot_dialogue_manager · GDScript with official C# support.

---

## 1. When to use Dialogue Manager

| Approach | Best for |
|---|---|
| **dialogue-system** skill (hand-rolled `Resource` data) | Full control over data shape, no addon dependency, small dialogue trees |
| **Dialogue Manager** | Script-like `.dialogue` text format, branching responses, conditions/mutations, translation pipeline, visual editor tab, official C# wrapper |
| Full adventure-game framework | Point-and-click games needing rooms/inventory/actors bundled with dialogue — Dialogue Manager only owns the dialogue layer |

Choose Dialogue Manager when writers want to author branching dialogue as readable script text (not
Inspector-edited Resources) and you want built-in conditions, mutations, random lines, and a translation
workflow (CSV or PO) for free. If you need dialogue as strongly-typed Resources you fully own, use
`dialogue-system` instead. Dialogue Manager only handles dialogue — it is not a full adventure/quest
framework, so a larger point-and-click framework would still own rooms, inventory, and actors around it.

---

## 2. Install & setup

1. Godot AssetLib → search "Dialogue Manager" → Download. Or copy `addons/dialogue_manager/` from the
   [GitHub repo](https://github.com/nathanhoad/godot_dialogue_manager) into `res://addons/dialogue_manager/`.
2. **Project → Project Settings → Plugins** → enable "Dialogue Manager". This adds a **Dialogue** tab to
   the bottom editor panel and registers the `DialogueManager` autoload automatically — no manual
   autoload step needed.
3. `addons/dialogue_manager/plugin.cfg`:

```ini
[plugin]
name="Dialogue Manager"
description="A powerful nonlinear dialogue system"
author="Nathan Hoad"
version="3.10.4"
script="plugin.gd"
```

4. C# projects need no extra NuGet package — `using DialogueManagerRuntime;` is enough (§4).
5. Settings live at **Project Settings → General → Dialogue Manager**: notably **State Autoload
   Shortcuts** (autoload names usable in dialogue without a prefix) and **Balloon Path** (the scene
   `show_dialogue_balloon()` opens — leave empty to use the built-in example balloon).

---

## 3. `.dialogue` syntax

Open/create a `.dialogue` file from the **Dialogue** editor tab. Lines are `Character: text` or bare
`text` (narrator). Godot's RichTextLabel BBCode works, plus extras: `[[A|B|C]]` (random inline pick),
`[wait=N]` / `[wait="ui_accept"]` (pause typing), `[speed=N]`, `[next=auto]` (auto-advance).

**Titles and jumps** — `~ name` marks a title; `=> name` jumps to it; `=> END` ends the flow; `=> END!`
force-ends past any pending jump-and-returns; `=>< name` jumps and returns here once that branch hits `END`:

```
~ start
Nathan: Well?
- First one
- Another one => another_title
- Start again => start
=> END

~ another_title
Nathan: Another one?
=> END
```

**Responses** (`- `) nest by indentation and can carry a condition in `[...]` — put any jump *last*:

```
Nathan: How many projects have you started and not finished?
- Just a couple
	Nathan: That's not so bad.
- A lot [if SomeGlobal.some_property == true]
	Nathan: Maybe you should finish one before another.
- Another one [if SomeGlobal.some_method()] => another_title
```

**Conditions** — `if` / `elif` / `else`, boolean `and`/`or`/`()`, and `match`/`while` blocks:

```
if SomeGlobal.some_property >= 10
    Nathan: That property is >= 10.
elif SomeGlobal.some_other_property == "some value"
    Nathan: Or we might be in here.
else
    Nathan: If neither are true, I'll say this.
```

Inline conditions: `Nathan: I have done this [if already_done]once again[/if]`, with an optional
`[else]`. Null-safe member access uses `?.`: `if some_node_reference?.name == "SomeNode"`.

**Mutations** — `set` assigns state, `do` calls a method or emits a signal; both can run inline
(`[do wave()]`, suppress the implicit `await` with `[do! wave()]`):

```
if SomeGlobal.has_met_nathan == false
    do SomeGlobal.animate("Nathan", "Wave")
    Nathan: Hi, I'm Nathan.
    set SomeGlobal.has_met_nathan = true
```

Built-in mutations: `do wait(float)`, `do debug(...)`. Emit a signal from dialogue with
`do SomeGlobal.some_signal.emit("arg")`.

**Locals vs extra game states** — `set locals.asked = true` creates a per-conversation temp variable
(a convention implemented by the *example balloon*, not a Dialogue Manager core feature). Objects passed
in the `extra_game_states` array are referenced directly by name and their mutations persist after the
conversation ends — pass **instances**, not classes (`GameStateClass.new()`, never the bare class).

**Randomised lines** — prefix with `%` (equal weight) or `%N` (relative weight); a blank line separates
random groups:

```
Nathan: I will say this.
%3 Nathan: This line has a 60% chance of being picked
%2 Nathan: This line has a 40% chance of being picked
```

**Variables and tags** — `{{SomeGlobal.some_property}}` interpolates state into text (also usable as a
character name). `[#happy, #mood=calm]` attaches tags, readable via `line.get_tag_value("mood")`.

---

## 4. Runtime API & example balloon

Load a `DialogueResource` (`.dialogue` file) and either let `DialogueManager` open a balloon for you, or
pull lines manually with `await DialogueManager.get_next_dialogue_line(resource, title)`. When there is
no next line it returns `null` — check falsy in GDScript (`if not line:` / `while line:`) and
`line != null` in C#. (The tag's `API.md` prose says "empty dictionary `{}`", but the v3.10.4 source
returns `null` on every end-of-dialogue path — a `line == {}` check would never fire.)

### GDScript

```gdscript
# npc.gd
extends Node2D

@export var dialogue_resource: DialogueResource

func _on_interact() -> void:
    # Opens the configured balloon (Settings → Balloon Path), or the built-in example balloon.
    DialogueManager.show_dialogue_balloon(dialogue_resource, "start")

func _manual_walk() -> void:
    # Manual traversal — build a totally custom balloon around this loop.
    var line: DialogueLine = await DialogueManager.get_next_dialogue_line(dialogue_resource, "start")
    while line:
        print("%s: %s" % [line.character, line.text])
        if line.responses.is_empty():
            line = await DialogueManager.get_next_dialogue_line(dialogue_resource, line.next_id)
        else:
            var chosen: DialogueResponse = line.responses[0]  # replace with real UI selection
            line = await DialogueManager.get_next_dialogue_line(dialogue_resource, chosen.next_id)
```

### C#

```csharp
// Npc.cs
using Godot;
using DialogueManagerRuntime;

public partial class Npc : Node2D
{
    [Export] public Resource DialogueResource;

    private void OnInteract()
    {
        DialogueManager.ShowDialogueBalloon(DialogueResource, "start");
    }

    private async void ManualWalk()
    {
        var line = await DialogueManager.GetNextDialogueLine(DialogueResource, "start");
        while (line != null)
        {
            GD.Print($"{line.Character}: {line.Text}");
            if (line.Responses.Count == 0)
            {
                line = await DialogueManager.GetNextDialogueLine(DialogueResource, line.NextId);
            }
            else
            {
                var chosen = line.Responses[0]; // replace with real UI selection
                line = await DialogueManager.GetNextDialogueLine(DialogueResource, chosen.NextId);
            }
        }
    }
}
```

Other `DialogueManager` methods: `show_dialogue_balloon_scene(balloon_scene, resource, title)` (open a
specific balloon scene), `show_example_dialogue_balloon(resource, title)` (force the built-in balloon),
`create_resource_from_text(text)` (compile a `.dialogue` string at runtime — fails on syntax errors). C#
names are identical PascalCase: `ShowDialogueBalloonScene`, `ShowExampleDialogueBalloon`,
`CreateResourceFromText`.

`get_next_dialogue_line` takes a `mutation_behaviour` param — GDScript `DMConstants.MutationBehaviour`,
C# `MutationBehaviour` (both: `Wait` default, `DoNotWait`, `Skip`). The enum lives on `DMConstants`, **not**
on the `DialogueManager` autoload. Leave it `Wait` unless you know otherwise; the example balloon only
supports `Wait`.

---

## 5. Signals & typed access

`DialogueLine` fields: `id`, `next_id`, `character`, `text`, `tags` (`PackedStringArray`),
`translation_key`, `responses` (`Array[DialogueResponse]`), `concurrent_lines`. `DialogueResponse` adds
`is_allowed: bool` and `condition_as_text: String` on top of the same `id`/`next_id`/`character`/`text`/
`tags`/`translation_key` fields.

### GDScript

```gdscript
func _ready() -> void:
    DialogueManager.dialogue_started.connect(_on_dialogue_started)
    DialogueManager.dialogue_ended.connect(_on_dialogue_ended)
    DialogueManager.got_dialogue.connect(_on_got_dialogue)
    DialogueManager.mutated.connect(_on_mutated)

func _on_dialogue_started(resource: DialogueResource) -> void:
    pass

func _on_dialogue_ended(resource: DialogueResource) -> void:
    pass

func _on_got_dialogue(line: DialogueLine) -> void:
    print(line.character, ": ", line.text, " tags=", line.tags)

func _on_mutated(mutation: Dictionary) -> void:
    pass  # fires before a `do`/inline mutation runs (not `set` lines)
```

### C#

```csharp
using DialogueManagerRuntime;

public override void _Ready()
{
    DialogueManager.DialogueStarted += (Resource resource) => { };
    DialogueManager.DialogueEnded += (Resource resource) => { };
    DialogueManager.GotDialogue += (DialogueLine line) =>
    {
        GD.Print($"{line.Character}: {line.Text} tags={line.Tags}");
    };
    DialogueManager.Mutated += (Godot.Collections.Dictionary mutation) => { };
}
```

> ⚠️ These C# events are bridged to the underlying Godot signals lazily, on the **first access to
> `DialogueManager.Instance`**. A project that only subscribes here and then drives dialogue from
> GDScript never touches `Instance`, so the handlers never fire. Touch the API from C# at least once
> (e.g. `_ = DialogueManager.Instance;`, or run the dialogue via `GetNextDialogueLine`/`ShowDialogueBalloon`
> from C#) to wire them up.

The built-in responses menu node only exposes `response_selected` as a Godot signal, so connect it with
`Connect` + `Callable` instead of a C# event handler:

```csharp
responsesMenu.Connect("response_selected", Callable.From((DialogueResponse response) =>
{
    // advance using response.NextId
}));
```

`passed_title(title)` (GDScript) / `DialogueManager.PassedTitle += (string title) => { }` (C#) fires
every time a `~ title` marker is crossed — useful for analytics or save-point bookmarking.

---

## 6. Translations

By default all dialogue/response text is run through Godot's `tr()`. The `DialogueManager.translation_source`
property picks the backend — its enum type is GDScript `DMConstants.TranslationSource` / C#
`TranslationSource` (`None`, `CSV`, `PO`, `Guess` default), **not** `DialogueManager.TranslationSource`.
`Guess` inspects your locale project settings for a PO file and falls back to CSV.

Static per-line IDs (`Nathan: Hi! I'm Nathan. [ID:HI_IM_NATHAN]`) give a stable `translation_key` for
matching voiced lines and CSV/PO round-trips, instead of keying off the literal text. `.dialogue` files
auto-register in the POT Generation list; a `##` comment line before a dialogue line becomes a
`#. TRANSLATORS:` note in the exported PO/POT. Export/import CSV from the editor's **Translations** menu
(Dialogue tab); re-import matches by static ID when present, otherwise by literal text.

See the **localization** skill for `TranslationServer`, locale switching, and RTL — Dialogue Manager
only produces the translation keys and CSV/PO export; wiring locale changes into the running game is
`localization`'s job.

---

## Implementation checklist

- [ ] Dialogue Manager plugin enabled in **Project Settings → Plugins** (registers the `DialogueManager` autoload automatically)
- [ ] `.dialogue` resources loaded via `load()`/`preload()`, not parsed by hand
- [ ] Every `get_next_dialogue_line` / `GetNextDialogueLine` call is `await`ed
- [ ] Manual traversal loops detect dialogue end via the `null` return (`if not line:` in GDScript, `line != null` in C#) — never compare against `{}`
- [ ] Response lines put `[if condition]` before any `=> target` jump, never after
- [ ] `extra_game_states` entries are **instances** (`GameStateClass.new()`), not bare classes
- [ ] C# state properties that dialogue reads/writes carry `[Export]`
- [ ] C# code uses `using DialogueManagerRuntime;` and PascalCase members (`ShowDialogueBalloon`, `GetNextDialogueLine`, `DialogueStarted`, `GotDialogue`)
- [ ] Custom balloons override **Balloon Path** in Settings rather than forking `show_dialogue_balloon` call sites
- [ ] Static translation IDs (`[ID:KEY]`) added to any line needing voice-over or stable CSV/PO keys
- [ ] Inline `do`/`await` mutations use `do!` when the caller shouldn't block on them
