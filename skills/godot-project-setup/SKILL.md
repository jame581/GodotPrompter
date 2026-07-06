---
name: godot-project-setup
description: Use when creating a new Godot 4.x project — scaffolds recommended directory structure, project settings, autoloads, and .gitignore
---

# Godot Project Setup

This skill scaffolds a new Godot 4.3+ project with recommended directory structure, project settings, autoloads, and version control configuration.

> **Related skills:** **scene-organization** for structuring scene trees, **event-bus** for the EventBus autoload pattern, **save-load** for the SaveManager autoload pattern.

## Recommended Directory Structure (Split Layout)

The split layout separates assets, scenes, and scripts into distinct top-level directories. This scales well for medium-to-large projects and makes it easy to find resources by type.

```
res://
├── assets/
│   ├── audio/
│   │   ├── music/
│   │   └── sfx/
│   ├── fonts/
│   ├── shaders/
│   ├── sprites/
│   │   ├── characters/
│   │   ├── environment/
│   │   └── ui/
│   └── textures/
├── scenes/
│   ├── autoloads/
│   ├── characters/
│   ├── environment/
│   ├── levels/
│   ├── screens/
│   └── ui/
├── scripts/
│   ├── autoloads/
│   ├── characters/
│   ├── components/
│   ├── resources/
│   └── ui/
├── resources/
│   ├── items/
│   ├── levels/
│   └── themes/
└── addons/
```

**Why split layout?**
- Assets managed by artists can be updated without touching script directories.
- Glob patterns in export presets are simpler (`assets/**` stays separate from `scripts/**`).
- Easier to configure `.gitattributes` binary rules per directory.
- Scales to teams where artists and programmers work in different areas.

## Alternative: Co-Located Structure

For solo projects or small teams, keep scenes and scripts together by feature. Easier to move a feature wholesale; harder to apply binary `gitattributes` rules.

```
res://
├── assets/
│   ├── audio/
│   ├── fonts/
│   └── textures/
├── entities/
│   ├── player/
│   │   ├── player.tscn
│   │   ├── player.gd          # or Player.cs
│   │   └── player_state.gd
│   └── enemy/
│       ├── enemy.tscn
│       └── enemy.gd
├── levels/
│   ├── level_01/
│   │   ├── level_01.tscn
│   │   └── level_01.gd
│   └── main_menu/
│       ├── main_menu.tscn
│       └── main_menu.gd
├── systems/
│   ├── inventory/
│   └── dialogue/
├── autoloads/
├── resources/
└── addons/
```

## .gitignore

```gitignore
# Godot editor data — never commit
.godot/

# Export artifacts
*.apk
*.aab
*.ipa
*.exe
*.x86_64
*.x86_32
*.arm32
*.arm64
*.pck
*.zip
export/

# C# / Mono build output
.mono/
.import/
bin/
obj/
*.csproj.user
*.sln.user
*.user

# IDE and OS files
.vs/
.vscode/settings.json
.idea/
*.swp
.DS_Store
Thumbs.db

# GodotPrompter (if used in-project)
.godot-prompter-cache/
```

## .gitattributes

Normalize line endings for text files and mark binary assets so Git does not attempt text diffs on them.

```gitattributes
# Default: normalize line endings to LF on commit
* text=auto eol=lf

# Godot-specific text files
*.gd text eol=lf
*.gdshader text eol=lf
*.gdshaderinc text eol=lf
*.tscn text eol=lf
*.tres text eol=lf
*.godot text eol=lf
*.cfg text eol=lf
*.import text eol=lf

# C# source
*.cs text eol=lf
*.csproj text eol=lf
*.sln text eol=lf

# Binary assets — no diff, no merge, no EOL conversion
*.png binary
*.jpg binary
*.jpeg binary
*.webp binary
*.svg binary
*.psd binary
*.aseprite binary
*.wav binary
*.ogg binary
*.mp3 binary
*.ttf binary
*.otf binary
*.woff binary
*.woff2 binary
*.glb binary
*.gltf binary
*.blend binary
*.fbx binary
*.mp4 binary
*.ogv binary
```

## Project Settings

Configure these in `Project > Project Settings` or directly in `project.godot`.

### Display

