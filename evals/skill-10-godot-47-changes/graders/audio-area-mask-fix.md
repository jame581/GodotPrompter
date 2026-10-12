---
type: llm
focus: last_message
weight: 2
---
Pass only if the answer says the `AudioStreamPlayer3D` nodes must have their `area_mask` property (C#: `AreaMask`) set to a non-zero value that includes the collision layer of the tunnel's Area3D (for example `area_mask = 1`), and shows this in the setup. Fail if `area_mask` is never set on the players, or if the fix offered is something else instead: changing the Area3D's `monitoring` / `monitorable`, its `collision_mask`, the players' `bus` property by script on enter/exit signals, or the bus layout.
