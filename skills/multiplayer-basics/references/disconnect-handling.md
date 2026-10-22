# Disconnect Handling

Reference for `skills/multiplayer-basics/SKILL.md` — timeout detection, server-side cleanup of disconnected peers, client-side reconnect / fall-back. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 7. Disconnect Handling

### Timeout Detection

ENet drops an unresponsive peer automatically — by default after 5 to 30 s, depending on round-trip time (configurable with `ENetPacketPeer.set_timeout()`). `peer_disconnected` fires on both sides when the timeout expires, and a client also gets `server_disconnected`.

### GDScript

```gdscript
# disconnect_handler.gd
extends Node

# Track active peer IDs so we know what to clean up.
var _connected_peers: Dictionary = {}   # peer_id → player_node


func register_peer(peer_id: int, player_node: Node) -> void:
	_connected_peers[peer_id] = player_node


func _ready() -> void:
	multiplayer.peer_disconnected.connect(_on_peer_disconnected)
	# Clients also handle losing the server connection.
	multiplayer.server_disconnected.connect(_on_server_disconnected)


func _on_peer_disconnected(peer_id: int) -> void:
	if _connected_peers.has(peer_id):
		var player: Node = _connected_peers[peer_id]
		if is_instance_valid(player):
			player.queue_free()
		_connected_peers.erase(peer_id)
	print("Cleaned up peer %d" % peer_id)


func _on_server_disconnected() -> void:
	# Server dropped — return to main menu.
	print("Lost connection to server — returning to main menu")
	multiplayer.multiplayer_peer = null
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")


# Reconnection: simply call NetworkManager.join_game() again.
# Godot does not have built-in reconnect; implement a retry loop.
# Poll the peer's status: awaiting connected_to_server alone would hang on a failed attempt.
func attempt_reconnect(address: String, port: int, max_attempts: int = 3) -> void:
	for attempt in range(max_attempts):
		print("Reconnect attempt %d / %d" % [attempt + 1, max_attempts])
		NetworkManager.join_game(address, port)
		var peer: ENetMultiplayerPeer = NetworkManager.peer   # the peer join_game() just created
		while peer.get_connection_status() == MultiplayerPeer.CONNECTION_CONNECTING:
			await get_tree().process_frame
		if peer.get_connection_status() == MultiplayerPeer.CONNECTION_CONNECTED:
			return   # Success.
	push_error("Failed to reconnect after %d attempts" % max_attempts)
```

### C#

```csharp
// DisconnectHandler.cs
using System.Collections.Generic;
using Godot;

public partial class DisconnectHandler : Node
{
    private readonly Dictionary<long, Node> _connectedPeers = new();

    public void RegisterPeer(long peerId, Node playerNode)
        => _connectedPeers[peerId] = playerNode;

    public override void _Ready()
    {
        Multiplayer.PeerDisconnected   += OnPeerDisconnected;
        Multiplayer.ServerDisconnected += OnServerDisconnected;
    }

    private void OnPeerDisconnected(long peerId)
    {
        if (_connectedPeers.TryGetValue(peerId, out var player))
        {
            if (GodotObject.IsInstanceValid(player))
                player.QueueFree();
            _connectedPeers.Remove(peerId);
        }
        GD.Print($"Cleaned up peer {peerId}");
    }

    private void OnServerDisconnected()
    {
        GD.Print("Lost connection to server — returning to main menu");
        Multiplayer.MultiplayerPeer = null;
        GetTree().ChangeSceneToFile("res://scenes/main_menu.tscn");
    }
}
```

> **Always check `is_instance_valid(node)`** before accessing a node reference that may have been freed. `peer_disconnected` and `queue_free` can race in the same frame.

---

