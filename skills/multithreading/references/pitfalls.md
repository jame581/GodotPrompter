# Multithreading — Pitfalls & Deadlocks

Deeper coverage for the **multithreading** skill: deadlocks, data races, the "don't await from a thread" trap, when threading hurts, and the separate-rendering-thread caveat. Back to [Multithreading](../SKILL.md).

---

## 1. Deadlocks: the `ERR_BUSY` nested-wait case

`WorkerThreadPool.wait_for_task_completion(task_id)` returns one of `OK`, `ERR_INVALID_PARAMETER`, or `ERR_BUSY`. You get `ERR_BUSY` when you wait for a task **from inside another running pool task** in a way that could deadlock — e.g. task A waits on task B while B is queued behind A on the same pool.

Rules to avoid it:

- Don't wait on a pool task from within another pool task. Structure work so the main thread issues and waits, or use `is_task_completed` / `is_group_task_completed` to poll without blocking.
- A group task's `Callable` is invoked once per element index `0..elements-1`; don't have it re-enter the pool and wait.
- Always pair every `add_task` / `add_group_task` with exactly one `wait_for_*_completion`. Skipping the wait leaks the task's allocated resources; double-waiting on a freed id gives `ERR_INVALID_PARAMETER`.

With raw `Thread`, the classic deadlock is two threads each holding one `Mutex` and waiting for the other. Always acquire multiple mutexes in a consistent global order, and keep critical sections short.

---

## 2. Data races

- **Scene tree:** never read or write live nodes from a worker. Snapshot the data you need before starting the thread, compute on the copy, and hand results back with `call_deferred` / `set_deferred`.
- **Containers:** reading/writing *existing* `Array`/`Dictionary` elements across threads is fine, but **adding, removing, or resizing** must be guarded by a `Mutex` (GDScript) or `lock` (C#). A resize can reallocate backing storage out from under a concurrent reader.
- **Shared scalars:** even an `int += 1` is a read-modify-write — guard it (`mutex.lock()/unlock()`, or `lock`/`Interlocked` in C#). Mark simple flags `volatile` in C# so the worker actually re-reads them.
- **Resources:** modifying a single unique `Resource` from multiple threads is unsupported. Passing references across threads is fine; mutating the same instance concurrently is not.

---

## 3. Don't `await` Godot signals from a thread

In C#, `await ToSignal(...)` and any access to Godot objects must happen on the **main thread** — Godot's `SynchronizationContext` only marshals correctly there. From a `Task.Run` body or a raw `System.Threading.Thread`:

- Do pure CPU work only (no Godot object reads/writes, no `GetNode`, no signal awaits).
- Marshal back with `CallDeferred(MethodName.X, ...)`, then do the Godot work in that main-thread callback.

The same applies to GDScript: don't `await` a node signal or coroutine from inside a `Thread` body; defer back first.

---

## 4. When threading hurts

- **Cheap work:** distributing tiny tasks across `WorkerThreadPool` can be slower than a plain loop — the scheduling and synchronization overhead dominates. Only thread genuinely CPU-expensive work, and profile first (see **godot-optimization**).
- **Thread creation cost:** spinning up a `Thread` is slow, especially on Windows. Pre-create long-lived workers before the heavy phase; don't create-and-join per frame.
- **Over-locking:** a `Mutex` taken too often, or held across expensive work, serializes your threads back into single-file execution. Keep critical sections minimal.
- **GPU stalls:** any GPU work off the main thread (texture creation, image read/modify) forces a RenderingServer sync stall that can be worse than doing it inline.

---

## 5. Separate rendering thread model — known bugs

Setting `Rendering > Driver > Thread Model = Separate` lets you instance render nodes (Sprite2D, MeshInstance3D) off the main thread, but this mode **has known bugs** and is not the default. Prefer the server APIs (RenderingServer with thread-safe operation enabled) for thread-driven instancing, and treat the separate render thread as advanced/experimental. Physics has the analogous `Run on Separate Thread` setting per dimension; enable it explicitly before doing physics work off-thread.
