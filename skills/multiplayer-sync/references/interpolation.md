# Interpolation

Reference for `skills/multiplayer-sync/SKILL.md` — visual interpolation between snapshots in `_process`. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 3. Interpolation

Network updates arrive in discrete ticks (e.g. every 50 ms at 20 Hz). Without interpolation, remote players visibly stutter from position to position. Interpolation smooths this by blending between the previous received state and the current received state over time.

### Why `_process`, Not `_physics_process`

- `_physics_process` runs at a fixed physics rate (default 60 Hz) and is coupled to simulation.
- `_process` runs every rendered frame and has access to the render sub-tick fraction via `Engine.get_physics_interpolation_fraction()`.
- Visual smoothing belongs in `_process` because it does not affect gameplay state — it only affects what the player sees.

### Interpolation (GDScript)

```gdscript
# remote_player_display.gd — attached to a non-authority instance
extends Node2D

var _prev_pos: Vector2 = Vector2.ZERO
var _curr_pos: Vector2 = Vector2.ZERO
var _prev_health: int = 100
var _curr_health: int = 100

@onready var _sync_source: Node = $"../SyncedPlayer"  # the node with MultiplayerSynchronizer


func _ready() -> void:
    # Disable physics on remote display nodes — authority drives state.
    set_physics_process(false)
    # Listen for each sync tick to capture before/after state.
    _sync_source.connect("synchronized", _on_synchronized)


func _on_synchronized() -> void:
    # Called by MultiplayerSynchronizer after each replication tick.
    _prev_pos    = _curr_pos
    _curr_pos    = _sync_source.synced_position
    _prev_health = _curr_health
    _curr_health = _sync_source.synced_health


func _process(_delta: float) -> void:
    # interpolation_fraction is 0.0..1.0 between the last and next physics tick.
    var f: float = Engine.get_physics_interpolation_fraction()
    global_position = _prev_pos.lerp(_curr_pos, f)
    # Health and other discrete values are not lerped — snap on change.
```

### Interpolation (C#)

```csharp
// RemotePlayerDisplay.cs — attached to a non-authority instance
using Godot;

public partial class RemotePlayerDisplay : Node2D
{
    private Vector2 _prevPos = Vector2.Zero;
    private Vector2 _currPos = Vector2.Zero;
    private int _prevHealth;
    private int _currHealth;

    private SyncedPlayer _syncSource = null!;

    public override void _Ready()
    {
        SetPhysicsProcess(false);
        _syncSource = GetNode<SyncedPlayer>("../SyncedPlayer");
        _syncSource.Connect(
            MultiplayerSynchronizer.SignalName.Synchronized,
            Callable.From(OnSynchronized));
    }

    private void OnSynchronized()
    {
        _prevPos    = _currPos;
        _currPos    = _syncSource.SyncedPosition;
        _prevHealth = _currHealth;
        _currHealth = _syncSource.SyncedHealth;
    }

    public override void _Process(double delta)
    {
        float f = (float)Engine.GetPhysicsInterpolationFraction();
        GlobalPosition = _prevPos.Lerp(_currPos, f);
        // Discrete values like health snap immediately — no lerp.
    }
}
```

---

