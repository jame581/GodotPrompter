# IKModifier3D — Solver Comparison

Reference for `skills/animation-system/SKILL.md` — the full solver comparison table and selection guidance (Godot 4.6+).

> ← Back to [SKILL.md](../SKILL.md)

---

**Pick the right solver:**

| Solver | Algorithm | Best for | Notes |
|---|---|---|---|
| `TwoBoneIK3D` | Analytical two-bone | Legs, arms (chain is exactly 2 bones) | Deterministic and non-iterative. Requires a pole target (`set_pole_node`) to fix the elbow or knee direction. |
| `CCDIK3D` | Cyclic Coordinate Descent (rotation-based) | Chains whose joints have limitations | Fast even with large joint rotations; smoother and more stable than FABRIK when joints are limited. |
| `FABRIK3D` | Forward And Backward Reaching (position-based) | Simple chains without joint limitations | Precise, accurate target tracking. |
| `JacobianIK3D` | Jacobian | Organic, biological motion | Solves all joints together for natural, smooth movement; converges more slowly, so tracking is gentler and less immediate. |
| `SplineIK3D` | Spline fitting | Tails, tentacles, spines that follow a curve | Aligns the chain along a `Path3D` (`set_path_3d`) instead of reaching a target node. |

Default to `TwoBoneIK3D` when the chain is exactly 2 bones (give it a pole node). Use `FABRIK3D` for simple unconstrained chains that must hit the target precisely, `CCDIK3D` when joints have limitations, `SplineIK3D` to follow a `Path3D`, and `JacobianIK3D` when smooth organic motion matters more than immediate tracking. These descriptions follow the engine's class reference; it gives no relative cost figures, so profile before choosing on performance.
