---
name: tween-animation
description: Use when implementing tweens — property animation, method tweening, chaining, parallel sequences, easing, and common UI/gameplay motion recipes
---

# Tweens in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **animation-system** for AnimationPlayer/AnimationTree (keyframe-based), **godot-ui** for UI transitions, **shader-basics** for tweening shader parameters, **camera-system** for camera shake and transitions, **math-essentials** for easing curves and interpolation math, **particles-vfx** for code-driven VFX timing and sequencing.

---

## 1. Core Concepts

### Tween vs AnimationPlayer

| Feature         | Tween (code-driven)                        | AnimationPlayer (data-driven)              |
|-----------------|--------------------------------------------|--------------------------------------------|
| Setup           | Code only — no editor needed               | Animation panel with keyframes             |
| Best for        | Procedural motion, UI transitions, VFX     | Complex multi-track, artist-driven clips   |
| Reusability     | Recreated per use — lightweight            | Saved as resources, reusable across scenes |
| Blending        | No — one tween per property at a time      | Yes — AnimationTree supports blending      |
| Method calls    | `tween_callback()` at any point            | Call Method tracks at keyframed times      |

**Rule of thumb:** Use Tweens for one-off procedural animations (fade in, bounce, slide). Use AnimationPlayer for repeating, artist-tuned animations (walk cycle, attack sequence).

### Creating a Tween

Tweens are created from any `Node` and auto-bind to it. When the node is freed, the tween stops automatically.

```gdscript
# Creates a tween bound to this node
var tween := create_tween()
tween.tween_property(self, "position", Vector2(400, 300), 1.0)
```

```csharp
var tween = CreateTween();
tween.TweenProperty(this, "position", new Vector2(400, 300), 1.0f);
```

> **Important:** Each call to `create_tween()` creates a new tween. Previous tweens on the same property are **not** automatically killed — they compete. Kill old tweens before creating new ones on the same property if you don't want conflicts.

---

## 2. Tweener Types

### tween_property() — Animate any property

```gdscript
var tween := create_tween()
# Animate position over 0.5 seconds
tween.tween_property($Sprite2D, "position", Vector2(200, 100), 0.5)
# Animate modulate alpha (fade out)
tween.tween_property($Sprite2D, "modulate:a", 0.0, 0.3)
```

```csharp
var tween = CreateTween();
tween.TweenProperty(GetNode("Sprite2D"), "position", new Vector2(200, 100), 0.5);
tween.TweenProperty(GetNode("Sprite2D"), "modulate:a", 0.0f, 0.3);
```

**Sub-property access:** Use `:` to target individual components — `"position:x"`, `"modulate:a"`, `"scale:y"`.

### tween_callback() — Call a method at a point in the sequence

```gdscript
var tween := create_tween()
tween.tween_property(self, "position", Vector2.ZERO, 0.5)
tween.tween_callback(func(): print("Arrived!"))
tween.tween_callback(queue_free)
```

```csharp
var tween = CreateTween();
tween.TweenProperty(this, "position", Vector2.Zero, 0.5f);
tween.TweenCallback(Callable.From(() => GD.Print("Arrived!")));
tween.TweenCallback(Callable.From(QueueFree));
```

### tween_interval() — Wait/delay between steps

```gdscript
var tween := create_tween()
tween.tween_property(self, "modulate:a", 0.0, 0.3)  # fade out
tween.tween_interval(1.0)                             # wait 1 second
tween.tween_property(self, "modulate:a", 1.0, 0.3)  # fade back in
```

```csharp
var tween = CreateTween();
tween.TweenProperty(this, "modulate:a", 0.0f, 0.3);
tween.TweenInterval(1.0f);
tween.TweenProperty(this, "modulate:a", 1.0f, 0.3);
```

### tween_method() — Animate a custom method with interpolated values

```gdscript
# Animate a method that receives interpolated float values
func _ready() -> void:
    var tween := create_tween()
    tween.tween_method(_set_health_bar, 100.0, 0.0, 2.0)

func _set_health_bar(value: float) -> void:
    $HealthBar.value = value
    $HealthLabel.text = "%d%%" % int(value)
```

```csharp
public override void _Ready()
{
    var tween = CreateTween();
    tween.TweenMethod(Callable.From<float>(SetHealthBar), 100.0f, 0.0f, 2.0f);
}

private void SetHealthBar(float value)
{
    GetNode<ProgressBar>("HealthBar").Value = value;
    GetNode<Label>("HealthLabel").Text = $"{(int)value}%";
}
```

---

## 3. Sequencing — Chain vs Parallel

### Sequential (Default)

