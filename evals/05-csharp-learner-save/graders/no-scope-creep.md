---
type: llm
focus: last_message
---
Pass if the delivered code and setup implement only the feature the user asked for. Restructuring or supporting code that the requested feature genuinely needs is fine — e.g. showing the feature inside a complete, runnable version of the script it lives in, or introducing a small component/binder that owns the data the feature displays. Limits that stop the requested feature breaking in play — a cooldown, an air or use limit, a clamp, a guard against triggering twice — are part of that feature, not extra mechanics. Fail only if the answer implements genuinely new, unrequested features (e.g. sound effects, animations, particles, visual polish, saving, extra gameplay mechanics). Mentioning ONE extra idea as a suggested next step is allowed.
