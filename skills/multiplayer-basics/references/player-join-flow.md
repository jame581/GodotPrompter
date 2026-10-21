# Player Join Flow

Reference for `skills/multiplayer-basics/SKILL.md` — full peer-connect → load lobby → spawn player → start match flow. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Player Join Flow

```
Client connects
    └── [server] peer_connected fires with new peer_id
            └── server sends initial world state to new peer  (RPC → new peer)
            └── server calls server_spawn_player(peer_id, spawn_pos)
                    └── MultiplayerSpawner replicates the new node to ALL clients
                    └── server calls set_multiplayer_authority(peer_id) on the new node
            └── server notifies existing clients of the new player  (optional RPC)
```

### GDScript

```gdscript
# game_server.gd  (runs on server only — guard with is_multiplayer_authority / is_server)
extends Node

const SPAWN_POSITIONS: Array[Vector2] = [
	Vector2(100, 300),
	Vector2(200, 300),
	Vector2(300, 300),
	Vector2(400, 300),
]

var _next_spawn_index := 0


func _ready() -> void:
	if not multiplayer.is_server():
		return
	multiplayer.peer_connected.connect(_on_peer_connected)
	multiplayer.peer_disconnected.connect(_on_peer_disconnected)


func _on_peer_connected(peer_id: int) -> void:
	# 1. Send the new client a snapshot of existing players.
	_send_initial_state.rpc_id(peer_id)

	# 2. Spawn a player node for the new peer.
	var spawn_pos := SPAWN_POSITIONS[_next_spawn_index % SPAWN_POSITIONS.size()]
	_next_spawn_index += 1
	$World.server_spawn_player(peer_id, spawn_pos)

	# 3. Notify everyone that a new player joined.
	_notify_player_joined.rpc(peer_id)


func _on_peer_disconnected(peer_id: int) -> void:
	_cleanup_player(peer_id)
	_notify_player_left.rpc(peer_id)


# Runs only on the newly connected client.
@rpc("authority", "reliable")
func _send_initial_state() -> void:
	print("Received initial state from server")
	# Populate local UI, load persistent world state, etc.


# Runs on all peers.
@rpc("authority", "reliable", "call_local")
func _notify_player_joined(peer_id: int) -> void:
	print("Player %d joined" % peer_id)


@rpc("authority", "reliable", "call_local")
func _notify_player_left(peer_id: int) -> void:
	print("Player %d left" % peer_id)


func _cleanup_player(peer_id: int) -> void:
	var player := get_tree().get_first_node_in_group("player_%d" % peer_id)
	if player:
		player.queue_free()
```

### C#

```csharp
// GameServer.cs
using Godot;

public partial class GameServer : Node
{
    private static readonly Vector2[] SpawnPositions =
    {
        new(100, 300), new(200, 300), new(300, 300), new(400, 300),
    };

    private int _nextSpawnIndex;

    public override void _Ready()
    {
        if (!Multiplayer.IsServer()) return;
        Multiplayer.PeerConnected    += OnPeerConnected;
        Multiplayer.PeerDisconnected += OnPeerDisconnected;
    }

    private void OnPeerConnected(long peerId)
    {
        RpcId(peerId, MethodName.SendInitialState);

        var spawnPos = SpawnPositions[_nextSpawnIndex++ % SpawnPositions.Length];
        GetNode<World>("World").ServerSpawnPlayer((int)peerId, spawnPos);

        Rpc(MethodName.NotifyPlayerJoined, (int)peerId);
    }

    private void OnPeerDisconnected(long peerId)
    {
        CleanupPlayer((int)peerId);
        Rpc(MethodName.NotifyPlayerLeft, (int)peerId);
    }

    [Rpc(MultiplayerApi.RpcMode.Authority, TransferMode = MultiplayerPeer.TransferModeEnum.Reliable)]
    private void SendInitialState()
        => GD.Print("Received initial state from server");

    [Rpc(MultiplayerApi.RpcMode.Authority,
         CallLocal = true,
         TransferMode = MultiplayerPeer.TransferModeEnum.Reliable)]
    private void NotifyPlayerJoined(int peerId)
        => GD.Print($"Player {peerId} joined");

    [Rpc(MultiplayerApi.RpcMode.Authority,
         CallLocal = true,
         TransferMode = MultiplayerPeer.TransferModeEnum.Reliable)]
    private void NotifyPlayerLeft(int peerId)
        => GD.Print($"Player {peerId} left");

    private void CleanupPlayer(int peerId)
    {
        var player = GetTree().GetFirstNodeInGroup($"player_{peerId}");
        player?.QueueFree();
    }
}
```

---

