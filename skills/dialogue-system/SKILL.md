---
name: dialogue-system
description: Use when implementing dialogue — data structures for branching dialogue, conditions, and UI presentation
---

# Dialogue Systems in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **resource-pattern** for dialogue data as Resources, **godot-ui** for Control node layout, **state-machine** for dialogue flow management, **save-load** for dialogue state persistence, **dialogue-manager** for a full-featured dialogue addon, **popochiu** for adventure games.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        UI Layer                         │
│   DialogueUI (Control)                                  │
│     ├─ Label (speaker_name)                             │
│     ├─ TextureRect (portrait)                           │
│     ├─ RichTextLabel (dialogue_text, typewriter effect) │
│     └─ VBoxContainer (choice_container)                 │
│           └─ Button × N (choice buttons)                │
│                                                         │
│   Connects to: line_displayed, choice_presented signals │
└───────────────────────┬─────────────────────────────────┘
                        │ drives UI via signals
┌───────────────────────▼─────────────────────────────────┐
│              DialogueManager (Autoload / Node)           │
│   start_dialogue(dialogue_data)                         │
│   advance()  → next line or end                         │
│   choose(choice_index)                                  │
│   current_line: DialogueLine (read-only)                │
│                                                         │
│   signals: dialogue_started                             │
│             line_displayed(line)                        │
│             choice_presented(choices)                   │
│             dialogue_ended                              │
└───────────────────────┬─────────────────────────────────┘
                        │ reads
┌───────────────────────▼─────────────────────────────────┐
│                   Data Layer (Resources)                 │
│   DialogueData (Resource)                               │
│     lines: Dictionary  ← id → DialogueLine              │
│     start_line_id: String                               │
│                                                         │
│   DialogueLine (Resource)                               │
│     speaker, text, choices, next_line_id, condition     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. DialogueLine Resource

`DialogueLine` holds all data for a single beat of dialogue. Choices is an `Array[Dictionary]` so each entry can carry a `text`, `next_line_id`, and optional `condition` without a separate class.

### GDScript

```gdscript
# dialogue_line.gd
class_name DialogueLine
extends Resource

## Display name shown in the UI speaker box.
@export var speaker: String = ""

## The body text. Supports BBCode and variable placeholders: {player_name}.
@export_multiline var text: String = ""

## When non-empty, overrides next_line_id. Each Dictionary must have:
##   "text"        : String   — label on the choice button
##   "next_line_id": String   — line to jump to when chosen
##   "condition"   : String   — (optional) expression; omit or "" to always show
@export var choices: Array = []

## ID of the next DialogueLine. Ignored when choices is non-empty.
@export var next_line_id: String = ""

## Optional condition expression evaluated before displaying this line.
## If the expression returns false the manager skips to next_line_id.
## Example: "GameState.has_item('key')"
@export var condition: String = ""
```

### C#

```csharp
// DialogueLine.cs
using Godot;
using Godot.Collections;

[GlobalClass]
public partial class DialogueLine : Resource
{
    /// <summary>Display name shown in the speaker box.</summary>
    [Export] public string Speaker     { get; set; } = "";

    /// <summary>Body text. Supports BBCode and {variable} placeholders.</summary>
    [Export(PropertyHint.MultilineText)]
    public string Text                 { get; set; } = "";

    /// <summary>
    /// When non-empty, overrides NextLineId. Each Dictionary entry must contain:
    ///   "text"         : string  — choice button label
    ///   "next_line_id" : string  — line to jump to
    ///   "condition"    : string  — (optional) expression; omit or "" to always show
    /// </summary>
    [Export] public Array Choices      { get; set; } = new();

    /// <summary>ID of the next DialogueLine. Ignored when Choices is non-empty.</summary>
    [Export] public string NextLineId  { get; set; } = "";

    /// <summary>
    /// Optional condition expression. Evaluated before displaying this line.
    /// Example: "GameState.HasItem(\"key\")"
    /// </summary>
    [Export] public string Condition   { get; set; } = "";
}
```

---

## 3. DialogueData Resource

`DialogueData` is a container Resource that holds a dictionary of all lines, keyed by their string ID. Creating it as a `.tres` file lets you assign it to NPCs in the Inspector.

### GDScript

