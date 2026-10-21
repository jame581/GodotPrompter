# JSON — Game Saves

Reference for `skills/save-load/SKILL.md` — `JSON.stringify` / `JSON.parse_string` for game save state. Full GDScript and C# implementation.

> ← Back to [SKILL.md](../SKILL.md)

---
## 3. JSON — Game Saves

Use JSON for game saves. It is portable, debuggable, and easy to version-migrate.

### GDScript

```gdscript
# save_manager.gd — add as autoload named SaveManager
extends Node

const SAVE_DIR       := "user://saves/"
const SAVE_EXTENSION := ".json"
const CURRENT_VERSION := 2


func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(SAVE_DIR)


# ── Save ──────────────────────────────────────────────────────────────────────

func save_game(slot_name: String) -> bool:
	var player := get_tree().get_first_node_in_group("player")
	var world  := get_tree().get_first_node_in_group("world")

	var data: Dictionary = {
		"version":   CURRENT_VERSION,
		"timestamp": Time.get_unix_time_from_system(),
		"player":    _serialize_player(player),
		"world":     _serialize_world(world),
	}

	var json_string := JSON.stringify(data, "\t")
	var path        := SAVE_DIR + slot_name + SAVE_EXTENSION
	var file        := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		push_error("SaveManager: cannot open '%s' for writing — error %d" % [path, FileAccess.get_open_error()])
		return false

	file.store_string(json_string)
	return true


func _serialize_player(player: Node) -> Dictionary:
	return {
		"position":  {"x": player.global_position.x, "y": player.global_position.y},
		"health":    player.health,
		"inventory": player.inventory.duplicate(),
	}


func _serialize_world(world: Node) -> Dictionary:
	var enemies: Array = []
	for enemy in get_tree().get_nodes_in_group("enemies"):
		enemies.append({
			"scene_path": enemy.scene_file_path,
			"position":   {"x": enemy.global_position.x, "y": enemy.global_position.y},
			"health":     enemy.health,
		})
	return {"enemies": enemies}


# ── Load ──────────────────────────────────────────────────────────────────────

func load_game(slot_name: String) -> bool:
	var path := SAVE_DIR + slot_name + SAVE_EXTENSION
	if not FileAccess.file_exists(path):
		push_error("SaveManager: save file not found at '%s'" % path)
		return false

	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("SaveManager: cannot open '%s' for reading — error %d" % [path, FileAccess.get_open_error()])
		return false

	var json   := JSON.new()
	var err    := json.parse(file.get_as_text())
	if err != OK:
		push_error("SaveManager: JSON parse error in '%s': %s" % [path, json.get_error_message()])
		return false

	var data: Dictionary = json.data
	data = _migrate(data)

	var player := get_tree().get_first_node_in_group("player")
	var world  := get_tree().get_first_node_in_group("world")
	_deserialize_player(player, data["player"])
	_deserialize_world(world, data["world"])
	return true


func _deserialize_player(player: Node, data: Dictionary) -> void:
	player.global_position = Vector2(data["position"]["x"], data["position"]["y"])
	player.health          = data["health"]
	player.inventory       = data["inventory"].duplicate()


func _deserialize_world(world: Node, data: Dictionary) -> void:
	# Remove existing enemies spawned at runtime
	for enemy in get_tree().get_nodes_in_group("enemies"):
		enemy.queue_free()

	for entry: Dictionary in data["enemies"]:
		var scene: PackedScene = load(entry["scene_path"])
		if scene == null:
			push_error("SaveManager: missing scene '%s'" % entry["scene_path"])
			continue
		var enemy: Node = scene.instantiate()
		world.add_child(enemy)
		enemy.global_position = Vector2(entry["position"]["x"], entry["position"]["y"])
		enemy.health          = entry["health"]


# ── Helpers ───────────────────────────────────────────────────────────────────

func get_save_slots() -> Array[String]:
	var slots: Array[String] = []
	var dir := DirAccess.open(SAVE_DIR)
	if dir == null:
		return slots
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if not dir.current_is_dir() and file_name.ends_with(SAVE_EXTENSION):
			slots.append(file_name.trim_suffix(SAVE_EXTENSION))
		file_name = dir.get_next()
	return slots


func delete_save(slot_name: String) -> bool:
	var path := SAVE_DIR + slot_name + SAVE_EXTENSION
	var err  := DirAccess.remove_absolute(path)
	if err != OK:
		push_error("SaveManager: failed to delete '%s' — error %d" % [path, err])
		return false
	return true


# ── Migration ─────────────────────────────────────────────────────────────────

func _migrate(data: Dictionary) -> Dictionary:
	var version: int = data.get("version", 0)

	if version < 1:
		# v0 → v1: add inventory array
		data["player"]["inventory"] = []
		version = 1

	if version < 2:
		# v1 → v2: add skills array to player
		data["player"]["skills"] = []
		version = 2

	data["version"] = CURRENT_VERSION
	return data
```

### C#

