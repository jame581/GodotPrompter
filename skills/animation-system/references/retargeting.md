# Animation Retargeting

Reference for `skills/animation-system/SKILL.md` — post-import retargeting workflow for sharing animation libraries across differently-proportioned skeletons (Godot 4.3+).

> ← Back to [SKILL.md](../SKILL.md)

---

## Animation Retargeting on Import (Godot 4.3+)

Godot 4.3 can retarget animations from one skeleton to another during `.glb`/`.gltf` import. Use this to share a library of animations across differently-proportioned characters.

**Setup:**
1. In the Import dock for a `.glb` file, expand **Animation**
2. Enable **Retarget** and assign a `SkeletonProfile` (e.g., `SkeletonProfileHumanoid`)
3. Map source skeleton bones to the profile's bone names
4. Re-import — animations now target the profile's generic bone names
5. Any skeleton using the same `SkeletonProfile` can play these animations
