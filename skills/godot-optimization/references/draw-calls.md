# Draw Call Optimization

Reference for `skills/godot-optimization/SKILL.md` — reducing per-frame draw calls via batching, atlases, materials, culling, and LOD.

> ← Back to [SKILL.md](../SKILL.md)

---

Every distinct mesh, sprite, or canvas item that cannot be batched with its neighbours costs one draw call. Reducing draw calls is one of the highest-leverage optimisations, especially on mobile.

### 2D Batching with CanvasGroup

Wrap sibling nodes inside a `CanvasGroup` so Godot batches them into a single draw call. This is most effective for HUD elements, tile layers, and groups of sprites that share the same texture.

**This is a scene-tree change, not a code change** — and therefore identical in GDScript and C#. Add a `CanvasGroup` node in the editor and reparent the sprites under it; the node type alone enables batching.

Constraints for batching to occur:
- Children must share the same texture (use a texture atlas).
- Children must use the same blend mode and shader (or none).
- No `CanvasItem.clip_children` or light occluder between them.

### Reducing Unique Materials

Each unique material combination breaks a batch. Keep the material count low:

```gdscript
# WRONG — creating a new material per instance duplicates draw calls
func _ready() -> void:
    var mat := StandardMaterial3D.new()
    mat.albedo_color = Color(randf(), randf(), randf())
    $MeshInstance3D.material_override = mat  # unique material = unique draw call

# RIGHT — vary colour via a shader parameter on a shared material
@export var shared_material: ShaderMaterial

func _ready() -> void:
    # All instances share the same material; vary only the instance parameter
    var mat := shared_material.duplicate()  # only duplicate when variance is truly needed
    mat.set_shader_parameter("tint", Color(randf(), randf(), randf()))
    $MeshInstance3D.material_override = mat
```

**C#:**

```csharp
// WRONG — creating a new material per instance duplicates draw calls
public override void _Ready()
{
    var mat = new StandardMaterial3D();
    mat.AlbedoColor = new Color(GD.Randf(), GD.Randf(), GD.Randf());
    GetNode<MeshInstance3D>("MeshInstance3D").MaterialOverride = mat; // unique draw call
}

// RIGHT — vary colour via a shader parameter on a shared material
[Export] public ShaderMaterial SharedMaterial { get; set; }

public override void _Ready()
{
    var mat = (ShaderMaterial)SharedMaterial.Duplicate();
    mat.SetShaderParameter("tint", new Color(GD.Randf(), GD.Randf(), GD.Randf()));
    GetNode<MeshInstance3D>("MeshInstance3D").MaterialOverride = mat;
}
```

For 3D scenes, enable **Rendering > Mesh LOD** and use `GeometryInstance3D.gi_mode = BAKE_STATIC` where possible to let the engine merge static geometry.

### Texture Atlases

Pack multiple sprites into a single atlas texture so all sprites sharing that atlas batch into one draw call.

- In the editor: **Import > Sprite Frames** supports atlas import.
- For tilemaps, use a single TileSet with one atlas texture per tile layer.
- For UI, pack icons into a single `AtlasTexture` or use `StyleBoxTexture` regions.

### Visibility Culling

Stop processing and rendering objects that are off-screen.

```gdscript
# 2D — VisibleOnScreenNotifier2D pauses processing when the node leaves the viewport
extends Sprite2D

@onready var _vis: VisibleOnScreenNotifier2D = $VisibleOnScreenNotifier2D

func _ready() -> void:
    _vis.screen_entered.connect(_on_screen_entered)
    _vis.screen_exited.connect(_on_screen_exited)
    set_process(false)  # start paused; enable only when visible

func _on_screen_entered() -> void:
    set_process(true)

func _on_screen_exited() -> void:
    set_process(false)
```

**C#:**

```csharp
// 2D — VisibleOnScreenNotifier2D pauses processing when the node leaves the viewport
public partial class CulledSprite : Sprite2D
{
    private VisibleOnScreenNotifier2D _vis;

    public override void _Ready()
    {
        _vis = GetNode<VisibleOnScreenNotifier2D>("VisibleOnScreenNotifier2D");
        _vis.ScreenEntered += OnScreenEntered;
        _vis.ScreenExited += OnScreenExited;
        SetProcess(false); // start paused; enable only when visible
    }

    private void OnScreenEntered() => SetProcess(true);
    private void OnScreenExited() => SetProcess(false);
}
```

```gdscript
# 3D — VisibleOnScreenNotifier3D works identically
extends Node3D

@onready var _vis: VisibleOnScreenNotifier3D = $VisibleOnScreenNotifier3D

func _ready() -> void:
    _vis.screen_entered.connect(func(): set_process(true))
    _vis.screen_exited.connect(func(): set_process(false))
    set_process(false)
```

**C#:**

```csharp
// 3D — VisibleOnScreenNotifier3D works identically
public partial class CulledNode3D : Node3D
{
    public override void _Ready()
    {
        var vis = GetNode<VisibleOnScreenNotifier3D>("VisibleOnScreenNotifier3D");
        vis.ScreenEntered += () => SetProcess(true);
        vis.ScreenExited += () => SetProcess(false);
        SetProcess(false);
    }
}
```

You can also query visibility directly:

```gdscript
# Only update expensive logic when the node is visible on screen
func _process(_delta: float) -> void:
    if not $VisibleOnScreenNotifier2D.is_on_screen():
        return
    _run_expensive_animation_logic()
```

**C#:**

```csharp
// Only update expensive logic when the node is visible on screen
public override void _Process(double delta)
{
    if (!GetNode<VisibleOnScreenNotifier2D>("VisibleOnScreenNotifier2D").IsOnScreen())
        return;
    RunExpensiveAnimationLogic();
}
```

### LOD for 3D

Use `VisibleOnScreenNotifier3D` distance thresholds or Godot's built-in LOD system to swap high-poly meshes for low-poly equivalents at range.

```gdscript
# Manually swap mesh at distance
@export var lod_distance: float = 50.0
@onready var _camera := get_viewport().get_camera_3d()

func _process(_delta: float) -> void:
    var dist := global_position.distance_to(_camera.global_position)
    $HighPolyMesh.visible = dist < lod_distance
    $LowPolyMesh.visible = dist >= lod_distance
```

**C#:**

```csharp
// Manually swap mesh at distance
[Export] public float LodDistance { get; set; } = 50.0f;

public override void _Process(double delta)
{
    var camera = GetViewport().GetCamera3D();
    float dist = GlobalPosition.DistanceTo(camera.GlobalPosition);
    GetNode<MeshInstance3D>("HighPolyMesh").Visible = dist < LodDistance;
    GetNode<MeshInstance3D>("LowPolyMesh").Visible = dist >= LodDistance;
}
```

For automatic LOD: set `GeometryInstance3D.lod_bias` and enable **Rendering > Mesh LOD** in Project Settings. Godot 4 generates LOD levels automatically during import if **Import > Generate LODs** is enabled on the mesh asset.
