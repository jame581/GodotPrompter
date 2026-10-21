# Lambda Functions

Reference for `skills/gdscript-patterns/SKILL.md` — lambda syntax, inline signal connections, `Array` methods with lambdas, and closures.

> ← Back to [SKILL.md](../SKILL.md)

---

## 3. Lambda Functions

Lambdas are inline anonymous functions, useful for callbacks, sorting, filtering.

### Basic Syntax

```gdscript
# Single-expression lambda
var double := func(x: int) -> int: return x * 2

# Multi-line lambda
var greet := func(name: String) -> void:
    print("Hello, %s!" % name)
    print("Welcome!")

# Calling a lambda
double.call(5)  # returns 10
greet.call("Player")
```

### With Signals

```gdscript
# Inline signal connection (one-off use)
$Button.pressed.connect(func(): print("Button pressed!"))

# With arguments
$Timer.timeout.connect(func():
    health -= 1
    if health <= 0:
        die()
)

# One-shot connection (auto-disconnects after first call)
$Timer.timeout.connect(func(): print("Once!"), CONNECT_ONE_SHOT)
```

### With Array Methods

```gdscript
var numbers: Array[int] = [1, 2, 3, 4, 5, 6, 7, 8]

# Filter — keep elements where lambda returns true
var evens: Array[int] = numbers.filter(func(n: int) -> bool: return n % 2 == 0)
# [2, 4, 6, 8]

# Map — transform each element
var doubled: Array[int] = numbers.map(func(n: int) -> int: return n * 2)
# [2, 4, 6, 8, 10, 12, 14, 16]

# Reduce — accumulate into single value
var total: int = numbers.reduce(func(acc: int, n: int) -> int: return acc + n, 0)
# 36

# Any / All
var has_negative: bool = numbers.any(func(n: int) -> bool: return n < 0)
var all_positive: bool = numbers.all(func(n: int) -> bool: return n > 0)

# Sort with custom comparison
var items: Array[Dictionary] = [{"name": "B", "value": 2}, {"name": "A", "value": 1}]
items.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return a["value"] < b["value"])
```

### Closures (Capturing Variables)

Locals are captured by value, so a captured `int` counter returns 1 on every call. Share state through a reference type:

```gdscript
func create_counter(start: int) -> Callable:
    var state := {"count": start}  # shared, so changes persist
    return func() -> int:
        state.count += 1
        return state.count

var counter := create_counter(0)
print(counter.call())  # 1
print(counter.call())  # 2
```
