---
name: dialogue-manager
description: Use when using the Dialogue Manager addon — .dialogue files with cues, responses, conditions and mutations, runtime balloons, actionable nodes, and C# support
---

# Dialogue Manager

> **Related skills:** **dialogue-system** for hand-rolled dialogue data structures, **localization** for translating lines, **popochiu** for full adventure-game workflows.

> **Addon:** Dialogue Manager · version `v4.2.0` · Godot 4.6+ (built for 4.7; Godot 4.4–4.5 → v3.10, 4.3 → v3.3, see §7) · MIT · source: https://github.com/nathanhoad/godot_dialogue_manager · GDScript with official C# support.

---

## 1. When to use Dialogue Manager

| Approach | Best for |
|---|---|
| **dialogue-system** skill (hand-rolled `Resource` data) | Full control over data shape, no addon dependency, small dialogue trees |
| **Dialogue Manager** | Script-like `.dialogue` text format, branching responses, conditions/mutations, translation pipeline, visual editor tab, official C# wrapper |
| Full adventure-game framework | Point-and-click games needing rooms/inventory/actors bundled with dialogue — Dialogue Manager only owns the dialogue layer |

Choose Dialogue Manager when writers want to author branching dialogue as readable script text (not
Inspector-edited Resources) and you want built-in conditions, mutations, random lines, and translation
templates for free. If you need dialogue as strongly-typed Resources you fully own, use
`dialogue-system` instead. It is not a quest or adventure framework.

---

## 2. Install & setup

