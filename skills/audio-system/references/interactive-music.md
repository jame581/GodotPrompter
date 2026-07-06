# Interactive & Adaptive Music (Godot 4.3+)

Reference for `skills/audio-system/SKILL.md` — `AudioStreamPlaylist`, `AudioStreamSynchronized`, `AudioStreamInteractive` for adaptive music. Plus runtime WAV loading (4.4+).

> ← Back to [SKILL.md](../SKILL.md)

---
## 10. Interactive & Adaptive Music (Godot 4.3+)

Godot 4.3 introduced specialized AudioStream types for dynamic music that responds to gameplay.

### AudioStreamPlaylist

Plays a sequence of audio streams in order. Use for level music with intro → loop → outro structure, or for jukebox-style playlists.

```gdscript
# Create a playlist with intro and loop
var playlist := AudioStreamPlaylist.new()
playlist.stream_count = 2
playlist.set_list_stream(0, preload("res://audio/music/boss_intro.ogg"))
playlist.set_list_stream(1, preload("res://audio/music/boss_loop.ogg"))
# BPM sync ensures transitions land on beat boundaries
playlist.bpm = 120.0
playlist.shuffle = false
playlist.loop = true    # loop the entire playlist

$MusicPlayer.stream = playlist
$MusicPlayer.play()
```

```csharp
var playlist = new AudioStreamPlaylist();
playlist.StreamCount = 2;
playlist.SetListStream(0, GD.Load<AudioStream>("res://audio/music/boss_intro.ogg"));
playlist.SetListStream(1, GD.Load<AudioStream>("res://audio/music/boss_loop.ogg"));
playlist.Shuffle = false;
playlist.Loop = true;

GetNode<AudioStreamPlayer>("MusicPlayer").Stream = playlist;
GetNode<AudioStreamPlayer>("MusicPlayer").Play();
```

### AudioStreamSynchronized

Plays multiple streams in perfect sync, allowing you to blend layers. Use for adaptive music — e.g. a base track with combat percussion that fades in when enemies appear.

```gdscript
# Three synchronized layers: base, drums, intensity
var sync := AudioStreamSynchronized.new()
sync.stream_count = 3
sync.set_sync_stream(0, preload("res://audio/music/ambient_base.ogg"))
sync.set_sync_stream(1, preload("res://audio/music/ambient_drums.ogg"))
sync.set_sync_stream(2, preload("res://audio/music/ambient_intense.ogg"))

# Set initial volumes — layer 0 full, others silent
sync.set_sync_stream_volume(0, 0.0)   # 0 dB
sync.set_sync_stream_volume(1, -80.0)  # silent
sync.set_sync_stream_volume(2, -80.0)  # silent

$MusicPlayer.stream = sync
$MusicPlayer.play()

# When combat starts — fade in drums layer
func _on_combat_started() -> void:
    var playback := $MusicPlayer.get_stream_playback() as AudioStreamPlaybackSynchronized
    # Tween the volume of layer 1 from silent to audible
    var tween := create_tween()
    tween.tween_method(
        func(db: float) -> void: playback.set_stream_volume(1, db),
        -80.0, 0.0, 1.5
    )
```

```csharp
var sync = new AudioStreamSynchronized();
sync.StreamCount = 3;
sync.SetSyncStream(0, GD.Load<AudioStream>("res://audio/music/ambient_base.ogg"));
sync.SetSyncStream(1, GD.Load<AudioStream>("res://audio/music/ambient_drums.ogg"));
sync.SetSyncStream(2, GD.Load<AudioStream>("res://audio/music/ambient_intense.ogg"));
sync.SetSyncStreamVolume(0, 0.0f);
sync.SetSyncStreamVolume(1, -80.0f);
sync.SetSyncStreamVolume(2, -80.0f);

GetNode<AudioStreamPlayer>("MusicPlayer").Stream = sync;
GetNode<AudioStreamPlayer>("MusicPlayer").Play();

// When combat starts — fade in drums layer
public void OnCombatStarted()
{
    var playback = GetNode<AudioStreamPlayer>("MusicPlayer").GetStreamPlayback() as AudioStreamPlaybackSynchronized;
    var tween = CreateTween();
    tween.TweenMethod(Callable.From<float>(db => playback.SetStreamVolume(1, db)), -80.0f, 0.0f, 1.5);
}
```

### AudioStreamInteractive

Transitions between music clips based on triggers (e.g. exploration → combat → boss). Define transition rules: crossfade, fade-to-silence, or immediate switch. Set transitions between clips by index with configurable fade times.

> **Note:** AudioStreamInteractive is configured primarily through the Inspector — set up clips and transition rules in the AudioStreamInteractive resource editor. Code triggers the switch:

```gdscript
# Switch to clip index 2 (e.g. "combat" clip)
var playback: AudioStreamPlaybackInteractive = $MusicPlayer.get_stream_playback()
playback.switch_to_clip(2)
```

```csharp
var playback = GetNode<AudioStreamPlayer>("MusicPlayer").GetStreamPlayback() as AudioStreamPlaybackInteractive;
playback.SwitchToClip(2);
```

#### Resume-Position Transitions (Godot 4.7+)

`add_transition()`'s `to_time` parameter takes a `TransitionToTime` value. Godot 4.7 exposes `TRANSITION_TO_TIME_PREVIOUS_POSITION` (`2`) to scripts: the destination clip resumes from the last position a previous transition left it at, or plays from its start if it never played. Classic use — exploration ↔ combat music that picks up where it left off:

```gdscript
# Clip 0 = exploration, clip 1 = combat.
# Combat → exploration: resume exploration where it left off.
var interactive: AudioStreamInteractive = $MusicPlayer.stream
interactive.add_transition(
    1, 0,
    AudioStreamInteractive.TRANSITION_FROM_TIME_NEXT_BEAT,
    AudioStreamInteractive.TRANSITION_TO_TIME_PREVIOUS_POSITION,
    AudioStreamInteractive.FADE_CROSS,
    4.0  # fade over 4 beats
)
```

```csharp
var interactive = (AudioStreamInteractive)GetNode<AudioStreamPlayer>("MusicPlayer").Stream;
interactive.AddTransition(
    1, 0,
    AudioStreamInteractive.TransitionFromTime.NextBeat,
    AudioStreamInteractive.TransitionToTime.PreviousPosition,
    AudioStreamInteractive.FadeMode.Cross,
    4.0f
);
```

The same option is available in the Inspector's transition editor.

### When to Use Which

| Stream Type | Use For |
|---|---|
| `AudioStreamPlaylist` | Sequential tracks (intro → loop), jukeboxes |
| `AudioStreamSynchronized` | Layered music with volume blending |
| `AudioStreamInteractive` | State-based music with designed transitions |

### Runtime WAV Loading (Godot 4.4+)

Godot 4.4 allows loading WAV files at runtime from user directories (mods, user-generated content):

```gdscript
func load_wav_from_path(path: String) -> AudioStreamWAV:
    var file := FileAccess.open(path, FileAccess.READ)
    if not file:
        push_error("Cannot open audio file: %s" % path)
        return null

    var wav := AudioStreamWAV.new()
    wav.data = file.get_buffer(file.get_length())
    wav.format = AudioStreamWAV.FORMAT_16_BITS
    wav.mix_rate = 44100
    wav.stereo = false
    return wav
```

> **Warning:** Runtime-loaded audio bypasses Godot's import system. You must set `format`, `mix_rate`, and `stereo` manually to match the actual file. Incorrect values produce garbled audio.

---

