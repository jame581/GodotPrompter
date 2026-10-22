---
type: llm
focus: last_message
---
Pass if any code shown uses Godot 4 APIs only (`Viewport.scaling_3d_mode` with `Viewport.SCALING_3D_MODE_BILINEAR` / `SCALING_3D_MODE_FSR2` / `SCALING_3D_MODE_NEAREST`, `scaling_3d_scale`, `RenderingServer.get_current_rendering_method()` or the `rendering/renderer/rendering_method` setting) and does not invent properties or Godot 3 names (`Viewport.fsr`, `get_viewport().render_scale`, `OS.get_video_driver_name` as the only renderer check). Also pass if no code is shown. Fail if code uses non-existent or Godot 3 APIs.
