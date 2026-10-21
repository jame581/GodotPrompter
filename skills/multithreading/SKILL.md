---
name: multithreading
description: Use when running work off the main thread — WorkerThreadPool, Thread/Mutex/Semaphore, call_deferred, thread-safe scene access, and threaded resource loading
---

# Multithreading

Run expensive work off the main thread without corrupting the scene tree. Prefer `WorkerThreadPool` for short parallel jobs; reach for `Thread`/`Mutex`/`Semaphore` only when you need a long-lived worker.

> **Related skills:** **godot-optimization** for profiling before threading, **assets-pipeline** for asset import, **csharp-godot** for C# specifics, **gdscript-advanced** for async/await pitfalls.

---

## 1. Threading model & safety rules

The main thread owns the scene tree — **interacting with the active scene tree is not thread-safe.** Observe these doc-sourced rules:

- **Servers** (RenderingServer, PhysicsServer) are thread-safe **only after enabling it in Project Settings** (`Rendering > Driver > Thread Model = Separate`, `Physics > {2D,3D} > Run on Separate Thread`). Servers handle thousands of thread-driven instances well.
- **NavigationServer2D/3D are thread-safe and thread-friendly** (true parallel queries); tune `Navigation > Pathfinding > Max Threads`.
- **AStar2D/3D/Grid2D are NOT thread-safe** — one dedicated thread per object only; sharing one object across threads corrupts data.
- **GDScript `Array`/`Dictionary`:** reading/writing existing elements across threads is OK; **resizing (add/remove) needs a `Mutex`.**
- **No GPU work off the main thread** (texture creation, image read/modify) — causes RenderingServer sync stalls.
- **Build scene chunks off-tree** in a thread, then add them on the main thread via `add_child.call_deferred()` — only with a single loader thread (multiple threads risk tweaking the same cached resource → crashes).

> **Golden rule:** Mutate the scene tree only on the main thread. From a worker, hand results back with `call_deferred` / `set_deferred`.

---

## 2. WorkerThreadPool (preferred)

`WorkerThreadPool` is a global singleton with threads allocated at startup. A regular task (`add_task`) runs on one worker; a **group task** (`add_group_task`) is distributed across workers, calling the `Callable` repeatedly for each element index — great for iterating many elements. **Every task must be waited on** (`wait_for_task_completion` / `wait_for_group_task_completion`) or its allocated resources leak. Distributing cheap work can hurt performance — only use it for genuinely expensive work.

### GDScript

```gdscript
var enemies = [] # Filled with enemies elsewhere.

func process_enemy_ai(enemy_index):
    var processed_enemy = enemies[enemy_index]
    # Expensive per-enemy logic...

func _process(delta):
    var task_id = WorkerThreadPool.add_group_task(process_enemy_ai, enemies.size())
    # ... other main-thread work ...
    WorkerThreadPool.wait_for_group_task_completion(task_id)
    # Safe to read results now.
```

### C# Equivalent

```csharp
private List<Node> _enemies = new(); // Filled with enemies elsewhere.

private void ProcessEnemyAI(int enemyIndex)
{
    Node processedEnemy = _enemies[enemyIndex];
    // Expensive per-enemy logic...
}

public override void _Process(double delta)
{
    long taskId = WorkerThreadPool.AddGroupTask(Callable.From<int>(ProcessEnemyAI), _enemies.Count);
    // ... other main-thread work ...
    WorkerThreadPool.WaitForGroupTaskCompletion(taskId);
    // Safe to read results now.
}
```

This relies on the element count staying constant during the multithreaded part.

---

## 3. Thread / Mutex / Semaphore

Real signatures: `Thread.start(callable: Callable, priority := PRIORITY_NORMAL)`, `wait_to_finish()` (blocks; join before free), `is_alive()`. `Mutex` is reentrant (`lock`/`unlock`/`try_lock`). `Semaphore` exposes `wait()` / `post(count := 1)`.

### GDScript

The canonical semaphore producer/consumer + clean-shutdown idiom:

```gdscript
var counter := 0
var mutex: Mutex
var semaphore: Semaphore
var thread: Thread
var exit_thread := false

func _ready():
    mutex = Mutex.new()
    semaphore = Semaphore.new()
    thread = Thread.new()
    thread.start(_thread_function)

func _thread_function():
    while true:
        semaphore.wait() # Block until there is work.

        mutex.lock()
        var should_exit = exit_thread
        mutex.unlock()
        if should_exit:
            break

        mutex.lock()
        counter += 1
        mutex.unlock()

func increment_counter():
    semaphore.post() # Wake the worker.

func _exit_tree():
    mutex.lock()
    exit_thread = true
    mutex.unlock()
    semaphore.post()        # Unblock so it can see exit_thread.
    thread.wait_to_finish() # Join.
```

### C# Equivalent

`Godot.Mutex`/`Godot.Semaphore` also exist, but `System.Threading` is idiomatic in C#:

```csharp
using Godot;
using System.Threading;

public partial class Worker : Node
{
    private int _counter;
    private readonly object _lock = new();
    private readonly SemaphoreSlim _semaphore = new(0);
    private Thread _thread;
    private volatile bool _exitThread;

    public override void _Ready()
    {
        _thread = new Thread(ThreadFunction) { IsBackground = true };
        _thread.Start();
    }

    private void ThreadFunction()
    {
        while (true)
        {
            _semaphore.Wait();           // Block until there is work.
            if (_exitThread) break;
            lock (_lock) { _counter++; }
        }
    }

    public void IncrementCounter() => _semaphore.Release(); // Wake the worker.

    public override void _ExitTree()
    {
        _exitThread = true;
        _semaphore.Release();            // Unblock so it can see _exitThread.
        _thread.Join();                  // Join.
    }
}
```

