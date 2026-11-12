---
tags: [discriminating]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
I'm starting a new C# project on Godot 4.8 and I'm creating the repo by hand on a Linux box so my CI can build it before anyone opens the editor. Please write the `.csproj` for a game called "Starfall" (desktop only, nothing exotic), tell me which target framework and which Godot.NET.Sdk version to put in it, and what .NET SDK I need installed on the CI runner so `dotnet build` works.
