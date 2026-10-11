---
tags: [discriminating]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
I'm on Godot 4.7, building the chat box UI for my game. It is a RichTextLabel Control, and from code I insert small icon textures (emotes, item icons) inline between the words. I want every icon to be sized relative to the label's font size, so that when a player raises the UI text size in the accessibility options the icons grow with the text automatically, without me recalculating a pixel size and re-inserting the images. The older Godot 4 examples I can find only size inline images in pixels or as a percentage of the label width, and neither does this. What is the right way to insert the image on 4.7 so it scales with the font? Show the call in GDScript and C#.
