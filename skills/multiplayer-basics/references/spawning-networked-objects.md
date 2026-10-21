# Spawning Networked Objects

Reference for `skills/multiplayer-basics/SKILL.md` — `MultiplayerSpawner` setup, scene replication on peer join, GDScript + C# spawn-on-server flow.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Spawning Networked Objects

Use **MultiplayerSpawner** to replicate `add_child` calls from the server to all clients automatically. Without it, clients must handle spawning manually and objects will not appear remotely.

### Scene Setup

```
World (Node)
├── MultiplayerSpawner       ← Add this node
│       spawn_path = "../Players"
└── Players (Node)           ← Spawner watches this container
```

### GDScript

```gdscript
# world.gd
extends Node

@onready var spawner: MultiplayerSpawner = $MultiplayerSpawner
@onready var players_container: Node     = $Players


func _ready() -> void:
	# Register scenes the spawner is allowed to replicate.
	spawner.add_spawnable_scene("res://scenes/player.tscn")

	# Optional: custom spawn function lets you pass extra data
	# (e.g. initial position, skin) along with the spawn event.
	spawner.spawn_function = _custom_spawn


func _custom_spawn(data: Variant) -> Node:
	# data is whatever you passed to spawner.spawn(data).
	var scene: PackedScene = load("res://scenes/player.tscn")
	var player: Node = scene.instantiate()
	player.name = str(data["peer_id"])
	player.global_position = data["position"]
	return player


# Call only on the server — MultiplayerSpawner replicates to clients.
func server_spawn_player(peer_id: int, spawn_pos: Vector2) -> void:
	if not multiplayer.is_server():
		return
	var data := {"peer_id": peer_id, "position": spawn_pos}
	var player: Node = spawner.spawn(data)
	player.set_multiplayer_authority(peer_id)
```

### C#

```csharp
// World.cs
using Godot;

public partial class World : Node
{
    [Export] private MultiplayerSpawner _spawner;
    [Export] private Node _playersContainer;

    public override void _Ready()
    {
        _spawner.AddSpawnableScene("res://scenes/player.tscn");
        _spawner.SpawnFunction = new Callable(this, MethodName.CustomSpawn);
    }

    private Node CustomSpawn(Variant data)
    {
        var dict   = data.AsGodotDictionary();
        var scene  = GD.Load<PackedScene>("res://scenes/player.tscn");
        var player = scene.Instantiate<Node2D>();
        player.Name              = dict["peer_id"].As<int>().ToString();
        player.GlobalPosition    = dict["position"].As<Vector2>();
        return player;
    }

    public void ServerSpawnPlayer(int peerId, Vector2 spawnPos)
    {
        if (!Multiplayer.IsServer()) return;
        var data = new Godot.Collections.Dictionary
        {
            ["peer_id"]  = peerId,
            ["position"] = spawnPos,
        };
        var player = _spawner.Spawn(data);
        player.SetMultiplayerAuthority(peerId);
    }
}
```

> **Note:** `spawner.spawn()` must be called on the server. `spawn_path` must point to the container node using a NodePath relative to the MultiplayerSpawner's parent. Every scene passed to `add_spawnable_scene` must be in the project — packed-scene paths are sent over the network.

---

