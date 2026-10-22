# Godot 4.7+ XR Features

Reference for `skills/xr-development/SKILL.md` — OpenXR user presence detection and per-eye composition layer visibility (Godot 4.7+). Spatial anchor extensibility lives in [spatial-entities.md](spatial-entities.md).

> ← Back to [SKILL.md](../SKILL.md)

---

## User Presence Detection (Godot 4.7+)

`OpenXRInterface` exposes the OpenXR user presence extension: the `user_presence_changed(is_user_present: bool)` signal fires when the user puts on or removes the headset, `is_user_presence_supported()` reports whether the extension is supported and enabled, and `is_user_present()` polls the current state (both only return valid values after OpenXR is initialized). Typical use: pause the game and mute audio when the headset comes off.

> **Note:** The signal is not emitted during application startup or shutdown — assume user presence is gained on startup and lost on shutdown.

```gdscript
func _ready() -> void:
    var xr_interface: OpenXRInterface = XRServer.find_interface("OpenXR")
    if xr_interface and xr_interface.is_user_presence_supported():
        xr_interface.user_presence_changed.connect(_on_user_presence_changed)

func _on_user_presence_changed(is_user_present: bool) -> void:
    get_tree().paused = not is_user_present
```

```csharp
public override void _Ready()
{
    var xrInterface = XRServer.FindInterface("OpenXR") as OpenXRInterface;
    if (xrInterface != null && xrInterface.IsUserPresenceSupported())
        xrInterface.UserPresenceChanged += OnUserPresenceChanged;
}

private void OnUserPresenceChanged(bool isUserPresent)
{
    GetTree().Paused = !isUserPresent;
}
```

## Composition Layer Eye Visibility (Godot 4.7+)

`OpenXRCompositionLayer` gains `eye_visibility` (`EyeVisibility` enum: `EYE_VISIBILITY_BOTH = 0` default, `EYE_VISIBILITY_LEFT = 1`, `EYE_VISIBILITY_RIGHT = 2`) — the eye(s) the composition layer is visible to. Renders a quad/cylinder/equirect layer to one eye only, e.g. for per-eye calibration screens or stereo content authored per eye.

```gdscript
$OpenXRCompositionLayerQuad.eye_visibility = OpenXRCompositionLayer.EYE_VISIBILITY_LEFT
```

```csharp
GetNode<OpenXRCompositionLayerQuad>("OpenXRCompositionLayerQuad").EyeVisibility =
    OpenXRCompositionLayer.EyeVisibilityEnum.Left;
```

> **Note:** Not all composition layer types or runtimes support restricting visibility to a single eye.
