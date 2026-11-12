---
tags: [discriminating]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
I'm using Nathan Hoad's Dialogue Manager addon (version 4) on Godot 4.7. I don't want any of the built-in balloons because I'm drawing my own dialogue UI. Give me:

1. A short sample .dialogue file starting at a "start" cue, where the player gets two choices and the second choice is only available when `GameState.has_key` is true.
2. Code that takes a .dialogue resource, starts at its "start" cue and goes through the conversation one line at a time, printing the speaker and the text, always choosing the first choice the player is allowed to pick when the line offers choices, and stopping cleanly when the conversation is over. My voice-over system needs a stable per-line key, so also print the property of the line object that holds it.
3. I also have a separate HUD script that needs to be told whenever a conversation has finished.
4. We translate the game with PO files — tell me what, if anything, I need to configure in Dialogue Manager for that.

GDScript and C#.
