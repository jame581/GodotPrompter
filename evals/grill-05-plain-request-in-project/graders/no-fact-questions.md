---
type: llm
focus: last_message
---
Pass if every question asks about something only the user can know — intent, constraints, priorities, taste. The four root decisions (scope; 2D/3D/2.5D; GDScript/C#/both; single-player/networked and who is authoritative) are the user's to state and ALWAYS pass, as do feature choices such as grid vs. list, stacking rules, or whether items persist. Fail only if a question asks the user to pick an implementation the assistant should decide for them — a Godot node type or class ("Control or Node2D?", "ItemList or GridContainer?"), an API, or a storage technology named as such ("Resource or Dictionary?", "JSON or ConfigFile?").
