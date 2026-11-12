# Animation Retargeting

Reference for `skills/animation-system/SKILL.md` — post-import retargeting workflow for sharing animation libraries across differently-proportioned skeletons (Godot 4.3+).

> ← Back to [SKILL.md](../SKILL.md)

---

## Animation Retargeting on Import (Godot 4.3+)

Godot 4.3 can retarget animations from one skeleton to another during `.glb`/`.gltf` import. Use this to share a library of animations across differently-proportioned characters.

**Setup:**
1. Select the `.glb` file in the FileSystem dock, then in the Import dock click **Advanced...** to open the *Advanced Import Settings* dialog
2. In the dialog's scene tree, select the **Skeleton3D** node; its settings include a **Retarget** group with a **Bone Map** property (`retarget/bone_map`)
3. Create a new `BoneMap` there, assign a `SkeletonProfile` (e.g., `SkeletonProfileHumanoid`) to it, and map the source skeleton's bones to the profile's bone names
4. Click **Reimport** — with a Bone Map set, the Retarget group's other options (bone renamer, rest fixer, remove tracks) apply and animations target the profile's generic bone names
5. Any skeleton using the same `SkeletonProfile` can play these animations
