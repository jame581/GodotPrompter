---
type: llm
focus: last_message
---
Pass if the Area3D is configured with `audio_bus_override = true` and `audio_bus_name = "Underwater"` (C#: `AudioBusOverride = true`, `AudioBusName = "Underwater"`). Fail if the area is configured with other property names for this, such as `bus`, `audio_bus`, `override_audio_bus` or `bus_override`, or if the area's own bus-override properties are not used at all.
