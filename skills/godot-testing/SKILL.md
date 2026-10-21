---
name: godot-testing
description: Use when writing tests for Godot projects — TDD workflow with GUT and gdUnit4, covers both GDScript and C#
---

# Godot Testing

This skill covers test-driven development (TDD) for Godot 4.3+ projects using GUT (Godot Unit Testing) and gdUnit4. It includes framework selection, full RED-GREEN-REFACTOR examples, test structure, running tests in CI, and common testing patterns.

> **Related skills:** **godot-code-review** for review checklists, **dependency-injection** for test-friendly architecture, **export-pipeline** for CI/CD test automation.

## Framework Selection

| Feature               | GUT                              | gdUnit4                           |
|-----------------------|----------------------------------|-----------------------------------|
| Language              | GDScript-first, limited C#       | GDScript + C# (first-class)       |
| Install               | AssetLib or git submodule        | AssetLib or git submodule         |
| Editor integration    | Built-in GUT panel               | Built-in inspector + panel        |
| Mocking               | `double()` / `stub()` API        | `mock()` / `spy()` API            |
| Scene testing         | `add_child_autofree()`           | `auto_free()` + scene runner      |
| CI support            | `gut_cmdln.gd` CLI script        | `gdunit4_runner` CLI script       |
| C# support            | Minimal (GDScript wrappers only) | Native C# assertions + lifecycle  |
| Maturity              | Established (Godot 3 + 4)        | Godot 4 focused, actively updated |
| Best for              | Pure GDScript projects           | Mixed GDScript/C# or C#-only      |

**Rule of thumb:** Use GUT for GDScript-only projects. Use gdUnit4 for C# projects or when you need first-class C# support and scene runner utilities.

---

## TDD Workflow: RED-GREEN-REFACTOR

The standard Test-Driven Development cycle: write a failing test (RED), write minimal code to pass (GREEN), then refactor without breaking the test. Each step has its own discipline — don't skip RED (you'll write tests that pass trivially), and don't skip REFACTOR (technical debt compounds).

> See [references/tdd-workflow.md](references/tdd-workflow.md) for a worked GDScript + C# example walking through all three steps on a HealthComponent.

---

## Test Directory Structure

```
res://
├── src/
│   └── components/
│       ├── health_component.gd
│       └── HealthComponent.cs
└── tests/
    ├── unit/
    │   ├── test_health_component.gd      # GUT: test_ prefix required
    │   └── HealthComponentTest.cs        # gdUnit4 C#: [TestSuite] attribute
    ├── integration/
    │   ├── test_player_scene.gd
    │   └── PlayerSceneTest.cs
    └── gut_config.json                   # GUT configuration (optional)
```

### Naming conventions

| Framework | GDScript file       | C# file              | Test method prefix/attribute |
|-----------|---------------------|----------------------|------------------------------|
| GUT       | `test_*.gd`         | N/A                  | `func test_*()`              |
| gdUnit4   | `test_*.gd`         | `*Test.cs`           | `func test_*()` / `[TestCase]` |

---

## Running Tests

Both frameworks ship a CLI runner. **GUT:** `addons/gut/gut_cmdln.gd` invoked via `godot --headless --path . -s addons/gut/gut_cmdln.gd`. **gdUnit4:** `--add-gdunit-test-runner` argument, or via the editor "GdUnit Tests" dock. CI: tag-triggered or PR-triggered GitHub Action that installs Godot, runs the suite, exits non-zero on failure.

> See [references/running-tests.md](references/running-tests.md) for full GUT and gdUnit4 CLI invocations + a copy-pasteable GitHub Actions workflow.

---

## Testing Patterns

Four common patterns: **scenes with nodes** (instantiate via `add_child` in `before_each`, free in `after_each`), **signal testing** (assert that emitting works and connect-then-emit fires), **mocking/doubling** (gdUnit4 `Mock<T>` or hand-rolled fakes via `@export` injection), **async** (await yields, signals, frames in tests).

