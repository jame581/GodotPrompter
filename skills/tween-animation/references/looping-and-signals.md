# Looping and Signals

Reference for `skills/tween-animation/SKILL.md` — `set_loops()`, `finished` / `step_finished` / `loop_finished` signals.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Looping & Signals

### Looping

```gdscript
# Loop forever (0 = infinite)
var tween := create_tween().set_loops()
tween.tween_property($Icon, "rotation", TAU, 2.0).as_relative()

# Loop 3 times
var tween2 := create_tween().set_loops(3)
tween2.tween_property($Sprite, "modulate:a", 0.3, 0.5)
tween2.tween_property($Sprite, "modulate:a", 1.0, 0.5)
```

```csharp
// Loop forever
var tween = CreateTween().SetLoops();
tween.TweenProperty(GetNode("Icon"), "rotation", Mathf.Tau, 2.0f).AsRelative();

// Loop 3 times
var tween2 = CreateTween().SetLoops(3);
tween2.TweenProperty(GetNode("Sprite"), "modulate:a", 0.3f, 0.5f);
tween2.TweenProperty(GetNode("Sprite"), "modulate:a", 1.0f, 0.5f);
```

### Signals

```gdscript
var tween := create_tween()
tween.tween_property(self, "position", Vector2(300, 200), 0.5)
tween.finished.connect(_on_tween_finished)

func _on_tween_finished() -> void:
    print("Tween complete!")
```

```csharp
var tween = CreateTween();
tween.TweenProperty(this, "position", new Vector2(300, 200), 0.5f);
tween.Finished += OnTweenFinished;

private void OnTweenFinished()
{
    GD.Print("Tween complete!");
}
```

| Signal                       | Fires When                                   |
|------------------------------|----------------------------------------------|
| `finished`                   | All tweeners complete (after final loop)     |
| `loop_finished(loop_count)`  | Each loop iteration completes                |
| `step_finished(idx)`         | Each individual tweener completes            |

---

