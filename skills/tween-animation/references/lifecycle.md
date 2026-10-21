# Tween Lifecycle

Reference for `skills/tween-animation/SKILL.md` — kill/replace patterns, pause modes, speed scale, ignore time scale.

> ← Back to [SKILL.md](../SKILL.md)

---
## 7. Tween Lifecycle

### Killing and Replacing Tweens

```gdscript
var _move_tween: Tween

func move_to(target: Vector2) -> void:
    # Kill the previous tween if still running
    if _move_tween and _move_tween.is_valid():
        _move_tween.kill()

    _move_tween = create_tween()
    _move_tween.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
    _move_tween.tween_property(self, "position", target, 0.4)
```

```csharp
private Tween _moveTween;

public void MoveTo(Vector2 target)
{
    if (_moveTween != null && _moveTween.IsValid())
        _moveTween.Kill();

    _moveTween = CreateTween();
    _moveTween.SetTrans(Tween.TransitionType.Cubic).SetEase(Tween.EaseType.Out);
    _moveTween.TweenProperty(this, "position", target, 0.4f);
}
```

### Pause Mode

```gdscript
# Tween continues during SceneTree pause (for pause menu animations)
var tween := create_tween()
tween.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)

# Tween pauses when bound node's process_mode stops it (default)
tween.set_pause_mode(Tween.TWEEN_PAUSE_BOUND)
```

### Speed Scale

```gdscript
# Slow motion tween (half speed)
var tween := create_tween()
tween.set_speed_scale(0.5)

# Double speed
tween.set_speed_scale(2.0)
```

### Ignore Time Scale

```gdscript
# Tween runs at normal speed even when Engine.time_scale is changed
var tween := create_tween()
tween.set_ignore_time_scale()
```

---

