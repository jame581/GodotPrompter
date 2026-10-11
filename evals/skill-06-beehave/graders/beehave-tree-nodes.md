---
type: llm
focus: last_message
---
Pass only if the scene tree shown has a `BeehaveTree` node as the root of the behavior tree and builds the attack-or-patrol logic from composites named `SelectorComposite` and `SequenceComposite` (the reactive variants `SelectorReactiveComposite` / `SequenceReactiveComposite` also count). Fail if the root is named `BeehaveRoot` or `BTPlayer`, or if the composites are given as bare `Selector` / `Sequence` node types or as `BTSelector` / `BTSequence`.
