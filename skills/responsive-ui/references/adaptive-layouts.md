# Adaptive Layouts

Reference for `skills/responsive-ui/SKILL.md` — anchor + container strategy, detecting resolution changes, `size_flags` reference.

> ← Back to [SKILL.md](../SKILL.md)

---
## 7. Adaptive Layouts

### Anchor + Container Strategy

Design for your base resolution, anchor every HUD element to the nearest screen edge, and use `Container` nodes for anything that must reflow.

```
HUD (CanvasLayer)
└── SafeAreaMargin (MarginContainer — anchor: Full Rect)
    ├── TopBar (HBoxContainer — anchor: Top Wide)
    │   ├── HealthLabel (Label — size_flags_h: EXPAND_FILL)
    │   └── ScoreLabel  (Label)
    └── BottomBar (HBoxContainer — anchor: Bottom Wide)
        ├── InventoryButton (Button — custom_minimum_size: Vector2(64, 64))
        └── MapButton       (Button — custom_minimum_size: Vector2(64, 64))
```

**GDScript — setting size flags and minimum sizes in code:**

```gdscript
func _ready() -> void:
    # Expand to fill available horizontal space
    $TopBar/HealthLabel.size_flags_horizontal = Control.SIZE_EXPAND_FILL

    # Never collapse below 64x64
    $BottomBar/InventoryButton.custom_minimum_size = Vector2(64.0, 64.0)
```

**C#:**

```csharp
public override void _Ready()
{
    GetNode<Label>("TopBar/HealthLabel").SizeFlagsHorizontal = Control.SizeFlags.ExpandFill;
    GetNode<Button>("BottomBar/InventoryButton").CustomMinimumSize = new Vector2(64f, 64f);
}
```

### Detecting Resolution Changes

**GDScript:**

```gdscript
func _ready() -> void:
    get_viewport().size_changed.connect(_on_viewport_size_changed)


func _on_viewport_size_changed() -> void:
    var new_size: Vector2 = get_viewport().get_visible_rect().size
    _relayout(new_size)


func _relayout(size: Vector2) -> void:
    # Example: switch between side-by-side and stacked layout
    if size.x >= 1280.0:
        $SplitContainer.vertical = false   # wide layout
    else:
        $SplitContainer.vertical = true    # stacked layout
```

**C#:**

```csharp
public override void _Ready()
{
    GetViewport().SizeChanged += OnViewportSizeChanged;
}

private void OnViewportSizeChanged()
{
    Vector2 size = GetViewport().GetVisibleRect().Size;
    Relayout(size);
}

private void Relayout(Vector2 size)
{
    var split = GetNode<SplitContainer>("SplitContainer");
    split.Vertical = size.X < 1280f;
}
```

### Useful size_flags Values

| Constant | Behaviour in Container |
|---|---|
| `SIZE_SHRINK_BEGIN` | Align to start; take only minimum size |
| `SIZE_FILL` | Expand to fill available space without claiming extra |
| `SIZE_EXPAND` | Claim extra space from the container |
| `SIZE_EXPAND_FILL` | Claim extra space **and** fill it — most common for stretchy widgets |
| `SIZE_SHRINK_CENTER` | Centre within available space at minimum size |
| `SIZE_SHRINK_END` | Align to end; take only minimum size |

---