By default, tweeners run **sequentially** — each waits for the previous to finish.

```gdscript
var tween := create_tween()
tween.tween_property(self, "position:x", 300.0, 0.5)   # Step 1
tween.tween_property(self, "position:y", 200.0, 0.5)   # Step 2 (after Step 1)
tween.tween_property(self, "rotation", PI, 0.3)         # Step 3 (after Step 2)
```

### Parallel — Run tweeners simultaneously

#### Option 1: `set_parallel(true)` — All tweeners run at once

```gdscript
var tween := create_tween().set_parallel(true)
tween.tween_property(self, "position", Vector2(300, 200), 0.5)
tween.tween_property(self, "rotation", PI, 0.5)
tween.tween_property(self, "modulate:a", 0.5, 0.5)
```

```csharp
var tween = CreateTween().SetParallel(true);
tween.TweenProperty(this, "position", new Vector2(300, 200), 0.5f);
tween.TweenProperty(this, "rotation", Mathf.Pi, 0.5f);
tween.TweenProperty(this, "modulate:a", 0.5f, 0.5f);
```

#### Option 2: `chain()` — Switch back to sequential mid-tween

```gdscript
var tween := create_tween().set_parallel(true)
# These two run at the same time
tween.tween_property(self, "position", Vector2(300, 200), 0.5)
tween.tween_property(self, "scale", Vector2(2, 2), 0.5)
# Switch back to sequential for the next step
tween.chain().tween_property(self, "modulate:a", 0.0, 0.3)
tween.tween_callback(queue_free)
```

```csharp
var tween = CreateTween().SetParallel(true);
tween.TweenProperty(this, "position", new Vector2(300, 200), 0.5f);
tween.TweenProperty(this, "scale", new Vector2(2, 2), 0.5f);
tween.Chain().TweenProperty(this, "modulate:a", 0.0f, 0.3f);
tween.TweenCallback(Callable.From(QueueFree));
```

#### Option 3: `parallel()` — Make the next tweener parallel with the previous

```gdscript
var tween := create_tween()
tween.tween_property(self, "position", Vector2(300, 200), 0.5)
# This runs at the same time as position, not after
tween.parallel().tween_property(self, "rotation", PI, 0.5)
# This runs after both finish (back to sequential)
tween.tween_callback(func(): print("done"))
```

---

## 4. Easing & Transitions

### Setting Easing

```gdscript
var tween := create_tween()
# Set defaults for the entire tween
tween.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
tween.tween_property(self, "position", Vector2(400, 300), 0.6)
```

```csharp
var tween = CreateTween();
tween.SetTrans(Tween.TransitionType.Cubic).SetEase(Tween.EaseType.Out);
tween.TweenProperty(this, "position", new Vector2(400, 300), 0.6f);
```

### Per-Tweener Override

```gdscript
var tween := create_tween()
# This tweener uses bounce, overriding the tween default
tween.tween_property(self, "position:y", 0.0, 0.5) \
    .set_trans(Tween.TRANS_BOUNCE).set_ease(Tween.EASE_OUT)
```

```csharp
var tween = CreateTween();
tween.TweenProperty(this, "position:y", 0.0f, 0.5f)
    .SetTrans(Tween.TransitionType.Bounce)
    .SetEase(Tween.EaseType.Out);
```

### Transition Types

| Transition       | Character                              | Common Use                          |
|------------------|----------------------------------------|-------------------------------------|
| `TRANS_LINEAR`   | Constant speed                         | Progress bars, timers               |
| `TRANS_SINE`     | Gentle acceleration                    | Subtle UI animations                |
| `TRANS_QUAD`     | Moderate curve                         | General movement                    |
| `TRANS_CUBIC`    | Smooth curve                           | Most UI transitions                 |
| `TRANS_QUART`    | Strong curve                           | Dramatic entrances                  |
| `TRANS_QUINT`    | Very strong curve                      | Emphasis effects                    |
| `TRANS_EXPO`     | Exponential — sharp start/stop         | Snap-to-position                    |
| `TRANS_CIRC`     | Circular — smooth deceleration         | Natural motion                      |
| `TRANS_BACK`     | Overshoots target slightly             | Bouncy UI buttons                   |
| `TRANS_ELASTIC`  | Spring oscillation                     | Playful/cartoon effects             |
| `TRANS_BOUNCE`   | Bounces at the end                     | Dropping objects, landing           |

### Ease Types

| Ease          | Behavior                                |
|---------------|-----------------------------------------|
| `EASE_IN`     | Slow start, fast end                    |
| `EASE_OUT`    | Fast start, slow end (most natural)     |
| `EASE_IN_OUT` | Slow at both ends                       |
| `EASE_OUT_IN` | Fast at both ends (rarely used)         |

