# Jolt Physics — Differences from GodotPhysics

Reference for `skills/physics-system/SKILL.md` — behavioral differences to expect when switching the 3D engine to Jolt.

> ← Back to [SKILL.md](../SKILL.md)

---

- Position-only Baumgarte stabilization.
- Convex-radius collision margins.
- Single-body joints treat the unassigned slot as `node_a` (world — opposite of GodotPhysics).
- `face_index` returns `-1` unless **Enable Ray Cast Face Index** is on.
- Some joint properties (`bias`, `softness`, `relaxation`, `damping`) are unsupported on PinJoint / HingeJoint / SliderJoint / ConeTwistJoint.
