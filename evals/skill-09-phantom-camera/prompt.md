---
tags: [discriminating]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
I'm using the Phantom Camera addon (0.11) in a 2D game on Godot 4.4. Right now one camera follows the player. I want a second shot that takes over while the player is inside my boss arena's Area2D, keeps both the player and the boss in frame, and then hands back to the normal player camera when the player leaves the arena. Show me the scene tree and the code that sets up the boss shot and does the switching from script. GDScript and C#.
