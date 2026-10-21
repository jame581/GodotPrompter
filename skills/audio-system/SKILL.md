---
name: audio-system
description: Use when implementing audio — audio buses, AudioStreamPlayer, spatial audio, music management, SFX pooling, and dynamic mixing
---

# Audio System in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **event-bus** for decoupled audio triggers, **save-load** for persisting audio settings, **resource-pattern** for audio data containers.

---

## 1. Core Concepts

### Audio Node Types

| Node                   | Dimensions | Use For                                       |
|------------------------|------------|-----------------------------------------------|
| `AudioStreamPlayer`    | Non-positional | Music, UI sounds, global SFX              |
| `AudioStreamPlayer2D`  | 2D positional  | Footsteps, gunfire, environmental sounds  |
| `AudioStreamPlayer3D`  | 3D positional  | Same as 2D but in 3D space                |

### Audio Bus Architecture

Godot routes all audio through **buses** (like a mixing console).

```
Master (always exists)
├── Music          → volume, effects for background music
├── SFX            → volume, effects for sound effects
│   ├── Footsteps  → sub-bus for fine-tuning
│   └── Weapons    → sub-bus for fine-tuning
└── UI             → volume for menu sounds
```

**Setup:** Bottom panel → Audio tab → Add buses, set names, route outputs.

Every AudioStreamPlayer has a `bus` property — set it to the target bus name (e.g., `"SFX"`, `"Music"`).

---

## 2. Basic Audio Playback

### GDScript

```gdscript
extends Node2D

@onready var sfx_player: AudioStreamPlayer2D = $AudioStreamPlayer2D
@onready var music_player: AudioStreamPlayer = $MusicPlayer

func _ready() -> void:
    # Play background music (looping is set on the AudioStream resource)
    music_player.play()

func play_jump_sound() -> void:
    sfx_player.stream = preload("res://audio/sfx/jump.wav")
    sfx_player.play()
```

### C#

```csharp
using Godot;

public partial class AudioExample : Node2D
{
    private AudioStreamPlayer2D _sfxPlayer;
    private AudioStreamPlayer _musicPlayer;

    public override void _Ready()
    {
        _sfxPlayer = GetNode<AudioStreamPlayer2D>("AudioStreamPlayer2D");
        _musicPlayer = GetNode<AudioStreamPlayer>("MusicPlayer");
        _musicPlayer.Play();
    }

    public void PlayJumpSound()
    {
        _sfxPlayer.Stream = GD.Load<AudioStream>("res://audio/sfx/jump.wav");
        _sfxPlayer.Play();
    }
}
```

### Looping Audio

Looping is configured on the **AudioStream resource**, not the player node:

- **WAV:** Import tab → Loop Mode → Forward (or Ping-Pong)
- **OGG:** Import tab → Loop → On, set Loop Offset
- **MP3:** Import tab → Loop → On

> Always use OGG Vorbis for music (smaller files, good quality). Use WAV for short SFX (no decoding latency). Avoid MP3 for SFX — it adds silence at the start.

---

## 3. Audio Bus Management

### Setting Volume from Code

Godot uses **decibels (dB)** for volume. Linear-to-dB conversion is required for sliders.

#### GDScript

```gdscript
# Get bus index by name
var bus_index: int = AudioServer.get_bus_index("SFX")

# Set volume in dB directly
AudioServer.set_bus_volume_db(bus_index, -6.0)  # -6 dB = ~50% perceived volume

# Convert linear (0.0–1.0) to dB — use for UI sliders
func set_bus_volume_linear(bus_name: String, linear: float) -> void:
    var index := AudioServer.get_bus_index(bus_name)
    AudioServer.set_bus_volume_db(index, linear_to_db(linear))

# Mute / unmute a bus
AudioServer.set_bus_mute(bus_index, true)

# Read current volume as linear (for displaying on a slider)
func get_bus_volume_linear(bus_name: String) -> float:
    var index := AudioServer.get_bus_index(bus_name)
    return db_to_linear(AudioServer.get_bus_volume_db(index))
```

#### C#

```csharp
int busIndex = AudioServer.GetBusIndex("SFX");

// Set volume in dB
AudioServer.SetBusVolumeDb(busIndex, -6.0f);

// Linear to dB conversion for UI sliders
public void SetBusVolumeLinear(string busName, float linear)
{
    int index = AudioServer.GetBusIndex(busName);
    AudioServer.SetBusVolumeDb(index, Mathf.LinearToDb(linear));
}

// Mute / unmute
AudioServer.SetBusMute(busIndex, true);

// Read current volume as linear
public float GetBusVolumeLinear(string busName)
{
    int index = AudioServer.GetBusIndex(busName);
    return Mathf.DbToLinear(AudioServer.GetBusVolumeDb(index));
}
```

### Audio Bus Effects

Add effects to buses in the Audio panel (bottom dock). Common effects:

