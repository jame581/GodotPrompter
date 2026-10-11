---
type: llm
focus: last_message
weight: 2
---
Pass only if the answer states that in Godot 4.7 the blend space's boolean `sync` property is deprecated and replaced by a `sync_mode` property (C#: `SyncMode`) that takes an enum rather than a bool. Fail if the answer presents `sync = true` (C#: `Sync = true`) as the current, non-deprecated way on 4.7, if it never names `sync_mode` / `SyncMode`, or if it names a different replacement instead (for example `blend_mode`, an `AnimationNodeSync` / `AnimationNodeBlend2` `sync` flag, `AnimationNodeOneShot`, or a custom timeline or manual `advance()` workaround).
