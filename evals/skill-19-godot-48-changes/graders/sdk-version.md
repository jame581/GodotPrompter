---
type: llm
focus: last_message
---
Pass if the csproj's `Godot.NET.Sdk` reference carries a 4.8 version (for example `4.8.0` or `4.8.0-stable`, or an explicit instruction to match the installed editor's 4.8.x). Fail if it pins a 4.7 or earlier version, or leaves the version out with no instruction to match the editor version.
