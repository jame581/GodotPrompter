# Music Manager Autoload

Reference for `skills/audio-system/SKILL.md` — singleton music manager with crossfade, layering, GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Music Manager (Autoload)

A global music manager that handles crossfading between tracks.

### GDScript

```gdscript
# music_manager.gd — add as autoload named MusicManager
extends Node

@export var crossfade_duration: float = 1.5

var _player_a: AudioStreamPlayer
var _player_b: AudioStreamPlayer
var _active_player: AudioStreamPlayer

func _ready() -> void:
    _player_a = AudioStreamPlayer.new()
    _player_a.bus = "Music"
    add_child(_player_a)

    _player_b = AudioStreamPlayer.new()
    _player_b.bus = "Music"
    add_child(_player_b)

    _active_player = _player_a


func play_music(stream: AudioStream, from_position: float = 0.0) -> void:
    # If already playing this track, do nothing
    if _active_player.stream == stream and _active_player.playing:
        return

    var next_player := _player_b if _active_player == _player_a else _player_a

    # Crossfade
    next_player.stream = stream
    next_player.volume_db = -80.0
    next_player.play(from_position)

    var tween := create_tween().set_parallel(true)
    tween.tween_property(_active_player, "volume_db", -80.0, crossfade_duration)
    tween.tween_property(next_player, "volume_db", 0.0, crossfade_duration)
    tween.chain().tween_callback(_active_player.stop)

    _active_player = next_player


func stop_music(fade_duration: float = 1.0) -> void:
    var tween := create_tween()
    tween.tween_property(_active_player, "volume_db", -80.0, fade_duration)
    tween.tween_callback(_active_player.stop)


func set_music_volume(linear: float) -> void:
    var index := AudioServer.get_bus_index("Music")
    AudioServer.set_bus_volume_db(index, linear_to_db(linear))
```

### C#

```csharp
using Godot;

public partial class MusicManager : Node
{
    [Export] public float CrossfadeDuration { get; set; } = 1.5f;

    private AudioStreamPlayer _playerA;
    private AudioStreamPlayer _playerB;
    private AudioStreamPlayer _activePlayer;

    public override void _Ready()
    {
        _playerA = new AudioStreamPlayer { Bus = "Music" };
        AddChild(_playerA);

        _playerB = new AudioStreamPlayer { Bus = "Music" };
        AddChild(_playerB);

        _activePlayer = _playerA;
    }

    public void PlayMusic(AudioStream stream, float fromPosition = 0.0f)
    {
        if (_activePlayer.Stream == stream && _activePlayer.Playing)
            return;

        var nextPlayer = _activePlayer == _playerA ? _playerB : _playerA;

        nextPlayer.Stream = stream;
        nextPlayer.VolumeDb = -80.0f;
        nextPlayer.Play(fromPosition);

        var tween = CreateTween().SetParallel(true);
        tween.TweenProperty(_activePlayer, "volume_db", -80.0f, CrossfadeDuration);
        tween.TweenProperty(nextPlayer, "volume_db", 0.0f, CrossfadeDuration);
        tween.Chain().TweenCallback(Callable.From(_activePlayer.Stop));

        _activePlayer = nextPlayer;
    }

    public void StopMusic(float fadeDuration = 1.0f)
    {
        var tween = CreateTween();
        tween.TweenProperty(_activePlayer, "volume_db", -80.0f, fadeDuration);
        tween.TweenCallback(Callable.From(_activePlayer.Stop));
    }

    public void SetMusicVolume(float linear)
    {
        int index = AudioServer.GetBusIndex("Music");
        AudioServer.SetBusVolumeDb(index, Mathf.LinearToDb(linear));
    }
}
```

**Usage:**

```gdscript
# From any script:
MusicManager.play_music(preload("res://audio/music/boss_theme.ogg"))
MusicManager.stop_music(2.0)
```

---

