---
name: godot-code-review
description: Use when reviewing GDScript or C# Godot code — checklist of best practices, common anti-patterns, and Godot-specific pitfalls. Triggers on "review this script", "check my code", "any issues with this", "what's wrong with this code", including a short pasted snippet.
---

# Godot Code Review

A structured review guide for Godot 4.3+ projects covering GDScript and C#. Work through each checklist section, then produce a review summary using the output template at the end.

> **Related skills:** **godot-testing** for TDD and test coverage, **scene-organization** for scene tree best practices, **godot-optimization** for performance review.

---

## 1. Node & Scene Architecture

- [ ] Each scene has a single, clear responsibility (player, enemy, UI widget, etc.)
- [ ] Inheritance chains are shallow — prefer composition via child nodes over deep `extends` hierarchies
- [ ] Autoloads (singletons) are used sparingly; only truly global state belongs there
- [ ] Node references traverse only to direct children — no `get_parent()` chains
- [ ] `@onready` (GDScript) or `GetNode<T>()` (C#) targets direct children or named paths within the same scene

### Anti-pattern — `get_parent()` chain

```gdscript
# BAD: tight coupling, breaks if the tree changes
func take_damage(amount: int) -> void:
    get_parent().get_parent().get_node("HUD").update_health(health)
```

```csharp
// BAD: tight coupling, breaks if the tree changes
public void TakeDamage(int amount)
{
    GetParent().GetParent().GetNode("HUD").Call("UpdateHealth", _health);
}
```

### Fix — emit a signal instead

```gdscript
# GOOD: parent/ancestor listens; child stays decoupled
signal health_changed(new_health: int)

func take_damage(amount: int) -> void:
    health -= amount
    health_changed.emit(health)
```

```csharp
// GOOD: parent/ancestor listens; child stays decoupled
[Signal]
public delegate void HealthChangedEventHandler(int newHealth);

public void TakeDamage(int amount)
{
    _health -= amount;
    EmitSignal(SignalName.HealthChanged, _health);
}
```

---

## 2. GDScript Style

- [ ] Variables and functions use `snake_case`
- [ ] Class names declared with `class_name` use `PascalCase`
- [ ] Constants use `SCREAMING_SNAKE_CASE`
- [ ] All function parameters and return types carry type hints
- [ ] `@export` variables include an explicit type
- [ ] Signal declarations appear at the top of the file, before variables

### Bad — untyped

```gdscript
var speed = 200
var health = 100

func move(direction):
    position += direction * speed

func heal(amount):
    health += amount
    return health
```

```csharp
// BAD: no explicit types, weak contracts
float speed = 200;
int health = 100;

public void Move(object direction)
{
    Position += (Vector2)direction * speed;
}

public object Heal(object amount)
{
    health += (int)amount;
    return health;
}
```

### Good — typed

```gdscript
class_name PlayerController
extends CharacterBody2D

signal health_changed(new_health: int)
signal player_died()

const MAX_HEALTH: int = 100
const BASE_SPEED: float = 200.0

@export var speed: float = BASE_SPEED
@export var max_health: int = MAX_HEALTH

var health: int = max_health

func move(direction: Vector2) -> void:
    velocity = direction * speed
    move_and_slide()

func heal(amount: int) -> int:
    health = mini(health + amount, max_health)
    health_changed.emit(health)
    return health
```

```csharp
// GOOD: strongly typed, proper C# conventions
public partial class PlayerController : CharacterBody2D
{
    [Signal]
    public delegate void HealthChangedEventHandler(int newHealth);
    [Signal]
    public delegate void PlayerDiedEventHandler();

    private const int MaxHealth = 100;
    private const float BaseSpeed = 200f;

    [Export] public float Speed { get; set; } = BaseSpeed;
    [Export] public int MaxHp { get; set; } = MaxHealth;

    private int _health;

    public override void _Ready()
    {
        _health = MaxHp;
    }

    public void Move(Vector2 direction)
    {
        Velocity = direction * Speed;
        MoveAndSlide();
    }

    public int Heal(int amount)
    {
        _health = Mathf.Min(_health + amount, MaxHp);
        EmitSignal(SignalName.HealthChanged, _health);
        return _health;
    }
}
```

---

## 3. C# Style

- [ ] Node scripts use `partial class` to allow Godot source generators to work
- [ ] Methods and properties use `PascalCase`; local variables use `camelCase`
- [ ] `[Export]` properties use `PascalCase`
- [ ] `[Signal]` delegates follow the `<EventName>EventHandler` naming pattern
- [ ] `GetNode<T>()` results are null-checked or cached in `_Ready()` and validated

```csharp
// GOOD
public partial class PlayerController : CharacterBody2D
{
    [Signal]
    public delegate void HealthChangedEventHandler(int newHealth);

    [Export] public float Speed { get; set; } = 200f;
    [Export] public int MaxHealth { get; set; } = 100;

    private int _health;
    private AnimationPlayer _animationPlayer = null!;

    public override void _Ready()
    {
        _animationPlayer = GetNode<AnimationPlayer>("AnimationPlayer");
        // Validate at startup rather than silently failing later
        if (_animationPlayer is null)
            GD.PushError("AnimationPlayer node not found on PlayerController");

        _health = MaxHealth;
    }

    public void TakeDamage(int amount)
    {
        _health = Mathf.Max(_health - amount, 0);
        EmitSignal(SignalName.HealthChanged, _health);
    }
}
```

---

## 4. Performance

- [ ] `get_node()` / `$NodePath` is never called inside `_process()` or `_physics_process()` — always cache with `@onready`
- [ ] `load()` is not called in hot paths — use `preload()` for compile-time loading or cache the result
- [ ] `_process()` is disabled (`set_process(false)`) when the node does not need per-frame updates
- [ ] `StringName` (or `&"string"` literal) is used for comparisons inside `_process()` or tight loops

### Anti-pattern — uncached node lookup in `_process()`

```gdscript
# BAD: get_node() traverses the tree every frame
func _process(delta: float) -> void:
    get_node("HUD/HealthBar").value = health
    get_node("HUD/Label").text = str(health)
```

```csharp
// BAD: GetNode() traverses the tree every frame
public override void _Process(double delta)
{
    GetNode<ProgressBar>("HUD/HealthBar").Value = _health;
    GetNode<Label>("HUD/Label").Text = _health.ToString();
}
```

### Fix — cache with `@onready`

```gdscript
# GOOD: resolved once at scene load
@onready var _health_bar: ProgressBar = $HUD/HealthBar
@onready var _health_label: Label = $HUD/Label

func _process(delta: float) -> void:
    _health_bar.value = health
    _health_label.text = str(health)
```

```csharp
// GOOD: resolved once in _Ready()
private ProgressBar _healthBar = null!;
private Label _healthLabel = null!;

public override void _Ready()
{
    _healthBar = GetNode<ProgressBar>("HUD/HealthBar");
    _healthLabel = GetNode<Label>("HUD/Label");
}

public override void _Process(double delta)
{
    _healthBar.Value = _health;
    _healthLabel.Text = _health.ToString();
}
```

### StringName in hot paths

```gdscript
# BAD: new String allocation compared each frame
if animation_name == "run":
    pass

# GOOD: StringName literal, no allocation
if animation_name == &"run":
    pass
```

```csharp
// BAD: allocates a new StringName each frame
if (animationName == "run") { }

// GOOD: cache StringName as a static field
private static readonly StringName RunAnim = new("run");

public override void _Process(double delta)
{
    if (animationName == RunAnim) { }
}
```

---

## 5. Input Handling

- [ ] All actions use Input Map names (Project > Project Settings > Input Map), not hardcoded key constants
- [ ] `_unhandled_input()` is preferred over `_input()` to allow UI controls to consume events first
- [ ] Continuous movement is driven by `Input.get_vector()` / `Input.is_action_pressed()` inside `_physics_process()`
- [ ] Discrete one-shot actions (jump, shoot) are handled in `_unhandled_input()`

```gdscript
# Continuous movement — physics process
func _physics_process(delta: float) -> void:
    var direction: Vector2 = Input.get_vector(
        &"ui_left", &"ui_right", &"ui_up", &"ui_down"
    )
    velocity = direction * speed
    move_and_slide()

# Discrete action — unhandled input
func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed(&"jump"):
        _jump()
```

```csharp
// Continuous movement — physics process
public override void _PhysicsProcess(double delta)
{
    Vector2 direction = Input.GetVector(
        "ui_left", "ui_right", "ui_up", "ui_down"
    );
    Velocity = direction * Speed;
    MoveAndSlide();
}

// Discrete action — unhandled input
public override void _UnhandledInput(InputEvent @event)
{
    if (@event.IsActionPressed("jump"))
    {
        Jump();
    }
}
```

---

## 6. Signals & Communication

- [ ] Signals travel **up** the tree (child emits, parent/ancestor connects); method calls go **down** (parent calls child method)
- [ ] Connections are established in `_ready()` or wired in the editor — not in `_process()` or one-off callbacks
- [ ] There are no circular signal dependencies between nodes
- [ ] Signal names use **past tense** to describe what happened

```gdscript
# Good signal names
signal health_changed(new_health: int)   # past tense
signal enemy_died()                       # past tense
signal item_collected(item: ItemData)     # past tense

# Bad signal names (present/imperative tense)
# signal update_health(value: int)
# signal die()
# signal collect_item(item: ItemData)
```

```csharp
// Good signal names — past tense, EventHandler suffix
[Signal]
public delegate void HealthChangedEventHandler(int newHealth);
[Signal]
public delegate void EnemyDiedEventHandler();
[Signal]
public delegate void ItemCollectedEventHandler(ItemData item);

// Bad signal names (present/imperative tense)
// public delegate void UpdateHealthEventHandler(int value);
// public delegate void DieEventHandler();
// public delegate void CollectItemEventHandler(ItemData item);
```

```gdscript
# Parent connects to child signal in _ready()
func _ready() -> void:
    $Enemy.enemy_died.connect(_on_enemy_died)
    $Player.health_changed.connect(_on_player_health_changed)
```

```csharp
// Parent connects to child signal in _Ready()
public override void _Ready()
{
    GetNode<Enemy>("Enemy").EnemyDied += OnEnemyDied;
    GetNode<Player>("Player").HealthChanged += OnPlayerHealthChanged;
}
```

---

## 7. Resource Management

- [ ] `preload()` is used for resources known at edit time (scenes, textures, audio); `load()` is used for paths resolved at runtime
- [ ] Large or level-specific resources loaded at runtime use `ResourceLoader.load_threaded_request()` to avoid frame stalls
- [ ] Dynamically instantiated nodes are freed with `queue_free()`, not `free()`, to avoid use-after-free crashes

```gdscript
# Compile-time — path is validated by the editor
const BULLET_SCENE: PackedScene = preload("res://scenes/bullet.tscn")

# Runtime — path comes from data
func _load_level(path: String) -> void:
    ResourceLoader.load_threaded_request(path)

func _check_load(path: String) -> void:
    if ResourceLoader.load_threaded_get_status(path) == ResourceLoader.THREAD_LOAD_LOADED:
        var scene: PackedScene = ResourceLoader.load_threaded_get(path)
        get_tree().change_scene_to_packed(scene)

# Cleanup
func _on_enemy_died() -> void:
    queue_free()   # safe — deferred until end of frame
```

```csharp
// Compile-time equivalent — load once in a static field or _Ready()
private static readonly PackedScene BulletScene =
    GD.Load<PackedScene>("res://scenes/bullet.tscn");

// Runtime — path comes from data
private void LoadLevel(string path)
{
    ResourceLoader.LoadThreadedRequest(path);
}

private void CheckLoad(string path)
{
    if (ResourceLoader.LoadThreadedGetStatus(path) == ResourceLoader.ThreadLoadStatus.Loaded)
    {
        var scene = ResourceLoader.LoadThreadedGet(path) as PackedScene;
        GetTree().ChangeSceneToPacked(scene);
    }
}

// Cleanup
private void OnEnemyDied()
{
    QueueFree(); // safe — deferred until end of frame
}
```

---

## 8. Error-Prone Patterns

| Pattern | Problem | Fix |
|---|---|---|
| `await get_tree().create_timer(t).timeout` after `queue_free()` (GDScript) | The freed node's coroutine is dropped silently: no error, and nothing after the `await` runs, so `is_instance_valid(self)` there never fires | Do must-run work before `queue_free()`; re-check *other* nodes with `is_instance_valid()` after `await`; use `create_tween()` for effects that should die with the node |
| Fragile node paths like `$A/B/C/D/E` | Breaks silently when the scene tree is reorganized | Refactor to direct children + signals, or export a `NodePath` |
| `call_deferred()` used everywhere | Defers are appropriate for cross-frame safety, not a general solution; overuse hides real design issues | Only defer when crossing physics/main thread boundaries or breaking a call cycle |
| `set_physics_process(true)` called inside `_physics_process()` | Redundant call every frame; wastes CPU | Call once at the point you actually want to enable/disable processing |
| Directly setting `position` on a `CharacterBody2D` | Bypasses collision; teleports the body and can cause tunnelling | Use `move_and_slide()` with `velocity`; only set `position`/`global_position` for intentional teleports |

---

## 9. Review Output Format

Use this template when delivering a review:

```
## Code Review — <FileName or Feature>

### Critical
Issues that will cause bugs, crashes, or significant performance problems.

- [ ] <node/line> — <issue> — **Suggested fix:** <fix>

### Improvements
Code quality, style, or maintainability concerns that should be addressed.

- [ ] <node/line> — <issue> — **Suggested fix:** <fix>

### Positive
What the code does well — reinforce good patterns.

- <observation>

---
Reviewed against: Godot 4.3+ best practices
```

### Example

```
## Code Review — PlayerController.gd

### Critical
- [ ] _process() line 42 — `get_node("HUD/HealthBar")` called every frame — **Suggested fix:** Cache with `@onready var _health_bar: ProgressBar = $HUD/HealthBar`
- [ ] take_damage() line 67 — no type hints on parameter or return — **Suggested fix:** `func take_damage(amount: int) -> void:`

### Improvements
- [ ] Line 12 — signal `updateHealth` should be past tense — **Suggested fix:** Rename to `health_changed`
- [ ] Line 8 — `var speed = 200` missing type hint — **Suggested fix:** `var speed: float = 200.0`

### Positive
- Signals are declared at the top of the file
- Constants correctly use SCREAMING_SNAKE_CASE
- `queue_free()` used correctly for cleanup

---
Reviewed against: Godot 4.3+ best practices
```
