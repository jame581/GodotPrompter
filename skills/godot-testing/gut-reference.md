# GUT Quick Reference

GUT (Godot Unit Testing) is a GDScript-first testing framework for Godot 4.x. All examples target Godot 4.3+.

---

## Installation

**Option A — AssetLib (editor)**

1. Open the Godot editor, go to **AssetLib**
2. Search for "GUT"
3. Download and install — this creates `addons/gut/`
4. Enable in **Project > Project Settings > Plugins**

**Option B — git submodule**

```bash
git submodule add https://github.com/bitwes/Gut.git addons/gut
```

Then enable in **Project > Project Settings > Plugins**.

---

## File Conventions

| Convention         | Rule                                                              |
|--------------------|-------------------------------------------------------------------|
| File name          | Must start with `test_` (e.g., `test_health_component.gd`)       |
| Class              | `extends GutTest`                                                 |
| Test method        | Must start with `func test_`                                      |
| Directory          | Typically `res://tests/` (configured in GUT panel or config)     |

```gdscript
# tests/unit/test_health_component.gd
extends GutTest

func test_example() -> void:
    assert_eq(1 + 1, 2)
```

---

## Lifecycle Hooks

Hooks run in this order for each test:

```
before_all()
  for each test:
    before_each()
      test_*()
    after_each()
after_all()
```

```gdscript
extends GutTest

func before_all() -> void:
    # Runs once before ALL tests in this file
    pass

func after_all() -> void:
    # Runs once after ALL tests in this file
    pass

func before_each() -> void:
    # Runs before EACH test — set up fresh state here
    pass

func after_each() -> void:
    # Runs after EACH test — manual cleanup if needed
    # (add_child_autofree handles most cleanup automatically)
    pass
```

---

## Scene Management

### `add_child_autofree(node)` — preferred

Adds the node to the scene tree AND queues it for freeing after the test ends.

```gdscript
var _player: Player

func before_each() -> void:
    var scene := preload("res://scenes/player.tscn")
    _player = add_child_autofree(scene.instantiate())
    # _player is now in the tree and will be freed automatically

func test_player_starts_at_origin() -> void:
    assert_eq(_player.position, Vector2.ZERO)
```

### `autofree(obj)` — for objects not added to the tree

Registers an object for freeing after the test but does NOT add it to the scene tree.

```gdscript
func before_each() -> void:
    _config = autofree(GameConfig.new())  # not a Node, just a Resource
```

---

## Doubling / Mocking API

GUT uses "doubles" — partial stubs of real classes.

### Create a double

```gdscript
var mock := double(HealthComponent)
```

### Stub a method return value

```gdscript
stub(mock, "get_health").to_return(75)
stub(mock, "is_dead").to_return(false)
```

### Stub a method as a no-op

```gdscript
stub(mock, "take_damage")  # method does nothing, returns null
```

### Assert a method was called

```gdscript
_player.health = mock
_player.receive_hit(10)

assert_called(mock, "take_damage")
assert_call_count(mock, "take_damage", 1)
assert_called_with_parameters(mock, "take_damage", [10])
```

### Assert a method was NOT called

```gdscript
assert_not_called(mock, "heal")
```

### Spy on a real object (partial double)

```gdscript
# double() replaces all methods; use partial_double() to keep real behavior
var spy := partial_double(HealthComponent)
add_child_autofree(spy)
spy.take_damage(10)
assert_called(spy, "take_damage")
assert_eq(spy.current_health, 90)  # real method ran
```

---

## Signal Watching API

Always call `watch_signals()` before the action that triggers the signal.

```gdscript
func test_signals() -> void:
    watch_signals(_health)

    _health.take_damage(50)

    # Assert a signal was emitted
    assert_signal_emitted(_health, "health_changed")

    # Assert with specific argument values
    assert_signal_emitted_with_parameters(_health, "health_changed", [100, 50])

    # Assert a signal was NOT emitted
    assert_signal_not_emitted(_health, "died")

    # Get the list of all emitted signals
    var emissions := get_signal_emit_count(_health, "health_changed")
    assert_eq(emissions, 1)
```

