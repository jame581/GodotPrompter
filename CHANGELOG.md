# Changelog

All notable changes to GodotPrompter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.13.0] - 2026-07-28

### Added

- **SessionStart hook (`hooks/`)** — GodotPrompter now injects its skill-routing card into
  context automatically when it detects a Godot project (`project.godot` within four
  directories of the working directory), and does nothing at all in any other repository.
  This closes the gap that made the v1.4.1 coexistence fix underperform: routing guidance that
  must be opened to be read loses to guidance already in context. Verified on Claude Code;
  Cursor and Copilot CLI registrations ship but are not yet confirmed end-to-end. Codex and
  Antigravity continue to inherit the bootstrap via `AGENTS.md` / `GEMINI.md`.
- **`godot-mentor` skill** (54 → 55 skills) — teaching mode. Wraps the domain skills in a
  five-beat contract: concept and why that node, editor setup, annotated GDScript and C#, what
  to verify when you run it, one next step. Your preference is remembered per project in
  `~/.godot-prompter/state/` — **nothing is written into your game repository**. Survives
  `/clear` and compaction.
- **Godot version, renderer, and C# detection** — the hook parses `config/features` from
  `project.godot`, so advice targets the version and renderer actually in use. A `C#` feature
  tag now makes C# the leading example.
- **Subagent reach** — when a Godot project's `CLAUDE.md` has no `## GodotPrompter` section, the
  agent offers once (never silently) to add one. The SessionStart hook does **not** fire on
  subagent dispatch; CLAUDE.md is what subagents read.
- **Hook test suite** (`tests/hooks/`, 22 cases) now runs in CI alongside the validator, and
  `package.json` gains a `scripts` block (`npm run test:hooks`, `npm run validate`). Coverage
  includes the polyglot wrapper, a sanitized environment with no `HOME`, and the
  `.gitattributes` LF pin — the last of which is the assertion that actually holds on a Linux
  runner, where the working tree is LF regardless.
- The hook fires on **resume** as well as startup, clear, and compact, so `claude --resume`
  restores the card and mentor mode rather than starting cold.

### Changed

- **Bootstrap routing table** replaced 20 partial rows with 16 category rows covering all 55
  skills including the five addon skills, plus a Red Flags anti-rationalization table. Category
  rows rather than one row per skill: a full enumeration measured 2,963 bytes against the
  3,072-byte cap, leaving 109 bytes — one new skill from breaching CI.
- **Pattern X restructure of 8 skills.** All eight sat within 145 bytes of the 15.5 KB advisory
  band; the v1.12.0 notes named only four. No teaching content removed — sections moved to
  `references/`.

  | Skill | Before | After | Headroom |
  |---|---:|---:|---:|
  | `event-bus` | 15727 | 11616 | 145 → 4256 |
  | `particles-vfx` | 15837 | 12134 | 35 → 3738 |
  | `multiplayer-basics` | 15791 | 12400 | 81 → 3472 |
  | `godot-ui` | 15826 | 12771 | 46 → 3101 |
  | `localization` | 15864 | 12913 | 8 → 2959 |
  | `addon-development` | 15843 | 13212 | 29 → 2660 |
  | `physics-system` | 15853 | 14670 | 19 → 1202 |
  | `3d-essentials` | 15813 | 15066 | 59 → 806 |

  `physics-system` and `3d-essentials` end higher than the rest: both were already heavily
  restructured in v1.7.0 (12 and 9 reference files now), so every remaining section but the
  checklist already links one. Their numbers are close to the floor achievable without removing
  teaching content.
- **`.gitattributes`** pins `hooks/session-start` and `*.cmd` to LF, and both hook files are
  tracked with the exec bit. With `core.autocrlf=true` they would otherwise check out CRLF and
  bash would fail on a carriage return at every session start on Windows.
- **New validator rules:** `card-marker-missing`, `card-marker-malformed`,
  `card-marker-duplicate`, `card-empty`, `card-oversized`, `card-skill-missing`. Three new
  fixtures extend the v1.12.0 validator self-test.

### Fixed

- **Five skills were missing from the bootstrap's category index** — `ability-system`,
  `gdextension`, `gdscript-advanced`, `mobile-development`, `multithreading`.

