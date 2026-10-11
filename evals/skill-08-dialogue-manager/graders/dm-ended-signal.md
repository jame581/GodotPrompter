---
type: llm
focus: last_message
---
The HUD must be told when a conversation finishes. Pass if it is notified in either of these ways: (a) through the addon's own signal, named `dialogue_ended` in GDScript and `DialogueEnded` in C# (with `using DialogueManagerRuntime;`, or connected by the string name `"dialogue_ended"`); or (b) through a signal the answer's own conversation-walking code declares and emits when the loop ends. Fail if the answer names an addon signal that does not exist for this, such as `dialogue_finished`, `finished`, `dialogue_complete` or `conversation_ended` on `DialogueManager`, if the HUD is never notified, or if the answer says C# needs a NuGet package for the addon.
