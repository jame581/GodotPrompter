# Systematic Debugging Method

Reference for `skills/godot-debugging/SKILL.md` — full 7-step method: Reproduce, Isolate, Hypothesis, Trace, Fix, Verify, Add a Test.

> ← Back to [SKILL.md](../SKILL.md)

---
## 7. Systematic Debugging Checklist

Follow these steps in order. Skipping ahead to "just try a fix" wastes time and often introduces new bugs.

### Step 1 — Reproduce

- Identify the exact steps that trigger the bug, every time.
- If it is intermittent, add logging around the suspected area and run until it occurs.
- Note the Godot version, build type (debug vs release), and platform.

```gdscript
# Add a counter to catch intermittent bugs
var _frame_of_crash := 0

func _process(_delta: float) -> void:
    _frame_of_crash = Engine.get_process_frames()

func _on_enemy_died() -> void:
    print("Enemy died at frame: ", _frame_of_crash)
```

```csharp
// Add a counter to catch intermittent bugs
private ulong _frameOfCrash = 0;

public override void _Process(double delta)
{
    _frameOfCrash = Engine.GetProcessFrames();
}

private void OnEnemyDied()
{
    GD.Print("Enemy died at frame: ", _frameOfCrash);
}
```

### Step 2 — Isolate

- Remove unrelated systems. Can you reproduce in a minimal scene with only the suspect nodes?
- Disable scripts one by one using `set_script(null)` or commenting out `_process` / `_physics_process`.
- Use binary search: disable half the code, see if the bug persists, then narrow further.

```gdscript
# Quick isolation — disable a node's script temporarily at runtime
func _ready() -> void:
    $SuspectNode.set_script(null)  # removes script, node becomes a plain Node
```

```csharp
// Quick isolation — disable a node's script temporarily at runtime
public override void _Ready()
{
    GetNode("SuspectNode").SetScript(default);
}
```

### Step 3 — Form a Hypothesis

- State the hypothesis explicitly: "I believe X causes Y because Z."
- Write it down. This prevents hypothesis drift during investigation.

### Step 4 — Trace

- Use breakpoints, `print()`, or the Profiler to confirm or refute the hypothesis.
- Print values immediately before and after the suspected line.
- Check signal connections with `get_signal_connection_list()`.
- Inspect the scene tree with `print_tree_pretty()`.

```gdscript
func take_damage(amount: int) -> void:
    print("[TRACE] take_damage called — amount: %d, health before: %d" % [amount, health])
    health -= amount
    print("[TRACE] health after: %d" % health)
    if health <= 0:
        die()
```

```csharp
public void TakeDamage(int amount)
{
    GD.Print($"[TRACE] TakeDamage called — amount: {amount}, health before: {_health}");
    _health -= amount;
    GD.Print($"[TRACE] health after: {_health}");
    if (_health <= 0)
        Die();
}
```

### Step 5 — Fix

- Make the smallest change that addresses the root cause.
- Do not fix symptoms; fix the underlying cause identified by the trace.
- If the fix requires touching multiple systems, consider whether a design change is needed.

### Step 6 — Verify

- Reproduce the original steps — confirm the bug is gone.
- Run any existing tests: `gut -gdir=res://tests` or `gdunit4_runner`.
- Check for regressions in related functionality.

```bash
# Run GUT tests headless
godot --headless --script res://addons/gut/gut_cmdln.gd -gdir=res://tests -gexit

# Run gdUnit4 tests headless
godot --headless -s res://addons/gdUnit4/bin/GdUnit4CmdTool.gd
```

### Step 7 — Add a Test

- Write a regression test that would have caught this bug.
- Name the test after the bug scenario so it serves as documentation.

```gdscript
# tests/unit/test_health_component.gd
func test_take_damage_does_not_go_below_zero_regression() -> void:
    # Regression: health could go negative when overkill damage was applied
    _health.take_damage(9999)
    assert_eq(_health.current_health, 0,
        "Health must clamp to 0, not go negative on overkill")
```

```csharp
// tests/HealthComponentTest.cs (using GdUnit4 or similar C# test framework)
[TestCase]
public void TakeDamage_DoesNotGoBelowZero_Regression()
{
    // Regression: health could go negative when overkill damage was applied
    _health.TakeDamage(9999);
    AssertThat(_health.CurrentHealth).IsEqual(0);
}
```

---

