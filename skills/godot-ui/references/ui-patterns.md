# Common UI Patterns

Reference for `skills/godot-ui/SKILL.md` — main menu scene, settings screen with tabs, pause menu overlay. Full GDScript implementations.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Common UI Patterns

### Main Menu Scene Tree

```
MainMenu (Control — LayoutPreset: Full Rect)
└── Background (TextureRect — stretch: EXPAND_FIT, anchor: Full Rect)
└── CenterContainer (anchor: Full Rect)
    └── VBoxContainer
        ├── TitleLabel (Label)
        ├── StartButton (Button)
        ├── OptionsButton (Button)
        └── QuitButton (Button)
```

**GDScript:**

```gdscript
# scenes/screens/main_menu.gd
extends Control

func _ready() -> void:
    $CenterContainer/VBoxContainer/StartButton.grab_focus()

func _on_start_button_pressed() -> void:
    GameManager.change_scene("res://scenes/levels/level_01.tscn")

func _on_options_button_pressed() -> void:
    # Replace with your options screen path or overlay
    GameManager.change_scene("res://scenes/screens/options.tscn")

func _on_quit_button_pressed() -> void:
    get_tree().quit()
```

**C#:**

```csharp
// scenes/screens/MainMenu.cs
using Godot;

public partial class MainMenu : Control
{
    public override void _Ready()
    {
        GetNode<Button>("CenterContainer/VBoxContainer/StartButton").GrabFocus();
    }

    private void OnStartButtonPressed() =>
        GameManager.Instance.ChangeScene("res://scenes/levels/level_01.tscn");

    private void OnOptionsButtonPressed() =>
        GameManager.Instance.ChangeScene("res://scenes/screens/options.tscn");

    private void OnQuitButtonPressed() =>
        GetTree().Quit();
}
```

---

### Settings Screen with Tabs

```
OptionsScreen (Control — anchor: Full Rect)
└── PanelContainer (anchor: Full Rect)
    └── VBoxContainer
        ├── TitleLabel (Label — text: "Settings")
        ├── TabContainer
        │   ├── AudioTab (VBoxContainer — name: "Audio")
        │   │   ├── HBoxContainer
        │   │   │   ├── Label (text: "Master Volume")
        │   │   │   └── MasterSlider (HSlider)
        │   │   ├── HBoxContainer
        │   │   │   ├── Label (text: "Music Volume")
        │   │   │   └── MusicSlider (HSlider)
        │   │   └── HBoxContainer
        │   │       ├── Label (text: "SFX Volume")
        │   │       └── SFXSlider (HSlider)
        │   └── VideoTab (VBoxContainer — name: "Video")
        │       ├── HBoxContainer
        │       │   ├── Label (text: "Fullscreen")
        │       │   └── FullscreenCheck (CheckButton)
        │       └── HBoxContainer
        │           ├── Label (text: "Resolution")
        │           └── ResolutionOptions (OptionButton)
        └── CloseButton (Button — text: "Close")
```

**GDScript:**

```gdscript
# scenes/screens/options_screen.gd
extends Control

func _ready() -> void:
    var master_bus := AudioServer.get_bus_index("Master")
    $PanelContainer/VBoxContainer/TabContainer/AudioTab/HBoxContainer/MasterSlider.value = \
        db_to_linear(AudioServer.get_bus_volume_db(master_bus))

func _on_master_slider_value_changed(value: float) -> void:
    AudioServer.set_bus_volume_db(
        AudioServer.get_bus_index("Master"),
        linear_to_db(value)
    )

func _on_fullscreen_check_toggled(button_pressed: bool) -> void:
    DisplayServer.window_set_mode(
        DisplayServer.WINDOW_MODE_FULLSCREEN if button_pressed
        else DisplayServer.WINDOW_MODE_WINDOWED
    )

func _on_close_button_pressed() -> void:
    queue_free()   # or hide() if you want to keep state
```

**C#:**

