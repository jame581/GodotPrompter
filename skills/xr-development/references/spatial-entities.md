# Spatial Entities — Anchors, Plane and Marker Tracking

Reference for `skills/xr-development/SKILL.md` — the OpenXR Spatial Entities extensions (Godot 4.6+): placing and persisting spatial anchors, plus the 4.7 `create_new_anchor()` extensibility parameter.

> ← Back to [SKILL.md](../SKILL.md)

---

## Spatial Entities (Godot 4.6+)

Godot 4.6 adds the OpenXR **Spatial Entities** extensions (experimental API), enabling:

- **Spatial anchors** — persist virtual object positions across sessions (`OpenXRSpatialAnchorCapability`, `OpenXRAnchorTracker`, `XRAnchor3D`)
- **Plane detection** — detect floor, wall, and ceiling surfaces from the environment scan
- **Marker tracking** — track QR codes or image markers in the scene

**Basic spatial anchor usage:**

```gdscript
# Under XR > OpenXR > Extensions > Spatial Entity enable: Enabled, Enable Spatial Anchors, and
# Enable Builtin Anchor Detection (the default RID() context needs it). All are off by default.
# The capability is a singleton only while OpenXR is enabled; without it this script will not parse.
extends XROrigin3D

func place_anchor_at(local_transform: Transform3D) -> XRAnchor3D:
    if not OpenXRSpatialAnchorCapability.is_spatial_anchor_supported():
        push_error("Spatial anchors are not supported on this device.")
        return null

    # The transform is in this XROrigin3D's local space.
    var tracker: OpenXRAnchorTracker = OpenXRSpatialAnchorCapability.create_new_anchor(local_transform, RID())
    if tracker == null:
        return null

    # An XRAnchor3D follows the tracker it names; the runtime keeps it on the real-world spot.
    var anchor := XRAnchor3D.new()
    anchor.tracker = tracker.name
    add_child(anchor)
    return anchor
```

```csharp
// The capability is an engine singleton registered only while OpenXR is running.
public partial class SpatialAnchorManager : XROrigin3D
{
    public XRAnchor3D PlaceAnchorAt(Transform3D localTransform)
    {
        var anchors = Engine.GetSingleton("OpenXRSpatialAnchorCapability") as OpenXRSpatialAnchorCapability;
        if (anchors == null || !anchors.IsSpatialAnchorSupported())
        {
            GD.PushError("Spatial anchors are not supported on this device.");
            return null;
        }

        // The transform is in this XROrigin3D's local space.
        OpenXRAnchorTracker tracker = anchors.CreateNewAnchor(localTransform);
        if (tracker == null)
            return null;

        // An XRAnchor3D follows the tracker it names; the runtime keeps it on the real-world spot.
        var anchor = new XRAnchor3D { Tracker = tracker.Name };
        AddChild(anchor);
        return anchor;
    }
}
```

To keep an anchor across sessions, turn on **Enable Persistent Anchors**, check `is_spatial_persistence_supported()`, then call `persist_anchor(tracker, RID(), callback)` and store `tracker.uuid` with your own data; persisted anchors come back as `XRServer.TRACKER_ANCHOR` trackers on the next launch. See the [OpenXR spatial entities tutorial](https://docs.godotengine.org/en/stable/tutorials/xr/openxr_spatial_entities.html).

> **Note:** The spatial entities classes arrived in Godot 4.6 and `OpenXRSpatialAnchorCapability` is still marked experimental — its API may change. There is no `XRSpatialAnchor` class; the scene node is `XRAnchor3D`.

---

## Spatial Anchor Extensibility (Godot 4.7+)

`OpenXRSpatialAnchorCapability.create_new_anchor()` gains an optional `next` parameter — full signature: `create_new_anchor(transform: Transform3D, spatial_context: RID = RID(), next: OpenXRStructureBase = null) -> OpenXRAnchorTracker`. `next` must be a valid next object for the `XrSpatialAnchorCreateInfoEXT` chain, letting vendor-specific create-info structs be appended when creating an anchor. Existing calls are unaffected (compatible change, [GH-118128](https://github.com/godotengine/godot/pull/118128)).

> **Note:** `OpenXRSpatialAnchorCapability` is still marked experimental — the class may change in future versions. The section above shows typical anchor placement.
