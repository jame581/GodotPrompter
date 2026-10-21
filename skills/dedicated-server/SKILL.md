---
name: dedicated-server
description: Use when building dedicated servers — headless export, server architecture, lobby management, and deployment
---

# Dedicated Server in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, C# follows.

**Related skills:** See **multiplayer-basics** for ENet setup, RPCs, and authority model. See **multiplayer-sync** for state synchronization and interpolation.

---

## 1. Headless Export

A dedicated server runs without a display, GPU, or audio device. Godot supports this through the `--headless` flag and a dedicated export preset.

### --headless Flag

Pass `--headless` on the command line to suppress the display and audio drivers at runtime:

```
./my_game.x86_64 --headless
```

This is distinct from the `server` platform — `--headless` is a runtime flag that works on any exported binary. The `server` export template strips rendering entirely from the binary, reducing its size.

### Server Export Preset

In the Godot editor, create a dedicated **Linux/X11** (or **Linux Server**) export preset:

1. Open **Project → Export**.
2. Add a **Linux/X11** preset and name it `Linux Server`.
3. Under **Options → Binary**, enable **Export As Dedicated Server** (Godot 4.2+). This uses the server export template that omits rendering and audio code.
4. Under **Resources**, use the **Exclude** list to strip client-only assets (shaders, high-res textures, audio files) from the server PCK.

### Feature Tags

Use `OS.has_feature()` to branch between server and client code at runtime. Define a custom `server` feature in the export preset (Project Settings → Export → Custom Features) or rely on the built-in `dedicated_server` feature that the server template sets automatically:

```gdscript
# boot.gd — autoload, runs before any scene loads
extends Node

func _ready() -> void:
    if OS.has_feature("dedicated_server") or DisplayServer.get_name() == "headless":
        # Disable rendering-dependent systems
        RenderingServer.set_render_loop_enabled(false)
        # Start server logic
        ServerBootstrap.start()
    else:
        # Start client logic
        ClientBootstrap.start()
```

```csharp
// Boot.cs — autoload, runs before any scene loads.
using Godot;

public partial class Boot : Node
{
    public override void _Ready()
    {
        if (OS.HasFeature("dedicated_server") || DisplayServer.GetName() == "headless")
        {
            // Disable the render loop. The window is invisible but the engine still ticks.
            RenderingServer.SetRenderLoopEnabled(false);
            ServerBootstrap.Start();
        }
        else
        {
            ClientBootstrap.Start();
        }
    }
}
```

> **Note:** the export preset configuration (custom features, exclude list, "Export As Dedicated Server" flag) is identical regardless of language — see the GDScript section above for preset settings.

**Feature tag summary:**

| Tag | Set by | Notes |
|-----|--------|-------|
| `dedicated_server` | Server export template | Most reliable way to detect a server binary |
| `headless` | `--headless` CLI flag | Set at runtime, not baked into the binary |
| Custom `server` | Your export preset's Custom Features | Useful when sharing a binary between roles |

---

## 2. Server Architecture

### Game Loop Without Rendering

On a headless server, `_process` and `_physics_process` still run normally — but nothing is rendered. Keep all server logic in `_physics_process` for deterministic, fixed-rate updates.

### GDScript

```gdscript
# server_main.gd — add as autoload named ServerMain
extends Node

## Physics frames per second — matches Project Settings → Physics → Common → Physics Ticks Per Second.
## Override via --tick-rate CLI argument (see Section 5).
var tick_rate: int = 60

## Current server tick counter.
var server_tick: int = 0


func _ready() -> void:
    # Guard: this node does nothing on the client.
    if not _is_server():
        set_process(false)
        set_physics_process(false)
        return

    Engine.physics_ticks_per_second = tick_rate
    print("[Server] Started — tick rate: %d Hz" % tick_rate)


func _physics_process(_delta: float) -> void:
    server_tick += 1
    _tick_game_logic()


func _tick_game_logic() -> void:
    # All authoritative game simulation goes here.
    # Never reference Camera, CanvasLayer, or any rendering node from this path.
    pass


## Returns true when this process is acting as the authoritative server.
func _is_server() -> bool:
    # Covers both: dedicated binary and hosted listen-server.
    return multiplayer.is_server()
```

### Server-Only Logic Separated from Client

Structure your scenes so server-only nodes are in a dedicated branch and skipped on clients:

```gdscript
# world.gd
extends Node

@onready var server_systems: Node = $ServerSystems   # physics, AI, scoring
@onready var client_systems: Node = $ClientSystems   # camera, HUD, audio


func _ready() -> void:
    # Disable server systems on clients and vice versa.
    server_systems.set_process_mode(
        PROCESS_MODE_ALWAYS if multiplayer.is_server() else PROCESS_MODE_DISABLED
    )
    client_systems.set_process_mode(
        PROCESS_MODE_DISABLED if multiplayer.is_server() else PROCESS_MODE_ALWAYS
    )
```

### Engine.is_editor_hint() + is_server Checks

Use these guards at the top of scripts that must behave differently in the editor, on the server, and on clients:

```gdscript
func _ready() -> void:
    if Engine.is_editor_hint():
        return  # Skip all runtime setup in editor preview

    if multiplayer.is_server():
        _server_init()
    else:
        _client_init()


func _server_init() -> void:
    print("[Server] Initializing authoritative state")


func _client_init() -> void:
    print("[Client] Initializing local presentation layer")
```

### C#

