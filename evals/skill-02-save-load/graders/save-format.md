---
type: llm
focus: last_message
---
Pass only if ALL hold: (1) save files are written under user://, never res://; (2) the answer says why it chose its save format, contrasting it with at least one named alternative (JSON, ConfigFile, Resource .tres/.res, binary); (3) if it saves or loads game saves as Resource files (.tres or .res, ResourceSaver/ResourceLoader), it warns that loading a Resource file can execute embedded code and must not be done with untrusted files. An answer that uses JSON or ConfigFile satisfies (3) automatically.
