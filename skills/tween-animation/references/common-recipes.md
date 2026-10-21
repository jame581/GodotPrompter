# Common Tween Recipes

Reference for `skills/tween-animation/SKILL.md` — fade in/out, UI panel slide, button press bounce, damage number popup, pulsing/breathing, screen shake, shader parameter animation.

> ← Back to [SKILL.md](../SKILL.md)

---
## 8. Common Recipes

### Fade In / Fade Out

```gdscript
func fade_in(node: CanvasItem, duration: float = 0.3) -> Tween:
    node.modulate.a = 0.0
    var tween := node.create_tween()
    tween.tween_property(node, "modulate:a", 1.0, duration)
    return tween

func fade_out_and_free(node: CanvasItem, duration: float = 0.3) -> void:
    var tween := node.create_tween()
    tween.tween_property(node, "modulate:a", 0.0, duration)
    tween.tween_callback(node.queue_free)
```

```csharp
public Tween FadeIn(CanvasItem node, float duration = 0.3f)
{
    node.Modulate = new Color(node.Modulate, 0.0f);
    var tween = node.CreateTween();
    tween.TweenProperty(node, "modulate:a", 1.0f, duration);
    return tween;
}

public void FadeOutAndFree(CanvasItem node, float duration = 0.3f)
{
    var tween = node.CreateTween();
    tween.TweenProperty(node, "modulate:a", 0.0f, duration);
    tween.TweenCallback(Callable.From(node.QueueFree));
}
```

### UI Panel Slide In / Out

```gdscript
func slide_in(panel: Control) -> void:
    var target_x := panel.position.x
    var tween := create_tween()
    tween.tween_property(panel, "position:x", target_x, 0.4) \
        .from(target_x - 300.0) \
        .set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)

func slide_out(panel: Control) -> void:
    var tween := create_tween()
    tween.tween_property(panel, "position:x", panel.position.x - 300.0, 0.3) \
        .set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN)
    tween.tween_callback(func(): panel.visible = false)
```

### Button Press Feedback (Scale Bounce)

```gdscript
func bounce_press(button: Control) -> void:
    var tween := button.create_tween()
    tween.tween_property(button, "scale", Vector2(0.9, 0.9), 0.05)
    tween.tween_property(button, "scale", Vector2(1.05, 1.05), 0.1) \
        .set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
    tween.tween_property(button, "scale", Vector2.ONE, 0.1)
```

```csharp
public void BouncePress(Control button)
{
    var tween = button.CreateTween();
    tween.TweenProperty(button, "scale", new Vector2(0.9f, 0.9f), 0.05f);
    tween.TweenProperty(button, "scale", new Vector2(1.05f, 1.05f), 0.1f)
        .SetTrans(Tween.TransitionType.Back).SetEase(Tween.EaseType.Out);
    tween.TweenProperty(button, "scale", Vector2.One, 0.1f);
}
```

### Damage Number Popup

```gdscript
func spawn_damage_number(value: int, pos: Vector2) -> void:
    var label := Label.new()
    label.text = str(value)
    label.position = pos
    label.z_index = 100
    add_child(label)

    var tween := label.create_tween().set_parallel(true)
    tween.tween_property(label, "position:y", pos.y - 50.0, 0.6) \
        .set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
    tween.tween_property(label, "modulate:a", 0.0, 0.4) \
        .set_delay(0.3)
    tween.chain().tween_callback(label.queue_free)
```

```csharp
public void SpawnDamageNumber(int value, Vector2 pos)
{
    var label = new Label();
    label.Text = value.ToString();
    label.Position = pos;
    label.ZIndex = 100;
    AddChild(label);

    var tween = label.CreateTween().SetParallel(true);
    tween.TweenProperty(label, "position:y", pos.Y - 50.0f, 0.6f)
        .SetTrans(Tween.TransitionType.Quad).SetEase(Tween.EaseType.Out);
    tween.TweenProperty(label, "modulate:a", 0.0f, 0.4f)
        .SetDelay(0.3f);
    tween.Chain().TweenCallback(Callable.From(label.QueueFree));
}
```

### Pulsing / Breathing Effect

```gdscript
func start_pulse(node: CanvasItem) -> void:
    var tween := node.create_tween().set_loops()
    tween.tween_property(node, "modulate:a", 0.4, 0.8) \
        .set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
    tween.tween_property(node, "modulate:a", 1.0, 0.8) \
        .set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
```

```csharp
public void StartPulse(CanvasItem node)
{
    var tween = node.CreateTween().SetLoops();
    tween.TweenProperty(node, "modulate:a", 0.4f, 0.8f)
        .SetTrans(Tween.TransitionType.Sine).SetEase(Tween.EaseType.InOut);
    tween.TweenProperty(node, "modulate:a", 1.0f, 0.8f)
        .SetTrans(Tween.TransitionType.Sine).SetEase(Tween.EaseType.InOut);
}
```

### Screen Shake

```gdscript
# On Camera2D
func shake(intensity: float = 8.0, duration: float = 0.3) -> void:
    var tween := create_tween().set_loops(int(duration / 0.04))
    tween.tween_property(self, "offset",
        Vector2(randf_range(-intensity, intensity), randf_range(-intensity, intensity)), 0.02)
    tween.tween_property(self, "offset",
        Vector2(randf_range(-intensity, intensity), randf_range(-intensity, intensity)), 0.02)
    tween.finished.connect(func(): offset = Vector2.ZERO)
```

> **Note:** Tween offsets are fixed at creation time, so each loop shakes to the same positions. For truly random per-frame shake, use `_process()` with a timer instead.

### Shader Parameter Animation

```gdscript
func dissolve(sprite: Sprite2D, duration: float = 1.0) -> void:
    var mat: ShaderMaterial = sprite.material
    var tween := create_tween()
    tween.tween_property(mat, "shader_parameter/dissolve_amount", 1.0, duration)
    tween.tween_callback(sprite.queue_free)
```

```csharp
public void Dissolve(Sprite2D sprite, float duration = 1.0f)
{
    var mat = sprite.Material as ShaderMaterial;
    var tween = CreateTween();
    tween.TweenProperty(mat, "shader_parameter/dissolve_amount", 1.0f, duration);
    tween.TweenCallback(Callable.From(sprite.QueueFree));
}
```

---

