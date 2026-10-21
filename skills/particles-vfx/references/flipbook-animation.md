# Flipbook Animation (2D)

Reference for `skills/particles-vfx/SKILL.md` — sprite-sheet animated particles via `ParticleProcessMaterial.AnimSpeed` / `CanvasItemMaterial.ParticlesAnim*`. **GDScript + C# parity** (v1.6.0).

> ← Back to [SKILL.md](../SKILL.md)

---
### Setup

1. Set the particle **Texture** to a sprite sheet
2. On the GPUParticles2D, set the **CanvasItemMaterial** (not the process material):
   - Material → New CanvasItemMaterial
   - Enable **Particle Animation**
   - Set **H Frames** and **V Frames** to match the sheet layout
3. On the ParticleProcessMaterial, configure Animation:
   - `anim_speed_min` / `anim_speed_max` — playback speed
   - `anim_offset_min` / `anim_offset_max` — random start frame

```gdscript
# Process material animation settings
mat.anim_speed_min = 1.0
mat.anim_speed_max = 1.5
mat.anim_offset_min = 0.0
mat.anim_offset_max = 0.5  # random start position in the animation
```

```csharp
public partial class HitSpark : GpuParticles2D
{
    public override void _Ready()
    {
        // Process material — animation playback speed and start offset
        var mat = (ParticleProcessMaterial)ProcessMaterial;
        mat.AnimSpeedMin = 1.0f;
        mat.AnimSpeedMax = 1.5f;
        mat.AnimOffsetMin = 0.0f;
        mat.AnimOffsetMax = 0.5f;

        // CanvasItemMaterial — sheet layout and looping
        var canvasMat = (CanvasItemMaterial)Material;
        canvasMat.ParticlesAnimHFrames = 4;
        canvasMat.ParticlesAnimVFrames = 4;
        canvasMat.ParticlesAnimLoop = false;
        canvasMat.BlendMode = CanvasItemMaterial.BlendModeEnum.Add;  // good default for fire/sparks
    }
}
```

> Use **Add** blend mode on the CanvasItemMaterial for particles with black backgrounds (fire, sparks, magic).

---