> See [references/testing-patterns.md](references/testing-patterns.md) for full code on each pattern (GDScript + C# where applicable).

---

## Common Assertions

### GUT assertions

| Assertion                                    | Description                        |
|----------------------------------------------|------------------------------------|
| `assert_eq(actual, expected)`                | Equality                           |
| `assert_ne(actual, expected)`                | Not equal                          |
| `assert_true(value)`                         | Is truthy                          |
| `assert_false(value)`                        | Is falsy                           |
| `assert_null(value)`                         | Is null                            |
| `assert_not_null(value)`                     | Is not null                        |
| `assert_gt(actual, expected)`                | Greater than                       |
| `assert_lt(actual, expected)`                | Less than                          |
| `assert_gte(actual, expected)`               | Greater than or equal              |
| `assert_lte(actual, expected)`               | Less than or equal                 |
| `assert_has(collection, item)`               | Collection contains item           |
| `assert_does_not_have(collection, item)`     | Collection does not contain item   |
| `assert_string_contains(str, sub)`           | String contains substring          |
| `assert_almost_eq(actual, expected, margin)` | Float equality within margin       |
| `assert_signal_emitted(obj, signal_name)`    | Signal was emitted                 |
| `assert_signal_not_emitted(obj, signal_name)`| Signal was not emitted             |

### gdUnit4 assertions (GDScript + C#)

| GDScript                                           | C#                                              | Description                     |
|----------------------------------------------------|-------------------------------------------------|---------------------------------|
| `assert_that(val).is_equal(exp)`                   | `AssertThat(val).IsEqual(exp)`                  | Equality                        |
| `assert_that(val).is_not_equal(exp)`               | `AssertThat(val).IsNotEqual(exp)`               | Not equal                       |
| `assert_that(val).is_true()`                       | `AssertThat(val).IsTrue()`                      | Is true                         |
| `assert_that(val).is_false()`                      | `AssertThat(val).IsFalse()`                     | Is false                        |
| `assert_that(val).is_null()`                       | `AssertThat(val).IsNull()`                      | Is null                         |
| `assert_that(val).is_not_null()`                   | `AssertThat(val).IsNotNull()`                   | Is not null                     |
| `assert_that(val).is_greater(exp)`                 | `AssertThat(val).IsGreater(exp)`                | Greater than                    |
| `assert_that(val).is_less(exp)`                    | `AssertThat(val).IsLess(exp)`                   | Less than                       |
| `assert_that(val).is_between(min, max)`            | `AssertThat(val).IsBetween(min, max)`           | In range (inclusive)            |
| `assert_that(arr).contains([a, b])`                | `AssertThat(arr).Contains(a, b)`                | Array contains elements         |
| `assert_that(str).contains("sub")`                 | `AssertThat(str).Contains("sub")`               | String contains substring       |
| `assert_that(val).is_approximately(exp, margin)`   | `AssertThat(val).IsApproximately(exp, margin)`  | Float within margin             |
| `assert_signal(mon).is_emitted("name")`            | `AssertSignal(mon).IsEmitted("name")`           | Signal emitted                  |

---

## What NOT to Test

Avoid testing things that add noise without catching real bugs:

- **Godot engine internals** — do not assert that `Node.add_child()` works or that `@export` variables show up in the editor
- **Private implementation details** — test behavior through the public API; if a refactor breaks a test that covers only private state, the test is wrong
- **Visual/rendering output** — pixel-level rendering results are brittle; test the data driving the visuals instead
- **Timing-sensitive floats without margins** — use `assert_almost_eq` / `IsApproximately` for physics values
- **One-liners that wrap a built-in** — a property getter that just returns a field needs no test
- **Every possible invalid input** — test the documented contract, not every imaginable misuse

---

## Checklist

- [ ] Each test file matches the naming convention for the chosen framework (`test_*.gd` / `*Test.cs`)
- [ ] Tests extend the correct base class (`GutTest` / `GdUnit4.GdUnitTestSuite`)
- [ ] Nodes added to the scene tree use `add_child_autofree` or `auto_free` — never manual `queue_free()`
- [ ] Signals are watched before the action that triggers them
- [ ] Mocks/doubles are used for external dependencies, not for the unit under test
- [ ] Each test covers exactly one behavior (one logical assertion per test)
- [ ] CI workflow runs tests headlessly on every push and PR
- [ ] Flaky async tests use explicit timeouts, not arbitrary sleep durations
- [ ] Tests pass before merging (RED is only acceptable while actively implementing)
