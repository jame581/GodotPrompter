---
tags: [ceiling]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
I'm using the Beehave addon (2.9) in a Godot 4.4 project, GDScript only. I want an enemy that attacks when the player is within 150 pixels and patrols otherwise. A detection script I already have stores the player node in the tree's blackboard under the key "target". Show me the scene tree for the behavior tree and the scripts for the in-range check and for an attack that takes half a second to finish. There are about 200 of these enemies on screen, so the tree should only be evaluated every few frames instead of every frame.
