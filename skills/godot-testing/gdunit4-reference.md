# gdUnit4 Quick Reference

gdUnit4 is a testing framework for Godot 4.x with first-class support for both GDScript and C#. All examples target Godot 4.3+.

---

## Installation

**Option A — AssetLib (editor)**

1. Open the Godot editor, go to **AssetLib**
2. Search for "gdUnit4"
3. Download and install — this creates `addons/gdUnit4/`
4. Enable in **Project > Project Settings > Plugins**

**Option B — git submodule**

```bash
git submodule add https://github.com/MikeSchulze/gdUnit4.git addons/gdUnit4
```

**C# projects — add NuGet package**

```bash
dotnet add package gdUnit4.api
```

Then enable the plugin in **Project > Project Settings > Plugins**.

---

## File Conventions

### GDScript

| Convention   | Rule                                                                  |
|--------------|-----------------------------------------------------------------------|
| File name    | Must start with `test_` (e.g., `test_health_component.gd`)           |
| Class        | `extends GdUnitTestSuite`                                             |
| Test method  | Must start with `func test_`                                          |

```gdscript
# tests/unit/test_health_component.gd
extends GdUnitTestSuite

func test_example() -> void:
    assert_that(1 + 1).is_equal(2)
```

### C#

| Convention   | Rule                                                                  |
|--------------|-----------------------------------------------------------------------|
| File name    | Any name; `*Test.cs` is the convention                               |
| Class        | Decorated with `[TestSuite]`; inherits `GdUnit4.GdUnitTestSuite`     |
| Test method  | Decorated with `[TestCase]`                                           |

```csharp
// tests/unit/HealthComponentTest.cs
using GdUnit4;
using static GdUnit4.Assertions;

[TestSuite]
public partial class HealthComponentTest : GdUnit4.GdUnitTestSuite
{
    [TestCase]
    public void Example()
        => AssertThat(1 + 1).IsEqual(2);
}
```

---

## Lifecycle

### GDScript

```
before()
  for each test:
    before_test()
      test_*()
    after_test()
after()
```

```gdscript
extends GdUnitTestSuite

func before() -> void:
    # Runs once before ALL tests in this file
    pass

func after() -> void:
    # Runs once after ALL tests in this file
    pass

func before_test() -> void:
    # Runs before EACH test — set up fresh state here
    pass

func after_test() -> void:
    # Runs after EACH test — manual cleanup if needed
    pass
```

### C#

```csharp
[TestSuite]
public partial class ExampleTest : GdUnit4.GdUnitTestSuite
{
    [Before]
    public void Before()
    {
        // Runs once before ALL tests in this class
    }

    [After]
    public void After()
    {
        // Runs once after ALL tests in this class
    }

    [BeforeTest]
    public void BeforeTest()
    {
        // Runs before EACH test
    }

    [AfterTest]
    public void AfterTest()
    {
        // Runs after EACH test
    }
}
```

---

## Memory Management

### GDScript — `auto_free()`

Registers any `Object` for automatic freeing after the test. Does NOT add it to the scene tree.

```gdscript
func before_test() -> void:
    _health = auto_free(HealthComponent.new())
    add_child(_health)  # add manually if needed in the tree
```

### C# — `AutoFree<T>()`

```csharp
[BeforeTest]
public void BeforeTest()
{
    _health = AutoFree(new HealthComponent());
    AddChild(_health);
}
```

---

## Assertions API — GDScript

All assertions start with `assert_that(value)` and chain fluently.

### Values

```gdscript
assert_that(value).is_equal(expected)
assert_that(value).is_not_equal(expected)
assert_that(value).is_null()
assert_that(value).is_not_null()
assert_that(value).is_true()
assert_that(value).is_false()
assert_that(value).is_same(other)          # reference equality
assert_that(value).is_not_same(other)
```

### Numbers

```gdscript
assert_that(n).is_greater(x)
assert_that(n).is_greater_equal(x)
assert_that(n).is_less(x)
assert_that(n).is_less_equal(x)
assert_that(n).is_between(low, high)        # inclusive
assert_that(n).is_approximately(expected, margin)
assert_that(n).is_negative()
assert_that(n).is_zero()
```

### Strings

```gdscript
assert_that(str).is_equal(expected)
assert_that(str).contains("substring")
assert_that(str).not_contains("substring")
assert_that(str).starts_with("prefix")
assert_that(str).ends_with("suffix")
assert_that(str).is_empty()
assert_that(str).is_not_empty()
assert_that(str).has_length(n)
```

### Arrays

```gdscript
assert_that(arr).is_equal([1, 2, 3])
assert_that(arr).contains([2, 3])           # subset check
assert_that(arr).not_contains([4])
assert_that(arr).contains_exactly([1, 2, 3]) # exact match, any order
assert_that(arr).is_empty()
assert_that(arr).is_not_empty()
assert_that(arr).has_size(n)
```

### Signals

```gdscript
func test_signal() -> void:
    var monitor := monitor_signals(_health)
    _health.take_damage(10)

    assert_signal(monitor).is_emitted("health_changed")
    assert_signal(monitor).is_emitted("health_changed").with_parameters([100, 90])
    assert_signal(monitor).is_not_emitted("died")
    assert_signal(monitor).is_emitted("health_changed").exactly(1)
```

---

## Assertions API — C#

