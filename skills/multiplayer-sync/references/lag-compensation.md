# Lag Compensation

Reference for `skills/multiplayer-sync/SKILL.md` — server rewinds world to client's view-time when validating hit-scan. Full GDScript + C# code sketch.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Lag Compensation

Lag compensation lets the server validate a hit by rewinding the game state to the tick when the shooting client fired. Without it, a client would have to lead targets to account for latency — which is unfair and error-prone.

### Concept

```
Client fires at T=100ms latency ago.
Server receives the shot at T=now.
Server rewinds all character positions to T=100ms ago.
Server checks whether the bullet hit any character at that rewound state.
Server applies damage if hit, then discards the rewound snapshot.
```

### Code Sketch (GDScript)

```gdscript
# lag_compensation_manager.gd — runs on the server only
extends Node

const HISTORY_DURATION_SEC := 0.5  # how many seconds of history to keep
const PHYSICS_TICK_RATE    := 60.0

# history[tick] = { peer_id: position, ... }
var _position_history: Dictionary = {}
var _current_tick: int = 0


func _physics_process(_delta: float) -> void:
    if not multiplayer.is_server():
        return

    # Snapshot every peer's position this tick.
    var snapshot: Dictionary = {}
    for peer_id in multiplayer.get_peers():
        var player := _get_player(peer_id)
        if player:
            snapshot[peer_id] = player.global_position

    _position_history[_current_tick] = snapshot
    _current_tick += 1

    # Prune old history beyond the keep window.
    var oldest_kept: int = _current_tick - int(HISTORY_DURATION_SEC * PHYSICS_TICK_RATE)
    for old_tick in _position_history.keys():
        if old_tick < oldest_kept:
            _position_history.erase(old_tick)


func validate_shot(
    shooter_id: int,
    target_id: int,
    shot_origin: Vector3,
    shot_direction: Vector3,
    client_tick: int
) -> bool:
    if not _position_history.has(client_tick):
        return false  # too old or invalid tick

    var snapshot: Dictionary = _position_history[client_tick]
    if not snapshot.has(target_id):
        return false

    var rewound_pos: Vector2 = snapshot[target_id]

    # Simple AABB or circle hit check against the rewound position.
    var hit_radius := 32.0
    var closest_point := _closest_point_on_ray(shot_origin, shot_direction, rewound_pos)
    return closest_point.distance_to(rewound_pos) <= hit_radius


func _closest_point_on_ray(
    origin: Vector3, direction: Vector3, point: Vector2
) -> Vector2:
    # Project 2D point onto 2D ray (top-down example).
    var o := Vector2(origin.x, origin.z)
    var d := Vector2(direction.x, direction.z).normalized()
    var t := (Vector2(point) - o).dot(d)
    return o + d * max(t, 0.0)


func _get_player(peer_id: int) -> Node2D:
    return get_tree().get_first_node_in_group("player_%d" % peer_id) as Node2D
```

### Code Sketch (C#)

```csharp
// LagCompensationManager.cs — runs on the server only
using Godot;
using System.Collections.Generic;
using System.Linq;

public partial class LagCompensationManager : Node
{
    private const float HistoryDurationSec = 0.5f;
    private const float PhysicsTickRate = 60.0f;

    // history[tick] = { peerId -> position }
    private readonly Dictionary<int, Dictionary<int, Vector2>> _positionHistory = new();
    private int _currentTick;

    public override void _PhysicsProcess(double delta)
    {
        if (!Multiplayer.IsServer())
            return;

        // Snapshot every peer's position this tick.
        var snapshot = new Dictionary<int, Vector2>();
        foreach (int peerId in Multiplayer.GetPeers())
        {
            var player = GetPlayer(peerId);
            if (player is not null)
                snapshot[peerId] = player.GlobalPosition;
        }

        _positionHistory[_currentTick] = snapshot;
        _currentTick++;

        // Prune old history beyond the keep window.
        int oldestKept = _currentTick - (int)(HistoryDurationSec * PhysicsTickRate);
        foreach (int oldTick in _positionHistory.Keys.Where(t => t < oldestKept).ToList())
            _positionHistory.Remove(oldTick);
    }

    public bool ValidateShot(
        int shooterId,
        int targetId,
        Vector3 shotOrigin,
        Vector3 shotDirection,
        int clientTick)
    {
        if (!_positionHistory.TryGetValue(clientTick, out var snapshot))
            return false;

        if (!snapshot.TryGetValue(targetId, out Vector2 rewoundPos))
            return false;

        float hitRadius = 32.0f;
        Vector2 closestPoint = ClosestPointOnRay(shotOrigin, shotDirection, rewoundPos);
        return closestPoint.DistanceTo(rewoundPos) <= hitRadius;
    }

    private static Vector2 ClosestPointOnRay(Vector3 origin, Vector3 direction, Vector2 point)
    {
        // Project 2D point onto 2D ray (top-down example).
        var o = new Vector2(origin.X, origin.Z);
        Vector2 d = new Vector2(direction.X, direction.Z).Normalized();
        float t = (point - o).Dot(d);
        return o + d * Mathf.Max(t, 0.0f);
    }

    private Node2D GetPlayer(int peerId)
    {
        return GetTree().GetFirstNodeInGroup($"player_{peerId}") as Node2D;
    }
}
```

**Production considerations:**
- Store full `Transform` (not just position) for 3D games so rotation is also rewound.
- Apply hit validation on the server only; never trust hit reports from clients.
- Cap the rewind window to a max latency tolerance (e.g. 300 ms) to prevent abuse.

---

