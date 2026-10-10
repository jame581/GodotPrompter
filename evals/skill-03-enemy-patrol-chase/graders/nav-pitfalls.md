---
type: llm
focus: last_message
---
Pass if the answer warns about at least TWO of these, each with what to do: the navigation region must have a baked navigation polygon or no path is found; target_position should not be reassigned every physics frame (throttle it, for example with a Timer); the navigation map is not ready on the very first frame, so the first target must be deferred or awaited; navigation layers on the region and the agent must match; with avoidance enabled, movement must use the velocity_computed signal. Fail if it mentions fewer than two.
