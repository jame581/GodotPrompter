# Skill and Agent Index

Reference for `skills/using-godot-prompter/SKILL.md` — every GodotPrompter skill grouped by category with a one-line description, plus the agent list.

> ← Back to [SKILL.md](../SKILL.md)

### Core / Process
- `using-godot-prompter` — This skill (bootstrap)
- `godot-project-setup` — Scaffold new projects
- `godot-brainstorming` — Godot-specific design exploration
- `godot-grill` — Settle open design decisions in rounds, scope first, and record them
- `godot-code-review` — GDScript/C# review against Godot best practices
- `godot-debugging` — Godot-specific debugging techniques
- `godot-testing` — TDD with GUT and gdUnit4
- `godot-mentor` — Teaching mode: concept, editor setup, annotated code, verification, one next step

### Architecture & Patterns
- `scene-organization` — Scene tree structure, composition patterns
- `state-machine` — FSM patterns (node-based, resource-based, enum-based)
- `event-bus` — Signal-based decoupling, autoload event systems
- `component-system` — Composition over inheritance
- `resource-pattern` — Custom Resources as data containers
- `dependency-injection` — Autoloads, service locators

### Gameplay Systems
- `player-controller` — CharacterBody2D/3D movement, input handling
- `input-handling` — InputEvent system, Input Map, controllers/gamepads, mouse/touch, rebinding
- `animation-system` — AnimationPlayer, AnimationTree, blend trees, state machines
- `tween-animation` — Tween class, easing, chaining, parallel sequences, motion recipes
- `inventory-system` — Resource-based inventory patterns
- `ability-system` — Resource-based abilities, cost/cooldown/cast, buffs, stat modifiers, gameplay tags
- `dialogue-system` — Dialogue trees and patterns
- `save-load` — Serialization strategies
- `ai-navigation` — NavigationAgent, behavior trees
- `camera-system` — Camera follow, shake, zones
- `audio-system` — Audio buses, music management, SFX pooling, spatial audio
- `localization` — i18n/l10n, TranslationServer, CSV/PO, locale switching, RTL
- `procedural-generation` — Noise, BSP dungeons, cellular automata, WFC, seeded randomness

### UI/UX
- `godot-ui` — Control nodes, themes, containers
- `responsive-ui` — Multi-resolution scaling
- `hud-system` — In-game HUD patterns

### Multiplayer
- `multiplayer-basics` — MultiplayerAPI, RPCs, authority
- `multiplayer-sync` — Synchronization, interpolation
- `dedicated-server` — Headless export, server architecture
- `web-services` — HTTPRequest, REST/JSON clients, downloads, TLS, WebSocket clients

### Physics & 2D/3D
- `physics-system` — RigidBody, Area, raycasting, collision shapes, Jolt, ragdolls
- `2d-essentials` — TileMaps, parallax, 2D lights/shadows, particles, canvas layers
- `3d-essentials` — Materials, lighting, shadows, environment, GI, fog, LOD, decals
- `xr-development` — OpenXR, XROrigin3D, hand tracking, controllers, Meta Quest

### Rendering & Visual
- `rendering-pipeline` — Renderer per platform, lighting strategy, AA, 3D resolution scaling, SubViewports
- `shader-basics` — Godot shader language, visual shaders, common recipes, post-processing
- `particles-vfx` — GPUParticles2D/3D, process materials, subemitters, trails, attractors

### Build & Deploy
- `export-pipeline` — Platform exports, CI/CD
- `web-export` — Browser builds, threads and COOP/COEP, hosting, JavaScriptBridge, persistence
- `godot-optimization` — Profiler, performance patterns
- `addon-development` — EditorPlugin, tool scripts
- `assets-pipeline` — Image compression, 3D scene import, audio formats, resource management
- `mobile-development` — Android/iOS export and signing, permissions, plugins, IAP, ads, lifecycle
- `multithreading` — WorkerThreadPool, Thread/Mutex/Semaphore, `call_deferred`, threaded loading

### Scripting
- `gdscript-patterns` — Static typing, await/coroutines, lambdas, match, exports, idioms
- `gdscript-advanced` — Performance idioms, metaprogramming, `@tool` lifecycle, async pitfalls
- `gdextension` — Native extensions via godot-cpp (C++) or gdext (Rust), binding, building, interop
- `csharp-godot` — C# conventions, GodotSharp API
- `csharp-signals` — C# signal patterns

### Math & Data
- `math-essentials` — Vectors, transforms, interpolation, curves, paths, RNG

### Third-Party Addons (require the addon installed)
- `limboai` — LimboAI behavior trees + hierarchical state machines
- `beehave` — Beehave GDScript behavior trees
- `popochiu` — Popochiu point-and-click adventure framework
- `dialogue-manager` — Dialogue Manager branching dialogue
- `phantom-camera` — Phantom Camera dynamic cameras

## Agents

- **godot-game-architect** — Designs systems, plans scene trees, chooses patterns
- **godot-game-dev** — Implements features guided by skills
- **godot-code-reviewer** — Reviews code against Godot best practices
- **godot-shader-author** — Authors custom shaders, post-processing, Compositor effects
- **godot-performance-profiler** — Diagnoses performance issues from profiler data
- **godot-animator** — Designs animation graphs, blend trees, IKModifier3D, BoneConstraint3D, retargeting
- **godot-csharp-engineer** — C#-first development; parity mode for closing this repo's C# debt
- **godot-ui-designer** — Builds Control-tree UI — themes, responsive layouts, localization-aware
- **godot-tools-engineer** — Editor plugins, custom inspectors, gizmos, `@tool` scripts, plugin distribution