```csharp
// ServerMain.cs — add as autoload named ServerMain
using Godot;

public partial class ServerMain : Node
{
    /// <summary>Physics ticks per second. Override via --tick-rate CLI argument.</summary>
    public int TickRate { get; set; } = 60;

    /// <summary>Current server tick counter.</summary>
    public int ServerTick { get; private set; }

    public override void _Ready()
    {
        if (!IsServer())
        {
            SetProcess(false);
            SetPhysicsProcess(false);
            return;
        }

        Engine.PhysicsTicksPerSecond = TickRate;
        GD.Print($"[Server] Started — tick rate: {TickRate} Hz");
    }

    public override void _PhysicsProcess(double delta)
    {
        ServerTick++;
        TickGameLogic();
    }

    private void TickGameLogic()
    {
        // All authoritative game simulation goes here.
    }

    private bool IsServer() => Multiplayer.IsServer();
}
```

```csharp
// World.cs
using Godot;

public partial class World : Node
{
    [Export] private Node _serverSystems = null!;
    [Export] private Node _clientSystems = null!;

    public override void _Ready()
    {
        if (Engine.IsEditorHint()) return;

        _serverSystems.ProcessMode = Multiplayer.IsServer()
            ? ProcessModeEnum.Always
            : ProcessModeEnum.Disabled;

        _clientSystems.ProcessMode = Multiplayer.IsServer()
            ? ProcessModeEnum.Disabled
            : ProcessModeEnum.Always;
    }
}
```

---

## 7. Checklist

- [ ] Export preset uses the **server** export template (`dedicated_server` feature is set automatically)
- [ ] Client-only assets (shaders, audio, high-res textures) are excluded from the server PCK
- [ ] Boot script checks `OS.has_feature("dedicated_server")` or `DisplayServer.get_name() == "headless"` to branch server vs client startup
- [ ] `RenderingServer.set_render_loop_enabled(false)` called on the server to prevent any render work
- [ ] Server-only nodes use `PROCESS_MODE_DISABLED` on clients; client-only nodes use `PROCESS_MODE_DISABLED` on the server
- [ ] `Engine.is_editor_hint()` guard at the top of `_ready()` in every script that has side effects
- [ ] `ServerConfig` parses `--port`, `--max-players`, `--tick-rate` from CLI args before `_ready()` of other autoloads
- [ ] Config file loading falls back gracefully when `server.cfg` does not exist
- [ ] Environment variables (`SERVER_PORT`, `SERVER_MAX_PLAYERS`, `SERVER_TICK_RATE`) are applied after config file, before CLI args
- [ ] `LobbyManager.player_list` size is checked against `max_players` before accepting a new peer
- [ ] Peer is kicked via RPC before closing if the lobby is full
- [ ] Ready states are reset when `MatchState` returns to `LOBBY` so players must re-confirm each round
- [ ] `MatchManager` only runs `_physics_process` on the server (`SetPhysicsProcess(false)` on clients)
- [ ] Countdown and results timers are driven by `_physics_process` delta, not `Timer` nodes (avoids scene dependency)
- [ ] Dockerfile copies both the binary and the `.pck` file to the image
- [ ] UDP port is opened in the VPS firewall before the first test run
- [ ] systemd service has `Restart=on-failure` so the server recovers from crashes automatically
- [ ] Logs are routed to the systemd journal and inspectable with `journalctl -u <service> -f`

## 3. Lobby System

A per-player state dictionary keyed by `peer_id` is the canonical pattern. Server holds the authoritative dict; clients receive updates via RPC. Implement a `--max-players` CLI cap and a ready-toggle RPC so all peers can confirm before starting.

> See [references/lobby-management.md](references/lobby-management.md) for the full GDScript and C# lobby implementation (player_list dict, max-players cap, ready toggle RPC, broadcast pattern).

---

## 4. Match Flow

Drive lobby → countdown → in-game → results with a state machine. Server is authoritative — clients only receive state-change RPCs. Common states: `LOBBY`, `COUNTDOWN`, `IN_GAME`, `RESULTS`.

> See [references/match-flow.md](references/match-flow.md) for the full state machine with countdown/results timers and GDScript + C# implementations.

---

## 5. Server Configuration

Parse CLI flags from `OS.get_cmdline_args()` for `--port`, `--max-players`, `--tick-rate`, `--log-level`. Pre-set `Engine.physics_ticks_per_second` *before* the first physics frame; reading and writing the others is straightforward `match` / `switch` work.

> See [references/server-config.md](references/server-config.md) for the GDScript and C# argument-parsing helper that reads all four flags safely at startup.

---

## 6. Deployment

A Linux VPS with a `Dockerfile` and `systemd` service file is the standard production layout. The Dockerfile bundles the headless export template, the exported PCK, and the .NET runtime (for C# projects). systemd handles auto-restart, log rotation via `journald`, and resource limits.

> See [references/deployment.md](references/deployment.md) for the Dockerfile, the Linux VPS setup steps, the systemd unit file, and log-rotation configuration.

---

## 7. Checklist

- [ ] Headless export preset created and `dedicated_server` feature tag added
- [ ] `RenderingServer.set_render_loop_enabled(false)` (and audio bus muted) when `OS.has_feature("dedicated_server")` is true
- [ ] Server-side autoloads check `multiplayer.is_server()` before initializing systems
- [ ] CLI args parsed at startup for port, max-players, tick-rate, log-level
- [ ] Lobby state lives only on the server; clients receive updates via RPC
- [ ] Match-flow state machine has explicit transitions and a single source of truth (server)
- [ ] Production deployment uses systemd or Docker for auto-restart and log rotation
- [ ] Headless build is exported with **Export with Debug** off in production presets
