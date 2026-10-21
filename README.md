# GodotPrompter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Godot 4.x](https://img.shields.io/badge/Godot-4.3+-blue.svg)](https://godotengine.org)
[![Skills: 59](https://img.shields.io/badge/Skills-59-green.svg)](#available-skills)

Agentic skills framework for Godot 4.x game development. Gives AI coding agents domain-specific expertise for GDScript and C# projects.

Inspired by and built on top of the [Superpowers](https://github.com/obra/superpowers) plugin for Claude Code — which provides the underlying skill loading, brainstorming, and workflow infrastructure that GodotPrompter extends with Godot-specific domain knowledge.

## What is this?

GodotPrompter is a plugin that provides **skills** — structured domain knowledge that AI agents load on demand. When you ask your agent to "add a state machine" or "set up multiplayer", it loads the relevant GodotPrompter skill and follows Godot-specific best practices instead of relying on generic knowledge.

**59 skills** covering project setup, architecture, gameplay systems, input handling, physics, 2D/3D systems, animation, shaders, audio, UI, multiplayer, web services, localization, procedural generation, XR/VR, native extensions, multithreading, mobile and web shipping, rendering pipeline, optimization, GDScript / C# patterns, a teaching mode, and third-party addons (LimboAI, Beehave, Popochiu, Dialogue Manager, Phantom Camera). All targeting Godot 4.3+ with both GDScript and C# examples — newer features from Godot 4.5, 4.6, and 4.7 (variadic functions, abstract classes, stencil buffers, AreaLight3D, VirtualJoystick, OpenXR Spatial Entities, and more) are included as annotated additive sections.

**v1.16.0** adds three skills — `web-services` (HTTP and WebSocket backends), `rendering-pipeline` (renderer and graphics settings) and `web-export` (the browser target) — plus a C# compile check of every code block and a prose audit of the existing skills. See the [CHANGELOG](CHANGELOG.md).

## Quick Start

### Claude Code (recommended)

```bash
# Add the marketplace
claude plugins marketplace add jame581/skillsmith

# Install the plugin
claude plugins install godot-prompter@skillsmith
```

Or install from a local clone:

```bash
git clone https://github.com/jame581/GodotPrompter.git
claude plugins marketplace add ./GodotPrompter
claude plugins install godot-prompter@godot-prompter-marketplace
```

Then start a new session and ask:

```
"I'm starting a new Godot 4.3 project. How should I organize it?"
```

The agent loads the `godot-project-setup` skill and provides a complete directory structure, autoload setup, and .gitignore — not generic advice.

### Grok Build

```bash
grok plugin install jame581/GodotPrompter --trust
grok plugin enable godot-prompter
```

Pin to a release:

```bash
grok plugin install jame581/GodotPrompter@v1.16.0 --trust
grok plugin enable godot-prompter
```

### Antigravity CLI (`agy`)

```bash
agy plugin install https://github.com/jame581/GodotPrompter
```

### GitHub Copilot CLI

```bash
copilot plugin marketplace add jame581/skillsmith
copilot plugin install godot-prompter@skillsmith
```

Detailed guide: [`docs/platforms/copilot-cli.md`](docs/platforms/copilot-cli.md)

### Cursor

```
/add-plugin godot-prompter
```

Or clone and place in your project — Cursor reads `.cursor-plugin/plugin.json`.

Detailed guide: [`docs/platforms/cursor.md`](docs/platforms/cursor.md)

### Codex

```bash
git clone https://github.com/jame581/GodotPrompter.git ~/.codex/godot-prompter
mkdir -p ~/.agents/skills
ln -s ~/.codex/godot-prompter/skills ~/.agents/skills/godot-prompter
```

See `.codex/INSTALL.md` for Windows instructions.

### OpenCode

Add to `opencode.json`:

```json
{
  "plugin": ["godot-prompter@git+https://github.com/jame581/GodotPrompter.git"]
}
```

See `.opencode/INSTALL.md` for details.

## How It Works

### Automatic activation

GodotPrompter registers a SessionStart hook that injects its skill-routing card when it detects
a Godot project. It looks for `project.godot` up to four directories above your working
directory **and up to three below it**, so the common monorepo layout — docs and tooling at the
repo root, the engine project in `source/`, `game/`, or `godot/` — is detected when you open a
session at the root. Vendored `addons/` and dot-directories are skipped, so a plugin's bundled
demo project is never mistaken for yours. In any other repository the hook does nothing at all.

The hook reads only your project's `project.godot` and its own state file under your home
directory, makes no network requests, and writes nothing. If bash is unavailable on Windows it
exits silently and the plugin behaves exactly as it did before v1.13.0.

Verified end-to-end on Claude Code and GitHub Copilot CLI. Cursor's registration ships but is
not yet confirmed. Codex and Antigravity have no hook mechanism and continue to load the
bootstrap through `AGENTS.md` / `GEMINI.md`.

> The hook covers your session. **Subagents do not receive it** — `SessionStart` does not fire on
> subagent dispatch. When none of a Godot project's agent instructions files has a
> `## GodotPrompter` section, the agent offers once to add one, since that is what subagents read.
> `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.github/copilot-instructions.md` and the `.claude/rules/`
> and `.cursor/rules/` directories all count — whichever agent they belong to — and the offer names
> the file your repo already keeps, so an agent-agnostic project is never asked to start a
> `CLAUDE.md` it does not want. It never adds the section silently, and a refusal is remembered in
> `~/.godot-prompter/state/` so you are asked once, not at every session start. Changed your mind?
> Just ask the agent to add the section; nothing has to be un-set by hand.

### Mentor mode

Say "teach me as we go" in a Godot project and GodotPrompter switches to teaching delivery: the
Godot concept and why that node, the editor setup, annotated GDScript and C#, what to verify when
you run it, and one suggested next step. It wraps the domain skills rather than replacing them,
so the guidance stays version-checked.

Your preference is remembered per project in `~/.godot-prompter/state/` — nothing is written into
your game repository. Say "just give me the code" to turn it off.

### 1. Design Phase
Ask the agent to brainstorm a feature. When design decisions are open it loads `godot-grill` first, which asks them in numbered rounds with a recommended answer each and records your choices. Then `godot-brainstorming` walks you through:
- Architectural approaches with trade-offs
- Scene tree design, signal maps, and data flow
- An implementation plan with ordered tasks

### 2. Implementation Phase
For each task, the agent loads the relevant domain skill:
- Building a player? → `player-controller` + `input-handling` + `state-machine`
- Adding inventory? → `inventory-system` + `resource-pattern`
- Setting up 3D scene? → `3d-essentials` + `assets-pipeline`
- Adding particles? → `particles-vfx` + `shader-basics`
- Need animations? → `animation-system` + `tween-animation`
- Need save/load? → `save-load`

### 3. Review Phase
Ask for a code review. The agent loads `godot-code-review` and checks against Godot-specific checklists.

### Example Use Cases

- **"Set up a new Godot project"** — Loads the `godot-project-setup` skill and scaffolds a complete directory structure, autoloads, input map, and .gitignore following Godot best practices.
- **"Add a platformer player controller with coyote time and jump buffering"** — Loads `player-controller` and `input-handling` skills, providing complete CharacterBody2D code with physics-correct movement in both GDScript and C#.
- **"Design an enemy AI system with patrol, chase, and attack"** — Uses the `godot-game-architect` agent to plan the system with `ai-navigation`, `state-machine`, and `animation-system` skills, then the `godot-game-dev` agent to implement it.
- **"Set up a 3D scene with lighting, materials, and fog"** — Loads `3d-essentials` skill with StandardMaterial3D PBR workflow, DirectionalLight3D shadow configuration, environment setup, and volumetric fog.
- **"Add particle effects for explosions and fire"** — Loads `particles-vfx` skill with GPUParticles2D/3D recipes, ParticleProcessMaterial configuration, color ramps, and one-shot burst patterns.
- **"Review my code for Godot best practices"** — Uses the `godot-code-reviewer` agent with the `godot-code-review` skill to check node architecture, signal patterns, performance, input handling, and resource management.

### Agents

GodotPrompter includes 9 specialized agents:

| Agent | Purpose |
|-------|---------|
| **godot-game-architect** | Designs systems, plans scene trees, chooses patterns |
| **godot-game-dev** | Implements features guided by skills |
| **godot-code-reviewer** | Reviews code against Godot best practices |
| **godot-shader-author** | Authors custom shaders, post-processing, Compositor effects |
| **godot-performance-profiler** | Diagnoses performance issues from profiler data |
| **godot-animator** | Designs animation graphs, blend trees, IKModifier3D, BoneConstraint3D, retargeting |
| **godot-csharp-engineer** | C#-first development; parity mode for closing this repo's C# debt |
| **godot-ui-designer** | Builds Control-tree UI — themes, responsive layouts, localization-aware |
| **godot-tools-engineer** | Editor plugins, custom inspectors, gizmos, `@tool` scripts, plugin distribution |

## Supported Platforms

| Platform | Install | SessionStart hook | Fresh-context path | Status | Docs |
|----------|---------|-------------------|--------------------|--------|------|
| Claude Code | `claude plugins marketplace add jame581/skillsmith` | Yes | `CLAUDE.md` / `.claude/CLAUDE.md` | Primary, verified | This README + `tests/agent-integration/TEST_PLAN.md` |
| GitHub Copilot CLI | `copilot plugin marketplace add jame581/skillsmith` | Yes | `.github/copilot-instructions.md` or `AGENTS.md` | Verified | [`docs/platforms/copilot-cli.md`](docs/platforms/copilot-cli.md) |
| Cursor | `/add-plugin godot-prompter` or clone with `.cursor-plugin/` | Registration ships | `.cursor/rules/` or `AGENTS.md` | End-to-end install still pending confirmation | [`docs/platforms/cursor.md`](docs/platforms/cursor.md) |
| Codex | Clone + symlink | No | `AGENTS.md` | Documented | [`.codex/INSTALL.md`](.codex/INSTALL.md) |
| Antigravity | `agy plugin install https://github.com/jame581/GodotPrompter` | No | `GEMINI.md` | Documented | This README |
| OpenCode | Add to `opencode.json` | No | `AGENTS.md` | Documented | [`.opencode/INSTALL.md`](.opencode/INSTALL.md) |
| Grok Build | `grok plugin install jame581/GodotPrompter --trust` | Not documented | Not documented | Install path documented; smoke coverage still needed | This README |

Machine-readable release smoke coverage lives in [`tests/agent-integration/host-smoke-matrix.json`](tests/agent-integration/host-smoke-matrix.json).
The generated machine-readable skill catalog lives in [`skills/index.json`](skills/index.json).

> **Legacy marketplace:** The [`godot-prompter-marketplace`](https://github.com/jame581/godot-prompter-marketplace) repo remains online so existing installs keep receiving updates, but new users should install from [`skillsmith`](https://github.com/jame581/skillsmith).

## Available Skills

### Core / Process (8 skills)

| Skill | Description |
|-------|-------------|
| `using-godot-prompter` | Bootstrap — skill catalog, workflow guide, platform setup |
| `godot-project-setup` | Scaffold directory structure, autoloads, .gitignore, input maps |
| `godot-brainstorming` | Scene tree planning, node selection, architectural decisions |
| `godot-grill` | Settle open design decisions in rounds — scope first, each question with a recommended answer, recorded |
| `godot-code-review` | Review checklist — best practices, anti-patterns, Godot pitfalls |
| `godot-debugging` | Remote debugger, print techniques, signal tracing, error patterns |
| `godot-testing` | TDD with GUT and gdUnit4 — test structure, mocking, CI |
| `godot-mentor` | Teaching mode — concept, editor setup, annotated code, verification, one next step |

### Architecture & Patterns (6 skills)

| Skill | Description |
|-------|-------------|
| `scene-organization` | Scene tree composition, when to split scenes, node hierarchy |
| `state-machine` | Enum-based, node-based, resource-based FSM with trade-offs |
| `event-bus` | Global EventBus autoload with typed signals, decoupled communication |
| `component-system` | Hitbox/Hurtbox/Health components, composition over inheritance |
| `resource-pattern` | Custom Resources for items, stats, config, editor integration |
| `dependency-injection` | Autoloads, service locators, @export injection, scene injection |

### Physics, 2D/3D & XR (4 skills)

| Skill | Description |
|-------|-------------|
| `physics-system` | RigidBody, Area, raycasting, collision shapes, Jolt, ragdolls, interpolation |
| `2d-essentials` | TileMaps, parallax, 2D lights/shadows, particles, custom drawing, canvas layers |
| `3d-essentials` | Materials, lighting, shadows, environment, GI, fog, LOD, occlusion, decals |
| `xr-development` | OpenXR, XROrigin3D, hand tracking, controllers, passthrough, Meta Quest |

### Gameplay Systems (13 skills)

| Skill | Description |
|-------|-------------|
| `player-controller` | CharacterBody2D/3D movement — top-down, platformer, first-person |
| `input-handling` | InputEvent system, Input Map actions, controllers/gamepads, mouse/touch, action rebinding |
| `animation-system` | AnimationPlayer, AnimationTree, blend trees, state machines, sprite animation |
| `tween-animation` | Tween class, easing, chaining, parallel sequences, common motion recipes |
| `audio-system` | Audio buses, music management, SFX pooling, spatial audio, interactive music |
| `inventory-system` | Resource-based items, slot management, stacking, UI binding |
| `dialogue-system` | Branching dialogue trees, conditions, UI presentation |
| `save-load` | ConfigFile, JSON, Resource serialization, version migration |
| `ai-navigation` | NavigationAgent2D/3D, steering behaviors, patrol patterns, async baking |
| `ability-system` | Resource-based abilities, cost/cooldown/cast, buffs/debuffs, stat modifiers, gameplay tags, HUD binding |
| `camera-system` | Smooth follow, screen shake, camera zones, transitions |
| `localization` | TranslationServer, CSV/PO files, locale switching, RTL support, pluralization |
| `procedural-generation` | Noise, BSP dungeons, cellular automata, WFC, seeded randomness |

### UI/UX (3 skills)

| Skill | Description |
|-------|-------------|
| `godot-ui` | Control nodes, themes, anchors, containers, layout patterns |
| `responsive-ui` | Multi-resolution scaling, aspect ratios, DPI, mobile adaptation |
| `hud-system` | Health bars, score displays, minimap, damage numbers, notifications |

### Multiplayer & Web Services (4 skills)

| Skill | Description |
|-------|-------------|
| `multiplayer-basics` | MultiplayerAPI, ENet/WebSocket, RPCs, authority model |
| `multiplayer-sync` | MultiplayerSynchronizer, interpolation, prediction, lag compensation |
| `dedicated-server` | Headless export, server architecture, lobby management |
| `web-services` | HTTPRequest, REST/JSON API clients, downloads, TLS, WebSocket clients |

### Rendering & Visual (3 skills)

| Skill | Description |
|-------|-------------|
| `rendering-pipeline` | Renderer per platform, lighting strategy, AA, FSR/resolution scaling, SubViewports, graphics settings |
| `shader-basics` | Godot shader language, visual shaders, common recipes, post-processing |
| `particles-vfx` | GPUParticles2D/3D, process materials, subemitters, trails, attractors, collision |

### Build & Deploy (6 skills)

| Skill | Description |
|-------|-------------|
| `export-pipeline` | Platform exports, CI/CD with GitHub Actions, itch.io/Steam deploy |
| `godot-optimization` | Profiler, draw calls, physics tuning, object pooling, bottlenecks |
| `addon-development` | EditorPlugin, @tool scripts, custom inspectors, dock panels |
| `assets-pipeline` | Image compression, 3D scene import, audio formats, resource management |
| `mobile-development` | Android/iOS export, signing, lifecycle, permissions, plugins, IAP, device features |
| `web-export` | Browser builds, threads vs COOP/COEP headers, itch.io/self-hosting, PWA, JavaScriptBridge |

### Scripting (4 skills)

| Skill | Description |
|-------|-------------|
| `gdscript-patterns` | Static typing, await/coroutines, lambdas, match, exports, common idioms |
| `gdscript-advanced` | Performance idioms, metaprogramming, `@tool` lifecycle, profiler-driven depth |
| `csharp-godot` | C# conventions, GodotSharp API, project setup, GDScript interop |
| `csharp-signals` | [Signal] delegates, EmitSignal, async awaiting, event architecture |

### Native & Performance (2 skills)

| Skill | Description |
|-------|-------------|
| `gdextension` | godot-cpp (C++) / gdext (Rust) native extensions, class binding, building, interop |
| `multithreading` | WorkerThreadPool, Thread/Mutex/Semaphore, call_deferred, threaded resource loading |

### Math & Data (1 skill)

| Skill | Description |
|-------|-------------|
| `math-essentials` | Vectors, transforms, interpolation, curves, paths, RNG, game math recipes |

### Third-Party Addons (5 skills)

These skills cover community addons with pinned versions — LimboAI v1.8.0, Beehave v2.9.2, Popochiu v2.1.1, Dialogue Manager v3.10.4, and Phantom Camera v0.11.0.2. They require the corresponding addon to be installed in your project.

| Skill | Description |
|-------|-------------|
| `limboai` | LimboAI addon — behavior trees + hierarchical state machines, visual editor, blackboard, BTTask subclassing (Godot 4.6+, C++ GDExtension) |
| `beehave` | Beehave addon — pure-GDScript behavior trees, composites/decorators/leaves, blackboard, visual runtime debugger (GDScript-only) |
| `popochiu` | Popochiu addon — point-and-click adventure framework: rooms, characters, inventory, dialogs, command GUI (Godot 4.6, GDScript-only) |
| `dialogue-manager` | Dialogue Manager addon — .dialogue syntax, runtime balloons, conditions/mutations (Godot 4.6, GDScript + C#) |
| `phantom-camera` | Phantom Camera addon — priority-based camera switching, follow/look-at modes, tweened transitions (Godot 4.4+, GDScript + C#, pre-1.0) |

## Validation

Quality is enforced by an automated validator that runs on every pull request, every push to `master`, and every release tag. Human-readable run:

```bash
node scripts/validate-skills.mjs           # exit 1 on errors, 0 otherwise
node scripts/validate-skills.mjs --json    # machine-readable for CI
```

The validator (`scripts/validate-skills.mjs`) checks every `skills/*/SKILL.md` and `agents/*.md` against these rules. `scanner-risky-approval` covers the whole repository. Additional metadata checks keep the generated Codex mirrors, the machine-readable skill index, and the cross-host smoke matrix current:

| Rule | What it checks | Severity |
|---|---|---|
| `frontmatter-{missing,name-missing,description-missing,name-mismatch}` | YAML frontmatter is present and `name` matches folder | error |
| `cross-ref-broken` | Every skill referenced on the `**Related skills:**` line and inline `see <skill> skill` mentions resolves to an existing skill folder | error |
| `agent-frontmatter-{missing,name-missing,description-missing}` | An `agents/*.md` file has YAML frontmatter with `name` and `description` | error |
| `agent-skill-path-broken` | Every `skills/<name>/SKILL.md` path inside an agent definition exists | error |
| `related-skills-line-missing` | Skill has a `**Related skills:**` line between H1 and first section | warning |
| `csharp-parity-missing` / `csharp-parity-accepted` | Every section with a GDScript code block also has a C# block (skills allowlisted as GDScript-only-by-design emit `accepted` instead of `missing`) | warning |
| `csharp-parity-exempt-no-reason` | A `csharp-parity: n/a` marker in a section states a reason. Checked for every marker, not only where C# is missing, so a reasonless marker cannot hide until the section is edited | error |
| `csharp-parity-{missing,accepted}-reference` | The same parity check for `skills/<name>/references/*.md`, section by section (or the whole file when it has no headings); allowlisted GDScript-only skills and `n/a` sections emit `accepted` | warning |
| `checklist-missing` | Implementation checklist (`- [ ]` items) present near end of file | warning |
| `token-budget-exceeded` | `SKILL.md` < 16 KB (references under `skills/<name>/references/` are unrestricted) | error |
| `token-budget-approaching` | `SKILL.md` ≥ 15.5 KB and < 16 KB — advisory heads-up before the hard budget | warning |
| `orphan-reference` | Every `references/*.md` file is linked from its parent `SKILL.md` | warning |
| `card-marker-{missing,malformed,duplicate}` | The hook-injected card regions (`SESSION-CARD` in `using-godot-prompter`, `MENTOR-CARD` in `godot-mentor`) have both markers, in order, appearing exactly once — the hook extracts the *first* region, so a duplicate pair would silently become the injected payload | error |
| `card-empty` | The card region is non-empty — otherwise the hook would inject nothing while CI stayed green | error |
| `card-oversized` | The card region is ≤ 3 KB — it is injected on every session start *and* every compaction | error |
| `card-skill-missing` | Every skill named in `CARD_SPECS` exists, so deleting one fails CI instead of silently skipping its check | error |
| `gdscript-nonexistent-api` | No GDScript code block in a `SKILL.md` or `references/*.md` uses an API already caught being invented: `Signal.any()` / `Signal.all()`, or the C#-only `ToSignal()`. Prose is not scanned. It is a denylist, so it cannot prove an API exists | error |
| `scanner-risky-approval` | No `.md`, `.json`, `.toml`, `.yml` or `.yaml` file writes out a setting the plugin scanner in `plugin-scan.yml` flags: a full-access sandbox mode, a never-ask approval policy, or a bypass approval mode. Comments and prose count, as they do for the scanner. In a git work tree it checks the files a clone would hold (tracked, or untracked and not ignored) | error |

Hook behaviour is covered separately by `npm run test:hooks` (51 cases), which also runs on release tags. Metadata coverage now also includes `node scripts/sync-codex-agents.mjs --check`, `node scripts/generate-skill-index.mjs --check`, and `node scripts/validate-platform-metadata.mjs`.

Token cost reporting:

```bash
npm ci --prefix scripts   # once: the tokenizers live in scripts/, not the plugin root
node scripts/count-tokens.mjs --tokenizer --markdown
```

Produces a per-skill / per-agent table (bytes, KB, estimated tokens, Claude / GPT tokenizer counts, status) that lives between `<!-- BEGIN-TOKEN-TABLE -->` markers in [`docs/token-budget.md`](docs/token-budget.md).

CI gate: `.github/workflows/release.yml` runs the version-consistency check, `node scripts/validate-skills.mjs`, the hook tests, the validator tests, the metadata tests, and the broken-fixture self-test on every `v*.*.*` push. The release is blocked if any of those fail or any of `package.json` / `.claude-plugin/plugin.json` / `.claude-plugin/marketplace.json` / `.cursor-plugin/plugin.json` / `plugin.json` drifts from the tag.

**Current baseline:** 0 errors, 57 warnings on `node scripts/validate-skills.mjs` in this repository state. All 57 are intentional `csharp-parity-accepted` warnings for GDScript-only content. Every `SKILL.md` is **under** the 16 KB budget — since v1.12.0 that is a validator **error**, not a warning, so an over-budget skill fails the release.

Behaviour is measured with `claude plugin eval` suites in [`evals/`](evals/) — mentor mode, `godot-grill`, the session card, and a set of domain skills — each run with and without the plugin; results are recorded in `evals/FOLLOWUPS.md`, `evals/GRILL.md` and `evals/SKILLS.md`. Since v1.15.1 every code example has also been parsed (GDScript) or compiled (C#) against Godot 4.7.2.

A manual agent-integration test plan covering full workflows (skill discovery, cross-reference navigation, end-to-end feature implementation) lives in [`tests/agent-integration/TEST_PLAN.md`](tests/agent-integration/TEST_PLAN.md) for spot-checks against new agent versions or platforms. Cross-host release smoke coverage is tracked in [`tests/agent-integration/host-smoke-matrix.json`](tests/agent-integration/host-smoke-matrix.json).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add new skills, conventions, and testing requirements.

## Acknowledgements

The SessionStart hook's polyglot Windows wrapper, JSON escaper, and platform output branching are
adapted from [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent (MIT).

## License

[MIT](LICENSE)

## Author

* **Jan Mesarč** - *Creator* - [janmesarc.online/](https://janmesarc.online/)

Do you like this project and want to support me? Great! I really appreciate it and it makes me very happy if you [Buy Me A Coffee](https://www.buymeacoffee.com/jame581).
