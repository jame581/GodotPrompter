---
type: llm
focus: last_message
---
Pass if the code inserts the image with `add_image()` (C#: `AddImage()`) using the em unit — `RichTextLabel.IMAGE_UNIT_EM` in GDScript, `ImageUnit.Em` in C# — for the width and/or height unit, so the size is expressed in ems and follows the font size. Fail if the main solution instead computes a pixel size from the font size (for example via `get_theme_font_size()` or `get_theme_font().get_height()`) and passes pixels, re-adds or updates images when the font size changes, uses `[img]` BBCode with pixel dimensions, or uses the percent unit.