> **Release notes:** 55 skills. Validator baseline: **0 errors, 16 warnings** (unchanged — all
> `csharp-parity-accepted` by design). Hook tests: 22/22. Repo-wide minimum stays Godot 4.3+.
>
> **First release shipping executable code.** The hook reads only `project.godot` and its own
> state file under your home directory, makes no network requests, and writes nothing. Its
> Windows wrapper and JSON escaper are adapted from
> [Superpowers](https://github.com/obra/superpowers) (MIT, Jesse Vincent).
>
> **Deferred to v1.14.0:** researched editor references (`editor-navigation.md`,
> `editor-recipes.md`). Until they land, mentor mode's Editor beat is constrained to node-tree
> and Inspector-level guidance — no menu paths.
>
> **Heads-up for contributors:** four more skills now sit closest to the advisory band —
> `phantom-camera` (159 bytes), `ai-navigation` (164), `export-pipeline` (181), `csharp-godot`
> (223). They are the next Pattern X candidates.

## [1.12.0] - 2026-07-14

### Added

- **Three new third-party addon skills** (51 → 54 skills; the Third-Party Addons category grows from 2 to 5). Every API fact in each skill was verified against the addon's **pinned tag**, not its docs site — each ships a research digest under `docs/superpowers/notes/`:
  - **`popochiu`** — Popochiu v2.1.1 (Godot 4.6, GDScript-only): point-and-click adventure framework. One-letter autoloads (`E`/`C`/`R`/`D`/`I`/`G`/`A`/`T`), the Room → Props / Hotspots / Regions / Walkable Areas / Markers model, `E.queue()` cutscene scripting, clickable lifecycle callbacks. Four Pattern X references: dialogs, inventory, GUI templates, pipeline (Aseprite / audio / save-load / transitions).
  - **`dialogue-manager`** — Dialogue Manager v3.10.4 (Godot 4.6, **full C# parity**): `.dialogue` syntax (titles, responses, conditions, mutations, jumps), runtime balloons, signals and typed access, translations.
  - **`phantom-camera`** — Phantom Camera v0.11.0.2 (Godot 4.4+, **full C# parity**, pre-1.0): `PhantomCameraHost` + PCam model, priority-based switching, follow modes, look-at modes (3D), tweened transitions.
- **`using-godot-prompter` gained a Third-Party Addons index section.** LimboAI and Beehave had never been listed in the bootstrap skill's catalog — all five addon skills are now discoverable there.
- **Validator self-test in CI** (`release.yml`): asserts the validator still *rejects* the deliberately-broken fixtures, so a future refactor cannot silently disable the rules while CI stays green.
- **CONTRIBUTING.md**: documents the enforced token budget and the third-party addon skill conventions (pin the version; research the tag, not the docs site; decide C# parity by what the addon actually ships; the four places to wire a new addon in).

### Changed

- **The 16 KB token budget is now enforced.** `token-budget-exceeded` was promoted from a warning to a **CI-failing error** (≥ 16,384 bytes), and a new advisory `token-budget-approaching` **warning** fires from 15.5 KB (15,872 bytes) so authors get a signal before the wall. Two fixtures (`scripts/fixtures/token-budget-{over,near}/`) cover both thresholds.
- **Byte measurement is LF-normalized** in `validate-skills.mjs` and `count-tokens.mjs`, and `.gitattributes` pins `eol=lf`. On CRLF (Windows) checkouts raw byte counts over-reported by ~1 byte per line, which had produced a **false "9 skills over budget" reading** — on real LF bytes none of them ever exceeded the limit. Local numbers now match CI, and `docs/token-budget.md` can finally be regenerated on Windows.
- **Headroom trim across 10 skills** to clear the new advisory band — `localization`, `gdscript-patterns`, `godot-ui`, `assets-pipeline`, `shader-basics`, `3d-essentials`, `multiplayer-basics`, `event-bus`, `input-handling`, `physics-system`. No teaching content removed: the bulk was markdown table-alignment whitespace plus prose tightening.
- **Migrated from Gemini CLI to Antigravity CLI** (PR [#13](https://github.com/jame581/GodotPrompter/pull/13), thanks @hubacekjakub). Google [retired Gemini CLI on 2026-06-18](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/); Antigravity CLI (`agy`) is the official successor. `gemini-extension.json` → root `plugin.json` (Antigravity schema), with `bump-version.mjs`, the release version-drift gate, `GEMINI.md`, README, and CONTRIBUTING retargeted.
- README, CLAUDE.md, `docs/token-budget.md`, and both agent routing lines updated for the new skills, counts, and validator rules.

### Fixed

- `dialogue-manager`: `MutationBehaviour` / `TranslationSource` live on **`DMConstants`** (GDScript) and are namespace-level in `DialogueManagerRuntime` (C#) — not on the `DialogueManager` autoload, as first written.
- `dialogue-manager`: end of dialogue returns **`null`**, not an empty dictionary — the addon's own `API.md` is wrong at this tag. Also documents that the C# events wire lazily on first `DialogueManager.Instance` access.
- `popochiu`: a `"..."` string is a **1 s** pause, not 0.5 s (`0.25 × 2^(dots−1)`).
- `dialogue-system/references/dialogue-manager.md` now states up front that it documents a *hand-rolled* autoload, not the identically-named addon.

> **Release notes:** 54 skills. Validator baseline: **0 errors, 16 warnings** (13 pre-existing `csharp-parity-accepted` + 3 for the intentionally GDScript-only `popochiu`). Repo-wide minimum stays Godot 4.3+; addon skills carry their own higher minimums. Agent integration tests for the three new skills: 3/3 pass.
>
> **Heads-up for contributors:** four skills now sit within ~35 bytes of the 15.5 KB advisory band (`localization` has just 8 bytes of headroom), so the next small edit to `localization`, `physics-system`, `addon-development`, or `particles-vfx` will trip the new warning. Use Pattern X rather than trimming teaching content.

## [1.11.1] - 2026-07-12

### Changed

- **`limboai` skill: pinned version bumped v1.7.1 → v1.8.0.** Upstream v1.8.0 is a Godot 4.7 compatibility release (18 commits, all internal — header/GDExtension compile fixes and CI updates) with no user-facing API changes, so no pattern or example updates were needed. Version-support facts refreshed: GDExtension still supports Godot 4.6+, but the module build — required for C# — now targets Godot 4.7 (was 4.6); noted in the addon header line and the install section.
- README third-party addon blurb updated to LimboAI v1.8.0.

> **Release notes:** Maintenance release — no new skills (51 total). Repo-wide minimum stays at Godot 4.3+.

## [1.11.0] - 2026-07-06

### Changed

- **Godot 4.7 alignment pass** across the skill library, replaying the v1.5.0 method: verified per-skill delta inventory (`docs/superpowers/notes/2026-07-05-godot-4.7-deltas.md`) applied as annotated additive sections and behavior-change warnings — 90 applied rows across 26 skills. Per-skill highlights:
  - `physics-system` — one-way collision direction (`CollisionShape2D.one_way_collision_direction`, `PhysicsServer2D` param); Jolt behavior-change warnings (SoftBody3D mass/stiffness reinterpretation, WorldBoundaryShape3D plane sign flip, Area3D↔SoftBody3D overlaps)
  - `animation-system` — BlendSpace `sync_mode` enum migration warning, named blend points, ping-pong sprite playback (`SpriteFrames.LoopMode`), `LookAtModifier3D.relative` default-flip warning
  - `tween-animation` — `Tween.has_tweeners()` guard for lazily built tweens
  - `input-handling` — `VirtualJoystick` node, joypad motion sensors (accelerometer/gyroscope + calibration), vibration capability checks, `DEVICE_ID_MOUSE`/`DEVICE_ID_KEYBOARD` warning, `ignore_joypad_on_unfocused_application` setting, `JOY_BUTTON_MISC2–6`
  - `audio-system` — `area_mask` default change warning (Area bus overrides), `AudioStreamInteractive.TRANSITION_TO_TIME_PREVIOUS_POSITION`
  - `gdscript-advanced` / `gdscript-patterns` — packed-array per-element setter and typed-return inheritance warnings, new `CONFUSABLE_TEMPORARY_MODIFICATION` warning, `type_exists()` deprecation
  - `particles-vfx` — inherit-emitter-scale flag, per-axis 3D scale/rotation, orientation rework (`TRANSFORM_ALIGN_LOCAL_BILLBOARD`, rotation velocity over lifetime), sub-frame particle seeking, subemitter velocity-inheritance fix warning
  - `xr-development` — user presence signal (`XR_EXT_user_presence`), composition layer eye visibility, spatial anchor `next` param, foveation default changes
  - `mobile-development` — Java interface proxies from GDScript (`JavaClassWrapper.create_proxy`/`create_sam_callback`), Android picture-in-picture, `orientation_changed` signal, VirtualJoystick cross-ref, native file picker on all devices, Gradle build no longer experimental, OBB expansion-file removal warning
  - `godot-ui` — `AccessibilityServer` split warning (C#-breaking), `custom_maximum_size`, Control offset transform (layout-safe UI juice), `_get_cursor_shape()` virtual, PopupMenu search bar, conic gradients, AtlasTexture tiling, RichTextLabel image-sizing rework warning, `all_tabs_in_front` deprecation
  - `responsive-ui` / `godot-project-setup` — new-project stretch defaults now `canvas_items`/`expand`
  - `3d-essentials` — AreaLight3D, GridMap octant queries, CSG autosmooth, HDR output setting, volumetric fog blending and `roughness_layers` default warnings; Vulkan raytracing noted as experimental
  - `2d-essentials` — antialiased-line feather removal warning; DrawableTexture2D noted as experimental
  - `shader-basics` — `in_shadow_pass`/`specular_amount` visual shader inputs, `LinearToSRGB` HDR clamp warning, `textureQueryLod()` fragment-only compile error warning
  - `addon-development` — unsaved-state and script-editor control APIs, `EditorInspector.create_default_inspector()`, inspector-property context-menu slot, `_can_commit_handle_on_click()` gizmo virtual
  - `csharp-godot` — 4.7 C# binary/source compatibility-break table warning, `EnableGodotDotNetPreview` opt-in for the Godot.NET preview bindings
  - `gdextension` — `Object.is_class(StringName)` signature warning, refcount-aware init entry points, `object_cast_to` deprecation, godot-headers relocation, TextServer-as-GDExtension removal
  - `localization` — `_customize_strings()` POT virtual, `OptimizedTranslation.generate()` bool return, `Control.translation_context`, accessibility-string POT extraction
  - `assets-pipeline` — Mesh/MeshLibrary scene import types, `GLTFDocument.ImportFlags`, `EditorSceneFormatImporter` constants-moved warning, font-hinting import default warning, DDS R8/R8G8
  - `export-pipeline` — Android patch PCKs, SparsePCK index encryption, `PCKPacker.add_file_from_buffer()`, stale `runnable=` preset text fixed
  - `math-essentials` — `Basis.is_orthonormal()`
  - `multithreading` — threaded resource loading reliability fixes; pre-4.7 deadlock caveats dropped
  - `ai-navigation` — `map_get_closest_point_normal()` now-normalized warning
  - `save-load` — `JSON.stringify()` empty-dictionary compaction warning
- Pattern X relocations to keep every SKILL.md within the 16 KB budget created **16 new reference files** this release (physics-system ×4, animation-system ×3, input-handling ×2, plus 3d-essentials, ai-navigation, assets-pipeline, localization, particles-vfx, shader-basics, xr-development).
- Stale pre-4.7 notes corrected: "Godot 4.6 is in beta" caveats removed from `physics-system` §8 (Jolt) and `localization/references/csv-plural-context.md` — 4.6 has long been stable and 4.7 is out.
- README and agent routing text updated for 4.7.

> **Release notes:** Alignment release — no new skills (51 total). Repo-wide minimum stays at Godot 4.3+; all 4.7 content is additive and annotated `(Godot 4.7+)`. Experimental 4.7 subsystems (Vulkan raytracing, DrawableTexture2D) are mention-only. Validator baseline: 0 errors, 13 warnings (pre-existing `csharp-parity-accepted`). Every SKILL.md ≤ 16 KB.

## [1.10.1] - 2026-06-27

### Fixed

- **Codex install on Windows (#10):** added a Windows (PowerShell) variant for the `git clone` step in `.codex/INSTALL.md`. The previous bash-only command used `~/.codex/godot-prompter`, which on Windows clones into a folder literally named `~`; the new variant uses `"$env:USERPROFILE\.codex\godot-prompter"`, matching the PowerShell blocks already present for the later symlink steps.
- **Stale deprecated-API comment (#9):** corrected a comment in `skills/godot-debugging/references/performance-debugging.md` that still referenced the removed-in-4.0 `VisibilityNotifier3D`, though the code already used the correct `VisibleOnScreenNotifier3D`. Re-audited the report's full list: no remaining `VisibilityNotifier` usages, and all `TileMap` references are either `TileMapLayer` (4.3+), feature-area names, or explicit deprecation notices — no deprecated code.

> **Release notes:** Documentation-only patch. No skill content or API changes. 51 skills, every `SKILL.md` ≤ 16 KB. Repo-wide minimum stays at Godot 4.3+.

## [1.10.0] - 2026-06-17

### Added

- **3 new skills** (48 → 51):
  - `ability-system` — core gameplay systems: ability definition/cost/cooldown/cast lifecycle, buff/debuff stacks, stat-modifier pipeline, gameplay tags and conditions, HUD binding patterns. Pattern X with 3 references (`stat-modifiers`, `tags-and-conditions`, `ui-binding`); full C# parity throughout.
  - `limboai` *(Third-Party Addons)* — LimboAI v1.7.1 behavior tree + hierarchical state machine: `BTTask` authoring, BT runner setup, HSM state definitions and transitions, C++ GDExtension install, C# via module build. Reference: `hsm.md`.
  - `beehave` *(Third-Party Addons)* — Beehave v2.9.2 pure-GDScript behavior tree: `BeehaveTree` setup, action/condition node authoring, composite nodes, selector/sequence semantics, custom node extension. Reference: `custom-nodes.md`. GDScript-only by design (Beehave ships no C# API).
- New **Third-Party Addons** README category — first community-addon coverage in the repository; addon skills pin the addon version and install source.
- **Antigravity** added as a 6th supported platform: `references/antigravity-tools.md` tool mapping added to `using-godot-prompter`; bootstrap wiring in README and CLAUDE.md. Format verified; runtime install pending (no live Antigravity binary on the release machine).

### Changed

- Cross-ref wiring: `ability-system` back-linked from `component-system`, `event-bus`, `hud-system`, `resource-pattern`, `state-machine`; `limboai` and `beehave` linked from `ai-navigation` and `state-machine` (and cross-linked to each other); `ability-system` linked from `limboai`.
- Light agent edits: `godot-game-architect` and `godot-game-dev` routing notes extended to cover the new ability-system and third-party addon skills.

> **Release notes:** 3 new skills (48 → 51); first Third-Party Addons category in the repo. All addon content grounded against official LimboAI and Beehave repositories (cloned, version-pinned); see `docs/superpowers/notes/2026-06-17-limboai-research.md` and `docs/superpowers/notes/2026-06-17-beehave-research.md`. Validator baseline at release: 0 errors, 13 warnings (10 pre-existing `csharp-parity-accepted` + 3 new `csharp-parity-accepted` from `beehave` being GDScript-only, now allowlisted; 0 token-budget). Every SKILL.md ≤ 16 KB. 51 skills. Repo-wide minimum stays at Godot 4.3+.

## [1.9.0] - 2026-05-29

### Added

- **3 new skills** (45 → 48):
  - `gdextension` — native extensions with godot-cpp (C++) and gdext (Rust): when to go native, project/build setup, `ClassDB` class binding, the `.gdextension` file, compatibility rules, and GDScript/C# interop. References: `rust-gdext`, `debugging-native`.
  - `multithreading` — `WorkerThreadPool`, `Thread`/`Mutex`/`Semaphore`, `call_deferred` thread-safety, and threaded resource loading, with C# `System.Threading`/`Task` parity. Reference: `pitfalls`.
  - `mobile-development` — Android/iOS export & signing, app lifecycle, permissions, `JavaClassWrapper`/`AndroidRuntime` (Godot 4.4+), device features & safe area, mobile renderer/perf, and C#-on-mobile caveats. References: `plugins`, `iap-and-ads`, `crash-debugging`.
- New **Native & Performance** README category; `gdscript-advanced` added to the README catalog (was missing).

### Changed

- Wired the 3 new skills into the cross-reference graph (`export-pipeline`, `godot-optimization`, `assets-pipeline`, `csharp-godot`, `responsive-ui`, `input-handling`) and referenced them from the `godot-performance-profiler`, `godot-csharp-engineer`, and `godot-tools-engineer` agents.

### Fixed

- Corrected the v1.8.0 release notes: actual validator baseline was **0 errors, 10 warnings (0 token-budget)**, not 15/5; "down from 17 in v1.7.3" (not 22). Same correction applied to the C# parity-debt note (which now also names `gdscript-advanced` as accepted GDScript-only).

> **Release notes:** All three new skills are grounded in the official Godot docs (signatures, macros, and `.gdextension` file format verified against a local godot-docs clone; see `docs/superpowers/notes/2026-05-29-*-research.md`). Validator baseline at release: 0 errors, 10 warnings (all `csharp-parity-accepted` intentional GDScript-only; 0 token-budget). 48 skills, every `SKILL.md` ≤ 16 KB. Repo-wide minimum stays at Godot 4.3+ (features requiring newer engines — e.g. `JavaClassWrapper` at 4.4+, C# Android export at .NET 9 — are labeled inline).

## [1.8.0] - 2026-05-17

### Added

- **9 Codex sub-agents** under `.codex/agents/godot-prompter/`: `godot-animator`, `godot-code-reviewer`, `godot-csharp-engineer`, `godot-game-architect`, `godot-game-dev`, `godot-performance-profiler`, `godot-shader-author`, `godot-tools-engineer`, `godot-ui-designer`. Codex now reaches agent parity with the other platforms (PR #1, @hagonzalez95).

### Changed

- **C# parity initiative complete.** All 19 remaining deferred GDScript-only sections closed across 13 skills:
  - `camera-system` — 3 sections in references/ (camera3d-patterns, transitions, split-screen)
  - `dedicated-server` — 1 section in references/ (deployment)
  - `dependency-injection` — 1 SKILL.md + 1 references/ section (anti-patterns, testing-with-di)
  - `dialogue-system` — 3 sections in references/ (branching, UI, external-formats)
  - `event-bus` — 1 SKILL.md + 1 references/ section (typed-signal-parameters, testing)
  - `localization` — 1 SKILL.md section (locale-aware-formatting)
  - `player-controller` — 1 section restructured via Pattern X (Dash + WallJump moved to `references/common-movement-recipes.md` with proper class wrappers, gravity, and horizontal movement; the new reference file is the skill's first)
  - `resource-pattern` — 1 SKILL.md section (anti-patterns)
  - `save-load` — 2 sections in references/ (save-architecture, version-migration)
  - `scene-organization` — 1 SKILL.md section (node-communication-patterns)
  - `shader-basics` — 1 section in references/ (compositor-effects)
  - `state-machine` — 1 SKILL.md section (resource-based approach)
- `.opencode/INSTALL.md` — factual corrections from real-world usage: `/skills` slash command, corrected auto-update statement, accurate Windows/Unix log paths, link to OpenCode config docs (PR #2, @vasekhodina)
- `docs/superpowers/notes/2026-04-30-csharp-parity-debt.md` — 19 → 0 deferred sections; v1.8.0 progress block added; initiative marked complete

> **Release notes:** Validator baseline at release: 0 errors, 10 warnings (10 `csharp-parity-accepted` intentional GDScript-only; 0 `token-budget-exceeded`). Down from 17 in v1.7.3. **`csharp-parity-missing` warnings closed: 7 → 0** (all sections still in SKILL.md). Plus 12 silent closures in `references/<topic>.md` files (not validator-visible). Every skill in the repo now has matching C# for every GDScript example, except the intentional `csharp-parity-accepted` category (the `gdscript-patterns` skill, which is GDScript-by-design). The v1.5.0 C# parity initiative spanning v1.6.0–v1.8.0 is complete (33 → 0 deferred sections). Plus 9 new Codex sub-agents (platform parity for Codex). Repo-wide minimum stays at Godot 4.3+. Pre-release code review surfaced four `Important` issues (inverted null-check, broken `.Connect(methodGroup)`, missing gravity in Wall Jump C#, fictitious gdUnit4 API) — all fixed before tagging. Follow-up polish: 5 skills (`3d-essentials`, `ai-navigation`, `animation-system`, `multiplayer-basics`, `physics-system`) sit just under the 16 KB budget (15.97–16.36 KB) and remain Pattern X candidates for a future release.

## [1.7.3] - 2026-05-07

### Changed

- **v1.7.x token-budget initiative complete.** Final 4 over-budget skills restructured to **Pattern X** (core SKILL.md + `references/<topic>.md`):
  - `state-machine` (17.9 → 13.4 KB) — 1 reference: hierarchical-and-parallel
  - `export-pipeline` (17.7 → 13.9 KB) — 2 references: ci-cd-github-actions, distribution-itch-steam
  - `godot-brainstorming` (17.6 → 14.1 KB) — 1 reference: example-chest (worked Chest example + Design Output Format)
  - `event-bus` (16.8 → 14.7 KB) — 1 reference: testing
- 5 new reference files created across the 4 restructured skills
- `docs/superpowers/notes/2026-05-06-token-budget-debt.md` — 4 → 0 deferred skills; v1.7.3 progress block added; initiative marked complete

> **Release notes:** Validator baseline at release: 0 errors, 17 warnings (8 deferred C# parity + 9 accepted GDScript-only + 0 token-budget). Down from 22 in v1.7.2. **Token-budget warnings closed: 4 → 0.** Every SKILL.md in the repo is now ≤ 16 KB; the v1.7.0 token-budget initiative spanning v1.7.0–v1.7.3 is complete (35 skills restructured, 0 over budget). No new agents, no new skills — pure token-budget patch release closing the queue. Repo-wide minimum stays at Godot 4.3+.

## [1.7.2] - 2026-05-07

### Changed

- 10 more skills restructured to **Pattern X** (core SKILL.md + `references/<topic>.md`) — the next 10 heaviest from the v1.7.1 token-budget debt list:
  - `gdscript-patterns` (23 → 14.8 KB) — 5 references: export-annotations, common-idioms, variadic-functions, abstract-classes, super-in-virtual-methods
  - `tween-animation` (22 → 13.2 KB) — 4 references: property-tweener-modifiers, looping-and-signals, lifecycle, common-recipes
  - `save-load` (22 → 4.6 KB) — 4 references: configfile, json-saves, save-architecture, version-migration
  - `dependency-injection` (20 → 9.1 KB) — 5 references: autoloads, export-injection, service-locator, scene-injection, testing-with-di
  - `godot-testing` (20 → 9.3 KB) — 3 references: tdd-workflow, running-tests, testing-patterns
  - `camera-system` (20 → 10.8 KB) — 4 references: camera-zones, camera3d-patterns, transitions, split-screen
  - `resource-pattern` (19 → 9.3 KB) — 5 references: editor-integration, configuration-pattern, collections, sharing-vs-unique, saving-resources (v1.6.0 C# parity preserved in collections + sharing-vs-unique)
  - `csharp-signals` (19 → 9.4 KB) — 4 references: disconnecting, awaiting-signals, custom-signal-patterns, connecting-gdscript-signals
  - `responsive-ui` (18 → 8.6 KB) — 4 references: pixel-art-setup, dpi-scaling, mobile, adaptive-layouts
  - `math-essentials` (18 → 12.4 KB) — 3 references: curves-and-paths, random-numbers, game-math-recipes
- 41 new reference files created across the 10 restructured skills
- `docs/superpowers/notes/2026-05-06-token-budget-debt.md` — 14 → 4 deferred skills; v1.7.2 progress block added
- `docs/token-budget.md` — regenerated to reflect post-restructure state

> **Release notes:** Validator baseline at release: 0 errors, 22 warnings (8 deferred C# parity + 10 accepted GDScript-only + 4 token-budget). Down from 42 in v1.7.1. Token-budget warnings closed: 14 → 4 (10 restructures). Deferred parity warnings closed: 14 → 8 (6 incidental closures as sections moved to references with their already-paired C# blocks). Accepted GDScript-only: 14 → 10 (4 gdscript-patterns sections moved into references). Repo-wide minimum stays at Godot 4.3+. Only 4 skills remain over the 16 KB SKILL.md budget — the v1.7.0 token-budget initiative is 86% complete after this release.

## [1.7.1] - 2026-05-07

### Changed

- 10 more skills restructured to **Pattern X** (core SKILL.md + `references/<topic>.md`) — the next 10 heaviest from the v1.7.0 token-budget debt list:
  - `input-handling` (27 → 14.5 KB) — 4 references: mouse, gamepad, touch, action-rebinding
  - `dialogue-system` (26 → 10.6 KB) — 5 references: dialogue-manager, branching-and-conditions, ui-presentation, external-formats, variable-interpolation
  - `multiplayer-sync` (26 → 10.4 KB) — 4 references: interpolation, client-prediction, lag-compensation, bandwidth-optimization
  - `shader-basics` (26 → 15.5 KB) — 5 references: 2d-shader-recipes, 3d-shader-recipes, post-processing, compositor-effects, stencil-buffer
  - `godot-debugging` (26 → 12.0 KB) — 4 references: signal-tracing, performance-debugging, scene-tree-debugging, systematic-method
  - `particles-vfx` (25 → 14.2 KB) — 5 references: vfx-recipes, trails, subemitters, attractors-and-collision, flipbook-animation (v1.6.0 C# parity preserved in references)
  - `procedural-generation` (24 → 4.9 KB) — 4 references: noise-generation, bsp-dungeons, cellular-automata, wave-function-collapse
  - `multiplayer-basics` (24 → 15.6 KB) — 3 references: spawning-networked-objects, player-join-flow, disconnect-handling
  - `xr-development` (24 → 15.0 KB) — 5 references: controllers-and-input, hand-tracking, grabbing-objects, xr-ui, passthrough
  - `2d-essentials` (24 → 8.6 KB) — 5 references: tilemap, parallax, lights-and-shadows, 2d-particles, custom-drawing (v1.6.0 C# parity preserved inline for 2D Antialiasing)
- 44 new reference files created across the 10 restructured skills
- `docs/superpowers/notes/2026-05-06-token-budget-debt.md` — 24 → 14 deferred skills; v1.7.1 progress block added
- `docs/token-budget.md` — regenerated to reflect post-restructure state

> **Release notes:** Validator baseline at release: 0 errors, 42 warnings (14 deferred C# parity + 14 accepted GDScript-only + 14 token-budget). Down from 56 in v1.7.0. Token-budget warnings closed: 24 → 14 (10 restructures). Deferred C# parity warnings closed: 18 → 14 (4 incidental closures as sections moved to references along with their already-paired C# blocks). The 10 restructured skills now load 50-80% lighter into agent context. No new agents, no new skills — pure token-budget patch release. Repo-wide minimum stays at Godot 4.3+.

## [1.7.0] - 2026-05-06

### Added

- `scripts/count-tokens.mjs` — byte-count + tokenizer-mode token measurement for skills, references, and agents
- `docs/token-budget.md` — per-skill / per-agent token costs across Claude / GPT (cl100k_base)
- **gdscript-advanced** skill — production-grade GDScript depth (8 sections: performance idioms, metaprogramming, `@tool` lifecycle, async pitfalls, signal/Callable trade-offs, profiler-driven idioms, common pitfalls); GDScript-only by design via the new validator allowlist
- **godot-tools-engineer** agent — editor-plugin specialist (custom inspectors, gizmos, `@tool` scripts, plugin distribution); GDExtension explicitly out of scope (deferred to v1.8)
- `docs/superpowers/notes/2026-05-06-token-budget-debt.md` — debt-tracking note for the 24 over-budget skills not restructured this release
- **addon-development** — full C# parity for sections 4 / 6 / 7 / 8 (Custom Inspector Plugin, Custom Resource Editors, Gizmos, Testing Plugins); first skill in the repo with fully closed C# parity

### Changed

- `validate-skills.mjs` — three additions:
  - `[token-budget-exceeded]` warning at 16 KB SKILL.md ceiling
  - `[orphan-reference]` warning when a `references/*.md` file is not linked from its parent SKILL.md
  - `GDSCRIPT_ONLY_BY_DESIGN` allowlist re-categorizes parity warnings for `gdscript-patterns` / `gdscript-advanced` from `csharp-parity-missing` (deferred debt) to `csharp-parity-accepted` (intentional)
- 11 skills restructured using **Pattern X** (core SKILL.md + `references/<topic>.md`):
  - Top 10 ≥ 28 KB: `godot-optimization` (37 → 11.5 KB), `ai-navigation` (37 → 15.6), `animation-system` (35 → 16.0), `3d-essentials` (35 → 15.9), `physics-system` (34 → 15.9), `dedicated-server` (31 → 11.4), `hud-system` (28 → 11.2), `inventory-system` (28 → 13.5), `audio-system` (28 → 13.6), `godot-ui` (27 → 13.7)
  - `addon-development` (20 → 12.0 KB), restructured as part of the `godot-tools-engineer` dogfood
- `godot-game-dev`, `godot-game-architect` — extended routing notes to cover `godot-tools-engineer`
- `using-godot-prompter` — added explicit per-platform reference links (codex, copilot, cursor, gemini) to close orphan-reference warnings the new rule surfaces
- 50 new reference files created across 11 restructured skills + the new `gdscript-advanced` skill
- CONTRIBUTING.md release checklist now includes the `count-tokens.mjs --tokenizer --markdown` regeneration step before tagging

> **Release notes:** Validator baseline at release: 0 errors, 56 warnings (18 deferred C# parity + 14 accepted GDScript-only + 24 token-budget). Up from 32 in v1.6.0 because the new budget rule surfaces existing debt that was previously invisible. Deferred parity dropped one beyond the planned 19 because Pattern X moved at least one previously-flagged section into a `references/` file alongside its existing C# block, incidentally closing the gap. The 11 restructured skills now load 50-60% lighter into agent context. Repo-wide minimum stays at Godot 4.3+. Agent count: 8 → 9. Skill count: 44 → 45. addon-development becomes the first skill in the repo with fully closed C# parity.

## [1.6.0] - 2026-05-02

### Added

- **godot-animator** agent — animation graph specialist (AnimationPlayer vs AnimationTree decisions, blend trees, IKModifier3D family, BoneConstraint3D, retargeting); distinguishes animation FSM from gameplay FSM
- **godot-csharp-engineer** agent — C#-first specialist with two modes: user-code mode (idiomatic C#, `[Signal]` delegates, GC-light, Variant-light) and parity mode for closing this repo's own C# parity debt
- **godot-ui-designer** agent — Control-tree UI specialist (container-driven layout, Theme resources, responsive design, `TranslationServer` / RTL hooks, Godot 4.5+ FoldableContainer / Stacked Label Effects)
- **animation-system** — IKModifier3D solver comparison (cost / joint count / notes per solver), two-bone arm reach recipe with influence blending (CCDIK3D), foot placement on terrain recipe (FABRIK3D + raycast); GDScript and C# parity for both recipes (Godot 4.6+)

### Changed

- **godot-game-dev** and **godot-game-architect** agent descriptions — added routing notes deferring to `godot-csharp-engineer`, `godot-animator`, and `godot-ui-designer` for matching specialties
- C# parity sweep — closed 10 short / trivial deferred sections via `godot-csharp-engineer` in parity mode:
  - `2d-essentials` — 2D Antialiasing
  - `audio-system` — Spatial Audio (2D & 3D)
  - `component-system` — Wiring Components
  - `dedicated-server` — Headless Export
  - `dependency-injection` — The Problem
  - `localization` — Right-to-Left (RTL) Support
  - `particles-vfx` — Subemitters; Flipbook Animation (2D)
  - `resource-pattern` — Resource Collections; Sharing vs Unique

### Fixed

- `scripts/bump-version.mjs` — find the `godot-prompter` plugin in sibling marketplaces by name instead of by array index. Previously bumped the wrong plugin in multi-plugin marketplaces (e.g. skillsmith, where `logseq-brain` is at index 0).

> **Release notes:** Validator baseline at release: 0 errors, 32 warnings (down from 42 in v1.5.0). Agent count: 5 → 8. Skill count unchanged at 44. Repo-wide minimum stays at Godot 4.3+; new IK content is annotated `(Godot 4.6+)` since IKModifier3D requires 4.6.

## [1.5.0] - 2026-04-30

### Added

- **godot-shader-author** agent — shader specialist for canvas_item / spatial / particles / sky / fog shaders, post-processing, and Compositor effects
- **godot-performance-profiler** agent — profiler-driven bottleneck diagnosis with prescriptive fixes from godot-optimization
- `scripts/validate-skills.mjs` — validates SKILL.md frontmatter, cross-references, GDScript/C# parity, and implementation checklists; 0 errors at release (42 C# parity warnings documented as deferred debt)
- `scripts/bump-version.mjs` — bumps version across `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and sibling marketplace repos
- `.github/workflows/release.yml` — tag-triggered release workflow with marketplace PR automation
- **gdscript-patterns** — added Variadic Functions and Abstract Classes (Godot 4.5+)
- **physics-system** — added SoftBody3D Forces and Impulses; updated Jolt note for 4.6 stable; updated Physics Interpolation for 4.5 SceneTree restructure
- **shader-basics** — added Stencil Buffer Effects, SMAA Antialiasing, Shader Baker (Godot 4.5+)
- **3d-essentials** — added Specular Occlusion, Bent Normal Maps (4.5+); SSR overhaul, Glow/AgX controls (4.6+)
- **animation-system** — added BoneConstraint3D Modifiers (4.5+); IKModifier3D family (4.6+)
- **xr-development** — added 4.5+ features (D3D12 backend, foveated rendering, Render Models, SpaceWarp, visionOS export); 4.6+ features (OpenXR 1.1, Spatial Entities)
- **ai-navigation** — added Dedicated 2D Navigation Server (Godot 4.5+)
- **export-pipeline** — added Shader Baker and Windows Native Resource Editing (Godot 4.5+)
- **godot-ui** — added FoldableContainer and Stacked Label Effects (Godot 4.5+)
- **localization** — added Editor Locale Preview (4.5+); CSV Plural and Context Support (4.6+)

### Changed

- **gdscript-patterns** — added intent note (skill is GDScript-only by design)
- **godot-debugging** — added Implementation Checklist
- **using-godot-prompter** — added Related skills line and Implementation Checklist
- **multiplayer-sync** — standardized Related skills line to canonical form; added ai-navigation reciprocal cross-reference
- **camera-system** — added cross-references to math-essentials and tween-animation
- **player-controller** — added cross-references to 3d-essentials, animation-system, input-handling, and ai-navigation
- **state-machine** — added cross-references to animation-system and dialogue-system
- **input-handling** — added cross-reference to xr-development
- **responsive-ui** — added cross-references to input-handling and localization
- **tween-animation** — added cross-references to math-essentials and particles-vfx
- Cross-references audited across all 44 skills — added 21 reciprocal entries; standardized cross-reference formatting repo-wide

> **Release notes:** Validator baseline at release: 0 errors, 42 warnings (all C# parity — documented in `docs/superpowers/notes/2026-04-30-csharp-parity-debt.md`). Repo-wide minimum stays at Godot 4.3+; new content for 4.5/4.6 is additive with explicit version annotations.

## [1.4.1] - 2026-04-09

### Fixed

- **using-godot-prompter** — added coexistence section ensuring GodotPrompter skills are invoked even when another workflow plugin (e.g., Superpowers) drives the session
- **godot-brainstorming** — rewrote Step 4 to inject a `## GodotPrompter` section into project CLAUDE.md and annotate plan tasks with required skill references
- **godot-project-setup** — added CLAUDE.md GodotPrompter section to project setup checklist

## [1.4.0] - 2026-04-09

### Added

- **localization** skill — TranslationServer, CSV/PO translation files, locale switching, RTL support, pluralization
- **procedural-generation** skill — seeded randomness, FastNoiseLite, BSP dungeons, cellular automata caves, wave function collapse
- **xr-development** skill — OpenXR setup, XR controllers, hand tracking, physics grabbing, XR UI, passthrough, Meta Quest export
- 3 new skills bringing total from 41 to 44

### Changed

- **gdscript-patterns** — added `super()` in virtual methods section (Godot 4 breaking change from 3.x)
- **audio-system** — added interactive music streams (AudioStreamPlaylist, AudioStreamSynchronized, AudioStreamInteractive) and runtime WAV loading (Godot 4.3/4.4+)
- **ai-navigation** — added async navigation baking on background threads (Godot 4.4+)
- **animation-system** — added Animation Markers, LookAtModifier3D, SpringBoneSimulator3D, animation retargeting (Godot 4.3/4.4+)
- **shader-basics** — added Compositor effects and custom render passes (Godot 4.3+)
- **state-machine** — added hierarchical and parallel FSM patterns for complex characters
- **2d-essentials** — added TileMap node deprecation notice (use TileMapLayer instead)
- **physics-system** — added Jolt Physics as default recommendation for new 3D projects (Godot 4.4+)

## [1.3.0] - 2026-04-08

### Added

- **input-handling** skill — InputEvent system, Input Map actions, controllers/gamepads, mouse/touch, action rebinding, input architecture
- **3d-essentials** skill — materials, lighting, shadows, environment, global illumination, fog, LOD, occlusion culling, decals, MultiMesh, renderer comparison
- **tween-animation** skill — Tween class, easing/transitions, chaining/parallel, property/method/callback tweeners, common UI and gameplay motion recipes
- **particles-vfx** skill — GPUParticles2D/3D, ParticleProcessMaterial, emission shapes, subemitters, trails, attractors, collision, turbulence, flipbook animation, VFX recipes
- **gdscript-patterns** skill — static typing, await/coroutines, lambdas, match/pattern matching, export annotations, inner classes, common GDScript idioms
- **math-essentials** skill — vectors, transforms, interpolation (lerp/slerp/move_toward/smoothstep), curves/paths, random number generation, common game math recipes
- **assets-pipeline** skill — image import/compression, 3D scene import with naming conventions, audio formats, resource formats (.tres/.res), threaded loading
- 7 new skills bringing total from 34 to 41

## [1.2.0] - 2026-04-07

### Added

- **physics-system** skill — RigidBody2D/3D, StaticBody, Area2D/3D, raycasting, collision shapes/layers, Jolt physics, physics interpolation, ragdolls, SoftBody3D, and troubleshooting
- **2d-essentials** skill — TileMaps, parallax scrolling, 2D lights and shadows, 2D particles, custom drawing, 2D meshes, antialiasing, and pixel-perfect snapping
- Superpowers plugin attribution in README
- Author and support section in README
- Bidirectional cross-references across all related skills

## [1.1.0] - 2026-04-06

### Added

- **animation-system** skill — AnimationPlayer, AnimationTree, blend trees, state machines, sprite animation, and code-driven animation
- **shader-basics** skill — Godot shader language, visual shaders, common visual recipes, and post-processing effects
- **audio-system** skill — audio buses, AudioStreamPlayer, spatial audio, music management, SFX pooling, and dynamic mixing
- Release process documentation in CONTRIBUTING.md
- GitHub Sponsors and Buy Me a Coffee funding configuration

### Removed

- Trial project test files (replaced by real Godot project validation)

## [1.0.0] - 2026-04-06

### Added

- 32 skills covering Godot 4.3+ development (GDScript + C#)
- **Core/Process:** godot-project-setup, godot-brainstorming, godot-code-review, godot-debugging, godot-testing, using-godot-prompter
- **Architecture:** scene-organization, state-machine, event-bus, component-system, resource-pattern, dependency-injection
- **Gameplay:** player-controller, animation-system, audio-system, inventory-system, dialogue-system, save-load, ai-navigation, camera-system
- **Rendering/Visual:** shader-basics
- **UI/UX:** godot-ui, responsive-ui, hud-system
- **Multiplayer:** multiplayer-basics, multiplayer-sync, dedicated-server
- **Build/Deploy:** export-pipeline, godot-optimization, addon-development
- **C#:** csharp-godot, csharp-signals
- Cross-references between related skills
- 3 specialized agents: godot-game-architect, godot-game-dev, godot-code-reviewer
- Claude Code plugin structure (.claude-plugin/plugin.json)
- Platform support: Claude Code, Copilot CLI, Gemini CLI, Codex, Cursor, OpenCode
- Trial project validation (13/15 PASS, 2/15 PARTIAL)
- Agent integration test plan
