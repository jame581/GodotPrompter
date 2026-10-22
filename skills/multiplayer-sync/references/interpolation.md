# Interpolation

Reference for `skills/multiplayer-sync/SKILL.md` — visual interpolation between snapshots in `_process`. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 3. Interpolation

Network updates arrive in discrete ticks (e.g. every 50 ms at 20 Hz). Without interpolation, remote players visibly stutter from position to position. Interpolation smooths this by blending between the previous received state and the current received state over time.

### Why `_process`, Not `_physics_process`

- `_physics_process` runs at a fixed physics rate (default 60 Hz) and is coupled to simulation.
- `_process` runs every rendered frame, so the blend advances smoothly between network updates.
- Visual smoothing belongs in `_process` because it does not affect gameplay state — it only affects what the player sees.
- Blend by the time elapsed since the last update, not by `Engine.get_physics_interpolation_fraction()`: that fraction restarts every physics tick (60 Hz by default), while network updates arrive every few ticks.

### Interpolation (GDScript)

```gdscript
# remote_player_display.gd — attached to a non-authority instance
extends Node2D

var _prev_pos: Vector2 = Vector2.ZERO
var _curr_pos: Vector2 = Vector2.ZERO
var _prev_health: int = 100
var _curr_health: int = 100
var _since_update: float = 0.0

@onready var _sync_source: Node = $"../SyncedPlayer"  # has synced_position / synced_health
@onready var _sync: MultiplayerSynchronizer = $"../SyncedPlayer/MultiplayerSynchronizer"


func _ready() -> void:
    # Disable physics on remote display nodes — authority drives state.
    set_physics_process(false)
    # The signal belongs to the MultiplayerSynchronizer, not to the node it replicates.
    # "synchronized" covers "Always" properties; "delta_synchronized" covers "On Change" ones.
    _sync.synchronized.connect(_on_synchronized)


func _on_synchronized() -> void:
    # Emitted after a received update has been applied to the properties.
    _prev_pos     = global_position   # start from where we are drawn now
    _curr_pos     = _sync_source.synced_position
    _prev_health  = _curr_health
    _curr_health  = _sync_source.synced_health
    _since_update = 0.0


func _process(delta: float) -> void:
    # 0.0 at the update, 1.0 one sync interval later (replication_interval 0 = every frame).
    _since_update += delta
    var interval: float = maxf(_sync.replication_interval, delta)
    var f: float = clampf(_since_update / interval, 0.0, 1.0)
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
    private double _sinceUpdate;

    private SyncedPlayer _syncSource = null!;
    private MultiplayerSynchronizer _sync = null!;

    public override void _Ready()
    {
        SetPhysicsProcess(false);
        _syncSource = GetNode<SyncedPlayer>("../SyncedPlayer");
        // The signal belongs to the MultiplayerSynchronizer, not to the node it replicates.
        _sync = GetNode<MultiplayerSynchronizer>("../SyncedPlayer/MultiplayerSynchronizer");
        _sync.Synchronized += OnSynchronized;
    }

    private void OnSynchronized()
    {
        _prevPos     = GlobalPosition; // start from where we are drawn now
        _currPos     = _syncSource.SyncedPosition;
        _prevHealth  = _currHealth;
        _currHealth  = _syncSource.SyncedHealth;
        _sinceUpdate = 0.0;
    }

    public override void _Process(double delta)
    {
        // 0 at the update, 1 one sync interval later.
        _sinceUpdate += delta;
        double interval = Mathf.Max(_sync.ReplicationInterval, delta);
        float f = (float)Mathf.Clamp(_sinceUpdate / interval, 0.0, 1.0);
        GlobalPosition = _prevPos.Lerp(_currPos, f);
        // Discrete values like health snap immediately — no lerp.
    }
}
```

---

