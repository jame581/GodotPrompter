# Common Pitfalls

Reference for `skills/animation-system/SKILL.md` — the full symptom → cause → fix table.

> ← Back to [SKILL.md](../SKILL.md)

---

| Symptom                                          | Cause                                                  | Fix                                                                |
|--------------------------------------------------|--------------------------------------------------------|--------------------------------------------------------------------|
| Animation snaps instead of blending              | Using `AnimationPlayer.play()` instead of AnimationTree | Switch to AnimationTree with state machine or blend tree           |
| AnimationTree does nothing                       | `active` is `false`                                    | Set `anim_tree.active = true` in Inspector or `_ready()`           |
| `travel()` doesn't transition                    | No transition path between states                      | Add transition arrows in the AnimationTree state machine editor    |
| Animation plays but sprite doesn't change        | Track targets wrong node path                          | Verify the track's node path matches the actual scene tree         |
| Method call track doesn't fire                   | Method name typo or wrong target node                  | Check the track's node path and method name match exactly          |
| Blend parameters have no effect                  | Wrong parameter path string                            | Use `"parameters/<NodeName>/blend_position"` — check in Inspector  |
| Animation resets to frame 0 every physics frame  | Calling `play()` every frame on a non-looping clip     | Guard with `if anim_player.current_animation != "name"`            |
