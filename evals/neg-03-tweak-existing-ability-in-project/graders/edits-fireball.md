---
type: llm
focus: last_message
---
In scripts/abilities/fireball.gd, `_init` sets `cooldown = 3.0` and a tooltip ending "Cooldown: 3 seconds." Pass if the answer changes the cooldown to 2.5 and changes the tooltip text to say 2.5 seconds, as a concrete edit to that file. Fail if either change is missing, or if it proposes restructuring the ability system instead of editing those two values. The run is read-only, so an answer that says it could not write the file but shows the exact edit still passes; judge only the edit shown.
