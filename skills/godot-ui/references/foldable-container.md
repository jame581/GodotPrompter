> ← Back to [SKILL.md](../SKILL.md)

# FoldableContainer (Godot 4.5+)

`FoldableContainer` is a built-in `Container` node introduced in Godot 4.5, providing accordion-style collapsible sections with a toggle header — eliminating the boilerplate of manually wiring a `Button` to show/hide a child `VBoxContainer`.

## Basic Usage

```gdscript
# Build UI dynamically:
func _ready() -> void:
    var foldable := FoldableContainer.new()
    foldable.title = "Advanced Settings"
    foldable.folded = false  # start expanded

    var label := Label.new()
    label.text = "This content can be collapsed."
    foldable.add_child(label)

    var slider := HSlider.new()
    slider.min_value = 0.0
    slider.max_value = 1.0
    slider.value = 0.5
    foldable.add_child(slider)

    add_child(foldable)

# Listen for toggle:
func _ready() -> void:
    var foldable := $FoldableContainer
    foldable.folding_changed.connect(_on_section_toggled)

func _on_section_toggled(is_folded: bool) -> void:
    print("Section is now: ", "folded" if is_folded else "expanded")
```

```csharp
public override void _Ready()
{
    var foldable = new FoldableContainer
    {
        Title = "Advanced Settings",
        Folded = false
    };

    var label = new Label { Text = "This content can be collapsed." };
    foldable.AddChild(label);

    var slider = new HSlider { MinValue = 0.0, MaxValue = 1.0, Value = 0.5 };
    foldable.AddChild(slider);

    AddChild(foldable);

    // Listen for toggle:
    foldable.FoldingChanged += OnSectionToggled;
}

private void OnSectionToggled(bool isFolded)
{
    GD.Print("Section is now: ", isFolded ? "folded" : "expanded");
}
```

## Key Properties

| Property | Type | Purpose |
|----------|------|---------|
| `title` | `String` | Text shown in the toggle header |
| `folded` | `bool` | `true` = content hidden, `false` = content visible |
| `title_alignment` | `HorizontalAlignment` | Align the title text within the header |

## Signal

| Signal | Signature | When emitted |
|--------|-----------|--------------|
| `folding_changed` | `(folded: bool)` | Emitted whenever the fold state toggles |

> **Replaces boilerplate:** Before Godot 4.5, accordion sections required a `Button` + `VBoxContainer` + signal connection — `FoldableContainer` handles it all in one node.
