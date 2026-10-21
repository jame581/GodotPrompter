---
name: dependency-injection
description: Use when managing dependencies between systems — autoloads, service locators, @export injection, and scene injection patterns
---

# Dependency Injection in Godot 4.3+

Patterns for wiring dependencies between systems so nodes stay loosely coupled, swappable, and testable. All examples target Godot 4.3+ with no deprecated APIs.

> **Related skills:** **godot-testing** for test-friendly architecture, **event-bus** for signal-based decoupling, **godot-project-setup** for autoload registration.

---

## 1. The Problem

Tight coupling makes code hard to test, extend, and swap. The most common form in Godot is reaching directly into a global autoload from everywhere in the codebase.

```gdscript
# BAD — tight coupling via direct autoload access scattered everywhere

# player.gd
func take_damage(amount: int) -> void:
    health -= amount
    AudioManager.play_sfx("hurt")          # hard dependency on AudioManager
    UIManager.update_health_bar(health)    # hard dependency on UIManager
    if health <= 0:
        GameState.record_death()           # hard dependency on GameState

# enemy.gd
func attack() -> void:
    AudioManager.play_sfx("attack")        # same AudioManager dependency again
```

```csharp
// BAD — tight coupling via direct autoload / global access scattered everywhere

// Player.cs
public partial class Player : CharacterBody3D
{
    private int _health = 100;

    public void TakeDamage(int amount)
    {
        _health -= amount;
        GetNode<AudioManager>("/root/AudioManager").PlaySfx("hurt");        // hard dependency
        GetNode<UIManager>("/root/UIManager").UpdateHealthBar(_health);     // hard dependency
        if (_health <= 0)
            GetNode<GameState>("/root/GameState").RecordDeath();            // hard dependency
    }
}

// Enemy.cs
public partial class Enemy : CharacterBody3D
{
    public void Attack()
    {
        GetNode<AudioManager>("/root/AudioManager").PlaySfx("attack");      // same dependency again
    }
}
```

**Problems with this approach:**

- Every node that calls `AudioManager` directly is coupled to its concrete implementation.
- Swapping `AudioManager` for a different implementation requires changing every caller.
- Unit-testing `Player` in isolation is impossible — `AudioManager`, `UIManager`, and `GameState` must all exist and be valid.
- Autoload initialization order bugs silently break behaviour when scenes load.
- Hidden dependencies make it hard to see what a class actually needs to function.

---

## 2. Approach Comparison

| Pattern | Complexity | Testability | Best For |
|---|---|---|---|
| **Autoloads** | Low | Low | Truly global singletons: audio, settings, platform services |
| **@export Injection** | Low | High | Most nodes — wire deps in the editor, no runtime lookup needed |
| **Service Locator** | Medium | Medium | Plugins, optional systems, swappable implementations at runtime |
| **Scene Injection** | Low | High | Parent-to-child wiring: Level sets up Enemy, HUD sets up sub-panels |

---

## 3. Autoloads as Singletons

Register a script in **Project Settings → Globals → Autoload** for global access (`AudioManager.play_sfx(...)`, `GameState.score = 100`). Best for cross-cutting concerns: audio, save state, event bus, settings. Resist autoloading domain-specific systems (those should be scene-injected).

> See [references/autoloads.md](references/autoloads.md) for the full AudioManager example (SFX + crossfade music) in GDScript + C#.

---

## 4. @export Node Injection

Expose collaborator nodes as `@export var health_component: HealthComponent`, then wire in the Inspector or via parent scene. Lifecycle: `@export` properties are assigned BEFORE `_ready()`.