```csharp
// scenes/screens/OptionsScreen.cs
using Godot;

public partial class OptionsScreen : Control
{
    public override void _Ready()
    {
        int masterBus = AudioServer.GetBusIndex("Master");
        var slider = GetNode<HSlider>(
            "PanelContainer/VBoxContainer/TabContainer/AudioTab/HBoxContainer/MasterSlider");
        slider.Value = Mathf.DbToLinear(AudioServer.GetBusVolumeDb(masterBus));
    }

    private void OnMasterSliderValueChanged(float value)
    {
        AudioServer.SetBusVolumeDb(
            AudioServer.GetBusIndex("Master"),
            Mathf.LinearToDb(value));
    }

    private void OnFullscreenCheckToggled(bool buttonPressed)
    {
        DisplayServer.WindowSetMode(buttonPressed
            ? DisplayServer.WindowMode.Fullscreen
            : DisplayServer.WindowMode.Windowed);
    }

    private void OnCloseButtonPressed() => QueueFree();
}
```

---

### Pause Menu Overlay

The pause menu lives in its own scene that is added to the tree at runtime. Set the root `Control`'s `process_mode` to `PROCESS_MODE_ALWAYS` so it continues running while the tree is paused.

```
PauseMenu (Control — anchor: Full Rect, process_mode: Always)
└── ColorRect (anchor: Full Rect, color: Color(0,0,0,0.6))
└── CenterContainer (anchor: Full Rect)
    └── PanelContainer
        └── VBoxContainer
            ├── Label (text: "Paused")
            ├── ResumeButton (Button)
            ├── OptionsButton (Button)
            └── QuitToMenuButton (Button)
```

**GDScript:**

```gdscript
# scenes/ui/pause_menu.gd
extends Control

func _ready() -> void:
    # Ensure this node and all children keep processing while paused
    process_mode = Node.PROCESS_MODE_ALWAYS
    $CenterContainer/PanelContainer/VBoxContainer/ResumeButton.grab_focus()

func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("ui_cancel"):
        _on_resume_button_pressed()

func _on_resume_button_pressed() -> void:
    get_tree().paused = false
    queue_free()

func _on_options_button_pressed() -> void:
    var options := preload("res://scenes/screens/options_screen.tscn").instantiate()
    add_child(options)

func _on_quit_to_menu_button_pressed() -> void:
    get_tree().paused = false
    GameManager.change_scene("res://scenes/screens/main_menu.tscn")
```

**C#:**

```csharp
// scenes/ui/PauseMenu.cs
using Godot;

public partial class PauseMenu : Control
{
    public override void _Ready()
    {
        ProcessMode = ProcessModeEnum.Always;
        GetNode<Button>(
            "CenterContainer/PanelContainer/VBoxContainer/ResumeButton").GrabFocus();
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event.IsActionPressed("ui_cancel"))
            OnResumeButtonPressed();
    }

    private void OnResumeButtonPressed()
    {
        GetTree().Paused = false;
        QueueFree();
    }

    private void OnOptionsButtonPressed()
    {
        var options = GD.Load<PackedScene>("res://scenes/screens/options_screen.tscn").Instantiate();
        AddChild(options);
    }

    private void OnQuitToMenuButtonPressed()
    {
        GetTree().Paused = false;
        GameManager.Instance.ChangeScene("res://scenes/screens/main_menu.tscn");
    }
}
```

**Toggling the pause menu from game code (GDScript):**

```gdscript
# In your GameManager or a player HUD script
var _pause_menu_scene := preload("res://scenes/ui/pause_menu.tscn")
var _pause_menu: Control = null

func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_just_pressed("ui_cancel"):
        if get_tree().paused:
            return  # PauseMenu handles its own resume
        _pause_menu = _pause_menu_scene.instantiate()
        get_tree().root.add_child(_pause_menu)
        get_tree().paused = true
```

---


## Godot 4.7 Additions

### Control Offset Transform (Godot 4.7+)

The `offset_transform_*` properties apply a visual transform on top of the resolved layout without moving the layout rect — ideal for UI juice (shake, pulse) that must not re-trigger container layout. Enable with `offset_transform_enabled = true` (default `false`), then drive:

