# GodotPrompter Phase 1 (MVP) Implementation Plan

**Status:** shipped in v1.0.0 (2026-04-06)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the 7 remaining Phase 1 skills for GodotPrompter, covering project setup, testing, code review, scene organization, state machines, player controllers, and save/load systems.

**Architecture:** Each skill is an independent markdown document at `skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`). Skills use Claude Code tool names as canonical, provide both GDScript and C# examples (GDScript first), and target Godot 4.3+ minimum. No deprecated APIs.

**Tech Stack:** Markdown with YAML frontmatter. Godot 4.3+ API (GDScript + C#). Testing frameworks: GUT and gdUnit4.

---

## File Map

All files are new creations under the existing `skills/` directory:

| File | Responsibility |
|------|---------------|
| `skills/godot-project-setup/SKILL.md` | Project scaffolding — directory structure, project.godot settings, autoloads, .gitignore |
| `skills/godot-testing/SKILL.md` | TDD workflow with GUT and gdUnit4 — test structure, assertions, mocking, running |
| `skills/godot-testing/gut-reference.md` | GUT-specific API reference and patterns |
| `skills/godot-testing/gdunit4-reference.md` | gdUnit4-specific API reference and patterns |
| `skills/godot-code-review/SKILL.md` | Code review checklist — GDScript/C# best practices, Godot anti-patterns |
| `skills/scene-organization/SKILL.md` | Scene tree patterns — composition, inheritance, when to split scenes |
| `skills/state-machine/SKILL.md` | FSM patterns — enum-based, node-based, resource-based with trade-offs |
| `skills/player-controller/SKILL.md` | CharacterBody2D/3D movement — input handling, physics, common patterns |
| `skills/save-load/SKILL.md` | Serialization — ConfigFile, JSON, Resources, save game architecture |

---

### Task 1: godot-project-setup skill

**Files:**
- Create: `skills/godot-project-setup/SKILL.md`

- [ ] **Step 1: Create SKILL.md with frontmatter and overview**

```markdown
---
name: godot-project-setup
description: Use when creating a new Godot 4.x project — scaffolds recommended directory structure, project settings, autoloads, and .gitignore
---

# Godot Project Setup

Scaffold a well-organized Godot 4.x project from scratch. This skill guides you through creating the directory structure, configuring project settings, and setting up essential autoloads.

## When to Use

- Starting a new Godot project
- Restructuring an existing project
- Setting up a project template

## Directory Structure

The recommended project layout:

```
project_root/
  project.godot
  .gitignore
  .gitattributes
  assets/
    audio/
      music/
      sfx/
    fonts/
    sprites/
      characters/
      environment/
      ui/
    models/            # 3D projects only
    materials/         # 3D projects only
    shaders/
  scenes/
    characters/
    environment/
    ui/
    levels/
    autoload/
  scripts/
    characters/
    environment/
    ui/
    resources/
    autoload/
  addons/              # Third-party plugins
  export/              # Export presets (gitignored)
```

### Why This Structure

- `assets/` separates art, audio, and data from code — artists and programmers work in different directories
- `scenes/` and `scripts/` mirror each other — `scenes/characters/player.tscn` pairs with `scripts/characters/player.gd`
- `autoload/` under both `scenes/` and `scripts/` — autoloads are global singletons, keep them separate from scene-specific code
- `export/` is gitignored — build artifacts don't belong in version control

### Alternative: Co-located Structure

For smaller projects, co-locate scenes and scripts:

```
project_root/
  project.godot
  entities/
    player/
      player.tscn
      player.gd
      player_sprite.png
    enemy/
      enemy.tscn
      enemy.gd
  ui/
    hud/
      hud.tscn
      hud.gd
  autoload/
  addons/
```

**Trade-off:** Easier to find related files, but harder to manage in larger projects with many assets.

## .gitignore

```gitignore
# Godot 4.x
.godot/

# Export
export/
*.pck
*.zip

# Mono/C#
.mono/
data_*/
mono_crash.*.json

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
```

## .gitattributes

```gitattributes
# Normalize line endings
*.gd text eol=lf
*.tscn text eol=lf
*.tres text eol=lf
*.godot text eol=lf
*.cfg text eol=lf

# Binary assets
*.png binary
*.jpg binary
*.jpeg binary
*.webp binary
*.svg binary
*.ogg binary
*.wav binary
*.mp3 binary
*.glb binary
*.gltf binary
*.fbx binary
*.ttf binary
*.otf binary
*.woff binary
*.woff2 binary
```

## Project Settings (project.godot)

Key settings to configure for new projects:

### Display
- **Viewport Width/Height:** Set to your target resolution (e.g., 1920x1080, 640x360 for pixel art)
- **Stretch Mode:** `canvas_items` for 2D, `viewport` for pixel-perfect
- **Stretch Aspect:** `keep` for fixed aspect, `expand` for flexible

### Input Map
Define actions early rather than using hardcoded key checks:

**GDScript:**
```gdscript
# Bad — hardcoded
if Input.is_key_pressed(KEY_SPACE):
    jump()

# Good — action-based
if Input.is_action_just_pressed("jump"):
    jump()
```

**C#:**
```csharp
// Bad — hardcoded
if (Input.IsKeyPressed(Key.Space))
    Jump();

// Good — action-based
if (Input.IsActionJustPressed("jump"))
    Jump();
```

### Autoloads

Register global singletons in Project Settings > Autoload:

**Common autoloads for new projects:**

| Name | Purpose | Example |
|------|---------|---------|
| `GameManager` | Game state, scene transitions | `scripts/autoload/game_manager.gd` |
| `EventBus` | Global signal hub | `scripts/autoload/event_bus.gd` |
| `AudioManager` | Music/SFX playback | `scripts/autoload/audio_manager.gd` |
| `SaveManager` | Save/load coordination | `scripts/autoload/save_manager.gd` |

**GDScript — minimal GameManager autoload:**
```gdscript
extends Node

var current_level: int = 0
var is_paused: bool = false

func change_scene(scene_path: String) -> void:
    get_tree().change_scene_to_file(scene_path)

func quit_game() -> void:
    get_tree().quit()
```

**C# — minimal GameManager autoload:**
```csharp
using Godot;

public partial class GameManager : Node
{
    public int CurrentLevel { get; set; } = 0;
    public bool IsPaused { get; set; } = false;

    public void ChangeScene(string scenePath)
    {
        GetTree().ChangeSceneToFile(scenePath);
    }

    public void QuitGame()
    {
        GetTree().Quit();
    }
}
```

## C# Project Setup

When using C# with Godot:

1. Create a `.csproj` via Project > Tools > C# > Create C# Solution
2. The `.csproj` is auto-managed by Godot — don't edit manually unless adding NuGet packages
3. Add `.mono/` and `data_*/` to `.gitignore`
4. Use `partial class` for all node scripts (required by Godot source generators)
5. Match the C# namespace to your project name

## Checklist

When the agent scaffolds a new project, verify:

- [ ] `project.godot` exists with correct display settings
- [ ] Directory structure created per chosen layout
- [ ] `.gitignore` includes `.godot/`, export artifacts, and IDE files
- [ ] `.gitattributes` normalizes text files and marks binaries
- [ ] Input actions defined (not hardcoded keys)
- [ ] At least `GameManager` autoload created
- [ ] If C#: solution created, `partial class` used, `.mono/` gitignored
```

- [ ] **Step 2: Verify the file is well-formed**

Run: `head -5 skills/godot-project-setup/SKILL.md`
Expected: YAML frontmatter with `name: godot-project-setup`

- [ ] **Step 3: Commit**

```bash
git add skills/godot-project-setup/SKILL.md
git commit -m "feat: add godot-project-setup skill

Covers directory structure (split and co-located), .gitignore,
.gitattributes, project settings, autoloads, and C# setup."
```

---

### Task 2: godot-testing skill

**Files:**
- Create: `skills/godot-testing/SKILL.md`
- Create: `skills/godot-testing/gut-reference.md`
- Create: `skills/godot-testing/gdunit4-reference.md`

- [ ] **Step 1: Create SKILL.md with frontmatter and TDD workflow**

```markdown
---
name: godot-testing
description: Use when writing tests for Godot projects — TDD workflow with GUT and gdUnit4, covers both GDScript and C#
---

# Godot Testing

Test-driven development for Godot 4.x using GUT (GDScript) or gdUnit4 (GDScript + C#). This skill guides test structure, assertions, mocking, and CI integration.

## When to Use

- Writing new gameplay logic, systems, or utilities
- Fixing bugs (write the failing test first)
- Refactoring existing code
- Setting up CI test pipelines

## Framework Selection

| Criteria | GUT | gdUnit4 |
|----------|-----|---------|
| Language | GDScript only | GDScript + C# |
| Install | AssetLib or GitHub | AssetLib or GitHub |
| Editor Integration | Dock panel | Dock panel + InspectorPlugin |
| Mocking | Built-in `double()` | Built-in `mock()` + `spy()` |
| Scene Testing | `add_child_autofree()` | `auto_free()` runner |
| CI Support | CLI runner | CLI runner |
| Maturity | Stable, widely used | Active development, feature-rich |

**Recommendation:** Use GUT for GDScript-only projects. Use gdUnit4 if you need C# testing or advanced mocking.

## TDD Workflow in Godot

### 1. RED — Write a Failing Test

**GDScript (GUT):**
```gdscript
# tests/test_health_component.gd
extends GutTest

func test_take_damage_reduces_health() -> void:
    var health = HealthComponent.new()
    health.max_health = 100
    health.current_health = 100

    health.take_damage(25)

    assert_eq(health.current_health, 75, "Health should be reduced by damage amount")
```

**C# (gdUnit4):**
```csharp
// tests/HealthComponentTest.cs
using Godot;
using GdUnit4;
using static GdUnit4.Assertions;

[TestSuite]
public partial class HealthComponentTest
{
    [TestCase]
    public void TakeDamageReducesHealth()
    {
        var health = new HealthComponent();
        health.MaxHealth = 100;
        health.CurrentHealth = 100;

        health.TakeDamage(25);

        AssertInt(health.CurrentHealth).IsEqual(75);
    }
}
```

### 2. GREEN — Write Minimal Implementation

**GDScript:**
```gdscript
# scripts/components/health_component.gd
class_name HealthComponent
extends Node

@export var max_health: int = 100
var current_health: int = 100

func take_damage(amount: int) -> void:
    current_health -= amount
```

**C#:**
```csharp
using Godot;

public partial class HealthComponent : Node
{
    [Export] public int MaxHealth { get; set; } = 100;
    public int CurrentHealth { get; set; } = 100;

    public void TakeDamage(int amount)
    {
        CurrentHealth -= amount;
    }
}
```

### 3. REFACTOR — Improve Without Changing Behavior

```gdscript
func take_damage(amount: int) -> void:
    current_health = maxi(current_health - amount, 0)
```

Run tests again — still green.

## Test Directory Structure

```
tests/
  test_health_component.gd      # GUT: prefix with test_
  HealthComponentTest.cs         # gdUnit4 C#: suffix with Test
  test_inventory.gd
  test_save_manager.gd
```

- GUT convention: `test_` prefix on files and methods
- gdUnit4 convention: `Test` suffix on classes, `[TestCase]` attribute on methods
- Mirror your `scripts/` structure under `tests/`

## Running Tests

### GUT — Command Line
```bash
# Run all tests
godot --headless -s addons/gut/gut_cmdln.gd

# Run specific test file
godot --headless -s addons/gut/gut_cmdln.gd -gtest=res://tests/test_health_component.gd

# Run specific test method
godot --headless -s addons/gut/gut_cmdln.gd -gtest=res://tests/test_health_component.gd -gunit_test_name=test_take_damage_reduces_health
```

### gdUnit4 — Command Line
```bash
# Run all tests
godot --headless -s addons/gdUnit4/bin/GdUnitCmdTool.gd --add res://tests

# Run specific test
godot --headless -s addons/gdUnit4/bin/GdUnitCmdTool.gd --add res://tests/test_health_component.gd
```

### CI — GitHub Actions

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: chickensoft-games/setup-godot@v2
        with:
          version: 4.3.0
          use-dotnet: false  # set true for C#
      - name: Run GUT tests
        run: godot --headless -s addons/gut/gut_cmdln.gd --should_exit
```

## Testing Patterns

### Testing Scenes with Nodes

**GUT:**
```gdscript
func test_player_starts_at_origin() -> void:
    var player = preload("res://scenes/characters/player.tscn").instantiate()
    add_child_autofree(player)

    assert_eq(player.global_position, Vector2.ZERO)
```

**gdUnit4 (GDScript):**
```gdscript
func test_player_starts_at_origin() -> void:
    var player = auto_free(load("res://scenes/characters/player.tscn").instantiate())
    add_child(player)

    assert_that(player.global_position).is_equal(Vector2.ZERO)
```

### Testing Signals

**GUT:**
```gdscript
func test_health_emits_died_signal() -> void:
    var health = HealthComponent.new()
    add_child_autofree(health)
    health.max_health = 10
    health.current_health = 10
    watch_signals(health)

    health.take_damage(10)

    assert_signal_emitted(health, "died")
```

**gdUnit4 (C#):**
```csharp
[TestCase]
public void HealthEmitsDiedSignal()
{
    var health = AutoFree(new HealthComponent());
    AddChild(health);
    health.MaxHealth = 10;
    health.CurrentHealth = 10;

    health.TakeDamage(10);

    AssertSignal(health).IsEmitted("Died");
}
```

### Mocking Dependencies

**GUT:**
```gdscript
func test_enemy_uses_navigation() -> void:
    var enemy = preload("res://scenes/characters/enemy.tscn").instantiate()
    var nav_mock = double(NavigationAgent2D).new()
    stub(nav_mock, "get_next_path_position").to_return(Vector2(100, 0))

    add_child_autofree(enemy)
    enemy.nav_agent = nav_mock

    enemy.update_movement()
    assert_called(nav_mock, "get_next_path_position")
```

## Common Assertions

### GUT
| Assertion | Purpose |
|-----------|---------|
| `assert_eq(a, b)` | Equality |
| `assert_ne(a, b)` | Inequality |
| `assert_gt(a, b)` | Greater than |
| `assert_lt(a, b)` | Less than |
| `assert_true(x)` | Boolean true |
| `assert_null(x)` | Is null |
| `assert_not_null(x)` | Not null |
| `assert_signal_emitted(obj, sig)` | Signal was emitted |
| `assert_almost_eq(a, b, tol)` | Float near-equality |

### gdUnit4
| Assertion | Purpose |
|-----------|---------|
| `assert_that(a).is_equal(b)` | Equality |
| `assert_that(a).is_not_equal(b)` | Inequality |
| `assert_int(a).is_greater(b)` | Greater than |
| `assert_bool(x).is_true()` | Boolean true |
| `assert_that(x).is_null()` | Is null |
| `assert_signal(obj).is_emitted(sig)` | Signal was emitted |
| `assert_float(a).is_equal_approx(b, tol)` | Float near-equality |

## What NOT to Test

- Godot engine internals (e.g., does `Vector2.length()` work?)
- Purely visual output (use manual playtesting)
- Exact frame timing (flaky — test state changes instead)

## Checklist

When an agent writes tests, verify:

- [ ] Test file exists in `tests/` directory mirroring source structure
- [ ] Test names describe the behavior being tested
- [ ] Tests are independent — no shared mutable state between tests
- [ ] Scene tests use `add_child_autofree()` (GUT) or `auto_free()` (gdUnit4)
- [ ] Signal tests use `watch_signals` (GUT) or `AssertSignal` (gdUnit4)
- [ ] Tests run headless via CLI
```

- [ ] **Step 2: Create gut-reference.md**

```markdown
# GUT Quick Reference

## Installation

1. Download from AssetLib: search "GUT" or clone from GitHub
2. Enable plugin: Project > Project Settings > Plugins > GUT > Enable
3. Access via the GUT dock panel in the editor

## File Conventions

- Test files: `test_*.gd` (prefix with `test_`)
- Test classes: `extends GutTest`
- Test methods: `func test_*()` (prefix with `test_`)
- Setup/teardown: `before_each()`, `after_each()`, `before_all()`, `after_all()`

## Key APIs

### Lifecycle
```gdscript
func before_all() -> void:    # Once before all tests in file
func before_each() -> void:   # Before each test method
func after_each() -> void:    # After each test method
func after_all() -> void:     # Once after all tests in file
```

### Scene Management
```gdscript
add_child_autofree(node)      # Add to tree, auto-cleanup after test
autofree(object)              # Auto-cleanup after test (no tree)
```

### Doubling (Mocking)
```gdscript
var dbl = double(MyClass).new()
stub(dbl, "method_name").to_return(value)
stub(dbl, "method_name").to_call_super()
assert_called(dbl, "method_name")
assert_call_count(dbl, "method_name", expected_count)
```

### Signal Watching
```gdscript
watch_signals(object)
assert_signal_emitted(object, "signal_name")
assert_signal_not_emitted(object, "signal_name")
assert_signal_emit_count(object, "signal_name", expected_count)
get_signal_parameters(object, "signal_name", index)
```

### Waiting
```gdscript
await wait_seconds(0.5)       # Wait real time
await wait_frames(5)          # Wait N frames
```

### CLI Flags
```bash
godot --headless -s addons/gut/gut_cmdln.gd \
  -gtest=res://tests/test_file.gd \
  -gunit_test_name=test_specific \
  -glog=2 \
  --should_exit
```
```

- [ ] **Step 3: Create gdunit4-reference.md**

```markdown
# gdUnit4 Quick Reference

## Installation

1. Download from AssetLib: search "gdUnit4" or clone from GitHub
2. Enable plugin: Project > Project Settings > Plugins > gdUnit4 > Enable
3. For C#: add the gdUnit4.api NuGet package to your .csproj

## File Conventions

### GDScript
- Test files: `*_test.gd` or `test_*.gd`
- Test classes: `extends GdUnitTestSuite`
- Test methods: `func test_*()`

### C#
- Test files: `*Test.cs`
- Test classes: `[TestSuite] public partial class MyTest`
- Test methods: `[TestCase] public void MethodName()`

## Key APIs — GDScript

### Lifecycle
```gdscript
func before() -> void:         # Once before all tests
func before_test() -> void:    # Before each test
func after_test() -> void:     # After each test
func after() -> void:          # Once after all tests
```

### Memory Management
```gdscript
auto_free(object)              # Auto-cleanup after test
```

### Assertions
```gdscript
assert_that(value).is_equal(expected)
assert_that(value).is_not_equal(expected)
assert_that(value).is_null()
assert_that(value).is_not_null()
assert_int(value).is_greater(expected)
assert_int(value).is_less(expected)
assert_float(value).is_equal_approx(expected, tolerance)
assert_str(value).contains("substring")
assert_bool(value).is_true()
assert_array(array).contains([element])
assert_signal(object).is_emitted("signal_name")
```

### Mocking
```gdscript
var m = mock(MyClass)
do_return(value).on(m).method_name()
verify(m).method_name()
verify(m, 2).method_name()  # called exactly 2 times
```

## Key APIs — C#

### Lifecycle
```csharp
[Before] public void SetupSuite()     // Once before all
[BeforeTest] public void Setup()       // Before each
[AfterTest] public void Teardown()     // After each
[After] public void TeardownSuite()    // Once after all
```

### Assertions
```csharp
AssertThat(value).IsEqual(expected);
AssertThat(value).IsNotEqual(expected);
AssertThat(value).IsNull();
AssertInt(value).IsGreater(expected);
AssertFloat(value).IsEqualApprox(expected, tolerance);
AssertString(value).Contains("substring");
AssertBool(value).IsTrue();
AssertArray(array).Contains(element);
AssertSignal(object).IsEmitted("SignalName");
```

### Mocking (C#)
```csharp
var mock = Mock<MyClass>();
DoReturn(value).On(mock).MethodName();
Verify(mock).MethodName();
```

### CLI
```bash
# GDScript tests
godot --headless -s addons/gdUnit4/bin/GdUnitCmdTool.gd --add res://tests

# C# tests
godot --headless -s addons/gdUnit4/bin/GdUnitCmdTool.gd --add res://tests --cs
```
```

- [ ] **Step 4: Verify all three files are well-formed**

Run: `head -5 skills/godot-testing/SKILL.md && head -3 skills/godot-testing/gut-reference.md && head -3 skills/godot-testing/gdunit4-reference.md`
Expected: Correct frontmatter on SKILL.md, correct headers on reference files

- [ ] **Step 5: Commit**

```bash
git add skills/godot-testing/
git commit -m "feat: add godot-testing skill with GUT and gdUnit4 references

TDD workflow, test structure, assertions, mocking, signal testing,
scene testing, and CI integration for both frameworks."
```

---

### Task 3: godot-code-review skill

**Files:**
- Create: `skills/godot-code-review/SKILL.md`

- [ ] **Step 1: Create SKILL.md with review checklist**

```markdown
---
name: godot-code-review
description: Use when reviewing GDScript or C# Godot code — checklist of best practices, common anti-patterns, and Godot-specific pitfalls
---

# Godot Code Review

Structured code review for Godot 4.x projects. Covers GDScript and C# best practices, performance pitfalls, and Godot-specific anti-patterns.

## When to Use

- Reviewing PRs or code changes in a Godot project
- Self-reviewing before committing
- Auditing existing code quality

## Review Checklist

### 1. Node & Scene Architecture

- [ ] Scenes are focused — one responsibility per scene
- [ ] No deep inheritance chains (prefer composition with child nodes)
- [ ] Autoloads are used sparingly — only for truly global state
- [ ] Scenes don't reach up the tree (`get_parent().get_parent()...`) — use signals instead
- [ ] `@onready` / `GetNode` calls reference direct children, not deep paths

**Anti-pattern — reaching up the tree:**
```gdscript
# Bad — fragile coupling to parent structure
func _ready() -> void:
    var hud = get_parent().get_parent().get_node("HUD")
    hud.update_health(health)

# Good — emit a signal, let the parent wire it
signal health_changed(new_health: int)

func take_damage(amount: int) -> void:
    current_health -= amount
    health_changed.emit(current_health)
```

### 2. GDScript Style

- [ ] snake_case for variables, functions, signals
- [ ] PascalCase for classes (`class_name`)
- [ ] SCREAMING_SNAKE for constants
- [ ] Type hints on function parameters and return types
- [ ] `@export` variables have types specified
- [ ] No `var x = ...` without type when type isn't obvious from context
- [ ] Signals declared at top of file, after `class_name`
- [ ] `super()` called in overridden `_ready()`, `_process()` etc. when parent has logic

**Type hints:**
```gdscript
# Bad — untyped
var speed = 200
func move(delta):
    pass

# Good — typed
var speed: float = 200.0
func move(delta: float) -> void:
    pass
```

### 3. C# Style

- [ ] `partial class` used on all Node scripts (required for source generators)
- [ ] PascalCase for methods, properties, signals
- [ ] camelCase for local variables and parameters
- [ ] `[Export]` properties use PascalCase
- [ ] `[Signal]` delegate naming matches Godot convention
- [ ] Null checks on `GetNode<T>()` results or use `GetNodeOrNull<T>()`
- [ ] `using Godot;` present, no unnecessary `using` statements

### 4. Performance

- [ ] No `get_node()` / `GetNode()` calls in `_process()` / `_physics_process()` — cache in `_ready()`
- [ ] No `load()` / `GD.Load()` in hot paths — preload or cache references
- [ ] `_process()` disabled when not needed (`set_process(false)`)
- [ ] String concatenation in hot paths uses `StringName` for comparisons
- [ ] No unnecessary `_process()` overrides on nodes that don't need per-frame updates

**Anti-pattern — repeated node lookups:**
```gdscript
# Bad — lookup every frame
func _process(delta: float) -> void:
    var sprite = get_node("Sprite2D")
    sprite.rotation += delta

# Good — cached reference
@onready var sprite: Sprite2D = $Sprite2D

func _process(delta: float) -> void:
    sprite.rotation += delta
```

### 5. Input Handling

- [ ] Uses Input Map actions, not hardcoded key constants
- [ ] `_unhandled_input()` preferred over `_input()` unless consuming UI input
- [ ] Input handled in `_physics_process()` for movement, `_unhandled_input()` for discrete actions
- [ ] `event.is_action_pressed()` used instead of checking `event is InputEventKey`

### 6. Signals & Communication

- [ ] Signals used for upward/sideways communication (child → parent)
- [ ] Direct method calls used for downward communication (parent → child)
- [ ] Signal connections made in `_ready()` or via the editor
- [ ] No circular signal dependencies
- [ ] Signals have descriptive names in past tense for events (`health_changed`, `enemy_died`)

### 7. Resource Management

- [ ] `preload()` for resources known at compile time
- [ ] `load()` only when path is dynamic
- [ ] Large resources loaded asynchronously with `ResourceLoader.load_threaded_request()`
- [ ] Custom Resources use `class_name` and `@export` for editor integration
- [ ] No resource leaks — `queue_free()` called on dynamically created nodes

### 8. Error-Prone Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| `await get_tree().create_timer(0).timeout` | Timer not freed if node is freed | Check `is_inside_tree()` after await |
| `$"../../SomeNode"` | Fragile path | Use signals or `@export NodePath` |
| `call_deferred("method")` everywhere | Hides execution order bugs | Only use when actually needed (physics/rendering sync) |
| `set_physics_process(true)` in `_ready()` | Already true by default | Remove unnecessary call |
| Modifying `position` on CharacterBody | Bypasses collision | Use `velocity` + `move_and_slide()` |

## Review Output Format

When reviewing code, structure feedback as:

```
## [File: path/to/file.gd]

### Critical
- Line 45: `get_parent().get_parent()` — fragile tree coupling. Use a signal instead.

### Improvement
- Line 12: Missing type hint on `speed` variable.
- Line 30: `get_node("Sprite2D")` called in `_process()` — cache with `@onready`.

### Positive
- Clean signal naming convention throughout.
- Good use of composition with child nodes.
```
```

- [ ] **Step 2: Verify the file is well-formed**

Run: `head -5 skills/godot-code-review/SKILL.md`
Expected: YAML frontmatter with `name: godot-code-review`

- [ ] **Step 3: Commit**

```bash
git add skills/godot-code-review/SKILL.md
git commit -m "feat: add godot-code-review skill

Review checklist covering node architecture, GDScript/C# style,
performance, input handling, signals, resources, and common pitfalls."
```

---

### Task 4: scene-organization skill

**Files:**
- Create: `skills/scene-organization/SKILL.md`

- [ ] **Step 1: Create SKILL.md with scene patterns**

```markdown
---
name: scene-organization
description: Use when designing scene tree structure — composition vs inheritance, when to split scenes, node hierarchy patterns
---

# Scene Organization

Patterns for structuring Godot 4.x scene trees. Covers composition, inheritance, scene splitting, and node hierarchy design.

## When to Use

- Designing a new scene or feature
- Refactoring a scene that has grown too large
- Deciding between inheritance and composition

## Core Principle: Scenes as Building Blocks

In Godot, scenes are **reusable components**. Think of them like classes:
- A scene encapsulates **one concept** (a player, an enemy, a health bar)
- Scenes **compose** — a Player scene contains a Sprite, CollisionShape, StateMachine scene
- Scenes **inherit** — an Orc scene inherits from Enemy scene (use sparingly)

## Composition Over Inheritance

**Prefer composition** (child scenes) over inheritance (scene inheritance):

```
Player (CharacterBody2D)
  ├── Sprite2D
  ├── CollisionShape2D
  ├── HealthComponent        ← reusable scene
  ├── HitboxComponent        ← reusable scene
  ├── StateMachine           ← reusable scene
  └── AnimationPlayer
```

Each component is its own scene that can be reused across Player, Enemy, NPC, etc.

**GDScript — HealthComponent:**
```gdscript
# scripts/components/health_component.gd
class_name HealthComponent
extends Node

signal health_changed(new_health: int)
signal died

@export var max_health: int = 100
var current_health: int

func _ready() -> void:
    current_health = max_health

func take_damage(amount: int) -> void:
    current_health = maxi(current_health - amount, 0)
    health_changed.emit(current_health)
    if current_health == 0:
        died.emit()

func heal(amount: int) -> void:
    current_health = mini(current_health + amount, max_health)
    health_changed.emit(current_health)
```

**C# — HealthComponent:**
```csharp
using Godot;

public partial class HealthComponent : Node
{
    [Signal] public delegate void HealthChangedEventHandler(int newHealth);
    [Signal] public delegate void DiedEventHandler();

    [Export] public int MaxHealth { get; set; } = 100;
    public int CurrentHealth { get; private set; }

    public override void _Ready()
    {
        CurrentHealth = MaxHealth;
    }

    public void TakeDamage(int amount)
    {
        CurrentHealth = Mathf.Max(CurrentHealth - amount, 0);
        EmitSignal(SignalName.HealthChanged, CurrentHealth);
        if (CurrentHealth == 0)
            EmitSignal(SignalName.Died);
    }

    public void Heal(int amount)
    {
        CurrentHealth = Mathf.Min(CurrentHealth + amount, MaxHealth);
        EmitSignal(SignalName.HealthChanged, CurrentHealth);
    }
}
```

### When to Use Inheritance

Inheritance is appropriate when entities share **structure**, not just **behavior**:

- Base `Enemy` scene with Sprite, CollisionShape, AI → `Orc`, `Goblin` inherit and swap sprites/stats
- Base `Weapon` scene → `Sword`, `Bow` inherit and override attack methods
- Base `Pickup` scene → `HealthPickup`, `AmmoPickup` inherit

**Rule of thumb:** If you'd copy-paste the entire scene and change a few properties, use inheritance. If you'd only reuse a subset of nodes, use composition.

## Scene Splitting Rules

Split a scene when:
1. **Reuse** — the subtree appears in multiple places
2. **Complexity** — the scene has 15+ nodes (hard to navigate)
3. **Independence** — the subtree has its own logic that doesn't depend on siblings
4. **Team** — different people work on different parts

Keep together when:
1. The nodes are tightly coupled (a Sprite + its CollisionShape)
2. Splitting would require excessive signal wiring for simple operations
3. The subtree is small and only used once

## Node Communication Patterns

```
         Signal (up)
    Child ──────────► Parent
         
         Method call (down)
    Parent ──────────► Child
         
         Signal via EventBus (sideways)
    NodeA ──► EventBus ──► NodeB
```

- **Child → Parent:** Signals. The child doesn't know who listens.
- **Parent → Child:** Direct method calls. The parent owns its children.
- **Sibling → Sibling:** EventBus autoload or parent mediates.
- **Unrelated nodes:** EventBus autoload (global signal hub).

## Scene Tree Patterns

### Entity-Component Pattern
```
Enemy (CharacterBody2D)
  ├── Visuals (Node2D)
  │   ├── Sprite2D
  │   └── AnimationPlayer
  ├── Collision (CollisionShape2D)
  ├── Components (Node)
  │   ├── HealthComponent
  │   ├── HitboxComponent
  │   └── LootDropComponent
  └── AI (Node)
      ├── StateMachine
      └── NavigationAgent2D
```

### UI Scene Pattern
```
HUD (CanvasLayer)
  ├── MarginContainer
  │   ├── TopBar (HBoxContainer)
  │   │   ├── HealthBar
  │   │   └── ScoreLabel
  │   └── BottomBar (HBoxContainer)
  │       ├── WeaponSlots
  │       └── Minimap
  └── PauseMenu (hidden by default)
```

### Level Scene Pattern
```
Level01 (Node2D)
  ├── TileMapLayer
  ├── Entities (Node2D)
  │   ├── Player
  │   ├── Enemies (Node2D)
  │   └── NPCs (Node2D)
  ├── Pickups (Node2D)
  ├── Navigation (NavigationRegion2D)
  └── Camera2D
```

## Checklist

When reviewing scene organization:

- [ ] Each scene has one clear responsibility
- [ ] Reusable components are separate scenes
- [ ] No scene has more than ~15 nodes without good reason
- [ ] Communication flows correctly (signals up, calls down)
- [ ] No `get_parent()` chains — use signals
- [ ] Group nodes logically (Visuals, Components, AI)
```

- [ ] **Step 2: Verify the file is well-formed**

Run: `head -5 skills/scene-organization/SKILL.md`
Expected: YAML frontmatter with `name: scene-organization`

- [ ] **Step 3: Commit**

```bash
git add skills/scene-organization/SKILL.md
git commit -m "feat: add scene-organization skill

Composition vs inheritance, scene splitting rules, communication
patterns, and entity/UI/level scene tree templates."
```

---

### Task 5: state-machine skill

**Files:**
- Create: `skills/state-machine/SKILL.md`

- [ ] **Step 1: Create SKILL.md with three FSM approaches**

```markdown
---
name: state-machine
description: Use when implementing state machines in Godot — enum-based, node-based, and resource-based FSM patterns with trade-offs
---

# State Machine Patterns

Three approaches to finite state machines in Godot 4.x, from simplest to most flexible. Choose based on complexity.

## When to Use

- Player/enemy behavior with distinct states (idle, run, jump, attack)
- UI flows (menu → gameplay → pause → game over)
- Any system where behavior changes based on current state

## Approach Comparison

| Approach | Complexity | Best For |
|----------|-----------|----------|
| Enum-based | Low | Simple entities with <5 states, no shared logic |
| Node-based | Medium | Characters with complex state behavior, animations |
| Resource-based | High | Reusable/configurable state definitions, data-driven design |

## Approach 1: Enum-Based (Simplest)

All logic in one script using a match statement. Good for simple cases.

**GDScript:**
```gdscript
class_name SimpleEnemy
extends CharacterBody2D

enum State { IDLE, PATROL, CHASE, ATTACK }

var current_state: State = State.IDLE
var player: CharacterBody2D = null

@export var patrol_speed: float = 50.0
@export var chase_speed: float = 120.0
@export var attack_range: float = 30.0
@export var detect_range: float = 200.0

func _physics_process(delta: float) -> void:
    match current_state:
        State.IDLE:
            _state_idle(delta)
        State.PATROL:
            _state_patrol(delta)
        State.CHASE:
            _state_chase(delta)
        State.ATTACK:
            _state_attack(delta)

func _state_idle(_delta: float) -> void:
    velocity = Vector2.ZERO
    if _player_in_range(detect_range):
        current_state = State.CHASE
    # Transition to patrol after idle timer (omitted for brevity)

func _state_chase(_delta: float) -> void:
    if not _player_in_range(detect_range):
        current_state = State.IDLE
        return
    if _player_in_range(attack_range):
        current_state = State.ATTACK
        return
    var direction = global_position.direction_to(player.global_position)
    velocity = direction * chase_speed
    move_and_slide()

func _state_patrol(_delta: float) -> void:
    # Patrol waypoint logic
    if _player_in_range(detect_range):
        current_state = State.CHASE

func _state_attack(_delta: float) -> void:
    velocity = Vector2.ZERO
    # Attack logic — transition back to chase when done

func _player_in_range(range: float) -> bool:
    if player == null:
        return false
    return global_position.distance_to(player.global_position) < range
```

**C#:**
```csharp
using Godot;

public partial class SimpleEnemy : CharacterBody2D
{
    private enum State { Idle, Patrol, Chase, Attack }

    private State _currentState = State.Idle;
    private CharacterBody2D _player;

    [Export] public float PatrolSpeed { get; set; } = 50f;
    [Export] public float ChaseSpeed { get; set; } = 120f;
    [Export] public float AttackRange { get; set; } = 30f;
    [Export] public float DetectRange { get; set; } = 200f;

    public override void _PhysicsProcess(double delta)
    {
        switch (_currentState)
        {
            case State.Idle: StateIdle(delta); break;
            case State.Patrol: StatePatrol(delta); break;
            case State.Chase: StateChase(delta); break;
            case State.Attack: StateAttack(delta); break;
        }
    }

    private void StateIdle(double delta)
    {
        Velocity = Vector2.Zero;
        if (PlayerInRange(DetectRange))
            _currentState = State.Chase;
    }

    private void StateChase(double delta)
    {
        if (!PlayerInRange(DetectRange))
        {
            _currentState = State.Idle;
            return;
        }
        if (PlayerInRange(AttackRange))
        {
            _currentState = State.Attack;
            return;
        }
        var direction = GlobalPosition.DirectionTo(_player.GlobalPosition);
        Velocity = direction * ChaseSpeed;
        MoveAndSlide();
    }

    private void StatePatrol(double delta) { /* patrol logic */ }
    private void StateAttack(double delta) { /* attack logic */ }

    private bool PlayerInRange(float range)
    {
        return _player != null &&
               GlobalPosition.DistanceTo(_player.GlobalPosition) < range;
    }
}
```

**When to upgrade:** When you find yourself duplicating enter/exit logic, needing animation sync per state, or the match statement exceeds ~100 lines.

## Approach 2: Node-Based (Recommended for Characters)

Each state is a child node. A StateMachine node manages transitions.

**Scene tree:**
```
Player (CharacterBody2D)
  ├── StateMachine
  │   ├── Idle
  │   ├── Run
  │   ├── Jump
  │   └── Attack
  ├── Sprite2D
  ├── AnimationPlayer
  └── CollisionShape2D
```

**GDScript — State base class:**
```gdscript
# scripts/state_machine/state.gd
class_name State
extends Node

var entity: CharacterBody2D
var state_machine: StateMachine

func enter() -> void:
    pass

func exit() -> void:
    pass

func update(_delta: float) -> void:
    pass

func physics_update(_delta: float) -> void:
    pass

func handle_input(_event: InputEvent) -> void:
    pass
```

**GDScript — StateMachine:**
```gdscript
# scripts/state_machine/state_machine.gd
class_name StateMachine
extends Node

@export var initial_state: State
var current_state: State

func _ready() -> void:
    for child in get_children():
        if child is State:
            child.entity = owner as CharacterBody2D
            child.state_machine = self
    if initial_state:
        current_state = initial_state
        current_state.enter()

func _unhandled_input(event: InputEvent) -> void:
    current_state.handle_input(event)

func _process(delta: float) -> void:
    current_state.update(delta)

func _physics_process(delta: float) -> void:
    current_state.physics_update(delta)

func transition_to(target_state: State) -> void:
    if target_state == current_state:
        return
    current_state.exit()
    current_state = target_state
    current_state.enter()
```

**GDScript — Concrete state example (Idle):**
```gdscript
# scripts/state_machine/states/idle_state.gd
class_name IdleState
extends State

func enter() -> void:
    entity.velocity = Vector2.ZERO
    entity.get_node("AnimationPlayer").play("idle")

func physics_update(_delta: float) -> void:
    if not entity.is_on_floor():
        state_machine.transition_to($"../Jump")
        return

    var input_dir = Input.get_axis("move_left", "move_right")
    if input_dir != 0.0:
        state_machine.transition_to($"../Run")

func handle_input(event: InputEvent) -> void:
    if event.is_action_pressed("jump") and entity.is_on_floor():
        state_machine.transition_to($"../Jump")
```

**C# — State base class:**
```csharp
using Godot;

public partial class State : Node
{
    public CharacterBody2D Entity { get; set; }
    public StateMachine Machine { get; set; }

    public virtual void Enter() { }
    public virtual void Exit() { }
    public virtual void Update(double delta) { }
    public virtual void PhysicsUpdate(double delta) { }
    public virtual void HandleInput(InputEvent @event) { }
}
```

**C# — StateMachine:**
```csharp
using Godot;

public partial class StateMachine : Node
{
    [Export] public State InitialState { get; set; }
    public State CurrentState { get; private set; }

    public override void _Ready()
    {
        foreach (var child in GetChildren())
        {
            if (child is State state)
            {
                state.Entity = Owner as CharacterBody2D;
                state.Machine = this;
            }
        }
        if (InitialState != null)
        {
            CurrentState = InitialState;
            CurrentState.Enter();
        }
    }

    public override void _UnhandledInput(InputEvent @event)
        => CurrentState.HandleInput(@event);

    public override void _Process(double delta)
        => CurrentState.Update(delta);

    public override void _PhysicsProcess(double delta)
        => CurrentState.PhysicsUpdate(delta);

    public void TransitionTo(State targetState)
    {
        if (targetState == CurrentState) return;
        CurrentState.Exit();
        CurrentState = targetState;
        CurrentState.Enter();
    }
}
```

## Approach 3: Resource-Based (Data-Driven)

States defined as Resources — configurable in the editor, reusable across entities.

**GDScript — StateData resource:**
```gdscript
# scripts/state_machine/state_data.gd
class_name StateData
extends Resource

@export var state_name: StringName
@export var animation_name: String
@export var move_speed: float = 0.0
@export var can_transition_to: Array[StringName] = []
```

Use this when you want designers to configure state behavior in the Inspector without writing code.

## Choosing the Right Approach

```
                     Start
                       │
              Fewer than 5 states?
              ┌──yes───┤───no──┐
              ▼                ▼
          Enum-based     Need editor
                         configurability?
                     ┌──yes───┤───no──┐
                     ▼                ▼
               Resource-based    Node-based
```

## Checklist

- [ ] State machine chosen matches complexity (don't over-engineer)
- [ ] States have clear enter/exit methods for setup/cleanup
- [ ] Transitions are explicit, not hidden in random methods
- [ ] Animation sync happens in state enter/exit, not scattered
- [ ] No circular transition loops without exit conditions
```

- [ ] **Step 2: Verify the file is well-formed**

Run: `head -5 skills/state-machine/SKILL.md`
Expected: YAML frontmatter with `name: state-machine`

- [ ] **Step 3: Commit**

```bash
git add skills/state-machine/SKILL.md
git commit -m "feat: add state-machine skill

Three FSM approaches (enum, node, resource-based) with full
GDScript and C# examples and decision flowchart."
```

---

### Task 6: player-controller skill

**Files:**
- Create: `skills/player-controller/SKILL.md`

- [ ] **Step 1: Create SKILL.md with 2D and 3D controller patterns**

```markdown
---
name: player-controller
description: Use when implementing player movement — CharacterBody2D/3D patterns, input handling, physics, common movement recipes
---

# Player Controller

Movement patterns for Godot 4.x CharacterBody2D and CharacterBody3D. Covers top-down, platformer, and first-person controllers.

## When to Use

- Implementing player movement from scratch
- Adding jump, dash, or other movement abilities
- Fixing common movement bugs (sticky walls, inconsistent jumps)

## Core Concepts

### CharacterBody vs RigidBody

| Use | CharacterBody | RigidBody |
|-----|---------------|-----------|
| Player movement | Yes — direct velocity control | Rarely — physics-driven feels floaty |
| Enemies | Yes — predictable AI movement | Sometimes — ragdolls, physics puzzles |
| Projectiles | Sometimes — for precise control | Yes — for bouncing, gravity-affected |

**Rule:** Use CharacterBody for anything the player directly controls.

### The Movement Loop

```
_physics_process(delta):
    1. Read input → direction vector
    2. Apply forces (gravity, friction, acceleration)
    3. Modify velocity
    4. Call move_and_slide()
    5. Check post-movement state (is_on_floor, collisions)
```

## 2D Top-Down Controller

**GDScript:**
```gdscript
class_name TopDownPlayer
extends CharacterBody2D

@export var speed: float = 200.0
@export var acceleration: float = 1500.0
@export var friction: float = 1200.0

func _physics_process(delta: float) -> void:
    var input_dir = Input.get_vector("move_left", "move_right", "move_up", "move_down")

    if input_dir != Vector2.ZERO:
        velocity = velocity.move_toward(input_dir * speed, acceleration * delta)
    else:
        velocity = velocity.move_toward(Vector2.ZERO, friction * delta)

    move_and_slide()
```

**C#:**
```csharp
using Godot;

public partial class TopDownPlayer : CharacterBody2D
{
    [Export] public float Speed { get; set; } = 200f;
    [Export] public float Acceleration { get; set; } = 1500f;
    [Export] public float Friction { get; set; } = 1200f;

    public override void _PhysicsProcess(double delta)
    {
        var inputDir = Input.GetVector("move_left", "move_right", "move_up", "move_down");

        Velocity = inputDir != Vector2.Zero
            ? Velocity.MoveToward(inputDir * Speed, (float)(Acceleration * delta))
            : Velocity.MoveToward(Vector2.Zero, (float)(Friction * delta));

        MoveAndSlide();
    }
}
```

## 2D Platformer Controller

**GDScript:**
```gdscript
class_name PlatformerPlayer
extends CharacterBody2D

@export var speed: float = 300.0
@export var jump_velocity: float = -400.0
@export var gravity_scale: float = 1.0
@export var coyote_time: float = 0.1
@export var jump_buffer_time: float = 0.1

var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0
var was_on_floor: bool = false

func _physics_process(delta: float) -> void:
    var gravity = ProjectSettings.get_setting("physics/2d/default_gravity") as float
    var on_floor = is_on_floor()

    # Coyote time — allow jumping briefly after leaving a ledge
    if on_floor:
        coyote_timer = coyote_time
    elif was_on_floor:
        coyote_timer -= delta

    # Jump buffer — remember jump input pressed just before landing
    if Input.is_action_just_pressed("jump"):
        jump_buffer_timer = jump_buffer_time
    else:
        jump_buffer_timer -= delta

    # Gravity
    if not on_floor:
        velocity.y += gravity * gravity_scale * delta

    # Jump
    if jump_buffer_timer > 0.0 and coyote_timer > 0.0:
        velocity.y = jump_velocity
        jump_buffer_timer = 0.0
        coyote_timer = 0.0

    # Variable jump height — release early for short jump
    if Input.is_action_just_released("jump") and velocity.y < 0.0:
        velocity.y *= 0.5

    # Horizontal movement
    var direction = Input.get_axis("move_left", "move_right")
    if direction != 0.0:
        velocity.x = direction * speed
    else:
        velocity.x = move_toward(velocity.x, 0.0, speed * delta * 10.0)

    was_on_floor = on_floor
    move_and_slide()
```

**C#:**
```csharp
using Godot;

public partial class PlatformerPlayer : CharacterBody2D
{
    [Export] public float Speed { get; set; } = 300f;
    [Export] public float JumpVelocity { get; set; } = -400f;
    [Export] public float GravityScale { get; set; } = 1f;
    [Export] public float CoyoteTime { get; set; } = 0.1f;
    [Export] public float JumpBufferTime { get; set; } = 0.1f;

    private float _coyoteTimer;
    private float _jumpBufferTimer;
    private bool _wasOnFloor;

    public override void _PhysicsProcess(double delta)
    {
        float dt = (float)delta;
        float gravity = (float)ProjectSettings.GetSetting("physics/2d/default_gravity");
        bool onFloor = IsOnFloor();

        _coyoteTimer = onFloor ? CoyoteTime : (_wasOnFloor ? _coyoteTimer - dt : _coyoteTimer);

        _jumpBufferTimer = Input.IsActionJustPressed("jump")
            ? JumpBufferTime
            : _jumpBufferTimer - dt;

        var vel = Velocity;

        if (!onFloor)
            vel.Y += gravity * GravityScale * dt;

        if (_jumpBufferTimer > 0f && _coyoteTimer > 0f)
        {
            vel.Y = JumpVelocity;
            _jumpBufferTimer = 0f;
            _coyoteTimer = 0f;
        }

        if (Input.IsActionJustReleased("jump") && vel.Y < 0f)
            vel.Y *= 0.5f;

        float direction = Input.GetAxis("move_left", "move_right");
        vel.X = direction != 0f
            ? direction * Speed
            : Mathf.MoveToward(vel.X, 0f, Speed * dt * 10f);

        _wasOnFloor = onFloor;
        Velocity = vel;
        MoveAndSlide();
    }
}
```

## 3D First-Person Controller

**GDScript:**
```gdscript
class_name FPSController
extends CharacterBody3D

@export var speed: float = 5.0
@export var jump_velocity: float = 4.5
@export var mouse_sensitivity: float = 0.002

@onready var head: Node3D = $Head
@onready var camera: Camera3D = $Head/Camera3D

func _ready() -> void:
    Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventMouseMotion:
        rotate_y(-event.relative.x * mouse_sensitivity)
        head.rotate_x(-event.relative.y * mouse_sensitivity)
        head.rotation.x = clampf(head.rotation.x, deg_to_rad(-90), deg_to_rad(90))

    if event.is_action_pressed("ui_cancel"):
        Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func _physics_process(delta: float) -> void:
    var gravity = ProjectSettings.get_setting("physics/3d/default_gravity") as float

    if not is_on_floor():
        velocity.y -= gravity * delta

    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity

    var input_dir = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
    var direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

    if direction != Vector3.ZERO:
        velocity.x = direction.x * speed
        velocity.z = direction.z * speed
    else:
        velocity.x = move_toward(velocity.x, 0.0, speed)
        velocity.z = move_toward(velocity.z, 0.0, speed)

    move_and_slide()
```

**C#:**
```csharp
using Godot;

public partial class FpsController : CharacterBody3D
{
    [Export] public float Speed { get; set; } = 5f;
    [Export] public float JumpVelocity { get; set; } = 4.5f;
    [Export] public float MouseSensitivity { get; set; } = 0.002f;

    private Node3D _head;
    private Camera3D _camera;

    public override void _Ready()
    {
        _head = GetNode<Node3D>("Head");
        _camera = GetNode<Camera3D>("Head/Camera3D");
        Input.MouseMode = Input.MouseModeEnum.Captured;
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event is InputEventMouseMotion motion)
        {
            RotateY(-motion.Relative.X * MouseSensitivity);
            _head.RotateX(-motion.Relative.Y * MouseSensitivity);
            var rot = _head.Rotation;
            rot.X = Mathf.Clamp(rot.X, Mathf.DegToRad(-90f), Mathf.DegToRad(90f));
            _head.Rotation = rot;
        }

        if (@event.IsActionPressed("ui_cancel"))
            Input.MouseMode = Input.MouseModeEnum.Visible;
    }

    public override void _PhysicsProcess(double delta)
    {
        float dt = (float)delta;
        float gravity = (float)ProjectSettings.GetSetting("physics/3d/default_gravity");
        var vel = Velocity;

        if (!IsOnFloor())
            vel.Y -= gravity * dt;

        if (Input.IsActionJustPressed("jump") && IsOnFloor())
            vel.Y = JumpVelocity;

        var inputDir = Input.GetVector("move_left", "move_right", "move_forward", "move_back");
        var direction = (Transform.Basis * new Vector3(inputDir.X, 0, inputDir.Y)).Normalized();

        if (direction != Vector3.Zero)
        {
            vel.X = direction.X * Speed;
            vel.Z = direction.Z * Speed;
        }
        else
        {
            vel.X = Mathf.MoveToward(vel.X, 0f, Speed);
            vel.Z = Mathf.MoveToward(vel.Z, 0f, Speed);
        }

        Velocity = vel;
        MoveAndSlide();
    }
}
```

## Common Movement Recipes

### Dash
```gdscript
@export var dash_speed: float = 600.0
@export var dash_duration: float = 0.15
var is_dashing: bool = false

func start_dash() -> void:
    if is_dashing:
        return
    is_dashing = true
    var dash_dir = velocity.normalized() if velocity.length() > 0 else Vector2.RIGHT
    velocity = dash_dir * dash_speed
    await get_tree().create_timer(dash_duration).timeout
    is_dashing = false
```

### Wall Jump (2D Platformer)
```gdscript
func _physics_process(delta: float) -> void:
    # ... normal movement ...
    if is_on_wall() and not is_on_floor() and Input.is_action_just_pressed("jump"):
        var wall_normal = get_wall_normal()
        velocity.x = wall_normal.x * speed
        velocity.y = jump_velocity
```

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| Sticky walls in platformers | Set `floor_block_on_wall = false` on CharacterBody2D |
| Jittery movement | Use `_physics_process()` not `_process()` for movement |
| Inconsistent jump height | Use variable jump (cut velocity on release) |
| Sliding on slopes | Set `floor_snap_length` and `floor_max_angle` |
| Mouse look inverted Y | Check sign of `relative.y` multiplication |

## Checklist

- [ ] Movement uses `_physics_process()` not `_process()`
- [ ] Input uses action names, not hardcoded keys
- [ ] Gravity uses project setting, not hardcoded value
- [ ] `move_and_slide()` called after all velocity modifications
- [ ] Coyote time and jump buffer implemented for platformers
- [ ] Mouse captured for first-person, with escape to free cursor
```

- [ ] **Step 2: Verify the file is well-formed**

Run: `head -5 skills/player-controller/SKILL.md`
Expected: YAML frontmatter with `name: player-controller`

- [ ] **Step 3: Commit**

```bash
git add skills/player-controller/SKILL.md
git commit -m "feat: add player-controller skill

Top-down, platformer, and first-person controllers with full
GDScript/C# examples, movement recipes (dash, wall jump),
and common pitfall fixes."
```

---

### Task 7: save-load skill

**Files:**
- Create: `skills/save-load/SKILL.md`

- [ ] **Step 1: Create SKILL.md with serialization strategies**

```markdown
---
name: save-load
description: Use when implementing save/load systems — ConfigFile, JSON, Resource serialization, save game architecture
---

# Save & Load Systems

Serialization strategies for Godot 4.x. Covers simple settings, full game state, and migration patterns.

## When to Use

- Saving player settings (audio, display, controls)
- Saving game progress (player stats, inventory, world state)
- Auto-save systems
- Save file migration between game versions

## Strategy Comparison

| Strategy | Best For | Pros | Cons |
|----------|----------|------|------|
| ConfigFile | Settings, simple key-value | Built-in, INI format, human-readable | No complex nesting |
| JSON | Game saves, cross-platform | Human-readable, flexible structure | Manual serialization |
| Resources (.tres) | Editor-integrated data | Type-safe, Inspector-editable | Not secure (can execute code on load) |
| Binary Resources (.res) | Large saves, performance | Fast, compact | Not human-readable, same security caveat |

**Security warning:** Never use `ResourceLoader.load()` on untrusted save files — Resources can contain embedded GDScript that executes on load. Use JSON or ConfigFile for user-facing saves.

## ConfigFile — Settings

**GDScript:**
```gdscript
# scripts/autoload/settings_manager.gd
class_name SettingsManager
extends Node

const SETTINGS_PATH: String = "user://settings.cfg"
var config: ConfigFile = ConfigFile.new()

func _ready() -> void:
    load_settings()

func load_settings() -> void:
    var err = config.load(SETTINGS_PATH)
    if err != OK:
        _set_defaults()
        save_settings()

func save_settings() -> void:
    config.save(SETTINGS_PATH)

func _set_defaults() -> void:
    config.set_value("audio", "master_volume", 1.0)
    config.set_value("audio", "music_volume", 0.8)
    config.set_value("audio", "sfx_volume", 0.8)
    config.set_value("display", "fullscreen", false)
    config.set_value("display", "vsync", true)
    config.set_value("display", "resolution", Vector2i(1920, 1080))

func get_setting(section: String, key: String, default: Variant = null) -> Variant:
    return config.get_value(section, key, default)

func set_setting(section: String, key: String, value: Variant) -> void:
    config.set_value(section, key, value)
    save_settings()
```

**C#:**
```csharp
using Godot;

public partial class SettingsManager : Node
{
    private const string SettingsPath = "user://settings.cfg";
    private readonly ConfigFile _config = new();

    public override void _Ready() => LoadSettings();

    public void LoadSettings()
    {
        var err = _config.Load(SettingsPath);
        if (err != Error.Ok)
        {
            SetDefaults();
            SaveSettings();
        }
    }

    public void SaveSettings() => _config.Save(SettingsPath);

    private void SetDefaults()
    {
        _config.SetValue("audio", "master_volume", 1.0f);
        _config.SetValue("audio", "music_volume", 0.8f);
        _config.SetValue("audio", "sfx_volume", 0.8f);
        _config.SetValue("display", "fullscreen", false);
        _config.SetValue("display", "vsync", true);
    }

    public Variant GetSetting(string section, string key, Variant @default = default)
        => _config.GetValue(section, key, @default);

    public void SetSetting(string section, string key, Variant value)
    {
        _config.SetValue(section, key, value);
        SaveSettings();
    }
}
```

## JSON — Game Saves

**GDScript — SaveManager autoload:**
```gdscript
class_name SaveManager
extends Node

const SAVE_DIR: String = "user://saves/"
const SAVE_EXTENSION: String = ".json"

func _ready() -> void:
    DirAccess.make_dir_recursive_absolute(SAVE_DIR)

func save_game(slot_name: String) -> void:
    var save_data: Dictionary = {
        "version": 1,
        "timestamp": Time.get_datetime_string_from_system(),
        "player": _serialize_player(),
        "world": _serialize_world(),
    }
    var path = SAVE_DIR + slot_name + SAVE_EXTENSION
    var file = FileAccess.open(path, FileAccess.WRITE)
    file.store_string(JSON.stringify(save_data, "\t"))

func load_game(slot_name: String) -> bool:
    var path = SAVE_DIR + slot_name + SAVE_EXTENSION
    if not FileAccess.file_exists(path):
        return false
    var file = FileAccess.open(path, FileAccess.READ)
    var json = JSON.new()
    var err = json.parse(file.get_as_text())
    if err != OK:
        push_error("Failed to parse save file: %s" % json.get_error_message())
        return false
    var save_data: Dictionary = json.data
    save_data = _migrate(save_data)
    _deserialize_player(save_data["player"])
    _deserialize_world(save_data["world"])
    return true

func _serialize_player() -> Dictionary:
    var player = get_tree().get_first_node_in_group("player")
    return {
        "position": {"x": player.global_position.x, "y": player.global_position.y},
        "health": player.get_node("HealthComponent").current_health,
        "inventory": player.get_node("Inventory").serialize(),
    }

func _deserialize_player(data: Dictionary) -> void:
    var player = get_tree().get_first_node_in_group("player")
    player.global_position = Vector2(data["position"]["x"], data["position"]["y"])
    player.get_node("HealthComponent").current_health = data["health"]
    player.get_node("Inventory").deserialize(data["inventory"])

func _serialize_world() -> Dictionary:
    var enemies: Array[Dictionary] = []
    for enemy in get_tree().get_nodes_in_group("enemies"):
        enemies.append({
            "scene_path": enemy.scene_file_path,
            "position": {"x": enemy.global_position.x, "y": enemy.global_position.y},
            "health": enemy.get_node("HealthComponent").current_health,
        })
    return {"enemies": enemies}

func _deserialize_world(data: Dictionary) -> void:
    for enemy in get_tree().get_nodes_in_group("enemies"):
        enemy.queue_free()
    for enemy_data in data["enemies"]:
        var enemy = load(enemy_data["scene_path"]).instantiate()
        enemy.global_position = Vector2(enemy_data["position"]["x"], enemy_data["position"]["y"])
        get_tree().current_scene.add_child(enemy)
        enemy.get_node("HealthComponent").current_health = enemy_data["health"]

func _migrate(data: Dictionary) -> Dictionary:
    var version: int = data.get("version", 0)
    if version < 1:
        # Migration from v0 to v1: added inventory
        if not data["player"].has("inventory"):
            data["player"]["inventory"] = []
        data["version"] = 1
    return data

func get_save_slots() -> Array[String]:
    var slots: Array[String] = []
    var dir = DirAccess.open(SAVE_DIR)
    if dir:
        dir.list_dir_begin()
        var file_name = dir.get_next()
        while file_name != "":
            if file_name.ends_with(SAVE_EXTENSION):
                slots.append(file_name.trim_suffix(SAVE_EXTENSION))
            file_name = dir.get_next()
    return slots

func delete_save(slot_name: String) -> void:
    var path = SAVE_DIR + slot_name + SAVE_EXTENSION
    if FileAccess.file_exists(path):
        DirAccess.remove_absolute(path)
```

**C#:**
```csharp
using Godot;
using System.Collections.Generic;
using System.Text.Json;

public partial class SaveManager : Node
{
    private const string SaveDir = "user://saves/";
    private const string SaveExtension = ".json";

    public override void _Ready()
    {
        DirAccess.MakeDirRecursiveAbsolute(SaveDir);
    }

    public void SaveGame(string slotName)
    {
        var saveData = new Dictionary<string, object>
        {
            ["version"] = 1,
            ["timestamp"] = Time.GetDatetimeStringFromSystem(),
            ["player"] = SerializePlayer(),
        };
        var path = SaveDir + slotName + SaveExtension;
        using var file = FileAccess.Open(path, FileAccess.ModeFlags.Write);
        file.StoreString(JsonSerializer.Serialize(saveData, new JsonSerializerOptions { WriteIndented = true }));
    }

    public bool LoadGame(string slotName)
    {
        var path = SaveDir + slotName + SaveExtension;
        if (!FileAccess.FileExists(path)) return false;
        using var file = FileAccess.Open(path, FileAccess.ModeFlags.Read);
        var json = file.GetAsText();
        var saveData = JsonSerializer.Deserialize<Dictionary<string, object>>(json);
        // Deserialize player, world, etc.
        return true;
    }

    private Dictionary<string, object> SerializePlayer()
    {
        var player = GetTree().GetFirstNodeInGroup("player");
        return new Dictionary<string, object>
        {
            ["position_x"] = player.GlobalPosition.X,
            ["position_y"] = player.GlobalPosition.Y,
        };
    }
}
```

## Save Architecture Pattern

```
SaveManager (autoload)
    │
    ├── save_game(slot) ──► Collects data from Saveable nodes
    │                        via "saveable" group
    │
    └── load_game(slot) ──► Distributes data to Saveable nodes

Saveable interface (implemented by any node that persists):
    func serialize() -> Dictionary
    func deserialize(data: Dictionary) -> void
```

**GDScript — Saveable pattern:**
```gdscript
# Any node that needs saving adds itself to "saveable" group
# and implements serialize/deserialize:

# scripts/components/saveable_component.gd
class_name SaveableComponent
extends Node

@export var save_key: String  # Unique identifier

func _ready() -> void:
    add_to_group("saveable")

func serialize() -> Dictionary:
    # Override in subclass or let parent implement
    return owner.serialize() if owner.has_method("serialize") else {}

func deserialize(data: Dictionary) -> void:
    if owner.has_method("deserialize"):
        owner.deserialize(data)
```

## Save File Location

| Platform | `user://` resolves to |
|----------|----------------------|
| Windows | `%APPDATA%\Godot\app_userdata\[project_name]\` |
| macOS | `~/Library/Application Support/Godot/app_userdata/[project_name]/` |
| Linux | `~/.local/share/godot/app_userdata/[project_name]/` |

## Version Migration

Always include a `version` field in save data. Migrate forward on load:

```gdscript
func _migrate(data: Dictionary) -> Dictionary:
    var v: int = data.get("version", 0)
    if v < 1:
        data["player"]["inventory"] = []
        data["version"] = 1
    if v < 2:
        data["player"]["skills"] = {}
        data["version"] = 2
    # Each migration step is additive — never remove, only transform
    return data
```

## Checklist

- [ ] Settings use ConfigFile (`user://settings.cfg`)
- [ ] Game saves use JSON (not Resources — security risk)
- [ ] Save data includes a `version` field for migration
- [ ] `user://` path used (not `res://` — read-only after export)
- [ ] Save directory created with `DirAccess.make_dir_recursive_absolute()`
- [ ] Vector2/Vector3 serialized as separate x/y/z floats (not Variant — JSON-safe)
- [ ] Error handling on file read/parse
- [ ] Migration function handles all previous versions
```

- [ ] **Step 2: Verify the file is well-formed**

Run: `head -5 skills/save-load/SKILL.md`
Expected: YAML frontmatter with `name: save-load`

- [ ] **Step 3: Commit**

```bash
git add skills/save-load/SKILL.md
git commit -m "feat: add save-load skill

ConfigFile for settings, JSON for game saves, Saveable component
pattern, version migration, platform paths, and security guidance."
```

---

### Task 8: Update bootstrap skill and README

**Files:**
- Modify: `skills/using-godot-prompter/SKILL.md` — verify catalog matches implemented skills
- Modify: `README.md` — add "Getting Started" section with example usage

- [ ] **Step 1: Update README with usage examples**

Add after the "Skill Categories" section:

```markdown
## Getting Started

Once installed, invoke skills by name when working on a Godot project:

### Examples

**"Set up a new Godot project"** — triggers `godot-project-setup`

**"Write tests for my health component"** — triggers `godot-testing`

**"Review this GDScript for issues"** — triggers `godot-code-review`

**"I need a platformer player controller"** — triggers `player-controller`

**"Add a state machine to my enemy"** — triggers `state-machine`

**"Implement save/load for my game"** — triggers `save-load`

Skills provide the agent with Godot-specific patterns, code examples, and checklists so it follows best practices instead of generic advice.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add getting started examples to README"
```

---

### Task 9: Final verification

- [ ] **Step 1: Verify all skill files exist and have correct frontmatter**

```bash
for skill_dir in skills/*/; do
  echo "=== $skill_dir ==="
  head -4 "${skill_dir}SKILL.md"
  echo ""
done
```

Expected: 8 skill directories, each with valid YAML frontmatter.

- [ ] **Step 2: Verify no files reference deprecated Godot 3.x APIs**

```bash
grep -r "KinematicBody" skills/ || echo "No deprecated KinematicBody references"
grep -r "yield(" skills/ || echo "No deprecated yield references"
grep -r "onready var" skills/ | grep -v "@onready" || echo "No Godot 3.x onready syntax"
```

Expected: All clean — no deprecated API references.

- [ ] **Step 3: Verify all GDScript examples use type hints**

```bash
grep -n "func.*) ->" skills/**/*.md | head -20
```

Expected: Functions have return type annotations.

- [ ] **Step 4: Push to remote**

```bash
git push origin master
```

- [ ] **Step 5: Update spec status**

Change `**Status:** In Progress` to `**Status:** Phase 1 Complete` in the design spec.

```bash
sed -i 's/Status: In Progress/Status: Phase 1 Complete/' docs/superpowers/specs/2026-04-03-godot-prompter-design.md
git add docs/superpowers/specs/2026-04-03-godot-prompter-design.md
git commit -m "docs: mark Phase 1 as complete in design spec"
git push origin master
```