| Setting | Recommended value | Notes |
|---|---|---|
| `display/window/size/viewport_width` | 1920 | Base resolution — art reference size |
| `display/window/size/viewport_height` | 1080 | |
| `display/window/stretch/mode` | `canvas_items` | Scales 2D content; use `viewport` for pixel-perfect |
| `display/window/stretch/aspect` | `keep` | Adds letterbox/pillarbox; `expand` fills screen |
| `display/window/size/resizable` | `true` | Allow window resize on desktop |

For pixel-art projects use `stretch/mode = viewport` and `texture_filter = nearest` on the root CanvasItem or globally via `rendering/textures/canvas_textures/default_texture_filter`.

> **Godot 4.7+:** Projects **newly created** in Godot 4.7 already default `display/window/stretch/mode` to `canvas_items` and `display/window/stretch/aspect` to `expand` (previously `disabled` / `keep`), so only `aspect` needs changing if you want `keep`'s letterboxing. Projects created on older versions keep their existing values — set both explicitly when upgrading.

### Input Map

Define actions in `Project > Project Settings > Input Map` rather than hard-coding key constants. This lets players rebind controls at runtime.

**GDScript — reading input actions:**

```gdscript
# Good: action-based (rebindable)
func _process(delta: float) -> void:
    var direction := Input.get_axis("move_left", "move_right")
    if Input.is_action_just_pressed("jump"):
        _jump()

# Avoid: hard-coded key checks
func _input(event: InputEvent) -> void:
    if event is InputEventKey and event.keycode == KEY_SPACE:
        _jump()
```

**C# — reading input actions:**

```csharp
// Good: action-based (rebindable)
public override void _Process(double delta)
{
    float direction = Input.GetAxis("move_left", "move_right");
    if (Input.IsActionJustPressed("jump"))
        Jump();
}

// Avoid: hard-coded key checks
public override void _Input(InputEvent @event)
{
    if (@event is InputEventKey key && key.Keycode == Key.Space)
        Jump();
}
```

**Saving and restoring custom bindings at runtime (GDScript):**

```gdscript
func save_bindings() -> void:
    var config := ConfigFile.new()
    for action in InputMap.get_actions():
        if action.begins_with("ui_"):
            continue  # skip built-in UI actions
        var events := InputMap.action_get_events(action)
        config.set_value("bindings", action, events)
    config.save("user://bindings.cfg")

func load_bindings() -> void:
    var config := ConfigFile.new()
    if config.load("user://bindings.cfg") != OK:
        return
    for action in config.get_section_keys("bindings"):
        InputMap.action_erase_events(action)
        for event in config.get_value("bindings", action):
            InputMap.action_add_event(action, event)
```