---

## Waiting

Use these inside `async` test functions (functions that `await`).

### Wait a fixed duration

```gdscript
func test_animation_finishes() -> void:
    _player.play_death_animation()
    await wait_seconds(1.0)
    assert_true(_player.is_dead)
```

### Wait a number of frames

```gdscript
func test_physics_step() -> void:
    _body.apply_force(Vector2(100, 0))
    await wait_frames(5)
    assert_gt(_body.velocity.x, 0)
```

### Wait for a signal (with timeout)

```gdscript
func test_emits_ready() -> void:
    var node := add_child_autofree(MyNode.new())
    await wait_for_signal(node.ready, 2.0)
    assert_true(node.is_ready)
```

---

## Common Assertion Reference

| Assertion                                         | Description                              |
|---------------------------------------------------|------------------------------------------|
| `assert_eq(actual, expected)`                     | Values are equal                         |
| `assert_ne(actual, expected)`                     | Values are not equal                     |
| `assert_true(value)`                              | Value is truthy                          |
| `assert_false(value)`                             | Value is falsy                           |
| `assert_null(value)`                              | Value is null                            |
| `assert_not_null(value)`                          | Value is not null                        |
| `assert_gt(actual, expected)`                     | actual > expected                        |
| `assert_lt(actual, expected)`                     | actual < expected                        |
| `assert_gte(actual, expected)`                    | actual >= expected                       |
| `assert_lte(actual, expected)`                    | actual <= expected                       |
| `assert_between(actual, low, high)`               | low <= actual <= high                    |
| `assert_almost_eq(actual, expected, margin)`      | Floats equal within margin               |
| `assert_has(collection, item)`                    | Array/Dictionary contains item           |
| `assert_does_not_have(collection, item)`          | Array/Dictionary does not contain item   |
| `assert_string_contains(str, sub)`                | String contains substring                |
| `assert_string_starts_with(str, prefix)`          | String starts with prefix                |
| `assert_signal_emitted(obj, signal_name)`         | Signal was emitted at least once         |
| `assert_signal_not_emitted(obj, signal_name)`     | Signal was never emitted                 |
| `assert_signal_emitted_with_parameters(obj, signal_name, params)` | Signal emitted with exact args |
| `assert_called(double, method_name)`              | Double method was called                 |
| `assert_not_called(double, method_name)`          | Double method was not called             |
| `assert_called_with_parameters(double, method, args)` | Double method called with args      |
| `assert_call_count(double, method, count)`        | Double method called exactly N times     |

---

## CLI Flags

```bash
godot --headless -s addons/gut/gut_cmdln.gd [flags]
```

| Flag                          | Description                                          |
|-------------------------------|------------------------------------------------------|
| `-gdir=res://tests`           | Directory to scan for test files                     |
| `-gtest=res://tests/test_x.gd`| Run a single test file                               |
| `-gselect=test_method_name`   | Run a single test method by name                     |
| `-gprefix=test_`              | File prefix to look for (default: `test_`)           |
| `-gsuffix=.gd`                | File suffix to look for (default: `.gd`)             |
| `-glog=0..3`                  | Log verbosity: 0=quiet, 1=default, 2=verbose, 3=max  |
| `-gexit`                      | Exit Godot after tests complete (required for CI)    |
| `-gexit_on_failure`           | Exit with error code if any test fails               |
| `-goutput_dir=res://results`  | Directory to write result files                      |
| `-gjunit_xml_file=report.xml` | Write JUnit-compatible XML report                    |
| `-gconfig=res://gut_config.json` | Load configuration from JSON file                 |

### Minimal CI invocation

```bash
godot --headless \
  -s addons/gut/gut_cmdln.gd \
  -gdir=res://tests \
  -gexit \
  -gexit_on_failure \
  -glog=2
```
