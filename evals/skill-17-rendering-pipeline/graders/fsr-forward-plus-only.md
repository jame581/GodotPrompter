---
type: llm
focus: last_message
weight: 2
---
Pass if the answer says FSR (FSR 1 and FSR 2) is only available on the Forward+ renderer, so on the Mobile renderer (and Compatibility) the mode is ignored/unsupported, which is why the dropdown does nothing and a warning (or, on Godot 4.3-4.5, an editor error) appears, AND recommends a fallback that works on the active renderer: bilinear scaling (`scaling_3d_mode` bilinear with `scaling_3d_scale` below 1.0), or nearest on Godot 4.7+. It should also say the menu should offer only the modes the running renderer supports (hide or disable FSR entries on Mobile). Fail if the answer blames something else (a missing setting, a bug, the scale value), says FSR 2 works on Mobile, or offers no working alternative for the Mobile renderer.
