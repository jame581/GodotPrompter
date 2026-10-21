# Audio Settings Integration

Reference for `skills/audio-system/SKILL.md` — settings menu wired to AudioServer bus volumes with persistence. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 8. Audio Settings Integration

Tie audio buses to a settings UI. Works well with the **save-load** skill's ConfigFile approach.

### GDScript

```gdscript
# In your settings/audio menu script:
@onready var master_slider: HSlider = %MasterSlider
@onready var music_slider: HSlider = %MusicSlider
@onready var sfx_slider: HSlider = %SFXSlider

func _ready() -> void:
    # Load saved values (0.0–1.0 linear)
    master_slider.value = _get_saved_volume("master")
    music_slider.value = _get_saved_volume("music")
    sfx_slider.value = _get_saved_volume("sfx")

    # Apply to buses
    _apply_volume("Master", master_slider.value)
    _apply_volume("Music", music_slider.value)
    _apply_volume("SFX", sfx_slider.value)

func _on_master_slider_value_changed(value: float) -> void:
    _apply_volume("Master", value)
    _save_volume("master", value)

func _on_music_slider_value_changed(value: float) -> void:
    _apply_volume("Music", value)
    _save_volume("music", value)

func _on_sfx_slider_value_changed(value: float) -> void:
    _apply_volume("SFX", value)
    _save_volume("sfx", value)

func _apply_volume(bus_name: String, linear: float) -> void:
    var index := AudioServer.get_bus_index(bus_name)
    if linear <= 0.01:
        AudioServer.set_bus_mute(index, true)
    else:
        AudioServer.set_bus_mute(index, false)
        AudioServer.set_bus_volume_db(index, linear_to_db(linear))

func _get_saved_volume(key: String) -> float:
    # Integrate with your settings system (see save-load skill)
    return SettingsManager.get_setting("audio", "%s_volume" % key, 1.0)

func _save_volume(key: String, value: float) -> void:
    SettingsManager.set_setting("audio", "%s_volume" % key, value)
```

### C#

```csharp
using Godot;

public partial class AudioSettings : Control
{
    private HSlider _masterSlider;
    private HSlider _musicSlider;
    private HSlider _sfxSlider;

    public override void _Ready()
    {
        _masterSlider = GetNode<HSlider>("%MasterSlider");
        _musicSlider = GetNode<HSlider>("%MusicSlider");
        _sfxSlider = GetNode<HSlider>("%SFXSlider");

        _masterSlider.Value = GetSavedVolume("master");
        _musicSlider.Value = GetSavedVolume("music");
        _sfxSlider.Value = GetSavedVolume("sfx");

        ApplyVolume("Master", (float)_masterSlider.Value);
        ApplyVolume("Music", (float)_musicSlider.Value);
        ApplyVolume("SFX", (float)_sfxSlider.Value);

        _masterSlider.ValueChanged += v => { ApplyVolume("Master", (float)v); SaveVolume("master", (float)v); };
        _musicSlider.ValueChanged += v => { ApplyVolume("Music", (float)v); SaveVolume("music", (float)v); };
        _sfxSlider.ValueChanged += v => { ApplyVolume("SFX", (float)v); SaveVolume("sfx", (float)v); };
    }

    private void ApplyVolume(string busName, float linear)
    {
        int index = AudioServer.GetBusIndex(busName);
        if (linear <= 0.01f)
            AudioServer.SetBusMute(index, true);
        else
        {
            AudioServer.SetBusMute(index, false);
            AudioServer.SetBusVolumeDb(index, Mathf.LinearToDb(linear));
        }
    }

    private float GetSavedVolume(string key)
    {
        // Integrate with your settings system (see save-load skill)
        return 1.0f;
    }

    private void SaveVolume(string key, float value)
    {
        // Integrate with your settings system (see save-load skill)
    }
}
```

---