1. Godot AssetLib → search "Dialogue Manager" → Download. Or copy `addons/dialogue_manager/` from the
   [GitHub repo](https://github.com/nathanhoad/godot_dialogue_manager) into `res://addons/dialogue_manager/`.
2. **Project → Project Settings → Plugins** → enable "Dialogue Manager". This adds a **Dialogue** main-screen
   tab and registers the `DialogueManager` autoload automatically — no manual autoload step.
3. `addons/dialogue_manager/plugin.cfg`:

```ini
[plugin]
name="Dialogue Manager"
description="A powerful branching dialogue system"
author="Nathan Hoad"
version="4.2.0"
script="plugin.gd"
```

4. C# projects need no NuGet package — `using DialogueManagerRuntime;` is enough (§4).
5. Settings live at **Project Settings → General → Dialogue Manager**: notably **State Autoload
   Shortcuts** (autoload names usable without a prefix) and **Balloon Path** (the scene
   `show_dialogue_balloon()` opens — empty uses the built-in example balloon).

---

## 3. `.dialogue` syntax

Lines are `Character: text` or bare `text` (narrator). Godot's RichTextLabel BBCode works, plus
`[[A|B|C]]` (random inline pick), `[wait=N]` / `[wait="ui_accept"]`, `[speed=N]`, `[next=auto]`.

**Cues and jumps** — `~ name` marks a **cue** (3.x called it a "title"); `=> name` jumps to it;
`=> END` ends the flow; `=> END!` force-ends past pending jump-and-returns; `=>< name` jumps and returns
here once that branch hits `END`. `import "res://other.dialogue" as other` then `=>< other/cue`.
Do not indent the line directly after a cue.

```
~ start
Nathan: Well?
- First one
- Another one => another_cue
- Start again => start
=> END

~ another_cue
Nathan: Another one?
=> END
```

**Responses** (`- `) nest by indentation. A response condition is **self-closing** — `[if cond /]` —
and any jump goes *last*:

```
Nathan: How many projects have you started and not finished?
- Just a couple
	Nathan: That's not so bad.
- A lot [if SomeGlobal.some_property == true /]
	Nathan: Maybe you should finish one before another.
- Another one [if SomeGlobal.some_method() /] => another_cue
```

A response whose condition fails is still returned, with `is_allowed == false` — your UI filters it.

**Conditions** — `if` / `elif` / `else`, `and`/`or`/`()` (short-circuiting), and `match`/`when`/`while`:

```
if SomeGlobal.some_property >= 10
	Nathan: That property is >= 10.
elif SomeGlobal.some_other_property == "some value"
	Nathan: Or we might be in here.
else
	Nathan: If neither are true, I'll say this.
```

Inline conditions inside a line are *not* self-closing: `Nathan: I have done this [if already_done]once again[/if]`,
with an optional `[else]`. Null-safe member access uses `?.`.

**Mutations** — `$>` assigns state or calls a method/emits a signal; inline `[$> wave()]` awaits,
`[$>> wave()]` does not. `set` / `do` / `[do!]` still parse but are deprecated:

```
if SomeGlobal.has_met_nathan == false
	$> SomeGlobal.animate("Nathan", "Wave")
	Nathan: Hi, I'm Nathan.
	$> SomeGlobal.has_met_nathan = true
```

Built-ins: `$> wait(1.0)`, `$> debug(...)`. Signals: `$> SomeGlobal.some_signal.emit("arg")`.

**State** — autoloads first; a `DialogueStateContext` node (`alias` + `target`) exposes a scene node while it
is in the tree; `extra_game_states` (pass **instances**, never bare classes) is the last resort.
`$> locals.asked = true` is a per-conversation variable implemented by the *example balloon*, not core.

**Randomised lines** — `%` (equal weight) or `%N` (relative weight); a blank line separates groups. A
condition on a random line is self-closing too: `% [if cond /] Nathan: Only sometimes.`

```
%3 Nathan: This line has a 60% chance of being picked
%2 Nathan: This line has a 40% chance of being picked
```

**Variables and tags** — `{{SomeGlobal.some_property}}` interpolates state. `[#happy, #mood=calm]`
attaches tags, read with `line.has_tag("happy")` / `line.get_tag_value("mood")`.

---

## 4. Runtime API — balloons and manual traversal

Either let `DialogueManager` open a balloon, or pull lines with
`await DialogueManager.get_next_dialogue_line(resource, cue_or_id)`. At the end it returns `null` (and
emits `dialogue_ended`) — test `while line:` / `if not line:` in GDScript, `line != null` in C#.

### GDScript

```gdscript
# npc.gd
extends Node2D

@export var dialogue_resource: DialogueResource

func _on_interact() -> void:
	# Opens Settings → Balloon Path, or the built-in example balloon.
	DialogueManager.show_dialogue_balloon(dialogue_resource, "start")

func _manual_walk() -> void:
	# Manual traversal for a fully custom UI.
	var line: DialogueLine = await DialogueManager.get_next_dialogue_line(dialogue_resource, "start")
	while line:
		print("%s: %s" % [line.character, line.text])
		if line.responses.is_empty():
			line = await DialogueManager.get_next_dialogue_line(dialogue_resource, line.next_id)
		else:
			var allowed: Array = line.responses.filter(func(r: DialogueResponse) -> bool: return r.is_allowed)
			var chosen: DialogueResponse = allowed[0]  # replace with real UI selection
			line = await DialogueManager.get_next_dialogue_line(dialogue_resource, chosen.next_id)
```

### C#

```csharp
// Npc.cs
using System.Linq;
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
                var chosen = line.Responses.First(r => r.IsAllowed); // replace with real UI selection
                line = await DialogueManager.GetNextDialogueLine(DialogueResource, chosen.NextId);
            }
        }
    }
}
```

Other methods (the second parameter is `cue`): `show_dialogue_balloon_scene(balloon_scene, resource, cue)`,
`show_example_dialogue_balloon(resource, cue)`, `set_default_balloon(scene)` (runtime override of Balloon
Path), `create_resource_from_text(text)`. C#: `ShowDialogueBalloonScene`, `ShowExampleDialogueBalloon`,
`SetDefaultBalloon`, `CreateResourceFromText`. `get_next_dialogue_line`'s `mutation_behaviour` is
`DMConstants.MutationBehaviour` (C# `MutationBehaviour`): `Wait` (default), `DoNotWait`, `Skip`. Leave it
`Wait` — the example balloon only supports `Wait`.

---

## 5. Actionable nodes ("press to talk")

`DialogueActionable2D` / `DialogueActionable3D` (an `Area2D` / `Area3D`; the upstream docs shorten them to
`Actionable2D`) hold `dialogue_resource` + `dialogue_cue`. `action()` opens the balloon, passing
`{actionable = self}` and the node's `owner` as extra game states; `dialogue_ended` fires when that resource
ends. The picker adds the GDScript nodes — attach the C# scripts by hand to get the C# classes.

### GDScript

```gdscript
# player.gd
func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_accept"):
		var nearest: DialogueActionable2D = DialogueActionable2D.get_nearest_actionable_to(global_position)
		if nearest:
			nearest.action()
```

### C#

```csharp
public override void _UnhandledInput(InputEvent @event)
{
    if (@event.IsActionPressed("ui_accept"))
    {
        // Finds only nodes running the C# DialogueActionable2D script.
        DialogueActionable2D.GetNearestActionableTo(GlobalPosition)?.Action();
    }
}
```

---

## 6. Signals, typed access, saving

`DialogueLine`: `id`, `next_id`, `character`, `text`, `tags`, `static_id`, `responses` (untyped `Array` of
`DialogueResponse`), `concurrent_lines`. `DialogueResponse` adds `is_allowed` and `condition_as_text`.
Treat `id`/`next_id` as opaque strings (they can be `<uid>@<id>`).

### GDScript

```gdscript
func _ready() -> void:
	DialogueManager.dialogue_started.connect(_on_dialogue_started)
	DialogueManager.dialogue_ended.connect(_on_dialogue_ended)
	DialogueManager.got_dialogue.connect(_on_got_dialogue)
	DialogueManager.passed_cue.connect(func(cue: String) -> void: print("cue ", cue))

func _on_dialogue_started(resource: DialogueResource) -> void:
	pass

func _on_dialogue_ended(resource: DialogueResource) -> void:
	pass  # tell the HUD the conversation is over

func _on_got_dialogue(line: DialogueLine) -> void:
	print(line.character, ": ", line.text, " id=", line.static_id)

# Save/restore the current line (persisted .dialogue files only).
func save_line(line: DialogueLine) -> String:
	return line.to_serialized()

func load_line(data: String) -> DialogueLine:
	return await DialogueLine.new_from_serialized(data)
```

### C#

```csharp
using System.Threading.Tasks;
using DialogueManagerRuntime;

public override void _Ready()
{
    DialogueManager.DialogueStarted += (Resource resource) => { };
    DialogueManager.DialogueEnded += (Resource resource) => { /* tell the HUD */ };
    DialogueManager.GotDialogue += (DialogueLine line) => GD.Print($"{line.Character}: {line.Text} id={line.StaticId}");
    DialogueManager.PassedCue += (string cue) => GD.Print($"cue {cue}");
}

// No C# serializer: store Id and NextId, then re-fetch the line by Id.
public async Task<DialogueLine> LoadLine(Resource resource, string id, string nextId)
{
    var line = await DialogueManager.GetNextDialogueLine(resource, id);
    if (line != null) line.NextId = nextId;
    return line;
}
```

`mutated(mutation)` / `Mutated` fires before a non-assignment mutation runs (calls, emits, `wait`) — not
assignments. Also new: `waiting_for_input` / `waited_for_input`.

> ⚠️ The C# events are bridged to the Godot signals lazily, on the **first access to
> `DialogueManager.Instance`**. A project that subscribes from C# but drives dialogue from GDScript never
> touches `Instance`, so the handlers never fire — add `_ = DialogueManager.Instance;` first.

The C# `DialogueResponsesMenu` script exposes `ResponseSelected` as a C# event. The GDScript node from
the picker does not — connect it with `Connect("response_selected", Callable.From((DialogueResponse r) => { }))`.

**Translations.** Text goes through `tr()`. With **Use Static IDs as Translation Keys** (default on), a
line's static ID (`Nathan: Hi! [ID:HI_IM_NATHAN]`) is the key and `"dialogue"` the context; `##` comments
become translator notes. Export templates (PO or CSV) via **Project Settings → Localization → Template
Generation**, or **Project → Tools → Dialogue → Simple CSV export…**. Locale switching and RTL: **localization**.

---

## 7. Migrating from 3.x

| 3.x | 4.x |
|---|---|
| "title", `passed_title`, `titles`/`get_titles()`, C# `PassedTitle` | "cue", `passed_cue`, `cues`/`get_cues()`, C# `PassedCue` (`~ name` unchanged) |
| `- Text [if cond]`, `% [if cond] Line` | `- Text [if cond /]`, `% [if cond /] Line` |
| `set x = 1`, `do f()`, `[do f()]`, `[do! f()]` | `$> x = 1`, `$> f()`, `[$> f()]`, `[$>> f()]` |
| `translation_key` / C# `TranslationKey` | `static_id` / C# `StaticId` |
| `DialogueManager.translation_source`, Dialogue-tab CSV import/export | removed — Template Generation / Simple CSV export |
| Godot 4.3+ | Godot 4.6+ |

A 3.x response condition `[if cond]` still compiles in 4.x with **no error**: the response is always
allowed and `[if cond]` shows up in its text. Upgrade checklist and the full rename list:
[references/migrating-from-3.md](references/migrating-from-3.md).

---

## Implementation checklist

- [ ] Dialogue Manager plugin enabled (registers the `DialogueManager` autoload); Godot 4.6+ for v4
- [ ] `.dialogue` resources loaded via `load()`/`preload()`, not parsed by hand
- [ ] Every `get_next_dialogue_line` / `GetNextDialogueLine` call is `await`ed
- [ ] Manual loops detect the end via the `null` return (`while line:` / `line != null`), never `{}`
- [ ] Response conditions are self-closing `[if condition /]`, placed before any `=> cue` jump
- [ ] Custom UIs skip responses whose `is_allowed` is `false`
- [ ] Mutations use `$>` / `[$> …]`; `[$>> …]` when the caller shouldn't block
- [ ] Scene state exposed with `DialogueStateContext`; `extra_game_states` entries are **instances**
- [ ] C# state properties that dialogue reads/writes carry `[Export]`
- [ ] C# uses `using DialogueManagerRuntime;` and PascalCase (`GetNextDialogueLine`, `DialogueEnded`, `PassedCue`, `StaticId`)
- [ ] Custom balloons set **Balloon Path** (or `set_default_balloon`) rather than forking call sites
- [ ] Static line IDs (`[ID:KEY]`) on any line needing voice-over or stable translation keys