All assertions use static `AssertThat()` / `AssertSignal()` from `GdUnit4.Assertions`.

```csharp
using static GdUnit4.Assertions;
```

### Values

```csharp
AssertThat(value).IsEqual(expected);
AssertThat(value).IsNotEqual(expected);
AssertThat(value).IsNull();
AssertThat(value).IsNotNull();
AssertThat(value).IsTrue();
AssertThat(value).IsFalse();
AssertThat(value).IsSame(other);
AssertThat(value).IsNotSame(other);
```

### Numbers

```csharp
AssertThat(n).IsGreater(x);
AssertThat(n).IsGreaterEqual(x);
AssertThat(n).IsLess(x);
AssertThat(n).IsLessEqual(x);
AssertThat(n).IsBetween(low, high);
AssertThat(n).IsApproximately(expected, margin);
AssertThat(n).IsNegative();
AssertThat(n).IsZero();
```

### Strings

```csharp
AssertThat(str).IsEqual(expected);
AssertThat(str).Contains("substring");
AssertThat(str).NotContains("substring");
AssertThat(str).StartsWith("prefix");
AssertThat(str).EndsWith("suffix");
AssertThat(str).IsEmpty();
AssertThat(str).IsNotEmpty();
AssertThat(str).HasLength(n);
```

### Arrays / Collections

```csharp
AssertThat(arr).IsEqual(new[] { 1, 2, 3 });
AssertThat(arr).Contains(2, 3);
AssertThat(arr).NotContains(4);
AssertThat(arr).ContainsExactly(1, 2, 3);
AssertThat(arr).IsEmpty();
AssertThat(arr).IsNotEmpty();
AssertThat(arr).HasSize(n);
```

### Signals

```csharp
[TestCase]
public async GdUnitAwaiter SignalTest()
{
    var monitor = MonitorSignals(_health);
    _health.TakeDamage(10);

    AssertSignal(monitor).IsEmitted("health_changed");
    AssertSignal(monitor).IsEmitted("health_changed").WithArgs(100, 90);
    AssertSignal(monitor).IsNotEmitted("died");
    AssertSignal(monitor).IsEmitted("health_changed").Exactly(1);
    await Task.CompletedTask;
}
```

---

## Mocking API — GDScript

```gdscript
# Create a mock (all methods stubbed to return null/defaults)
var mock_health := mock(HealthComponent)

# Stub a return value
do_return(75).on(mock_health).get_health()
do_return(false).on(mock_health).is_dead()

# Stub a property getter
# (use a method wrapper or spy pattern for property stubs)

# Verify a method was called
_player.health = mock_health
_player.receive_hit(10)

verify(mock_health).take_damage(10)
verify(mock_health, times(1)).take_damage(10)    # called exactly once
verify_no_interactions(mock_health)              # use before any calls

# Spy — wraps a real object, keeps real behavior, but tracks calls
var spy_health := spy(HealthComponent.new())
add_child(auto_free(spy_health))
spy_health.take_damage(10)

assert_eq(spy_health.current_health, 90)         # real method ran
verify(spy_health).take_damage(10)               # call was tracked
```

---

## Mocking API — C#

```csharp
// Create a mock (all methods stubbed)
var mockHealth = Mock<HealthComponent>();

// Stub method return value
mockHealth.MockMethod(h => h.GetHealth(), 75);
mockHealth.MockProperty(h => h.CurrentHealth, 75);

// Use the mock
_player.HealthComponent = mockHealth;
_player.ReceiveHit(10);

// Verify calls
Verify(mockHealth).TakeDamage(10);
Verify(mockHealth, Times(1)).TakeDamage(10);
VerifyNoInteractions(mockHealth);

// Spy — real object with call tracking
var spyHealth = Spy(new HealthComponent());
AddChild(AutoFree(spyHealth));
spyHealth.TakeDamage(10);

AssertThat(spyHealth.CurrentHealth).IsEqual(90);  // real behavior
Verify(spyHealth).TakeDamage(10);                 // call tracked
```

---

## CLI Commands

### GDScript tests only

```bash
godot --headless \
  -s addons/gdUnit4/GdUnitRunner.gd \
  -- \
  --testsuites res://tests
```

### C# tests (requires .NET Godot build)

```bash
godot --headless \
  -s addons/gdUnit4/bin/GdUnit4CSharpApiLoader.cs \
  -- \
  --testsuites res://tests
```

### Common CLI flags

| Flag                          | Description                                          |
|-------------------------------|------------------------------------------------------|
| `--testsuites <path>`         | Path to test directory or specific file              |
| `--report-dir <path>`         | Output directory for HTML/XML reports                |
| `--report-count <n>`          | Number of reports to keep (default: 20)              |
| `--verbose`                   | Verbose output                                       |
| `--ignore-pause`              | Skip `pause()` calls during CI runs                  |

### Minimal CI invocation

```bash
# GDScript
godot --headless \
  -s addons/gdUnit4/GdUnitRunner.gd \
  -- \
  --testsuites res://tests \
  --report-dir ./reports

# C# (mixed project)
godot --headless \
  -s addons/gdUnit4/bin/GdUnit4CSharpApiLoader.cs \
  -- \
  --testsuites res://tests \
  --report-dir ./reports
```

### Exit codes

| Code | Meaning                  |
|------|--------------------------|
| 0    | All tests passed         |
| 1    | One or more tests failed |