```csharp
// SaveManager.cs — add as autoload named SaveManager
using System.Collections.Generic;
using Godot;

public partial class SaveManager : Node
{
    private const string SaveDir        = "user://saves/";
    private const string SaveExtension  = ".json";
    private const int    CurrentVersion = 2;

    public override void _Ready()
    {
        DirAccess.MakeDirRecursiveAbsolute(SaveDir);
    }

    // ── Save ─────────────────────────────────────────────────────────────────

    public bool SaveGame(string slotName)
    {
        var player = GetTree().GetFirstNodeInGroup("player");
        var world  = GetTree().GetFirstNodeInGroup("world");

        var data = new Godot.Collections.Dictionary
        {
            ["version"]   = CurrentVersion,
            ["timestamp"] = Time.GetUnixTimeFromSystem(),
            ["player"]    = SerializePlayer(player),
            ["world"]     = SerializeWorld(world),
        };

        string json = Json.Stringify(data, "\t");
        string path = SaveDir + slotName + SaveExtension;

        using var file = FileAccess.Open(path, FileAccess.ModeFlags.Write);
        if (file == null)
        {
            GD.PushError($"SaveManager: cannot open '{path}' for writing — error {FileAccess.GetOpenError()}");
            return false;
        }

        file.StoreString(json);
        return true;
    }

    private Godot.Collections.Dictionary SerializePlayer(Node player)
    {
        var p = (CharacterBody2D)player;
        var health = p.GetNode<Node>("HealthComponent");
        return new Godot.Collections.Dictionary
        {
            ["position"]  = new Godot.Collections.Dictionary { ["x"] = p.GlobalPosition.X, ["y"] = p.GlobalPosition.Y },
            ["health"]    = health.Get("current_health"),
        };
    }

    private Godot.Collections.Dictionary SerializeWorld(Node world)
    {
        var enemies = new Godot.Collections.Array();
        foreach (Node enemy in GetTree().GetNodesInGroup("enemies"))
        {
            var e = (Node2D)enemy;
            var health = e.GetNode<Node>("HealthComponent");
            enemies.Add(new Godot.Collections.Dictionary
            {
                ["scene_path"] = enemy.SceneFilePath,
                ["position"]   = new Godot.Collections.Dictionary { ["x"] = e.GlobalPosition.X, ["y"] = e.GlobalPosition.Y },
                ["health"]     = health.Get("current_health"),
            });
        }
        return new Godot.Collections.Dictionary { ["enemies"] = enemies };
    }

    // ── Load ─────────────────────────────────────────────────────────────────

    public bool LoadGame(string slotName)
    {
        string path = SaveDir + slotName + SaveExtension;
        if (!FileAccess.FileExists(path))
        {
            GD.PushError($"SaveManager: save file not found at '{path}'");
            return false;
        }

        using var file = FileAccess.Open(path, FileAccess.ModeFlags.Read);
        if (file == null)
        {
            GD.PushError($"SaveManager: cannot open '{path}' for reading — error {FileAccess.GetOpenError()}");
            return false;
        }

        var json    = new Json();
        var err     = json.Parse(file.GetAsText());
        if (err != Error.Ok)
        {
            GD.PushError($"SaveManager: JSON parse error in '{path}': {json.GetErrorMessage()}");
            return false;
        }

        var data = json.Data.AsGodotDictionary();
        data = Migrate(data);

        var player = GetTree().GetFirstNodeInGroup("player");
        var world  = GetTree().GetFirstNodeInGroup("world");
        DeserializePlayer(player, data["player"].AsGodotDictionary());
        DeserializeWorld(world,   data["world"].AsGodotDictionary());
        return true;
    }

    private void DeserializePlayer(Node player, Godot.Collections.Dictionary data)
    {
        var p = (CharacterBody2D)player;
        var pos = data["position"].AsGodotDictionary();
        p.GlobalPosition = new Vector2(pos["x"].As<float>(), pos["y"].As<float>());
        var health = p.GetNode<Node>("HealthComponent");
        health.Set("current_health", data["health"].As<int>());
    }

    private void DeserializeWorld(Node world, Godot.Collections.Dictionary data)
    {
        foreach (Node enemy in GetTree().GetNodesInGroup("enemies"))
            enemy.QueueFree();

        foreach (Variant entry in data["enemies"].AsGodotArray())
        {
            var e     = entry.AsGodotDictionary();
            var scene = GD.Load<PackedScene>(e["scene_path"].As<string>());
            if (scene == null)
            {
                GD.PushError($"SaveManager: missing scene '{e["scene_path"]}'");
                continue;
            }
            var enemy  = scene.Instantiate();
            world.AddChild(enemy);
            var pos    = e["position"].AsGodotDictionary();
            var node   = (Node2D)enemy;
            node.GlobalPosition = new Vector2(pos["x"].As<float>(), pos["y"].As<float>());
            var health = enemy.GetNode<Node>("HealthComponent");
            health.Set("current_health", e["health"].As<int>());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public List<string> GetSaveSlots()
    {
        var slots = new List<string>();
        using var dir = DirAccess.Open(SaveDir);
        if (dir == null) return slots;

        dir.ListDirBegin();
        string fileName = dir.GetNext();
        while (fileName != "")
        {
            if (!dir.CurrentIsDir() && fileName.EndsWith(SaveExtension))
                slots.Add(fileName[..^SaveExtension.Length]);
            fileName = dir.GetNext();
        }
        return slots;
    }

    public bool DeleteSave(string slotName)
    {
        string path = SaveDir + slotName + SaveExtension;
        var err     = DirAccess.RemoveAbsolute(path);
        if (err != Error.Ok)
        {
            GD.PushError($"SaveManager: failed to delete '{path}' — error {err}");
            return false;
        }
        return true;
    }

    // ── Migration ─────────────────────────────────────────────────────────────

    private Godot.Collections.Dictionary Migrate(Godot.Collections.Dictionary data)
    {
        int version = data.ContainsKey("version") ? data["version"].As<int>() : 0;

        if (version < 1)
        {
            // v0 → v1: add inventory array
            data["player"].AsGodotDictionary()["inventory"] = new Godot.Collections.Array();
            version = 1;
        }

        if (version < 2)
        {
            // v1 → v2: add skills array to player
            data["player"].AsGodotDictionary()["skills"] = new Godot.Collections.Array();
            version = 2;
        }

        data["version"] = CurrentVersion;
        return data;
    }
}
```

---

