> ← Back to [SKILL.md](../SKILL.md)

# Animation Import

## Splitting Animations

If a 3D file contains a single timeline with multiple animations, split them in the **Advanced Import Settings**:

1. Double-click the `.glb` file to open Advanced Import Settings
2. Go to **Animations** tab
3. Add animation clips with **start frame** and **end frame**
4. Set **loop mode** per clip (None, Linear, Ping-Pong)

## Retargeting Animations

Share animations between characters with different skeletons:

1. Import both the source (animation) and target (character) models
2. Select the model, then click **Advanced...** in the Import dock to open *Advanced Import Settings*
3. Select the **Skeleton3D** node and find **Retarget > Bone Map**
4. Create a `BoneMap` and map the model's bones to the profile's bones
5. Use `SkeletonProfile` resources for standard humanoid mappings

## Animation Import Settings

| Setting | Description |
|-----------------------|------------------------------------------|
| **Import** | Enable/disable animation import |
| **FPS** | Bake framerate (30 is standard) |
| **Trimming** | Remove empty frames at start/end |
| **Remove Immutable Tracks** | Remove tracks that don't change |
