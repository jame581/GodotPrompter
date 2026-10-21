# Variable Interpolation

Reference for `skills/dialogue-system/SKILL.md` — replacing `{player_name}`-style placeholders in dialogue text. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 8. Variable Interpolation

Insert runtime values — player name, item names, quest counts — into dialogue text using `String.format()`. This works with both plain text and BBCode.

### GDScript

```gdscript
# Simple format call — keys match {placeholder} tokens in the text.
var template := "Welcome back, {player_name}! You have {gold} gold."
var result   := template.format({
    "player_name": GameState.player_name,
    "gold":        GameState.gold,
})
# → "Welcome back, Aria! You have 120 gold."


# BBCode-safe — format() does not escape BBCode tags, so this works directly:
var bbcode_template := "[color=yellow]{item_name}[/color] has been added to your pack."
var bbcode_result   := bbcode_template.format({"item_name": acquired_item.name})
dialogue_text.text  = bbcode_result  # RichTextLabel renders both BBCode and substituted value.
```

Define a central `_interpolate()` helper in `DialogueUI` (or `DialogueManager`) so all text passes through the same substitution table:

```gdscript
func _interpolate(raw: String) -> String:
    return raw.format({
        "player_name": GameState.player_name,
        "chapter":     str(GameState.quest_stage("main")),
        # add more keys as the game grows
    })
```

### C#

```csharp
// String.Format with named placeholders is not built into C#.
// Use a simple regex-replace helper or a dedicated method:

private string Interpolate(string raw)
{
    return raw
        .Replace("{player_name}", GameState.Instance.PlayerName)
        .Replace("{gold}",        GameState.Instance.Gold.ToString());
}

// Or use a Dictionary for extensibility:
private string Interpolate(string raw)
{
    var vars = new System.Collections.Generic.Dictionary<string, string>
    {
        ["player_name"] = GameState.Instance.PlayerName,
        ["chapter"]     = GameState.Instance.QuestStage("main").ToString(),
    };

    foreach (var (key, value) in vars)
        raw = raw.Replace($"{{{key}}}", value);

    return raw;
}
```

> For Godot's `RichTextLabel`, BBCode tags and `{placeholder}` tokens can coexist in the same string — `format()` only replaces `{key}` patterns and leaves all other characters untouched.

---

