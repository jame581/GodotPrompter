# DialogueManager (Autoload)

> ⚠️ **Not the addon.** This page documents a **hand-rolled** `DialogueManager` autoload you write yourself. For Nathan Hoad's *Dialogue Manager* addon (`.dialogue` files, balloons), read the **dialogue-manager** skill instead — `skills/dialogue-manager/SKILL.md`.

Reference for `skills/dialogue-system/SKILL.md` — full DialogueManager implementation: line-by-line traversal, choice handling, condition evaluation hooks, signals. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. DialogueManager

`DialogueManager` drives the state machine. Register it as an **Autoload** (`Project > Project Settings > Autoload`) so any scene can call `DialogueManager.start_dialogue(data)`.

### GDScript

```gdscript
# dialogue_manager.gd
class_name DialogueManager
extends Node

signal dialogue_started
signal line_displayed(line: DialogueLine)
signal choice_presented(choices: Array)
signal dialogue_ended

var current_line: DialogueLine:
    get: return _current_line

var _data: DialogueData = null
var _current_line: DialogueLine = null
var _active: bool = false


func start_dialogue(dialogue_data: DialogueData) -> void:
    assert(dialogue_data != null, "DialogueManager.start_dialogue: data must not be null")
    _data   = dialogue_data
    _active = true
    dialogue_started.emit()
    _go_to_line(_data.start_line_id)


func advance() -> void:
    if not _active or _current_line == null:
        return
    if not _current_line.choices.is_empty():
        push_warning("DialogueManager.advance: call choose() when choices are presented")
        return
    _go_to_line(_current_line.next_line_id)


func choose(choice_index: int) -> void:
    if not _active or _current_line == null:
        return
    if _current_line.choices.is_empty():
        push_warning("DialogueManager.choose: no choices on the current line")
        return

    var visible_choices := _visible_choices(_current_line.choices)
    if choice_index < 0 or choice_index >= visible_choices.size():
        push_error("DialogueManager.choose: index %d out of range" % choice_index)
        return

    _go_to_line(visible_choices[choice_index].get("next_line_id", ""))


func _go_to_line(id: String) -> void:
    if id.is_empty():
        _end_dialogue()
        return

    var line: DialogueLine = _data.get_line(id)
    if line == null:
        push_error("DialogueManager: unknown line id '%s'" % id)
        _end_dialogue()
        return

    # Skip line if its condition is not met
    if not line.condition.is_empty() and not _evaluate_condition(line.condition):
        _go_to_line(line.next_line_id)
        return

    _current_line = line
    line_displayed.emit(line)

    var visible := _visible_choices(line.choices)
    if not visible.is_empty():
        choice_presented.emit(visible)


func _end_dialogue() -> void:
    _active       = false
    _current_line = null
    _data         = null
    dialogue_ended.emit()


# Returns only choices whose condition passes (or have no condition).
func _visible_choices(choices: Array) -> Array:
    return choices.filter(func(c: Dictionary) -> bool:
        var cond: String = c.get("condition", "")
        return cond.is_empty() or _evaluate_condition(cond)
    )


# Evaluates a condition string against the current game state.
# See section 5 for a full condition evaluator example.
func _evaluate_condition(expression: String) -> bool:
    var expr := Expression.new()
    var err   := expr.parse(expression)
    if err != OK:
        push_error("DialogueManager: bad condition '%s' — %s" % [expression, expr.get_error_text()])
        return false
    var result = expr.execute([], self)
    if expr.has_execute_failed():
        push_error("DialogueManager: condition execute failed for '%s'" % expression)
        return false
    return bool(result)
```

### C#

```csharp
// DialogueManager.cs
using Godot;
using Godot.Collections;

public partial class DialogueManager : Node
{
    [Signal] public delegate void DialogueStartedEventHandler();
    [Signal] public delegate void LineDisplayedEventHandler(DialogueLine line);
    [Signal] public delegate void ChoicePresentedEventHandler(Array choices);
    [Signal] public delegate void DialogueEndedEventHandler();

    public DialogueLine CurrentLine => _currentLine;

    private DialogueData  _data        = null;
    private DialogueLine  _currentLine = null;
    private bool          _active      = false;

    public void StartDialogue(DialogueData dialogueData)
    {
        if (dialogueData == null)
        {
            GD.PushError("DialogueManager.StartDialogue: data must not be null");
            return;
        }

        _data   = dialogueData;
        _active = true;
        EmitSignal(SignalName.DialogueStarted);
        GoToLine(_data.StartLineId);
    }

    public void Advance()
    {
        if (!_active || _currentLine == null) return;
        if (_currentLine.Choices.Count > 0)
        {
            GD.PushWarning("DialogueManager.Advance: call Choose() when choices are presented");
            return;
        }
        GoToLine(_currentLine.NextLineId);
    }

    public void Choose(int choiceIndex)
    {
        if (!_active || _currentLine == null) return;
        if (_currentLine.Choices.Count == 0)
        {
            GD.PushWarning("DialogueManager.Choose: no choices on the current line");
            return;
        }

        var visible = VisibleChoices(_currentLine.Choices);
        if (choiceIndex < 0 || choiceIndex >= visible.Count)
        {
            GD.PushError($"DialogueManager.Choose: index {choiceIndex} out of range");
            return;
        }

        var chosen = visible[choiceIndex].AsGodotDictionary();
        GoToLine(chosen.ContainsKey("next_line_id") ? chosen["next_line_id"].As<string>() : "");
    }

    private void GoToLine(string id)
    {
        if (string.IsNullOrEmpty(id)) { EndDialogue(); return; }

        var line = _data.GetLine(id);
        if (line == null)
        {
            GD.PushError($"DialogueManager: unknown line id '{id}'");
            EndDialogue();
            return;
        }

        // Skip line if condition is not met
        if (!string.IsNullOrEmpty(line.Condition) && !EvaluateCondition(line.Condition))
        {
            GoToLine(line.NextLineId);
            return;
        }

        _currentLine = line;
        EmitSignal(SignalName.LineDisplayed, line);

        var visible = VisibleChoices(line.Choices);
        if (visible.Count > 0)
            EmitSignal(SignalName.ChoicePresented, visible);
    }

    private void EndDialogue()
    {
        _active      = false;
        _currentLine = null;
        _data        = null;
        EmitSignal(SignalName.DialogueEnded);
    }

    private Array VisibleChoices(Array choices)
    {
        var result = new Array();
        foreach (var c in choices)
        {
            var dict = c.AsGodotDictionary();
            string cond = dict.ContainsKey("condition") ? dict["condition"].As<string>() : "";
            if (string.IsNullOrEmpty(cond) || EvaluateCondition(cond))
                result.Add(c);
        }
        return result;
    }

    private bool EvaluateCondition(string expression)
    {
        var expr = new Expression();
        var err  = expr.Parse(expression);
        if (err != Error.Ok)
        {
            GD.PushError($"DialogueManager: bad condition '{expression}' — {expr.GetErrorText()}");
            return false;
        }
        var result = expr.Execute(Array.From(System.Array.Empty<Variant>()), this);
        if (expr.HasExecuteFailed())
        {
            GD.PushError($"DialogueManager: condition execute failed for '{expression}'");
            return false;
        }
        return result.As<bool>();
    }
}
```

---