| Effect          | Use For                                     |
|-----------------|---------------------------------------------|
| `Reverb`        | Cave, cathedral, bathroom ambience           |
| `Delay`         | Echo effects                                 |
| `Compressor`    | Normalize loud/quiet sounds (master bus)     |
| `Limiter`       | Prevent clipping on master bus               |
| `LowPassFilter` | Muffled sounds (underwater, behind walls)    |
| `HighPassFilter` | Thin/tinny sound (radio, phone)             |
| `Chorus`        | Thicken sounds                               |
| `Distortion`    | Gritty/overdrive effects                     |
| `EQ`            | Fine-tune frequency bands                    |

### Dynamic Effect Toggle

```gdscript
# Enable/disable an effect on a bus at runtime
var bus_index := AudioServer.get_bus_index("SFX")
var effect_index := 0  # First effect on the bus
AudioServer.set_bus_effect_enabled(bus_index, effect_index, true)

# Apply low-pass filter for "underwater" feel
func set_underwater(enabled: bool) -> void:
    var index := AudioServer.get_bus_index("SFX")
    # Assumes a LowPassFilter is the first effect on the SFX bus
    AudioServer.set_bus_effect_enabled(index, 0, enabled)
```

---

## 4. Spatial Audio (2D & 3D)

### AudioStreamPlayer2D

Automatically adjusts volume and panning based on distance to the nearest `AudioListener2D` (or the Camera2D if no listener exists).

```
Enemy (CharacterBody2D)
├── Sprite2D
└── AudioStreamPlayer2D   ← positioned at enemy's location
    bus = "SFX"
    max_distance = 1000.0
    attenuation = 1.0
```

Key properties:

| Property        | Description                                   | Default  |
|-----------------|-----------------------------------------------|----------|
| `max_distance`  | Beyond this distance, sound is silent          | 2000.0   |
| `attenuation`   | Volume falloff curve (1.0 = linear, higher = sharper) | 1.0 |
| `max_polyphony` | Max simultaneous instances of this player      | 1        |
| `panning_strength` | How much the sound pans left/right          | 1.0      |

### AudioStreamPlayer3D

Same concept but in 3D. Works with `AudioListener3D` (or the Camera3D).

Key additional properties:

| Property            | Description                                 |
|---------------------|---------------------------------------------|
| `unit_size`         | Distance at which volume is 0 dB            |
| `max_db`            | Maximum volume cap                          |
| `attenuation_model` | Inverse, InverseSquare, Logarithmic, Disabled |
| `doppler_tracking`  | Enable Doppler effect for moving sources    |

### AudioListener

```gdscript
# Make a specific camera the audio listener
# 2D: add AudioListener2D as child of Camera2D, call make_current()
# 3D: add AudioListener3D as child of Camera3D, call make_current()

# By default, the current Camera2D/3D acts as the listener.
# Only add an explicit AudioListener if you need a different listening position.
```

```csharp
// 2D spatial player
public partial class Footsteps : AudioStreamPlayer2D
{
    public override void _Ready()
    {
        Bus = "SFX";
        MaxDistance = 1000.0f;     // Pixels at which volume reaches zero
        Attenuation = 1.0f;         // Linear falloff (higher = sharper)
        MaxPolyphony = 4;           // Allow overlapping footstep sounds
    }

    public void PlayStep() => Play();
}

// 3D spatial player
public partial class EngineHum : AudioStreamPlayer3D
{
    public override void _Ready()
    {
        Bus = "SFX";
        UnitSize = 4.0f;            // Meters at which volume is 0 dB
        MaxDistance = 50.0f;
        AttenuationModel = AttenuationModelEnum.InverseDistance;
    }
}

// Custom listener — overrides the default Camera2D / Camera3D listener.
public partial class FollowCamListener : AudioListener3D
{
    public override void _Ready() => MakeCurrent();
}
```

> ⚠️ **Changed in Godot 4.7:** The default `area_mask` on `AudioStreamPlayer2D`/`AudioStreamPlayer3D` changed from `1` to `0` (disabled) — the `audio_bus_override` feature on `Area2D`/`Area3D` (e.g. an underwater bus) stops working for players left at the default. Set `area_mask` back to layer 1 to restore it; masks explicitly set to anything other than layer 1 keep working. (The migration guide says "AudioStreamPlayer", but `area_mask` only exists on the 2D/3D variants.) See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

---

## 5. Music Manager (Autoload)

Crossfade between background tracks via a singleton autoload that manages two `AudioStreamPlayer` nodes and tweens their volume_db. Wire a `Music` audio bus so the settings menu can adjust music separately.

> See [references/music-manager.md](references/music-manager.md) for the full GDScript and C# autoload (crossfade, push/pop stack, current-track query).

---

## 6. SFX Pool

Pre-instantiate a fixed pool of `AudioStreamPlayer` nodes; `play_sfx(stream)` finds the next free player and plays. Avoids per-shot instancing churn for high-volume effects (gunshots, footsteps, hits).

