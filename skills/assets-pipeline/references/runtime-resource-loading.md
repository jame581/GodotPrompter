> ← Back to [SKILL.md](../SKILL.md)

# Runtime Resource Loading

## Runtime Scene Loading

```gdscript
# Preload at compile time (known path)
const ENEMY_SCENE: PackedScene = preload("res://models/enemy.glb")

# Load at runtime (path from data)
func spawn_model(path: String) -> Node3D:
    var scene: PackedScene = load(path)
    var instance: Node3D = scene.instantiate()
    add_child(instance)
    return instance
```

```csharp
private static readonly PackedScene EnemyScene = GD.Load<PackedScene>("res://models/enemy.glb");

public Node3D SpawnModel(string path)
{
    var scene = GD.Load<PackedScene>(path);
    var instance = scene.Instantiate<Node3D>();
    AddChild(instance);
    return instance;
}
```

## Threaded Resource Loading

Load large resources without freezing the game:

```gdscript
func load_level_async(path: String) -> void:
    ResourceLoader.load_threaded_request(path)

func _process(delta: float) -> void:
    var status := ResourceLoader.load_threaded_get_status(_loading_path)
    match status:
        ResourceLoader.THREAD_LOAD_IN_PROGRESS:
            var progress: Array = []
            ResourceLoader.load_threaded_get_status(_loading_path, progress)
            loading_bar.value = progress[0] * 100.0
        ResourceLoader.THREAD_LOAD_LOADED:
            var scene: PackedScene = ResourceLoader.load_threaded_get(_loading_path)
            get_tree().change_scene_to_packed(scene)
        ResourceLoader.THREAD_LOAD_FAILED:
            push_error("Failed to load: %s" % _loading_path)
```

```csharp
public void LoadLevelAsync(string path)
{
    ResourceLoader.LoadThreadedRequest(path);
}

public override void _Process(double delta)
{
    var progress = new Godot.Collections.Array();
    var status = ResourceLoader.LoadThreadedGetStatus(_loadingPath, progress);
    switch (status)
    {
        case ResourceLoader.ThreadLoadStatus.InProgress:
            loadingBar.Value = (float)progress[0] * 100.0f;
            break;
        case ResourceLoader.ThreadLoadStatus.Loaded:
            var scene = ResourceLoader.LoadThreadedGet(_loadingPath) as PackedScene;
            GetTree().ChangeSceneToPacked(scene);
            break;
        case ResourceLoader.ThreadLoadStatus.Failed:
            GD.PushError($"Failed to load: {_loadingPath}");
            break;
    }
}
```
