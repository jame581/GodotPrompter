---
tags: [discriminating]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
I'm on Godot 4.7. My game swaps its on-screen button prompts between keyboard/mouse glyphs and gamepad glyphs. In my input handling I decide which one the player is using from the device number on each incoming input event: the tutorial I followed treats one particular device number as "keyboard and mouse" and every other number as a controller. That worked on Godot 4.5, but since upgrading to 4.7 the prompts stay on gamepad glyphs even when I only type and move the mouse. What changed, and what is the correct way to tell keyboard/mouse input from gamepad input on 4.7? Show the detection in GDScript and C#.