> See [references/sfx-pooling.md](references/sfx-pooling.md) for the GDScript + C# pooled player and a 2D positional variant (pool of `AudioStreamPlayer2D` nodes that follow a target).

---

## 7. Audio Settings Integration

Wire HSliders in the settings menu to bus volumes via `AudioServer.set_bus_volume_db(bus_idx, linear_to_db(value))`. Persist with `ConfigFile`. Use the `linear_to_db` / `db_to_linear` helpers — never log-base by hand.

> See [references/audio-settings.md](references/audio-settings.md) for the full settings menu wiring with persistence (GDScript + C#).

---

## 8. Interactive & Adaptive Music (Godot 4.3+)

Three stream types for adaptive music: `AudioStreamPlaylist` (sequenced or shuffled tracks), `AudioStreamSynchronized` (multiple stems played in sync — vertical layering for combat intensity), `AudioStreamInteractive` (clip transitions on triggers — state-driven music). Godot 4.4+ adds `AudioStreamWAV.load_from_file()` for runtime WAV loading.

> **Godot 4.7+:** `AudioStreamInteractive` now exposes `TRANSITION_TO_TIME_PREVIOUS_POSITION` (`TransitionToTime` enum) to scripts — the destination clip resumes from its last played position if there was a previous transition from that clip, otherwise it plays from its start. Ideal for exploration ↔ combat music that picks up where it left off.

> See [references/interactive-music.md](references/interactive-music.md) for the stream-type comparison, GDScript recipes, the 4.7+ resume-position transition, and the 4.4+ runtime-load example.

---

## 9. Audio Import Best Practices

| Format    | Use For        | File Size | Decode Latency | Loop Support  |
|-----------|----------------|-----------|----------------|---------------|
| **WAV**   | Short SFX      | Large     | None (PCM)     | Via import    |
| **OGG**   | Music, long SFX| Small     | Minimal        | Via import    |
| **MP3**   | Music (fallback)| Small    | Has padding    | Via import    |

### Import Settings

In the Import dock (select an audio file):

- **Loop:** Enable for music and ambient loops
- **BPM / Beat Count / Bar Beats:** Set for rhythm-synced games
- **Force Mono:** Enable for 3D positional audio (stereo doesn't spatialize well)

> **Tip:** Keep SFX as 16-bit WAV at 44.1kHz. Godot stores WAV uncompressed in PCK, so they play instantly with zero decode overhead. For music, OGG Vorbis at quality 6–8 is a good balance.

---

## 11. Common Pitfalls

| Symptom                            | Cause                                          | Fix                                                               |
|------------------------------------|-------------------------------------------------|-------------------------------------------------------------------|
| Sound doesn't play                 | Player not in the scene tree                    | Ensure the AudioStreamPlayer is `add_child()`'d before `play()`  |
| Sound plays but no audio heard     | Wrong bus name or bus is muted                  | Check `bus` property matches a bus name exactly (case-sensitive)   |
| Music restarts on scene change     | Player is part of the scene, not an autoload    | Move music player to an autoload (MusicManager)                   |
| Positional audio has no panning    | No AudioListener or Camera in the scene         | Add an AudioListener2D/3D or ensure a Camera is current           |
| Sound clicks or pops               | Audio file has no fade-in/fade-out              | Add a tiny fade (2–5ms) at start/end of WAV in audio editor      |
| Too many sounds playing at once    | No polyphony limit                              | Set `max_polyphony` on players or use an SFX pool                 |
| Volume slider feels non-linear     | Using dB directly instead of linear conversion  | Use `linear_to_db()` / `db_to_linear()` for slider values        |
| 3D audio sounds mono/flat          | Stereo source file                              | Import as mono (Force Mono in Import tab) for 3D spatialization   |
| MP3 has silence at start           | MP3 format adds encoder padding                 | Use WAV for timing-critical SFX, OGG for music                   |

---

## 12. Implementation Checklist

- [ ] Audio buses are set up: Master, Music, SFX (minimum)
- [ ] All AudioStreamPlayer nodes have the correct `bus` property assigned
- [ ] Music uses OGG Vorbis format; short SFX uses WAV
- [ ] Music player is in an autoload (survives scene changes)
- [ ] Music crossfading is implemented for smooth transitions
- [ ] SFX pool is used instead of creating new AudioStreamPlayer nodes dynamically
- [ ] Volume sliders use `linear_to_db()` / `db_to_linear()` conversion
- [ ] Near-zero slider values mute the bus (avoid `linear_to_db(0.0)` = `-inf`)
- [ ] 3D audio sources use mono audio files for proper spatialization
- [ ] Audio settings are saved and restored on game launch (ConfigFile or similar)
- [ ] Looping is configured on the AudioStream resource, not in code
- [ ] Interactive/adaptive music uses `AudioStreamPlaylist`, `AudioStreamSynchronized`, or `AudioStreamInteractive` (Godot 4.3+) instead of manual track-switching code
