---
type: llm
focus: last_message
weight: 2
---
Pass only if the answer states that Godot 4.7 changed how `RichTextLabel.add_image()` sizes images: the old `width_in_percent` / `height_in_percent` boolean arguments were replaced by `width_unit` / `height_unit` arguments that take an `ImageUnit` enum (members `IMAGE_UNIT_PIXEL`, `IMAGE_UNIT_PERCENT`, `IMAGE_UNIT_EM`). Mentioning the new unit arguments or the `ImageUnit` enum as something new or changed in 4.7 is enough; listing every member is not required. Fail if the answer presents `width_in_percent` / `height_in_percent` as the current 4.7 arguments, or says RichTextLabel has no built-in font-relative image sizing on 4.7.
