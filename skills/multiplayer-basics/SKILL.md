---
name: multiplayer-basics
description: Use when implementing multiplayer — MultiplayerAPI, ENet/WebSocket peers, RPCs, and authority model
---

# Multiplayer Basics in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, C# follows.

**Related skills:** See **multiplayer-sync** for state synchronization and interpolation. See **dedicated-server** for headless export and server deployment.

---

## 1. Multiplayer Architecture

Godot uses a **client-server model** built on top of `MultiplayerAPI`. One peer acts as the server; all others are clients. Every peer has a unique integer ID assigned by the network layer:

| Peer ID | Role |
|---------|------|
| `1` | The server (always) |
| `2`+ | Connected clients — randomly generated unique IDs, **not** sequential |

**Multiplayer authority** is the concept of ownership over a node. Only the authoritative peer should read input and drive that node's state. By default the server (peer `1`) is the authority for every node. Call `set_multiplayer_authority(peer_id)` to transfer ownership to a client.

```
Server (peer 1)
    ├── Owns game state by default
    ├── Spawns and validates objects
    └── Routes RPCs
Client (peer 2, 3, …)
    ├── Sends input to server via RPC
    └── Receives state updates from server
```

---

## 2. Setting Up ENetMultiplayerPeer

Both sides use the same three steps: create an `ENetMultiplayerPeer`, call `create_server(port, max_clients)` or `create_client(address, port)`, then assign it to `multiplayer.multiplayer_peer` and connect the four `MultiplayerAPI` signals. **Check the `create_*` return value** — it returns an `Error`, and a silent `ERR_CANT_CREATE` (port already in use) otherwise looks exactly like a hang.

The server is always peer ID `1`; clients receive randomly generated unique IDs, so never assume they are sequential.

Full server and client implementations with every signal handler, in GDScript and C#: [references/enet-setup.md](references/enet-setup.md)

---

## 3. RPCs

