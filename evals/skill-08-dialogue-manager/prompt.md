---
tags: [ceiling]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
I'm using Nathan Hoad's Dialogue Manager addon (version 3) on Godot 4.6. I don't want any of the built-in balloons because I'm drawing my own dialogue UI. Give me code that takes a .dialogue resource, starts at its "start" title and goes through the conversation one line at a time, printing the speaker and the text, always choosing the first choice when the line offers choices, and stopping cleanly when the conversation is over. I also have a separate HUD script that needs to be told whenever a conversation has finished. GDScript and C#.
