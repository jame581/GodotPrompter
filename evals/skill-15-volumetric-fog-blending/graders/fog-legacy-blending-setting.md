---
type: llm
focus: last_message
weight: 2
---
Pass if the answer says to restore the old look by enabling the project setting `rendering/environment/fog/use_legacy_blending` (setting it to `true`; it is `false` by default). Describing it as the "Use Legacy Blending" option under Rendering > Environment > Fog in Project Settings is acceptable. Fail if the only fix offered is re-tuning Environment values (density, albedo, emission, length, anisotropy, ambient inject), toggling temporal reprojection, switching renderer, or a project setting with a different name.
