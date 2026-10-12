---
tags: [discriminating]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
I'm on Godot 4.7. My 3D level has a flooded tunnel with an Area3D around it, and I want every AudioStreamPlayer3D that is inside that area to be routed through my "Underwater" audio bus automatically, without writing per-emitter code. I set it up the way older Godot 4 tutorials describe, but on 4.7 the sounds inside the tunnel still play on their normal bus. What is the correct setup? Show how to configure the area and the sound emitters from code in GDScript and C#.
