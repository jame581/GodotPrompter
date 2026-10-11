# Memory Management & Object Pooling

Reference for `skills/godot-optimization/SKILL.md` — runtime memory monitoring, ResourceLoader caching, freeing semantics, and object pooling for high-churn entities.

> ← Back to [SKILL.md](../SKILL.md)

---

## Memory Management

### Monitoring Memory at Runtime

```gdscript
# Query engine memory monitors via Performance singleton
func _print_memory_stats() -> void:
    var static_mem  := Performance.get_monitor(Performance.MEMORY_STATIC)
    var peak_mem    := Performance.get_monitor(Performance.MEMORY_STATIC_MAX)
    var video_ram   := Performance.get_monitor(Performance.RENDER_VIDEO_MEM_USED)
    var obj_count   := Performance.get_monitor(Performance.OBJECT_COUNT)
    var node_count  := Performance.get_monitor(Performance.OBJECT_NODE_COUNT)

    print("Static RAM : %.2f MB" % (static_mem   / 1_048_576.0))
    print("Peak RAM   : %.2f MB" % (peak_mem     / 1_048_576.0))
    print("Video RAM  : %.2f MB" % (video_ram    / 1_048_576.0))
    print("Objects    : %d" % obj_count)
    print("Nodes      : %d" % node_count)
```

**C#:**

```csharp
// Query engine memory monitors via Performance singleton
private void PrintMemoryStats()
{
    double staticMem = Performance.GetMonitor(Performance.Monitor.MemoryStatic);
    double peakMem = Performance.GetMonitor(Performance.Monitor.MemoryStaticMax);
    double videoRam = Performance.GetMonitor(Performance.Monitor.RenderVideoMemUsed);
    double objCount = Performance.GetMonitor(Performance.Monitor.ObjectCount);
    double nodeCount = Performance.GetMonitor(Performance.Monitor.ObjectNodeCount);

    GD.Print($"Static RAM : {staticMem / 1_048_576.0:F2} MB");
    GD.Print($"Peak RAM   : {peakMem / 1_048_576.0:F2} MB");
    GD.Print($"Video RAM  : {videoRam / 1_048_576.0:F2} MB");
    GD.Print($"Objects    : {objCount:F0}");
    GD.Print($"Nodes      : {nodeCount:F0}");
}
```

Watch for `MEMORY_STATIC` growing between identical scene loads — this usually means a resource is held by a long-lived reference.

### ResourceLoader Caching Behaviour

Godot caches every resource loaded via `load()` or `preload()` by path. Subsequent loads of the same path return the **same instance** from cache. This means:

- Resources are shared by default — modifying one instance modifies all users.
- Use `resource.duplicate()` when you need a per-instance copy (e.g. per-enemy stats).
- Resources are not freed until all references are released **and** the cache entry is cleared.

```gdscript
# Shared resource — all enemies use the same stats object (intended for read-only data)
const EnemyStats: Resource = preload("res://data/enemy_stats.tres")

# Per-instance copy — each enemy gets its own mutable copy
func _ready() -> void:
    _stats = EnemyStats.duplicate()
    _stats.health = _stats.max_health  # safe to modify
```

To force a resource out of the cache:

```gdscript
# Remove from ResourceLoader cache — the resource will be freed once
# all script references to it are also released.
ResourceLoader.load_threaded_request("res://large_texture.png")  # if using async
# For synchronous cache eviction there is no direct API; drop all references
# and call OS.gc() or wait for the next GC pass.
```

For large resources that are only needed temporarily (e.g. a loading-screen video), keep them in a local variable and let it go out of scope — Godot's reference counting will free it.

### Freeing Unused Resources

```gdscript
# Nodes: always use queue_free() unless you need synchronous teardown
func _on_enemy_died() -> void:
    queue_free()  # safe — deferred until end of current frame processing

# Nodes: free() is synchronous and immediate — only use when you are certain
# no other code will access the node in the same frame
func _force_remove_node(node: Node) -> void:
    node.free()  # dangerous if called from a signal emitted by `node` itself

# Non-node RefCounted resources are freed automatically when the last
# reference is released — no manual call needed.
var texture: ImageTexture = ImageTexture.new()
# texture is freed when it goes out of scope or is set to null

# Non-node Object (not RefCounted) — must be freed manually
var raw_obj := Object.new()
raw_obj.free()
```

**C#:**

```csharp
// Nodes: always use QueueFree() unless you need synchronous teardown
private void OnEnemyDied()
{
    QueueFree(); // safe — deferred until end of current frame
}

// Non-node RefCounted resources are freed automatically when the last
// reference is released (C# GC + Godot ref counting work together).
ImageTexture texture = new();
// texture is freed when it goes out of scope or is set to null

// Non-node GodotObject (not RefCounted) — must be freed manually
var rawObj = new GodotObject();
rawObj.Free();
```

### queue_free vs free

| Method | Timing | Safe inside callbacks | Use when |
|---|---|---|---|
| `queue_free()` | End of current frame | Yes | Normal node removal |
| `free()` | Immediate | Only if not inside own signal | Synchronous teardown, editor tools |

