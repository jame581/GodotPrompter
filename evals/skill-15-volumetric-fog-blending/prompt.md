---
tags: [discriminating]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
I upgraded my 3D project from Godot 4.5 to Godot 4.7 without touching the scene. The WorldEnvironment has volumetric fog enabled for a misty forest level, and its Environment settings (density, albedo, emission, length) are exactly what they were, but on 4.7 the volumetric fog visibly does not look the same as it did on 4.5 and the lighting mood I tuned is off. Why does the same volumetric fog render differently now, and how do I get the 4.5 look back exactly, without re-tuning the fog values by eye?
