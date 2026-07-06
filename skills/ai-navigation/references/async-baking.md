# Async Navigation Baking (Godot 4.4+)

Reference for `skills/ai-navigation/SKILL.md` — baking navigation meshes on a background thread.

> ← Back to [SKILL.md](../SKILL.md)

---

```gdscript
# 2D — bake on a background thread
func rebake_async() -> void:
	var nav_region: NavigationRegion2D = $NavigationRegion2D
	# Connect to know when baking finishes
	NavigationServer2D.bake_from_source_geometry_data_async(
		nav_region.navigation_polygon,
		NavigationMeshSourceGeometryData2D.new()
	)
	# Or use the region's built-in signal:
	nav_region.bake_finished.connect(_on_bake_finished, CONNECT_ONE_SHOT)
	nav_region.bake_navigation_polygon(true)  # true = use thread

func _on_bake_finished() -> void:
	print("Navigation mesh ready")
```

```gdscript
# 3D — bake on a background thread
func rebake_async_3d() -> void:
	var nav_region: NavigationRegion3D = $NavigationRegion3D
	nav_region.bake_finished.connect(_on_bake_finished_3d, CONNECT_ONE_SHOT)
	nav_region.bake_navigation_mesh(true)  # true = use thread

func _on_bake_finished_3d() -> void:
	print("3D navigation mesh ready")
```

```csharp
// 3D — bake on a background thread
public void RebakeAsync3D()
{
    var navRegion = GetNode<NavigationRegion3D>("NavigationRegion3D");
    navRegion.BakeFinished += OnBakeFinished;
    navRegion.BakeNavigationMesh(true); // true = use thread
}

private void OnBakeFinished()
{
    GD.Print("3D navigation mesh ready");
}
```
