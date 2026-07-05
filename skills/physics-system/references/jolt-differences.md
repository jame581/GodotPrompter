# Jolt Physics — Differences from GodotPhysics

Reference for `skills/physics-system/SKILL.md` — behavioral differences to expect when switching the 3D engine to Jolt.

> ← Back to [SKILL.md](../SKILL.md)

---

- **Position-only Baumgarte stabilization** — depenetration is applied to position only, not velocity.
- **Convex-radius collision margins** — convex shapes use a small margin that can subtly round sharp edges.
- **Single-body joints** — the unassigned slot is treated as `node_a` (the "world" anchor), the opposite of GodotPhysics.
- **`face_index`** — raycast results return `-1` unless **Enable Ray Cast Face Index** is turned on in project settings.
- **Unsupported joint properties** — `bias`, `softness`, `relaxation`, `damping` are ignored on PinJoint / HingeJoint / SliderJoint / ConeTwistJoint.