Thread creation is slow (especially on Windows) — pre-create before heavy work, not just-in-time. Over-locking mutexes is also costly.

---

## 4. Handing results back: call_deferred / set_deferred

### GDScript

```gdscript
# Unsafe from a worker thread:
world.add_child(enemy)
# Safe:
world.add_child.call_deferred(enemy)
```

### C# Equivalent

```csharp
// Unsafe from a worker thread:
world.AddChild(enemy);
// Safe — use the MethodName StringName constant, NOT "AddChild":
world.CallDeferred(Node.MethodName.AddChild, enemy);
```

In C#, `CallDeferred("AddChild")` fails — the deferred/`Call`/`Connect` APIs use Godot's snake_case names. Prefer the `Node.MethodName.*` constants (avoids the pitfall and an allocation).

---

## 5. Threaded resource loading

`ResourceLoader.load_threaded_request(path)` starts the load. Poll `load_threaded_get_status(path, progress)` each frame (`progress[0]` is the 0–1 ratio); on `THREAD_LOAD_LOADED` call `load_threaded_get(path)`. **`load_threaded_get` blocks like `load()` if the load is not finished** — always poll first. Statuses: `THREAD_LOAD_INVALID_RESOURCE` / `THREAD_LOAD_IN_PROGRESS` / `THREAD_LOAD_FAILED` / `THREAD_LOAD_LOADED`.

### GDScript

```gdscript
const SCENE_PATH := "res://enemy.tscn"
var _progress: Array = []

func _ready():
    ResourceLoader.load_threaded_request(SCENE_PATH)

func _process(_delta):
    var status := ResourceLoader.load_threaded_get_status(SCENE_PATH, _progress)
    match status:
        ResourceLoader.THREAD_LOAD_IN_PROGRESS:
            $ProgressBar.value = _progress[0] * 100.0
        ResourceLoader.THREAD_LOAD_LOADED:
            var scene: PackedScene = ResourceLoader.load_threaded_get(SCENE_PATH)
            add_child(scene.instantiate())
            set_process(false)
        ResourceLoader.THREAD_LOAD_FAILED, ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
            push_error("Threaded load failed: %s" % SCENE_PATH)
            set_process(false)
```

### C# Equivalent

```csharp
private const string ScenePath = "res://enemy.tscn";
private readonly Godot.Collections.Array _progress = new();

public override void _Ready() => ResourceLoader.LoadThreadedRequest(ScenePath);

public override void _Process(double delta)
{
    var status = ResourceLoader.LoadThreadedGetStatus(ScenePath, _progress);
    switch (status)
    {
        case ResourceLoader.ThreadLoadStatus.InProgress:
            GetNode<ProgressBar>("ProgressBar").Value = (double)_progress[0] * 100.0;
            break;
        case ResourceLoader.ThreadLoadStatus.Loaded:
            var scene = (PackedScene)ResourceLoader.LoadThreadedGet(ScenePath);
            AddChild(scene.Instantiate());
            SetProcess(false);
            break;
        case ResourceLoader.ThreadLoadStatus.Failed:
        case ResourceLoader.ThreadLoadStatus.InvalidResource:
            GD.PushError($"Threaded load failed: {ScenePath}");
            SetProcess(false);
            break;
    }
}
```

> **Godot 4.7+:** 4.7 shipped several threaded-load correctness fixes — `load_threaded_get()` deadlocks ([GH-119757](https://github.com/godotengine/godot/pull/119757), [GH-120077](https://github.com/godotengine/godot/pull/120077)), a race in `load_threaded_request()` ([GH-118824](https://github.com/godotengine/godot/pull/118824)), and resources returned by `load_threaded_get()` never being unloaded ([GH-119394](https://github.com/godotengine/godot/pull/119394)). No API change; if you carry workarounds for rare threaded-load hangs or leaks from earlier versions, re-test on 4.7 before keeping them. The poll-before-get rule above still applies.

---

## 6. C# concurrency: Tasks vs Godot threads

In C#, prefer `System.Threading.Tasks.Task.Run` / `async`-`await` for fire-and-forget CPU work; **never touch Godot objects or `await ToSignal(...)` from a background thread** — marshal results back with `CallDeferred`. Use `WorkerThreadPool` when you want Godot's pool and engine integration; use `Task` when you want .NET idioms. (GDScript users: use `WorkerThreadPool` or `Thread` from the sections above.)

```csharp
public override void _Process(double delta)
{
    if (Input.IsActionJustPressed("compute"))
    {
        _ = System.Threading.Tasks.Task.Run(() =>
        {
            int result = ExpensiveComputation();   // Pure CPU work, no Godot objects.
            CallDeferred(MethodName.OnComputed, result); // Marshal back to main thread.
        });
    }
}

private void OnComputed(int result) => GD.Print($"Done: {result}");
```

> **Deeper:** see [Pitfalls & deadlocks](references/pitfalls.md) for data races, the `ERR_BUSY` nested-wait deadlock, and when threading hurts.

---

## Implementation Checklist

- [ ] Profiled first — confirmed the work is genuinely CPU-expensive (see **godot-optimization**)
- [ ] Scene-tree mutations happen only on the main thread (`call_deferred` / `set_deferred`)
- [ ] Every `WorkerThreadPool` task is waited on (`wait_for_*_completion`)
- [ ] Shared state guarded by a `Mutex` / `lock`; container resizes are locked
- [ ] Threads joined (`wait_to_finish` / `Join`) before the owning node frees
- [ ] No GPU calls, no AStar sharing, no same-resource loads across threads
- [ ] Threaded loads poll status before calling `load_threaded_get`
