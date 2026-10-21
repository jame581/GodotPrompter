# UI Signal Patterns

Reference for `skills/godot-ui/SKILL.md` — common Control signals (pressed, gui_input, mouse_entered/exited) and signal-driven UI updates.

> ← Back to [SKILL.md](../SKILL.md)

---
## 7. Signals

Common UI signals and the nodes that emit them:

| Signal | Node(s) | When emitted | Signature |
|---|---|---|---|
| `pressed` | `Button`, `LinkButton` | Mouse click or keyboard/gamepad confirm | `()` |
| `toggled` | `Button` (toggle mode), `CheckButton`, `CheckBox` | Toggle state changes | `(button_pressed: bool)` |
| `text_changed` | `LineEdit`, `TextEdit` | User edits text | `(new_text: String)` |
| `text_submitted` | `LineEdit` | User presses Enter | `(new_text: String)` |
| `value_changed` | `HSlider`, `VSlider`, `SpinBox`, `ScrollBar` | Value changes | `(value: float)` |
| `item_selected` | `OptionButton`, `ItemList` | User selects an item | `(index: int)` |
| `tab_changed` | `TabContainer`, `TabBar` | Active tab changes | `(tab: int)` |
| `visibility_changed` | `Control` (all) | `show()`/`hide()`/`visible` toggled | `()` |
| `mouse_entered` | `Control` (all) | Mouse cursor enters the node's rect | `()` |
| `mouse_exited` | `Control` (all) | Mouse cursor leaves the node's rect | `()` |
| `focus_entered` | `Control` (all) | Node receives focus | `()` |
| `focus_exited` | `Control` (all) | Node loses focus | `()` |
| `resized` | `Control` (all) | Node's `size` property changes | `()` |
| `gui_input` | `Control` (all) | Any `InputEvent` within the node's rect | `(event: InputEvent)` |

**Connecting signals in GDScript:**

```gdscript
func _ready() -> void:
    $StartButton.pressed.connect(_on_start_button_pressed)
    $VolumeSlider.value_changed.connect(_on_volume_slider_value_changed)
    $SearchField.text_changed.connect(_on_search_field_text_changed)

func _on_start_button_pressed() -> void:
    pass

func _on_volume_slider_value_changed(value: float) -> void:
    pass

func _on_search_field_text_changed(new_text: String) -> void:
    pass
```

**Connecting signals in C#:**

```csharp
public override void _Ready()
{
    GetNode<Button>("StartButton").Pressed += OnStartButtonPressed;
    GetNode<HSlider>("VolumeSlider").ValueChanged += OnVolumeSliderValueChanged;
    GetNode<LineEdit>("SearchField").TextChanged += OnSearchFieldTextChanged;
}

private void OnStartButtonPressed() { }
private void OnVolumeSliderValueChanged(double value) { }
private void OnSearchFieldTextChanged(string newText) { }
```

---