Always prefer `queue_free()` for nodes created during gameplay. `free()` inside a signal handler emitted by the same node is undefined behaviour and will crash.

---

## Object Pooling

Calling `instantiate()` and `queue_free()` repeatedly for short-lived objects (bullets, hit effects, particles) is expensive because each cycle allocates and deallocates memory and re-runs `_ready()`. A pool pre-allocates a fixed set of instances and recycles them.

### GDScript Pool

```gdscript
# object_pool.gd
class_name ObjectPool
extends Node

@export var scene: PackedScene
@export var initial_size: int = 20
@export var grow_size: int = 10

var _pool: Array[Node] = []

func _ready() -> void:
    _grow(initial_size)

## Return an available instance from the pool, growing the pool if needed.
func get_instance() -> Node:
    for instance in _pool:
        if not instance.is_inside_tree() or not instance.visible:
            _activate(instance)
            return instance
    # Pool exhausted — grow and return one new instance
    push_warning("ObjectPool: pool exhausted, growing by %d" % grow_size)
    _grow(grow_size)
    return get_instance()

## Return an instance to the pool by deactivating it.
func release(instance: Node) -> void:
    instance.visible = false
    instance.set_process(false)
    instance.set_physics_process(false)
    # Move off-screen so it does not interfere with queries
    if instance is Node2D:
        (instance as Node2D).global_position = Vector2(-10_000, -10_000)
    elif instance is Node3D:
        (instance as Node3D).global_position = Vector3(-10_000, -10_000, -10_000)

# --- private ---

func _grow(count: int) -> void:
    for i in count:
        var instance := scene.instantiate()
        add_child(instance)
        instance.visible = false
        instance.set_process(false)
        instance.set_physics_process(false)
        _pool.append(instance)

func _activate(instance: Node) -> void:
    instance.visible = true
    instance.set_process(true)
    instance.set_physics_process(true)
```

**Usage:**

```gdscript
# bullet_spawner.gd
@onready var _pool: ObjectPool = $BulletPool

func _fire(direction: Vector2) -> void:
    var bullet: Bullet = _pool.get_instance() as Bullet
    bullet.global_position = $Muzzle.global_position
    bullet.direction = direction
    bullet.speed = 600.0

# In bullet.gd — return self to pool when done
func _on_hit_something() -> void:
    # Do not queue_free — return to pool instead
    _pool.release(self)
```

### C# Pool

```csharp
// ObjectPool.cs
using Godot;
using System.Collections.Generic;

public partial class ObjectPool : Node
{
    [Export] public PackedScene Scene { get; set; }
    [Export] public int InitialSize { get; set; } = 20;
    [Export] public int GrowSize { get; set; } = 10;

    private readonly List<Node> _pool = new();

    public override void _Ready()
    {
        Grow(InitialSize);
    }

    /// <summary>Returns an available instance from the pool, growing if needed.</summary>
    public T GetInstance<T>() where T : Node
    {
        foreach (var node in _pool)
        {
            if (node is CanvasItem ci && !ci.Visible)
            {
                Activate(node);
                return (T)node;
            }
            if (node is Node3D n3d && !n3d.Visible)
            {
                Activate(node);
                return (T)node;
            }
        }
        GD.PushWarning($"ObjectPool: pool exhausted, growing by {GrowSize}");
        Grow(GrowSize);
        return GetInstance<T>();
    }

    /// <summary>Returns an instance to the pool.</summary>
    public void Release(Node instance)
    {
        if (instance is CanvasItem ci)
        {
            ci.Visible = false;
            if (instance is Node2D n2d)
                n2d.GlobalPosition = new Vector2(-10_000f, -10_000f);
        }
        else if (instance is Node3D n3d)
        {
            n3d.Visible = false;
            n3d.GlobalPosition = new Vector3(-10_000f, -10_000f, -10_000f);
        }
        instance.SetProcess(false);
        instance.SetPhysicsProcess(false);
    }

    private void Grow(int count)
    {
        for (int i = 0; i < count; i++)
        {
            var instance = Scene.Instantiate();
            AddChild(instance);
            if (instance is CanvasItem ci) ci.Visible = false;
            else if (instance is Node3D n3d) n3d.Visible = false;
            instance.SetProcess(false);
            instance.SetPhysicsProcess(false);
            _pool.Add(instance);
        }
    }

    private static void Activate(Node instance)
    {
        if (instance is CanvasItem ci) ci.Visible = true;
        else if (instance is Node3D n3d) n3d.Visible = true;
        instance.SetProcess(true);
        instance.SetPhysicsProcess(true);
    }
}
```

**Usage in C#:**

```csharp
// BulletSpawner.cs
public partial class BulletSpawner : Node2D
{
    [Export] private ObjectPool _pool;

    private void Fire(Vector2 direction)
    {
        var bullet = _pool.GetInstance<Bullet>();
        bullet.GlobalPosition = GetNode<Marker2D>("Muzzle").GlobalPosition;
        bullet.Direction = direction;
    }
}

// Bullet.cs — return to pool instead of QueueFree
public partial class Bullet : CharacterBody2D
{
    [Export] private ObjectPool _pool;

    private void OnHitSomething()
    {
        _pool.Release(this);
    }
}
```
