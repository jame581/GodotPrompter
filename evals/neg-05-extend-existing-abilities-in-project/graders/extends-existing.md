---
type: llm
focus: last_message
---
The project already has an `Ability` base class (scripts/abilities/ability.gd with `_has_resources`, `_is_target_valid`, `_pay_cost`, `_on_cast` hooks, cost and cooldown), a `Fireball` subclass, and `StatusEffect`/`StatusEffectHost`/`BurnEffect` in scripts/combat. Pass only if the answer adds a new `Stun` ability that extends `Ability` (overriding its hooks and setting cooldown, mana_cost and tooltip as Fireball does) and disables the target for 2 s, ideally through a new `StatusEffect` subclass applied via the target's `StatusEffectHost`. Fail if it creates a parallel ability or buff system, ignores `Ability` and `StatusEffectHost`, or has no 2-second duration. The run is read-only, so an answer that says it could not write the files but shows the code still passes; judge only the code shown.