> See [references/export-injection.md](references/export-injection.md) for full `@export` patterns (GDScript + C#) and lifecycle notes.

---

## 5. Service Locator Pattern

A central registry autoload mapping `String` keys to service instances. Services register themselves at `_ready()`, deregister at `_exit_tree()`, consumers call `ServiceLocator.get(name)`. Useful when you want flexible runtime swap of implementations (testing, mods, A/B variants).

> See [references/service-locator.md](references/service-locator.md) for the full Service Locator (GDScript + C#) with typed helper methods.

---

## 6. Scene Injection

Parent scene loads its children, then in `_ready()` walks the tree assigning dependencies (`enemy.player = $Player`). Children declare `@export` properties but the parent — not the Inspector — sets them. Best for game-specific dependencies that change per level.

> See [references/scene-injection.md](references/scene-injection.md) for the parent-injects-children pattern (GDScript + C#).

---

## 7. Testing with Dependency Injection

Injecting fakes / test doubles is what makes nodes testable. For autoloads: mock-replace before the test scene loads. For `@export` injection: swap the export to a test double. For Service Locator: register a fake under the same key.

> See [references/testing-with-di.md](references/testing-with-di.md) for GUT-based test patterns showing each injection technique.

---

## 8. When to Use What

| Situation | Recommended Pattern |
|---|---|
| Service used by nearly every node in every scene | Autoload singleton |
| Node needs 1–3 deps, scene is editor-authored | `@export` injection |
| System is optional or swappable at runtime | Service Locator |
| Parent scene constructs children and knows their needs | Scene injection |
| Writing tests for a node with external dependencies | `@export` or property injection + stubs |
| Plugin that must work in any project | Service Locator (self-registers, no assumptions) |
| Two sibling nodes need the same dep | Let their parent hold it and inject downward |

**Quick decision guide:**

```
Does every scene in the project need it?
  YES → Autoload singleton
  NO  ↓

Is the dependency known at edit-time and wired in the Inspector?
  YES → @export injection
  NO  ↓

Does the dependency need to be swapped at runtime (plugins, A/B testing)?
  YES → Service Locator
  NO  ↓

Does a parent scene own both the consumer and the dependency?
  YES → Scene injection
  NO  → Reconsider — either promote to autoload or restructure ownership
```

---

## 9. Anti-patterns

### Autoload for everything

```gdscript
# BAD — GameManager, EnemySpawner, InventorySystem, DialogueSystem all as autoloads.
# Every node in the game is coupled to every other system at module level.
# Test one component → must initialise all autoloads.

# GOOD — Only AudioManager, Settings, and SceneTransition are autoloads.
# EnemySpawner is a node in the Level scene, injected into enemies that need it.
```

```csharp
// BAD — GameManager, EnemySpawner, InventorySystem, DialogueSystem all as autoloads.
// Every node in the game is coupled to every other system at module level.
// Test one component → must initialise all autoloads.

// GOOD — Only AudioManager, Settings, and SceneTransition are autoloads.
// EnemySpawner is a node in the Level scene, injected into enemies that need it.
```

### Deep dependency chains

```gdscript
# BAD — Player needs HealthComponent, which needs AudioManager,
# which needs SoundBank, which needs FileSystem...
# A change deep in the chain breaks everything above it.

# GOOD — flatten: HealthComponent takes only AudioManager (or a narrow interface).
# Each node declares only immediate dependencies.
```

```csharp
// BAD — Player needs HealthComponent, which needs AudioManager,
// which needs SoundBank, which needs FileSystem...
// A change deep in the chain breaks everything above it.

// GOOD — flatten: HealthComponent takes only AudioManager (or a narrow interface).
// Each node declares only immediate dependencies.
```

### Circular dependencies

```gdscript
# BAD
# PlayerController._ready() calls ServiceLocator.get_service("inventory")
# InventorySystem._ready() calls ServiceLocator.get_service("player")
# Neither can fully initialise because the other isn't ready yet.

# GOOD — break the cycle with a signal.
# InventorySystem emits item_used; PlayerController connects to it.
# PlayerController never holds a reference to InventorySystem at all.
```

```csharp
// BAD
// PlayerController._Ready() calls ServiceLocator.GetService("inventory")
// InventorySystem._Ready() calls ServiceLocator.GetService("player")
// Neither can fully initialise because the other isn't ready yet.

// GOOD — break the cycle with a signal.
// InventorySystem emits ItemUsed; PlayerController connects to it.
// PlayerController never holds a reference to InventorySystem at all.
```

### Service Locator as a god object

```gdscript
# BAD — everything is registered: enemies, UI panels, individual nodes.
# ServiceLocator becomes a second, untyped scene tree.

# GOOD — only register stable, long-lived services (audio, analytics, save system).
# Short-lived nodes are wired by their parent via scene injection.
```

```csharp
// BAD — everything is registered: enemies, UI panels, individual nodes.
// ServiceLocator becomes a second, untyped scene tree.

// GOOD — only register stable, long-lived services (audio, analytics, save system).
// Short-lived nodes are wired by their parent via scene injection.
```

### Forgetting null checks after injection

```gdscript
# BAD — crashes if the @export was never set in the editor
func take_damage(amount: int) -> void:
    audio.play_sfx("hurt")   # NullReferenceError if audio was not wired

# GOOD — guard or assert clearly
func take_damage(amount: int) -> void:
    assert(audio != null, "HealthComponent: audio dependency was not injected")
    audio.play_sfx("hurt")

# OR — treat it as optional
func take_damage(amount: int) -> void:
    if audio != null:
        audio.play_sfx("hurt")
```

```csharp
// BAD — crashes if the [Export] was never set in the editor
public void TakeDamage(int amount)
{
    _audio.PlaySfx("hurt");   // NullReferenceException if _audio was not wired
}

// GOOD — guard or assert clearly
public void TakeDamage(int amount)
{
    if (_audio == null)
    {
        GD.PushError("HealthComponent: audio dependency was not injected");
        return;
    }
    _audio.PlaySfx("hurt");
}

// OR — treat it as optional
public void TakeDamage(int amount)
{
    _audio?.PlaySfx("hurt");
}
```

---

## 10. Checklist

- [ ] Autoloads are used only for genuinely global services (audio, settings, platform)
- [ ] Nodes declare their dependencies explicitly (`@export` or a public property) rather than calling `get_node` on distant relatives
- [ ] `@export` fields are validated (`assert` or null check) before use
- [ ] Service Locator services call `unregister` in `_exit_tree()` / `_ExitTree()`
- [ ] Scene injection is done in the parent's `_ready()`, after children are fully initialised
- [ ] No circular dependencies between services or autoloads
- [ ] Each node depends only on its immediate collaborators — no deep chains
- [ ] Test stubs/mocks are plain nodes that implement the same interface as the real service
- [ ] C# `@export` (`[Export]`) dependencies are disconnected / cleared in `_ExitTree()` if they hold event subscriptions
- [ ] Service Locator is not used to store scene-specific or short-lived nodes
