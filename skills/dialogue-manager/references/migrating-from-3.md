# Migrating from Dialogue Manager 3 to 4

Reference for `skills/dialogue-manager/SKILL.md` — the full 3.10.x → 4.2.0 rename list, the syntax that
compiles silently wrong, removed APIs, C# wrapper changes, behaviour changes, and the upgrade procedure.
Checked against the addon source at the `v4.2.0` tag (`docs/Upgrading_Version.md` is the upstream summary).

> ← Back to [SKILL.md](../SKILL.md)

---

## 1. Should you upgrade?

Dialogue Manager 4 requires **Godot 4.6+**. On Godot 4.4–4.5 stay on the v3.10 line; on 4.3 use v3.3.
Commit everything first — a major upgrade usually needs manual edits — then install v4, delete the
project's `.godot/` cache folder, and restart the editor a couple of times so it rebuilds the cache.

---

## 2. `.dialogue` syntax

| 3.x | 4.x | What happens if you leave the 3.x form |
|---|---|---|
| "Title" (`~ name`) | "Cue" (`~ name`, unchanged) | Nothing — only the terminology and API names changed |
| `- Text [if cond]` | `- Text [if cond /]` | Compiles **without error**; the response is always allowed and its text keeps `[if cond]` |
| `- Text [if cond] => cue` | `- Text [if cond /] => cue` | Same — the jump still works, the gate does not |
| `% [if cond] Line` | `% [if cond /] Line` | Compiles without error; the random line is never gated and `[if cond]` is glued to the character name |
| `set x = 1` / `do f()` | `$> x = 1` / `$> f()` | Still compiles and runs — deprecated, no warning |
| `[do f()]` / `[do! f()]` | `[$> f()]` / `[$>> f()]` | Still compiles and runs — deprecated |
| `do wait(1)`, `do debug(x)` | `$> wait(1)`, `$> debug(x)` | Still compiles |
| Inline `[if cond]text[/if]` | unchanged | — inline conditions are **not** self-closing |

The upstream `docs/Conditions_Mutations.md` still shows a random-line condition without `/]`; the
compiler's `WEIGHTED_RANDOM_SIBLINGS_REGEX` requires it. Trust the self-closing form.

Find the silent ones in an existing project with a search for `[if ` on lines that start with `-` or `%`
and do not contain ` /]`.

---

## 3. Runtime API renames and removals

| 3.x | 4.x |
|---|---|
| signal `passed_title(title)` | `passed_cue(cue)` |
| `DialogueResource.titles`, `first_title`, `get_titles()` | `cues`, `first_cue`, `get_cues()` |
| `title` parameter of `show_dialogue_balloon` and friends | `cue` (positional calls unaffected) |
| `DialogueLine.translation_key`, `DialogueResponse.translation_key` | `static_id` |
| `DialogueManager.translation_source`, `DMConstants.TranslationSource` | removed — text always goes through `tr()` |
| Dialogue tab → Translations menu (CSV export/import) | removed — **Project Settings → Localization → Template Generation** (PO or CSV), or **Project → Tools → Dialogue → Simple CSV export…**; no CSV re-import |
| `DialogueResource.raw_text` | removed (opt-in setting **Include Raw Text in Dialogue Resource Meta Data**) |
| `DialogueLine.conditions` | removed |
| `show_error_for_missing_state_value(message, will_show)` | `(message, extra_game_states, will_show)` |
| `ERR_*_TITLE*` error constants | `ERR_*_CUE*` |

Unchanged: `get_next_dialogue_line(resource, key, extra_game_states, mutation_behaviour)` and its `null`
return at the end, `DMConstants.MutationBehaviour`, the `dialogue_started` / `got_dialogue` / `mutated` /
`dialogue_ended` signals, and the **Balloon Path** and **State Autoload Shortcuts** settings.

New in 4.x: `DialogueLine.to_serialized()` / `await DialogueLine.new_from_serialized(data)`,
`DialogueLine.refresh()`, `DialogueResponse.has_tag()`, `set_default_balloon()`,
`register_state_context()` / `unregister_state_context()`, `reseed_randomizer()`, signals
`waiting_for_input` / `waited_for_input`, the `DialogueActionable2D/3D`, `DialogueStateContext` and
`DialogueMarker2D/3D` nodes, and a **Dialogue** tab in the debugger.

### GDScript

```gdscript
# 3.x: DialogueManager.passed_title.connect(...) and line.translation_key
func _ready() -> void:
	DialogueManager.passed_cue.connect(func(cue: String) -> void: print("reached ", cue))
	DialogueManager.got_dialogue.connect(func(line: DialogueLine) -> void: print(line.static_id))
```

### C#

```csharp
// 3.x: DialogueManager.PassedTitle and line.TranslationKey
public override void _Ready()
{
    DialogueManager.PassedCue += (string cue) => GD.Print($"reached {cue}");
    DialogueManager.GotDialogue += (DialogueLine line) => GD.Print(line.StaticId);
}
```

---

## 4. C# wrapper changes

| 3.x | 4.x |
|---|---|
| `PassedTitle` | `PassedCue` |
| `DialogueLine.TranslationKey`, `DialogueResponse.TranslationKey` | `StaticId` |
| `DialogueManager.TranslationSource` property | removed (the enum is still declared, unused) |
| Static events were plain delegate fields | C# `event`s — `+=` / `-=` still compile; assigning with `=` does not |
| `Mutate(...)` was `async void` | returns `Task` |
| — | `SetDefaultBalloon`, `ReseedRandomizer`, `WaitingForInput`, `WaitedForInput`, three `ShowDialogueBalloonScene` overloads (`string`, `PackedScene`, `Node`) |
| — | native C# node scripts: `DialogueActionable2D/3D`, `DialogueStateContext`, `DialogueLabel`, `DialogueMarker2D/3D`, `DialogueResponsesMenu` (attach by hand; the picker adds the GDScript ones) |

The lazy event bridge is unchanged: C# handlers fire only after something touches
`DialogueManager.Instance`. There is no C# `ToSerialized`; store `Id` and `NextId`, re-fetch with
`GetNextDialogueLine(resource, id)` and set `NextId` back.

---

## 5. Behaviour changes

- **Conditions short-circuit.** `and` / `or` stop once the result is known, so `if node and node.prop`
  no longer errors on a null `node` — and a side effect in the right-hand operand may now be skipped.
- **Line IDs are opaque.** An `id` / `next_id` can be `<resource uid>@<line id>` and `next_id` can carry
  a `|`-separated return stack. Do not parse or store them as numbers.
- **Indenting the line directly after a cue** is now a compile error ("Invalid indentation").
- **Translation keys.** With **Use Static IDs as Translation Keys** (default on) a line's static ID is
  the msgid and `"dialogue"` the context; previously, with PO files, the static ID was the context (with CSV it was the key). Re-export your
  templates after upgrading.
