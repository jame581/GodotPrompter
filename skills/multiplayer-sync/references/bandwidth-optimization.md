# Bandwidth Optimization

Reference for `skills/multiplayer-sync/SKILL.md` — sync only changed properties, quantize floats, distance-based sync rate, reliable vs unreliable channel selection.

> ← Back to [SKILL.md](../SKILL.md)

---

## 7. Bandwidth Optimization

## 7. Bandwidth Optimization

### Sync Only Changed Properties

Use `delta_interval` on `MultiplayerSynchronizer` so only dirty properties are sent each tick. Combine with a short `replication_interval` for a full-state heartbeat.

```gdscript
func _ready() -> void:
    var sync := $MultiplayerSynchronizer
    sync.replication_interval = 1.0   # Full state every 1 s as fallback
    sync.delta_interval        = 0.05  # Changed properties every 50 ms
```

```csharp
public override void _Ready()
{
    var sync = GetNode<MultiplayerSynchronizer>("MultiplayerSynchronizer");
    sync.ReplicationInterval = 1.0;  // Full state every 1 s as fallback
    sync.DeltaInterval       = 0.05; // Changed properties every 50 ms
}
```

### Quantize Floats

Reduce float precision before sending. A 16-bit integer covers ±32767 cm — more than enough for most game worlds.

```gdscript
# Encode a position component to a 16-bit integer (1 cm precision, ±327 m range).
func quantize(value: float) -> int:
    return clampi(int(value * 100.0), -32768, 32767)

func dequantize(value: int) -> float:
    return float(value) / 100.0
```

```csharp
// Encode a position component to a 16-bit integer (1 cm precision, +/-327 m range).
public static int Quantize(float value)
{
    return Mathf.Clamp((int)(value * 100.0f), -32768, 32767);
}

public static float Dequantize(int value)
{
    return value / 100.0f;
}
```

### Distance-Based Sync Rate

Reduce the sync rate for objects far from the local player to save bandwidth.

```gdscript
# distance_sync_manager.gd — call from a timer or _physics_process
func update_sync_intervals(local_player: Node2D) -> void:
    for sync_node in get_tree().get_nodes_in_group("synced_objects"):
        var obj := sync_node.get_parent() as Node2D
        if obj == null:
            continue
        var dist: float = local_player.global_position.distance_to(obj.global_position)
        var multiplayer_sync := sync_node as MultiplayerSynchronizer
        if dist < 200.0:
            multiplayer_sync.replication_interval = 0.05   # 20 Hz — nearby
        elif dist < 600.0:
            multiplayer_sync.replication_interval = 0.1    # 10 Hz — medium
        else:
            multiplayer_sync.replication_interval = 0.5    # 2 Hz  — distant
```

```csharp
// DistanceSyncManager.cs — call from a timer or _PhysicsProcess
public void UpdateSyncIntervals(Node2D localPlayer)
{
    foreach (Node syncNode in GetTree().GetNodesInGroup("synced_objects"))
    {
        if (syncNode.GetParent() is not Node2D obj)
            continue;
        float dist = localPlayer.GlobalPosition.DistanceTo(obj.GlobalPosition);
        var multiplayerSync = (MultiplayerSynchronizer)syncNode;
        if (dist < 200.0f)
            multiplayerSync.ReplicationInterval = 0.05;  // 20 Hz — nearby
        else if (dist < 600.0f)
            multiplayerSync.ReplicationInterval = 0.1;   // 10 Hz — medium
        else
            multiplayerSync.ReplicationInterval = 0.5;   // 2 Hz  — distant
    }
}
```

### Reliable vs Unreliable Channels

| Data Type | Channel | Why |
|---|---|---|
| Position, velocity | `unreliable` | Timeliness matters; a dropped packet will be superseded by the next one |
| Health, score, kills | `reliable` | Must arrive and in order; gaps cause incorrect state |
| Spawn / despawn events | `reliable` | One-time events that must not be missed |
| Chat messages | `reliable` | Ordering and delivery matter to the user |

In Godot, set the channel per `@rpc` annotation:

```gdscript
@rpc("any_peer", "call_remote", "unreliable")
func update_position(pos: Vector2) -> void:
    synced_position = pos

@rpc("any_peer", "call_remote", "reliable")
func take_damage(amount: int) -> void:
    synced_health -= amount
```

```csharp
[Rpc(MultiplayerApi.RpcMode.AnyPeer, CallLocal = false, TransferMode = MultiplayerPeer.TransferModeEnum.Unreliable)]
private void UpdatePosition(Vector2 pos)
{
    SyncedPosition = pos;
}

[Rpc(MultiplayerApi.RpcMode.AnyPeer, CallLocal = false, TransferMode = MultiplayerPeer.TransferModeEnum.Reliable)]
private void TakeDamage(int amount)
{
    SyncedHealth -= amount;
}
```

---

