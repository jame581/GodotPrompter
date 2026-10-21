# GodotPrompter Phase 3 (UI, Multiplayer, Deploy, C#) Implementation Plan

**Status:** shipped in v1.0.0 (2026-04-06)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 11 Phase 3 skills covering UI/UX, multiplayer networking, build/deploy pipelines, and C#-specific patterns.

**Architecture:** Same as Phase 1+2 — independent markdown skill documents at `skills/<name>/SKILL.md` with YAML frontmatter. GDScript + C# examples (GDScript first). Godot 4.3+ minimum.

**Tech Stack:** Markdown with YAML frontmatter. Godot 4.3+ API (GDScript + C#).

---

## File Map

| File | Responsibility |
|------|---------------|
| `skills/godot-ui/SKILL.md` | Control nodes, themes, anchors, containers, responsive design basics |
| `skills/responsive-ui/SKILL.md` | Multi-resolution scaling, aspect ratios, mobile/desktop adaptation |
| `skills/hud-system/SKILL.md` | In-game HUD patterns — health bars, score, minimap, notifications |
| `skills/multiplayer-basics/SKILL.md` | MultiplayerAPI, ENet/WebSocket, RPCs, authority model |
| `skills/multiplayer-sync/SKILL.md` | MultiplayerSynchronizer, interpolation, prediction, lag compensation |
| `skills/dedicated-server/SKILL.md` | Headless export, server architecture, lobby management |
| `skills/export-pipeline/SKILL.md` | Platform exports, presets, CI/CD with GitHub Actions |
| `skills/godot-optimization/SKILL.md` | Profiler, draw calls, physics, memory, common bottlenecks |
| `skills/addon-development/SKILL.md` | EditorPlugin, @tool scripts, custom inspectors, dock panels |
| `skills/csharp-godot/SKILL.md` | C# conventions, GodotSharp API differences from GDScript, project setup |
| `skills/csharp-signals/SKILL.md` | C# signal patterns — delegates, [Signal] attribute, async signals |

---

### Task 1: godot-ui skill

Frontmatter: `name: godot-ui`, `description: Use when building user interfaces — Control nodes, themes, anchors, containers, and layout patterns`

Sections:
- Control Node Hierarchy: how UI nodes differ from Node2D (anchors, focus, themes)
- Common Container Nodes table: VBoxContainer, HBoxContainer, GridContainer, MarginContainer, PanelContainer, ScrollContainer, TabContainer — purpose, when to use
- Anchors & Margins: how anchor presets work, full rect, center, top-left, custom anchors
- Theme System: creating themes, StyleBox, font overrides, theme inheritance, theme_override_ methods
- Focus & Navigation: focus modes, focus neighbors, UI navigation with gamepad/keyboard
- Common UI Patterns: main menu, settings screen, pause menu — scene tree examples
- Signals: button pressed, text_changed, value_changed, visibility_changed
- Checklist

### Task 2: responsive-ui skill

Frontmatter: `name: responsive-ui`, `description: Use when handling multiple resolutions — stretch modes, aspect ratios, DPI scaling, and mobile/desktop adaptation`

Sections:
- Project Settings for Resolution: window size, stretch mode (canvas_items vs viewport), stretch aspect (keep, expand, ignore)
- Stretch Mode Comparison table: canvas_items (smooth scaling), viewport (pixel-perfect), disabled
- Aspect Ratio Handling: keep (letterbox), expand (fill), keep_width/keep_height
- Pixel Art Setup: viewport stretch + integer scaling, nearest-neighbor filter
- DPI Scaling: content_scale_factor, high-DPI displays
- Mobile Considerations: touch input, safe areas, orientation lock
- Adaptive Layouts: using anchors + containers that reflow, min_size on controls
- Testing Multiple Resolutions: editor preview sizes, command line --resolution flag
- Checklist

### Task 3: hud-system skill

Frontmatter: `name: hud-system`, `description: Use when building in-game HUDs — health bars, score displays, minimap, notifications, and damage numbers`

Sections:
- HUD Architecture: CanvasLayer for HUD (stays on screen), separate from world UI
- Health Bar (GDScript + C#): TextureProgressBar or ProgressBar, connecting to HealthComponent signals, smooth tween animation
- Score/Label Display (GDScript + C#): updating labels from EventBus signals
- Damage Numbers (GDScript): floating damage text that rises and fades, scene pooling
- Notification System (GDScript + C#): toast-style notifications, queue, auto-dismiss with timer
- Minimap Concept: SubViewport approach, simplified render, player marker
- Crosshair/Interaction Prompts: showing "Press E to interact" near interactables
- Checklist

### Task 4: multiplayer-basics skill

Frontmatter: `name: multiplayer-basics`, `description: Use when implementing multiplayer — MultiplayerAPI, ENet/WebSocket peers, RPCs, and authority model`

Sections:
- Multiplayer Architecture: client-server model, peer IDs, multiplayer authority
- Setting Up ENetMultiplayerPeer (GDScript + C#): create_server, create_client, signals (peer_connected, peer_disconnected, connected_to_server)
- RPCs (GDScript + C#): @rpc annotation, call modes (any_peer, authority), transfer modes (reliable, unreliable, ordered), channel
- Authority Model: multiplayer_authority, is_multiplayer_authority(), set_multiplayer_authority()
- Spawning Networked Objects: MultiplayerSpawner configuration, spawn path, auto-spawn
- Player Join Flow: connection → authentication → spawn → sync initial state
- Disconnect Handling: timeout detection, cleanup, reconnection
- Common Pitfalls: RPC on non-authority, desync from unordered calls, input in wrong _process
- Checklist

### Task 5: multiplayer-sync skill

Frontmatter: `name: multiplayer-sync`, `description: Use when synchronizing multiplayer state — MultiplayerSynchronizer, interpolation, prediction, and lag compensation`

Sections:
- MultiplayerSynchronizer: replication config, sync properties, visibility, delta vs full sync
- Property Synchronization (GDScript + C#): what to sync (position, health, state), sync intervals
- Interpolation: smoothing between sync ticks, storing previous + current state, lerp in _process
- Client-Side Prediction: predict local player movement, reconcile with server corrections
- Lag Compensation: server-side rewind for hit detection, timestamp-based
- State vs Input Synchronization: when to sync state (simple) vs sync inputs (responsive)
- Bandwidth Optimization: sync only what changed, quantization, reducing sync rate for distant objects
- Checklist

### Task 6: dedicated-server skill

Frontmatter: `name: dedicated-server`, `description: Use when building dedicated servers — headless export, server architecture, lobby management, and deployment`

Sections:
- Headless Export: --headless flag, disabling rendering, server export preset
- Server Architecture: game loop without rendering, server-only logic, anti-cheat basics
- Lobby System (GDScript + C#): lobby creation, player list, ready states, game start
- Match Flow: lobby → countdown → gameplay → results → return to lobby
- Server Configuration: command line args, config file for port/max_players/tick_rate
- Deployment: Docker basics, running on Linux VPS, systemd service file
- Checklist

### Task 7: export-pipeline skill

Frontmatter: `name: export-pipeline`, `description: Use when exporting and distributing Godot games — export presets, platform settings, CI/CD with GitHub Actions`

Sections:
- Export Presets: creating presets per platform, export_presets.cfg
- Platform-Specific Settings table: Windows (icon, signing), Linux (permissions), macOS (notarization, plist), Web (threads, SharedArrayBuffer), Android (keystore, permissions), iOS (provisioning)
- Export from CLI: godot --headless --export-release/debug
- CI/CD with GitHub Actions: full workflow YAML for multi-platform export (Windows, Linux, Web)
- Versioning: auto-versioning from git tags, injecting version into project settings
- itch.io Deployment: butler push, channels per platform
- Steam Deployment: brief mention of Steamworks SDK integration
- Checklist

### Task 8: godot-optimization skill

Frontmatter: `name: godot-optimization`, `description: Use when optimizing Godot games — profiler, draw calls, physics tuning, memory management, and common bottlenecks`

Sections:
- Using the Profiler: how to read profiler output, identifying hotspots, frame time budget
- Draw Call Optimization: batching, reducing materials, CanvasGroup for 2D, visibility culling
- Physics Optimization: collision layers/masks, simplified collision shapes, physics tick rate, Area2D vs raycasts
- GDScript Performance: avoid allocations in hot paths, use StringName, typed arrays, static typing benefits
- Memory Management: monitoring memory, ResourceLoader caching, freeing unused resources
- Object Pooling (GDScript + C#): pool pattern for frequently spawned objects (bullets, particles, enemies)
- Common Bottlenecks table: problem → diagnosis → fix (too many draw calls, GDScript in _process, excessive signals, unoptimized tilemap, large textures)
- Checklist

### Task 9: addon-development skill

Frontmatter: `name: addon-development`, `description: Use when creating Godot editor plugins — EditorPlugin, @tool scripts, custom inspectors, and dock panels`

Sections:
- Plugin Structure: addons/plugin_name/, plugin.cfg, main plugin script
- @tool Annotation: making scripts run in editor, _get_configuration_warnings(), editor vs runtime checks (Engine.is_editor_hint())
- EditorPlugin Base (GDScript + C#): _enter_tree/_exit_tree, adding custom types, toolbar buttons
- Custom Inspector Plugin: EditorInspectorPlugin, adding custom controls to Inspector
- Custom Dock Panel: add_control_to_dock(), UI in editor
- Custom Resource Editors: EditorResourcePicker, previews
- Gizmos: EditorNode3DGizmoPlugin for 3D editor handles
- Testing Plugins: reloading, debugging in editor, plugin lifecycle
- plugin.cfg Format: name, description, author, version, script path
- Checklist

### Task 10: csharp-godot skill

Frontmatter: `name: csharp-godot`, `description: Use when working with C# in Godot — conventions, GodotSharp API differences from GDScript, project setup, and interop`

Sections:
- C# vs GDScript Comparison table: syntax mapping (var→var, func→method, signal→delegate, @export→[Export], @onready→_Ready+GetNode, match→switch, etc.)
- Project Setup: .csproj, NuGet packages, solution structure, IDE setup (Rider, VS Code)
- partial class Requirement: why it's needed (source generators), common error when forgotten
- Naming Conventions: PascalCase methods/properties, camelCase locals, matching Godot API names
- Signals in C#: [Signal] delegate, EmitSignal with SignalName, connecting with += operator
- Async/Await: ToSignal() for awaiting signals, Task-based patterns
- GDScript Interop: calling GDScript from C#, calling C# from GDScript, Variant marshalling
- Performance: C# vs GDScript benchmarks (C# faster for computation), when to use each
- Common Gotchas: Variant conversion, null vs default, Godot collections vs .NET collections, disposing
- Checklist

### Task 11: csharp-signals skill

Frontmatter: `name: csharp-signals`, `description: Use when implementing signals in C# — [Signal] delegates, EmitSignal patterns, async signal awaiting, and event-driven architecture`

Sections:
- Signal Declaration: [Signal] public delegate void NameEventHandler(params), naming convention (EventHandler suffix)
- Emitting Signals: EmitSignal(SignalName.Name, args), type-safe emission
- Connecting Signals: += operator, lambda connections, connecting in _Ready
- Disconnecting: -= operator, _ExitTree cleanup, preventing memory leaks
- Awaiting Signals: ToSignal(source, SignalName), async patterns, timeout with Task.WhenAny
- Custom Signal Patterns: typed event args, signal bus in C#, generic signal helpers
- Connecting GDScript Signals from C#: SignalName strings, Callable.From
- Common Mistakes: forgetting EventHandler suffix, wrong parameter types, connecting to freed objects, not disconnecting
- Checklist
