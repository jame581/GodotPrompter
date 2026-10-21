# ConfigFile — Settings

Reference for `skills/save-load/SKILL.md` — `ConfigFile` for INI-style settings (audio, video, controls). GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 2. ConfigFile — Settings

Use ConfigFile for application settings: audio volumes, display options, key bindings. It produces a human-readable INI-style file.

### GDScript

```gdscript
# settings_manager.gd — add as autoload named SettingsManager
extends Node

const SETTINGS_PATH := "user://settings.cfg"

var _config := ConfigFile.new()


func _ready() -> void:
	load_settings()


func load_settings() -> void:
	var err := _config.load(SETTINGS_PATH)
	if err != OK:
		_set_defaults()
		save_settings()


func save_settings() -> void:
	var err := _config.save(SETTINGS_PATH)
	if err != OK:
		push_error("SettingsManager: failed to save settings — error %d" % err)


func get_setting(section: String, key: String, default: Variant = null) -> Variant:
	return _config.get_value(section, key, default)


func set_setting(section: String, key: String, value: Variant) -> void:
	_config.set_value(section, key, value)
	save_settings()


func _set_defaults() -> void:
	# Audio
	_config.set_value("audio", "master_volume", 1.0)
	_config.set_value("audio", "music_volume", 0.8)
	_config.set_value("audio", "sfx_volume", 1.0)
	# Display
	_config.set_value("display", "fullscreen", false)
	_config.set_value("display", "vsync", true)
	_config.set_value("display", "resolution_scale", 1.0)
```

**Usage:**

```gdscript
# Read
var vol: float = SettingsManager.get_setting("audio", "master_volume", 1.0)

# Write
SettingsManager.set_setting("audio", "master_volume", 0.5)
```

### C#

```csharp
// SettingsManager.cs — add as autoload named SettingsManager
using Godot;

public partial class SettingsManager : Node
{
    private const string SettingsPath = "user://settings.cfg";

    private readonly ConfigFile _config = new();

    public override void _Ready()
    {
        LoadSettings();
    }

    public void LoadSettings()
    {
        var err = _config.Load(SettingsPath);
        if (err != Error.Ok)
        {
            SetDefaults();
            SaveSettings();
        }
    }

    public void SaveSettings()
    {
        var err = _config.Save(SettingsPath);
        if (err != Error.Ok)
            GD.PushError($"SettingsManager: failed to save settings — error {err}");
    }

    public Variant GetSetting(string section, string key, Variant @default = default)
        => _config.GetValue(section, key, @default);

    public void SetSetting(string section, string key, Variant value)
    {
        _config.SetValue(section, key, value);
        SaveSettings();
    }

    private void SetDefaults()
    {
        // Audio
        _config.SetValue("audio", "master_volume", Variant.From(1.0f));
        _config.SetValue("audio", "music_volume",  Variant.From(0.8f));
        _config.SetValue("audio", "sfx_volume",    Variant.From(1.0f));
        // Display
        _config.SetValue("display", "fullscreen",       Variant.From(false));
        _config.SetValue("display", "vsync",            Variant.From(true));
        _config.SetValue("display", "resolution_scale", Variant.From(1.0f));
    }
}
```

**Usage:**

```csharp
// Read
float vol = SettingsManager.GetSetting("audio", "master_volume", Variant.From(1.0f)).As<float>();

// Write
SettingsManager.SetSetting("audio", "master_volume", Variant.From(0.5f));
```

---

