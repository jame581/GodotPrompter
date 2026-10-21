---
tags: [ceiling]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
My Godot 4.4 game downloads a large content pack (around 300 MB) from my server with an HTTPRequest node. To stop it hanging on bad connections I set `http.timeout = 10.0`, and now on slow connections it always fails with a timeout error even though I can see the byte count still going up the whole time. Fast connections are fine. How do I make big downloads work reliably on slow connections, and what should the download code look like?