| Property | Default | Purpose |
|---|---|---|
| `offset_transform_position` / `offset_transform_position_ratio` | `Vector2(0, 0)` / `Vector2(0, 0)` | Position offset in absolute pixels / relative to the control's `size`; the final offset combines both |
| `offset_transform_rotation` | `0.0` | Rotation offset around the pivot |
| `offset_transform_scale` | `Vector2(1, 1)` | Scale offset around the pivot |
| `offset_transform_pivot` | `Vector2(0, 0)` | Pivot for rotation/scale in absolute pixels; combined with the ratio pivot |
| `offset_transform_pivot_ratio` | `Vector2(0.5, 0.5)` | Pivot relative to the control's `size` (`(0, 0)` top-left, `(1, 1)` bottom-right; default is the center) |
| `offset_transform_visual_only` | `true` | If `true`, input events still register at the control's original location; if `false`, input follows the visual transform |

**GDScript:**

```gdscript
# Punch-scale a button without disturbing its container siblings
func punch(button: Button) -> void:
    button.offset_transform_enabled = true
    var tween := create_tween()
    tween.tween_property(button, "offset_transform_scale", Vector2(1.15, 1.15), 0.08)
    tween.tween_property(button, "offset_transform_scale", Vector2.ONE, 0.15)
```

**C#:**

```csharp
public void Punch(Button button)
{
    button.OffsetTransformEnabled = true;
    Tween tween = CreateTween();
    tween.TweenProperty(button, "offset_transform_scale", new Vector2(1.15f, 1.15f), 0.08);
    tween.TweenProperty(button, "offset_transform_scale", Vector2.One, 0.15);
}
```

Introduced in [GH-87081](https://github.com/godotengine/godot/pull/87081).

### Per-Position Cursor Shape (Godot 4.7+)

Override the `Control._get_cursor_shape(at_position: Vector2) -> int` virtual (const) to return the cursor shape for a position in the control's local coordinates while hovering. Used by `get_cursor_shape()`; falls back to the static `mouse_default_cursor_shape` when not overridden ([GH-111819](https://github.com/godotengine/godot/pull/111819)).

**GDScript:**

```gdscript
# Show a horizontal-resize cursor on a panel's right edge
func _get_cursor_shape(at_position: Vector2) -> int:
    if at_position.x > size.x - 8.0:
        return Control.CURSOR_HSIZE
    return Control.CURSOR_ARROW
```

**C#:**

```csharp
public override int _GetCursorShape(Vector2 atPosition)
{
    if (atPosition.X > Size.X - 8f)
        return (int)Control.CursorShape.Hsize;
    return (int)Control.CursorShape.Arrow;
}
```

### PopupMenu Search Bar (Godot 4.7+)

`PopupMenu` gains a built-in filter bar and item reordering ([GH-114236](https://github.com/godotengine/godot/pull/114236)). When the bar is enabled, `allow_search` (keyboard type-ahead) is ignored.

**GDScript:**

```gdscript
popup_menu.search_bar_enabled = true              # default false
popup_menu.search_bar_fuzzy_search_enabled = true # default true — near-matches allowed
popup_menu.search_bar_fuzzy_search_max_misses = 2 # default 2 — max mismatches per result
popup_menu.search_bar_min_item_count = 20         # default 0 — bar shows only at >= 20 items (separators not counted)
popup_menu.set_item_index(3, 0)                   # move item 3 to the top
```

**C#:**

```csharp
popupMenu.SearchBarEnabled = true;
popupMenu.SearchBarFuzzySearchEnabled = true;
popupMenu.SearchBarFuzzySearchMaxMisses = 2;
popupMenu.SearchBarMinItemCount = 20;
popupMenu.SetItemIndex(3, 0);
```

### TextureRect Atlas Tiling (Godot 4.7+)

`TextureRect.STRETCH_TILE` now supports `AtlasTexture` textures — only an `AtlasTexture` with a non-zero `margin` remains unsupported (previously tiling an `AtlasTexture` was unsupported outright, [GH-113808](https://github.com/godotengine/godot/pull/113808)).
