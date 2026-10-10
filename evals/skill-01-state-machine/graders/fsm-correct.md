---
type: llm
focus: last_message
---
Pass only if ALL hold: (1) each state has an entry hook and an exit hook, and a per-frame or per-physics-frame update; (2) transitions go through one place (the machine) that calls the old state's exit and then the new state's entry; (3) movement runs from the physics callback and move_and_slide() is called with no arguments, with velocity set as a property beforehand.