`@rpc` (GDScript) / `[Rpc]` (C#) marks a method as callable across the network. Choose the mode and transfer settings carefully — they affect both security and performance.

### RPC Modes

| Mode | Who may call it | Executes on |
|------|-----------------|-------------|
| `"authority"` (default) | Only the authority peer | The peer(s) it is sent to |
| `"any_peer"` | Any connected peer | The peer(s) it is sent to |

### Transfer Modes

| Mode | Delivery | Order | Use For |
|------|----------|-------|---------|
| `"reliable"` | Guaranteed | In-order | Chat, spawn events, important state |
| `"unreliable"` | Best-effort | Unordered | High-frequency position updates |
| `"unreliable_ordered"` | Best-effort | In-order per channel | Smooth movement streams |

### GDScript

```gdscript
# chat.gd
extends Node

# Any peer can call; server validates then broadcasts to all peers.
@rpc("any_peer", "reliable")
func send_chat_message(text: String) -> void:
	if not multiplayer.is_server():
		return
	var sender_id := multiplayer.get_remote_sender_id()
	_broadcast_chat.rpc(sender_id, text)


# Only the authority (server) can call this; runs on every peer.
@rpc("authority", "reliable", "call_local")
func _broadcast_chat(sender_id: int, text: String) -> void:
	print("[%d]: %s" % [sender_id, text])


# Client → server: request to spawn an object.
@rpc("any_peer", "reliable")
func request_spawn(scene_path: String, spawn_position: Vector2) -> void:
	if not multiplayer.is_server():
		return
	# Server validates and performs the actual spawn.
	var scene: PackedScene = load(scene_path)
	if scene == null:
		return
	var instance := scene.instantiate()
	instance.global_position = spawn_position
	get_tree().root.add_child(instance)


# High-frequency sync; unreliable_ordered + a channel keeps this off other RPC traffic.
@rpc("authority", "unreliable_ordered", "call_local", 1)
func sync_position(pos: Vector2) -> void:
	global_position = pos
```

**Sending to specific peers:**

```gdscript
# Send to everyone (including self if call_local is set):
send_chat_message.rpc("Hello!")

# Send to one specific peer:
send_chat_message.rpc_id(target_peer_id, "Hello!")
```

### C#

```csharp
// Chat.cs
using Godot;

public partial class Chat : Node
{
    // Any peer can call; executes on the server only.
    [Rpc(MultiplayerApi.RpcMode.AnyPeer, TransferMode = MultiplayerPeer.TransferModeEnum.Reliable)]
    public void SendChatMessage(string text)
    {
        if (!Multiplayer.IsServer()) return;
        int senderId = Multiplayer.GetRemoteSenderId();
        Rpc(MethodName.BroadcastChat, senderId, text);
    }

    // Authority only; runs on every peer including the caller.
    [Rpc(MultiplayerApi.RpcMode.Authority,
         CallLocal = true,
         TransferMode = MultiplayerPeer.TransferModeEnum.Reliable)]
    private void BroadcastChat(int senderId, string text)
        => GD.Print($"[{senderId}]: {text}");

    // Client → server: request a spawn.
    [Rpc(MultiplayerApi.RpcMode.AnyPeer, TransferMode = MultiplayerPeer.TransferModeEnum.Reliable)]
    public void RequestSpawn(string scenePath, Vector2 spawnPosition)
    {
        if (!Multiplayer.IsServer()) return;
        var scene = GD.Load<PackedScene>(scenePath);
        if (scene == null) return;
        var instance = scene.Instantiate<Node2D>();
        instance.GlobalPosition = spawnPosition;
        GetTree().Root.AddChild(instance);
    }

    // High-frequency position sync.
    [Rpc(MultiplayerApi.RpcMode.Authority,
         CallLocal = true,
         TransferMode = MultiplayerPeer.TransferModeEnum.UnreliableOrdered,
         TransferChannel = 1)]
    public void SyncPosition(Vector2 pos)
        => GlobalPosition = pos;
}
```

**Sending to specific peers in C#:**

```csharp
// Broadcast to all:
Rpc(MethodName.SendChatMessage, "Hello!");

// Send to one peer:
RpcId(targetPeerId, MethodName.SendChatMessage, "Hello!");
```

---

## 4. Authority Model

Every node has exactly one authoritative peer — the peer that is permitted to send state updates for that node. Other peers should treat incoming state as read-only.

### GDScript

```gdscript
# player.gd
extends CharacterBody2D

func _ready() -> void:
	# multiplayer.get_unique_id() = this peer's ID; server assigns authority during spawn (see Section 6).
	pass


func _physics_process(delta: float) -> void:
	# Guard: authority-only input and movement.
	if not is_multiplayer_authority():
		return

	var direction := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	velocity = direction * 200.0
	move_and_slide()

	sync_position.rpc(global_position)


@rpc("authority", "unreliable_ordered", "call_local", 1)
func sync_position(pos: Vector2) -> void:
	if not is_multiplayer_authority():
		global_position = pos


func print_authority_info() -> void:
	print("My peer ID : %d" % multiplayer.get_unique_id())
	print("Authority  : %d" % get_multiplayer_authority())
	print("Am I auth? : %s" % str(is_multiplayer_authority()))
```

### C#

```csharp
// Player.cs
using Godot;

public partial class Player : CharacterBody2D
{
    public override void _PhysicsProcess(double delta)
    {
        // Guard: authority-only input.
        if (!IsMultiplayerAuthority()) return;

        var direction = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");
        Velocity = direction * 200f;
        MoveAndSlide();

        Rpc(MethodName.SyncPosition, GlobalPosition);
    }

    [Rpc(MultiplayerApi.RpcMode.Authority,
         CallLocal = true,
         TransferMode = MultiplayerPeer.TransferModeEnum.UnreliableOrdered,
         TransferChannel = 1)]
    private void SyncPosition(Vector2 pos)
    {
        if (!IsMultiplayerAuthority())
            GlobalPosition = pos;
    }
}
```

**API summary:**

| Method | Returns | Notes |
|--------|---------|-------|
| `multiplayer.get_unique_id()` | `int` | This peer's ID |
| `get_multiplayer_authority()` | `int` | ID of the peer that owns this node |
| `is_multiplayer_authority()` | `bool` | True if this peer owns this node |
| `set_multiplayer_authority(id)` | `void` | Transfer ownership; call on the server |

---

## 5. Spawning Networked Objects

Use `MultiplayerSpawner` to replicate scene instances across peers. The server adds a child to the spawned node's parent, the spawner mirrors it on every peer with synchronized state. For dynamic spawn paths, configure `_spawnable_scenes` and call `add_child(scene.instantiate())` only on the server.

> See [references/spawning-networked-objects.md](references/spawning-networked-objects.md) for `MultiplayerSpawner` scene setup and the spawn-on-server flow (GDScript + C#).

---

## 6. Player Join Flow

The full lobby-join lifecycle: peer connects → server allocates a slot → load lobby scene → spawn player node → broadcast peer-list to all clients → on "start match" RPC, transition all peers to gameplay scene.

> See [references/player-join-flow.md](references/player-join-flow.md) for the full GDScript and C# implementation (peer-connected handler, slot allocation, lobby state, gameplay transition).

---

## 7. Disconnect Handling

Listen for `peer_disconnected(id)` on the `multiplayer` API. On the server: free the disconnected peer's player node and broadcast the updated peer-list. On clients: detect a server-disconnect and route to a reconnect / main-menu screen.

> See [references/disconnect-handling.md](references/disconnect-handling.md) for the timeout detection settings, server-side cleanup, and client-side reconnect flow (GDScript + C#).

---

## 8. Common Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| Calling an RPC on the wrong authority | `rpc_id` silently ignored; method never runs | Check `is_multiplayer_authority()` before sending; use `"any_peer"` only where intentional |
| Desync from unordered RPCs | Positions jitter or snap | Use `"unreliable_ordered"` for streams; use `"reliable"` for critical state changes |
| Reading input in `_process` vs `_physics_process` | Movement desyncs on different frame rates | Always move `CharacterBody2D` in `_physics_process`; send sync RPCs from there too |
| Not checking `is_multiplayer_authority()` before input | Every peer controls every player | Add an `if not is_multiplayer_authority(): return` guard at the top of input handling |
| Spawning without `MultiplayerSpawner` | Object appears on server, missing on clients | Every runtime `add_child` on the server that should be replicated must go through `MultiplayerSpawner.spawn()` |
| Forgetting `call_local` on authority RPCs | Server state diverges from its own node | Add `"call_local"` when the sender also needs to execute the RPC locally |
| Using `rpc()` before the peer is assigned | Crash or silent failure | Assign `multiplayer.multiplayer_peer` before calling any RPC |
| Not stripping `res://` scenes from exported builds | Clients can read server-only scripts | Use `export_exclude` or PCK encryption for sensitive server code |

---

## 9. Checklist

- [ ] `ENetMultiplayerPeer.create_server()` / `create_client()` return `OK` before assigning to `multiplayer.multiplayer_peer`
- [ ] All four multiplayer signals connected: `peer_connected`, `peer_disconnected`, `connected_to_server`, `connection_failed`
- [ ] Every node that reads player input guards with `if not is_multiplayer_authority(): return`
- [ ] Input processing and `sync_position` RPC are both in `_physics_process`, not `_process`
- [ ] RPC modes chosen deliberately: `"any_peer"` only for client → server calls; `"authority"` for server → client
- [ ] Unreliable RPCs used only for high-frequency updates (position, rotation); reliable for events (spawn, damage, chat)
- [ ] `MultiplayerSpawner` configured with all spawnable scenes before the first player joins
- [ ] `set_multiplayer_authority(peer_id)` called on the server after each player node is spawned
- [ ] `peer_disconnected` handler frees the player node and removes it from tracking collections
- [ ] `server_disconnected` handler on clients returns to main menu and nulls `multiplayer.multiplayer_peer`
- [ ] `is_instance_valid()` checked before dereferencing any stored node reference in disconnect callbacks
- [ ] No `rpc()` calls made before `multiplayer.multiplayer_peer` is assigned
