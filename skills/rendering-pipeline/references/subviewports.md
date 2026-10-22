# SubViewports and Render Targets

Reference for `skills/rendering-pipeline/SKILL.md` — update modes, showing a SubViewport in UI, per-viewport render settings, and capturing a texture once.

> ← Back to [SKILL.md](../SKILL.md)

A `SubViewport` renders its own scene (or a second camera on the same world) into a texture: minimaps, security cameras, portraits, 3D models in UI, low-resolution pixel-art 3D. **Each active SubViewport is another full render**, so control when it updates.

| `render_target_update_mode` | Use for |
|---|---|
| `UPDATE_WHEN_VISIBLE` (default) | Live views shown on screen |
| `UPDATE_ONCE` | Snapshots — inventory icons, character portraits, a frozen photo |
| `UPDATE_DISABLED` | Pause an off-screen view entirely |
| `UPDATE_ALWAYS` | Feeds a material even when its container is hidden |

Show it in UI with a `SubViewportContainer` (`stretch = true` sizes the viewport to the container; `stretch_shrink = 3` renders at a third of the size for a chunky pixel look), or use `sub_viewport.get_texture()` as a `ViewportTexture` on any material. SubViewports have their own `msaa_3d`, `scaling_3d_*`, and `use_taa` — they do **not** inherit the root viewport's settings.

```gdscript
# Render a 3D model to a texture once, e.g. for an inventory icon.
func capture_icon(sub_viewport: SubViewport) -> ImageTexture:
    sub_viewport.render_target_update_mode = SubViewport.UPDATE_ONCE
    await RenderingServer.frame_post_draw
    return ImageTexture.create_from_image(sub_viewport.get_texture().get_image())
```

```csharp
// Render a 3D model to a texture once, e.g. for an inventory icon.
public async Task<ImageTexture> CaptureIcon(SubViewport subViewport)
{
    subViewport.RenderTargetUpdateMode = SubViewport.UpdateMode.Once;
    await ToSignal(RenderingServer.Singleton, RenderingServer.SignalName.FramePostDraw);
    return ImageTexture.CreateFromImage(subViewport.GetTexture().GetImage());
}
```

Set `transparent_bg = true` on the SubViewport for icons with an alpha background. Split-screen setup: **camera-system**; minimaps: **hud-system**.
