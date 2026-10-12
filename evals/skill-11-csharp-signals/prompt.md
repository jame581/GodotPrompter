---
tags: [ceiling]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
Godot 4.4 project that mixes C# and GDScript. My Player is a C# script and needs to announce health changes, sending the current and the maximum health as two ints. Two things listen to it: a HUD script written in GDScript and a damage-log script written in C#. Separately, my ScoreManager autoload is GDScript and declares `signal score_changed(new_score: int)`; a C# Label script has to update its text whenever that fires. Show me the Player code that declares and sends the health signal, the line(s) the GDScript HUD uses to connect to it, and both C# listeners.
