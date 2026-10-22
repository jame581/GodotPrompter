# Draw Call Optimization

Reference for `skills/godot-optimization/SKILL.md` — reducing per-frame draw calls via batching, atlases, materials, culling, and LOD.

> ← Back to [SKILL.md](../SKILL.md)

---

Every distinct mesh, sprite, or canvas item that cannot be batched with its neighbours costs one draw call. Reducing draw calls is one of the highest-leverage optimisations, especially on mobile.

### 2D Batching

Godot batches 2D draw calls automatically — the Compatibility renderer in every 4.x release, Forward+ and Mobile from Godot 4.4. Canvas items that are consecutive in draw order share one batch until something changes between them, such as:
- the texture (put sprites that draw together on one atlas),
- the material or shader (blend mode included),
- the texture filter or repeat mode,
- the clip region (`clip_children`).

**This is a scene and asset decision, not a code change** — identical in GDScript and C#: keep sprites that draw next to each other on one atlas and one material, and avoid interleaving them with differently textured items.

`CanvasGroup` is **not** a batching tool. It draws its children into a backbuffer, then draws that result once with its own shader — for group transparency or a group shader effect. That adds a buffer copy and a material change, so use it for the look, not for performance.

### Reducing Unique Materials

Each unique material breaks batching — in Forward+, `MeshInstance3D`s that share a mesh and material are instanced into one draw call automatically. Keep the material count low and put per-instance variation in an `instance uniform` (Compatibility renderer: 4.4+):

```gdscript
# WRONG — creating a new material per instance duplicates draw calls
func _ready() -> void:
    var mat := StandardMaterial3D.new()
    mat.albedo_color = Color(randf(), randf(), randf())
    $MeshInstance3D.material_override = mat  # unique material = unique draw call

# RIGHT — one shared material; the shader declares `instance uniform vec4 tint : source_color;`
# (instance uniforms in the Compatibility renderer need Godot 4.4+)
@export var shared_material: ShaderMaterial

func _ready() -> void:
    $MeshInstance3D.material_override = shared_material  # same material on every instance
    $MeshInstance3D.set_instance_shader_parameter("tint", Color(randf(), randf(), randf()))
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

// RIGHT — one shared material; the shader declares `instance uniform vec4 tint : source_color;`
// (instance uniforms in the Compatibility renderer need Godot 4.4+)
[Export] public ShaderMaterial SharedMaterial { get; set; }

public override void _Ready()
{
    var mesh = GetNode<MeshInstance3D>("MeshInstance3D");
    mesh.MaterialOverride = SharedMaterial; // same material on every instance
    mesh.SetInstanceShaderParameter("tint", new Color(GD.Randf(), GD.Randf(), GD.Randf()));
}
```

Godot does not merge static 3D meshes for you (`GeometryInstance3D.gi_mode` only controls global illumination baking). Use `MultiMeshInstance3D` for many copies of one mesh, or merge static props in your 3D modelling tool.

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

Use `GeometryInstance3D.visibility_range_begin` / `visibility_range_end` (manual, hierarchical LOD), Godot's automatic mesh LOD, or a script like the one below to swap high-poly meshes for low-poly equivalents at range. `VisibleOnScreenNotifier3D` has no distance setting.

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

For automatic LOD: the scene importer's **Meshes > Generate LODs** option (on by default) creates the LOD levels, and they are used with no extra setup. Tune globally with **Rendering > Mesh LOD > LOD Change > Threshold Pixels** (`0` disables automatic LOD) and per instance with `GeometryInstance3D.lod_bias`.