> **Most common combo:** `TRANS_CUBIC` + `EASE_OUT` for natural-feeling UI transitions. `TRANS_BACK` + `EASE_OUT` for playful bounce-in effects.

---

## 5. PropertyTweener Modifiers

Each `tween_property()` call returns a `PropertyTweener` you can chain modifiers on: `.from(value)` for a custom start, `.from_current()` to capture current value, `.as_relative()` to add (not replace), `.set_delay(seconds)` to delay this tweener's start.

> See [references/property-tweener-modifiers.md](references/property-tweener-modifiers.md) for full code examples of each modifier.

---

## 6. Looping and Signals

`tween.set_loops(N)` repeats N times (`0` = infinite). Signals: `finished` (whole tween done), `step_finished(idx)` (one step done), `loop_finished(loop_count)` (one full cycle done).

> See [references/looping-and-signals.md](references/looping-and-signals.md) for loop-count semantics and signal wiring.

---

## 7. Tween Lifecycle

Tweens are owned by their host SceneTree. Kill running tweens with `tween.kill()` before starting a new one to avoid stacking. Use `set_pause_mode`, `set_speed_scale`, `set_ignore_time_scale` for runtime control.

> See [references/lifecycle.md](references/lifecycle.md) for kill/replace patterns, pause modes, speed scale, ignore-time-scale.

### has_tweeners() (Godot 4.7+)

`Tween.has_tweeners()` (const) returns `true` if any `Tweener` has been added to the tween and the tween is valid — useful when tweeners are appended dynamically and the tween can end up empty. Killing an empty tween before it starts prevents errors.

```gdscript
var tween := create_tween()
_add_intro_steps(tween)  # may append zero tweeners
if not tween.has_tweeners():
    tween.kill()
```

```csharp
var tween = CreateTween();
AddIntroSteps(tween); // may append zero tweeners
if (!tween.HasTweeners())
    tween.Kill();
```

---

## 8. Common Recipes

The patterns most projects need: fade in/out, UI panel slide in/out, button press bounce, damage number popup, pulsing/breathing effect, screen shake, shader parameter animation.

> See [references/common-recipes.md](references/common-recipes.md) for ready-to-use code for each recipe.

---

## 9. Common Pitfalls

| Symptom                             | Cause                                            | Fix                                                                |
|-------------------------------------|---------------------------------------------------|--------------------------------------------------------------------|
| Tween jumps or jitters              | Multiple tweens competing on the same property    | Kill the old tween before creating a new one                       |
| Tween does nothing                  | Node was freed before tween finished              | Check `is_valid()` or use `tween_callback` instead of `await`      |
| Tween runs during pause             | Default pause mode doesn't match expectation      | Set `set_pause_mode(TWEEN_PAUSE_PROCESS)` for pause-immune tweens  |
| `from()` value ignored              | Called after `set_parallel()` changed ordering    | Call `from()` directly on the PropertyTweener, not on the Tween    |
| Tween doesn't loop smoothly         | End value doesn't match start for seamless loop   | Use `as_relative()` for rotation, or match start/end values        |
| Relative tween drifts over loops    | `as_relative()` accumulates each loop             | Use absolute values for looping; relative for one-shot moves       |
| Callback fires at wrong time        | Callback added to parallel section                | Use `chain()` to switch back to sequential before the callback     |
| Tween property path not found       | Typo or wrong path format                         | Use `"property:component"` — e.g., `"position:x"`, `"modulate:a"` |
| Tween faster/slower than expected   | `Engine.time_scale` affects tween                 | Use `set_ignore_time_scale()` for UI tweens during slow-mo         |

---

## 10. Implementation Checklist

- [ ] Old tweens are killed before creating new ones on the same property
- [ ] Tween references are stored in variables when they need to be killed later
- [ ] Easing is set (`TRANS_CUBIC` + `EASE_OUT` for natural motion, not default `TRANS_LINEAR`)
- [ ] `set_parallel(true)` is used when multiple properties should animate simultaneously
- [ ] `chain()` is used to switch back to sequential after parallel sections
- [ ] `from()` or `from_current()` is used when the start value matters (not just the end value)
- [ ] `as_relative()` is used for incremental movement instead of computing absolute targets
- [ ] Looping tweens use `set_loops()` — not manual recreation
- [ ] Tweens that must run during pause use `set_pause_mode(TWEEN_PAUSE_PROCESS)`
- [ ] `tween_callback(queue_free)` is used at the end of fire-and-forget sequences (damage numbers, particles)