**Saving and restoring custom bindings at runtime (C#):**

```csharp
public void SaveBindings()
{
    var config = new ConfigFile();
    foreach (StringName action in InputMap.GetActions())
    {
        if (((string)action).StartsWith("ui_"))
            continue; // skip built-in UI actions
        var events = InputMap.ActionGetEvents(action);
        config.SetValue("bindings", action, events);
    }
    config.Save("user://bindings.cfg");
}

public void LoadBindings()
{
    var config = new ConfigFile();
    if (config.Load("user://bindings.cfg") != Error.Ok)
        return;
    foreach (string action in config.GetSectionKeys("bindings"))
    {
        InputMap.ActionEraseEvents(action);
        var events = (Godot.Collections.Array)config.GetValue("bindings", action);
        foreach (InputEvent @event in events)
            InputMap.ActionAddEvent(action, @event);
    }
}
```

## Autoloads

Register autoloads in `Project > Project Settings > Autoload`. Autoloads are singleton nodes available globally via their registered name.

### Common Autoloads

| Name | Path | Purpose |
|---|---|---|
| `GameManager` | `autoloads/game_manager.gd` | Game state, scene transitions, pause |
| `EventBus` | `autoloads/event_bus.gd` | Decoupled signal relay |
| `AudioManager` | `autoloads/audio_manager.gd` | Music, SFX, volume control |
| `SaveManager` | `autoloads/save_manager.gd` | Save/load game data |

Keep autoloads small. Move logic into standalone classes and call them from the autoload.

### Minimal GameManager — GDScript

```gdscript
# autoloads/game_manager.gd
extends Node

signal scene_changed(scene_path: String)
signal game_paused(is_paused: bool)

var current_level: String = ""
var is_paused: bool = false


func change_scene(path: String) -> void:
    current_level = path
    scene_changed.emit(path)
    get_tree().change_scene_to_file(path)


func set_paused(paused: bool) -> void:
    is_paused = paused
    get_tree().paused = paused
    game_paused.emit(paused)


func quit_game() -> void:
    get_tree().quit()
```

### Minimal GameManager — C#

```csharp
// autoloads/GameManager.cs
using Godot;

public partial class GameManager : Node
{
    [Signal]
    public delegate void SceneChangedEventHandler(string scenePath);

    [Signal]
    public delegate void GamePausedEventHandler(bool isPaused);

    public string CurrentLevel { get; private set; } = "";
    public bool IsPaused { get; private set; }

    public void ChangeScene(string path)
    {
        CurrentLevel = path;
        EmitSignal(SignalName.SceneChanged, path);
        GetTree().ChangeSceneToFile(path);
    }

    public void SetPaused(bool paused)
    {
        IsPaused = paused;
        GetTree().Paused = paused;
        EmitSignal(SignalName.GamePaused, paused);
    }

    public void QuitGame() => GetTree().Quit();
}
```

### Minimal EventBus — GDScript

```gdscript
# autoloads/event_bus.gd
extends Node

# Declare all cross-system signals here.
# Systems emit to EventBus; listeners connect to EventBus.

signal player_died
signal item_collected(item_id: String, quantity: int)
signal score_changed(new_score: int)
signal level_completed(level_id: String)
```

Nodes connect with:

```gdscript
EventBus.player_died.connect(_on_player_died)
EventBus.player_died.emit()
```

## C# Project Setup

### .csproj

When you enable C# support Godot generates a `.csproj`. Keep it minimal and set the target framework to `net8.0`:

```xml
<Project Sdk="Godot.NET.Sdk/4.3.0">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <TargetFramework Condition=" '$(GodotTargetPlatform)' == 'android' ">net8.0</TargetFramework>
    <TargetFramework Condition=" '$(GodotTargetPlatform)' == 'ios' ">net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
    <RootNamespace>MyGame</RootNamespace>
  </PropertyGroup>
</Project>
```

Replace `MyGame` with your project name. The namespace must match across all C# scripts to avoid registration errors.

### partial class Requirement

Every C# class that extends a Godot type **must** be declared `partial`. Godot's source generator adds the registration code in a companion partial file.

```csharp
// Correct
public partial class Player : CharacterBody2D { }

// Wrong — will not register with Godot
public class Player : CharacterBody2D { }
```

### Namespace Convention

Use a single root namespace for the project. Sub-namespaces are optional but keep them shallow:

```csharp
namespace MyGame.Characters;   // OK
namespace MyGame.UI;           // OK
namespace MyGame.Systems.Inventory.Data.Containers;  // Too deep — flatten
```

### Signal Declaration in C#

Signals must use the `[Signal]` attribute with a delegate ending in `EventHandler`:

```csharp
[Signal]
public delegate void HealthChangedEventHandler(int newHealth, int maxHealth);

// Emit
EmitSignal(SignalName.HealthChanged, health, maxHealth);

// Connect
someNode.HealthChanged += OnHealthChanged;

// Disconnect
someNode.HealthChanged -= OnHealthChanged;
```

## Project Setup Checklist

Use this checklist after scaffolding a new project to verify everything is in place.

- [ ] Directory structure created (`assets/`, `scenes/`, `scripts/` or co-located layout)
- [ ] `.gitignore` created and includes `.godot/`, `.mono/`, `bin/`, `obj/`
- [ ] `.gitattributes` created with LF normalization and binary asset rules
- [ ] `project.godot` — viewport resolution set (1920x1080 or project target)
- [ ] `project.godot` — stretch mode configured (`canvas_items` or `viewport`)
- [ ] Input Map actions defined for all player inputs (no hard-coded key constants)
- [ ] Autoloads registered: `GameManager`, `EventBus`, `AudioManager`, `SaveManager`
- [ ] Autoload scripts created under `autoloads/` (or `scripts/autoloads/`)
- [ ] Autoloads are process mode `Always` if they must run while paused
- [ ] For C# projects: `.csproj` targets `net8.0`, `RootNamespace` set, `Nullable` enabled
- [ ] For C# projects: all node scripts use `partial class`
- [ ] Initial commit on `main` branch before adding game content
- [ ] `CLAUDE.md` contains `## GodotPrompter` section with skill invocation rule (see `godot-prompter:godot-brainstorming` for content)
- [ ] CI pipeline (optional but recommended): runs `godot --headless --check-only` on GDScript files