```gdscript
# dialogue_data.gd
class_name DialogueData
extends Resource

## Dictionary mapping line ID strings to DialogueLine resources.
## Example: { "intro": <DialogueLine>, "ask_quest": <DialogueLine> }
@export var lines: Dictionary = {}

## ID of the first line to display when dialogue starts.
@export var start_line_id: String = ""


## Convenience accessor — returns null for unknown IDs.
func get_line(id: String) -> DialogueLine:
    return lines.get(id, null)
```

### C#

```csharp
// DialogueData.cs
using Godot;
using Godot.Collections;

[GlobalClass]
public partial class DialogueData : Resource
{
    /// <summary>Maps line ID strings to DialogueLine resources.</summary>
    [Export] public Dictionary Lines        { get; set; } = new();

    /// <summary>ID of the first line to display when dialogue starts.</summary>
    [Export] public string StartLineId      { get; set; } = "";

    /// <summary>Returns the DialogueLine for id, or null if not found.</summary>
    public DialogueLine GetLine(string id)
    {
        if (Lines.ContainsKey(id))
            return Lines[id].As<DialogueLine>();
        return null;
    }
}
```

> Populate `lines` in the Inspector by adding Dictionary entries with string keys and `DialogueLine` resource values, or load them programmatically from JSON (see section 7).

---

## 4. DialogueManager

A singleton autoload owns the active `DialogueData` and tracks current line ID. `start(data)` sets the data and emits the first line; `advance(choice_index)` moves forward. Wires three signals: `line_changed(line)`, `choices_presented(choices)`, `dialogue_ended()`.

> See [references/dialogue-manager.md](references/dialogue-manager.md) for the full GDScript and C# manager (line traversal, choice handling, condition evaluation hooks, signals).

---

## 5. Branching and Conditions

Choices live on `DialogueLine.choices` (an Array of Dictionary). Each choice has `text`, `next_line_id`, optional `condition`. Conditions are GDScript expressions evaluated via the `Expression` class — passed a context object with project state (e.g. `GameState`).

> See [references/branching-and-conditions.md](references/branching-and-conditions.md) for the full choice-handling and condition-evaluator implementations (GDScript + C#), plus security notes on Expression input.

---

## 6. Dialogue UI

A `CanvasLayer` with a `RichTextLabel` for the line body (BBCode-enabled), a `Label` for speaker name, and a `VBoxContainer` for choice buttons. Typewriter effect via `RichTextLabel.visible_characters` driven by a `Tween`. UI subscribes to `DialogueManager` signals.

> See [references/ui-presentation.md](references/ui-presentation.md) for the scene-tree fragment, typewriter recipe, choice-button spawning, and full GDScript + C# wiring.

---

## 7. External Formats

Load dialogue from JSON for designer-friendly editing — map JSON keys to `DialogueLine` properties at load time. Or integrate the **Dialogic** addon for a node-graph editor (community standard).

> See [references/external-formats.md](references/external-formats.md) for the JSON loader recipe and Dialogic integration notes.

---

## 8. Variable Interpolation

Dialogue text supports `{player_name}`-style placeholders. Resolve via a small templater: `text.format(vars)` (GDScript) or `string.Format` with named-tag preprocessing (C#).

> See [references/variable-interpolation.md](references/variable-interpolation.md) for the GDScript and C# interpolation helpers.

---

## 9. Implementation Checklist

- [ ] `DialogueLine` and `DialogueData` extend `Resource` and carry `[GlobalClass]` (C#) for Inspector integration
- [ ] `DialogueManager` is registered as an Autoload so all scenes share a single instance
- [ ] `start_dialogue()` asserts that `dialogue_data` is non-null before accessing it
- [ ] `advance()` guards against being called when choices are pending
- [ ] `choose()` operates on the filtered visible-choices list, not the raw `choices` array
- [ ] Condition strings reference only stable autoload method names — avoid referencing scene-local nodes
- [ ] `_evaluate_condition()` passes a known base instance (`GameState`) to `Expression.execute()` to resolve method calls
- [ ] Typewriter timer uses `visible_characters`, not frame-by-frame string slicing, for BBCode compatibility
- [ ] Pressing `ui_accept` mid-typewriter reveals full text; a second press advances the line
- [ ] Choice buttons are freed (`queue_free`) before creating new ones — never accumulate stale children
- [ ] JSON loader validates file open and parse steps separately, emitting clear error messages for each failure
- [ ] Variable interpolation is centralised in one `_interpolate()` helper, not scattered across signal handlers
- [ ] `next_line_id = ""` signals end-of-dialogue — no magic sentinel strings beyond the empty string
- [ ] All `push_error()` messages include class name and method for easy log tracing
