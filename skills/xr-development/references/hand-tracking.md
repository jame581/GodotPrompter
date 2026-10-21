# Hand Tracking

Reference for `skills/xr-development/SKILL.md` — hand-tracking node setup, joint sampling, gesture-driven interactions.

> ← Back to [SKILL.md](../SKILL.md)

---
## 3. Hand Tracking

OpenXR hand tracking provides skeletal hand data without controllers.

```gdscript
extends XROrigin3D

@onready var left_hand: XRController3D = $LeftController
@onready var right_hand: XRController3D = $RightController

func _process(_delta: float) -> void:
    # Check if hand tracking is active (vs controller tracking)
    var xr_interface: XRInterface = XRServer.find_interface("OpenXR")
    if not xr_interface:
        return

    # Hand tracking data is accessed through the XRHandTracker
    var left_tracker: XRHandTracker = XRServer.get_tracker("left_hand") as XRHandTracker
    if left_tracker:
        # Check for pinch gesture
        if left_tracker.get_hand_joint_flags(XRHandTracker.HAND_JOINT_INDEX_FINGER_TIP) & XRHandTracker.HAND_JOINT_FLAG_POSITION_TRACKED:
            var thumb_tip: Vector3 = left_tracker.get_hand_joint_transform(XRHandTracker.HAND_JOINT_THUMB_TIP).origin
            var index_tip: Vector3 = left_tracker.get_hand_joint_transform(XRHandTracker.HAND_JOINT_INDEX_FINGER_TIP).origin
            var pinch_distance: float = thumb_tip.distance_to(index_tip)
            if pinch_distance < 0.02:  # 2cm threshold
                _on_pinch_detected()
```

```csharp
public partial class XRHandTrackingOrigin : XROrigin3D
{
    public override void _Process(double delta)
    {
        var xrInterface = XRServer.FindInterface("OpenXR");
        if (xrInterface == null)
            return;

        var leftTracker = XRServer.GetTracker("left_hand") as XRHandTracker;
        if (leftTracker != null)
        {
            var flags = leftTracker.GetHandJointFlags(XRHandTracker.HandJoint.IndexFingerTip);
            if (flags.HasFlag(XRHandTracker.HandJointFlags.PositionTracked))
            {
                Vector3 thumbTip = leftTracker.GetHandJointTransform(XRHandTracker.HandJoint.ThumbTip).Origin;
                Vector3 indexTip = leftTracker.GetHandJointTransform(XRHandTracker.HandJoint.IndexFingerTip).Origin;
                float pinchDistance = thumbTip.DistanceTo(indexTip);
                if (pinchDistance < 0.02f) // 2cm threshold
                    OnPinchDetected();
            }
        }
    }
}
```

> **Note:** Hand tracking availability depends on the XR headset. Meta Quest, Pico, and some SteamVR setups support it; Apple Vision Pro is not an OpenXR target in Godot. Always fall back to controller input.

---

