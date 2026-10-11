---
tags: [ceiling]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
I'm making a point-and-click adventure with the Popochiu addon (2.1) on Godot 4.6. In my Hallway room there is a door prop. When the player clicks the door, the player character should walk over to it and say "It's locked." When the player uses the Key inventory item on the door instead, the game should switch to my other room, which is called Garden. Separately, in my dialog tree's script: after the player picks the option whose id is AskKey, that option should disappear and the option with id AskGarden should become available. Show me the door script and the dialog script.
