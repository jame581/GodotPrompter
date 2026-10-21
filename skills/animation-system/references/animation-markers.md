# Animation Markers

Reference for `skills/animation-system/SKILL.md` — named points and regions inside an animation clip (Godot 4.4+).

> ← Back to [SKILL.md](../SKILL.md)

---

## Animation Markers (Godot 4.4+)

Markers define named points/regions within an animation clip — use them for subregion loops, section-based playback, and audio-synced events without splitting clips. Right-click the animation timeline → **Insert Marker...** → name it (e.g., `hit_frame`, `loop_start`). Play a region with `anim_player.play_section_with_markers(&"attack", &"loop_start", &"loop_end")`, or compare `animation.get_marker_time(&"hit_frame")` with `anim_player.current_animation_position`.

```gdscript
@onready var anim_player: AnimationPlayer = $AnimationPlayer

func play_attack_loop() -> void:
    anim_player.play_section_with_markers(&"attack", &"loop_start", &"loop_end")

func is_past_hit_frame() -> bool:
    var animation: Animation = anim_player.get_animation(&"attack")
    return anim_player.current_animation == &"attack" \
        and anim_player.current_animation_position >= animation.get_marker_time(&"hit_frame")
```

```csharp
private AnimationPlayer _animPlayer;

public override void _Ready()
{
    _animPlayer = GetNode<AnimationPlayer>("AnimationPlayer");
}

private void PlayAttackLoop()
{
    _animPlayer.PlaySectionWithMarkers("attack", "loop_start", "loop_end");
}

private bool IsPastHitFrame()
{
    Animation animation = _animPlayer.GetAnimation("attack");
    return _animPlayer.CurrentAnimation == "attack"
        && _animPlayer.CurrentAnimationPosition >= animation.GetMarkerTime("hit_frame");
}
```
