---
tags: [discriminating]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
I'm on Godot 4.7 and I build my character's AnimationTree from code: an AnimationNodeBlendSpace1D that blends a walk clip and a run clip by speed. I need both clips to keep advancing in the background even while their blend weight is zero, so the feet are already in step when the blend moves from walk to run, instead of the run clip starting from a frozen pose. The tutorial I'm following was written for an older Godot 4 and does this with a single on/off flag on the blend space, but on 4.7 that flag is marked deprecated. What replaced it in 4.7, and which setting gives exactly the behaviour the old flag gave when it was on? Show how to set it on the blend space in GDScript and C#.
