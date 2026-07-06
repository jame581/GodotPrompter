# IKModifier3D — Solver Comparison

Reference for `skills/animation-system/SKILL.md` — the full solver comparison table and selection guidance (Godot 4.6+).

> ← Back to [SKILL.md](../SKILL.md)

---

**Pick the right solver:**

| Solver | Algorithm | Cost | Best for | Joint count | Notes |
|---|---|---|---|---|---|
| `TwoBoneIK3D` | Analytical two-bone | Cheapest | Legs, arms (chain is exactly 2 bones) | Exactly 2 | Fast and exact. Default when the chain is hip→knee→ankle or shoulder→elbow→wrist. |
| `CCDIK3D` | Cyclic Coordinate Descent | Cheap | Tails, tentacles, simple arms | 2–6 joints | Iterative; can twist unnaturally on long chains. Good default for short arms. |
| `FABRIK3D` | Forward And Backward Reaching | Moderate | Spines, longer limbs, natural reach | 3–10 joints | Forward-and-backward reaching; smooth, stable. Best when the chain length is variable. |
| `JacobianIK3D` | Jacobian / pseudo-inverse | Expensive | Overdetermined rigs, robotic arms | Any | Solves a Jacobian per step; most accurate, most CPU. Reserve for cinematic or hero rigs. |
| (4 further subclasses) | Various | Varies | See 4.6 release notes | — | — |

Default to `TwoBoneIK3D` when the chain is exactly 2 bones (the common humanoid case). Use `CCDIK3D` for short non-2-bone chains. Upgrade to `FABRIK3D` when the result twists or overshoots, or when chain length varies. Reach for `JacobianIK3D` only when rig accuracy is the bottleneck of frame quality, not frame time.
