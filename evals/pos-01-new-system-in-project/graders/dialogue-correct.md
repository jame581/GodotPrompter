---
type: llm
focus: last_message
---
The user asked for a dialogue system with a list of lines per NPC, an interact key that advances to the next line, the box closing after the last line, and a simple box at the bottom of the screen showing the NPC name and current line. Pass only if the answer gives code that (1) holds the lines in a per-NPC data structure, (2) advances on an input action (not a hard-coded key) and closes after the last line, and (3) builds a Control-based box anchored to the bottom showing the name and the current line. Fail if it asks questions instead of delivering code, or omits any of the three. The run is read-only, so an answer that shows the code without writing files still passes. Extras such as typewriter effects or signals do not matter.
