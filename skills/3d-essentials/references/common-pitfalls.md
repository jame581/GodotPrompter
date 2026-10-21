# Common Pitfalls

Reference for `skills/3d-essentials/SKILL.md` — the full symptom → cause → fix table.

> ← Back to [SKILL.md](../SKILL.md)

---

| Symptom                              | Cause                                          | Fix                                                              |
|--------------------------------------|-------------------------------------------------|------------------------------------------------------------------|
| 3D scene is completely black         | No Camera3D or no lights in scene               | Add Camera3D + DirectionalLight3D + WorldEnvironment             |
| Objects appear dark despite lighting | No ambient light or sky                          | Set Environment ambient_light_source to Sky or Color             |
| Shadow acne (striped shadows)        | Shadow bias too low                              | Increase `shadow_normal_bias` (preferred over `shadow_bias`)     |
| Peter-panning (shadows detached)     | Shadow bias too high                             | Lower `shadow_bias`; use `shadow_normal_bias` instead            |
| Shadows pop in/out                   | `directional_shadow_max_distance` too high       | Lower to 50–100m; quality improves as range shrinks              |
| Material looks flat / no reflections | Missing ReflectionProbe or Sky                   | Add ReflectionProbe or set Environment reflected light to Sky    |
| Decals don't appear                  | Y extent too small or wrong cull mask            | Increase Decal Y size; check cull mask matches target layer      |
| Transparency sorting artifacts       | Overlapping transparent meshes                   | Use Alpha Scissor/Hash where possible; avoid layered transparency |
| SDFGI shows light leaking           | Thin walls or small geometry                     | Thicken walls; increase SDFGI cascade count                      |
| Volumetric fog not visible           | Wrong renderer (Mobile/Compatibility)            | Switch to Forward+ renderer                                      |
| MultiMesh instances invisible         | `instance_count` set after transforms           | Set `instance_count` before calling `set_instance_transform()`   |
