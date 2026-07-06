---
name: export-pipeline
description: Use when exporting and distributing Godot games — export presets, platform settings, CI/CD with GitHub Actions
---

# Export Pipeline in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, C# follows where applicable.

> **Related skills:** **godot-testing** for CI/CD test integration, **godot-optimization** for pre-export performance checks, **responsive-ui** for platform-specific resolution settings, **mobile-development** for Android/iOS export specifics.

---

## 1. Export Presets

### Creating Presets in the Editor

Open **Project → Export**, click **Add…**, and select the target platform. Each preset maps to one entry in `export_presets.cfg`. You can create multiple presets for the same platform (e.g., a debug build and a release build for Windows).

Required one-time setup per platform:
- **Export Templates** must be downloaded via **Editor → Export Templates**.
- Platform-specific toolchains (Android SDK, Xcode, etc.) must be installed separately.

### export_presets.cfg

Godot writes `export_presets.cfg` to the project root. Commit this file — it is safe and contains no secrets. Secrets (codesigning passwords, keystore passwords) must **never** be committed; use environment variables instead.

Example preset structure (Windows release):

```ini
[preset.0]

name="Windows Desktop"
platform="Windows Desktop"
runnable=true
dedicated_server=false
custom_features=""
export_filter="all_resources"
include_filter=""
exclude_filter=""
export_path="build/windows/MyGame.exe"
encryption_include_filters=""
encryption_exclude_filters=""
encrypt_pck=false
encrypt_directory=false

[preset.0.options]

custom_template/debug=""
custom_template/release=""
debug/export_console_wrapper=1
binary_format/embed_pck=true
texture_format/s3tc_bptc=true
texture_format/etc2_astc=false
binary_format/architecture="x86_64"
codesign/enable=false
codesign/identity=""
codesign/password=""
codesign/timestamp=true
codesign/timestamp_server_url=""
codesign/digest_algorithm=1
codesign/description=""
codesign/custom_options=PackedStringArray()
application/icon=""
application/console_wrapper_icon=""
application/icon_interpolation=4
application/file_version=""
application/product_version=""
application/company_name=""
application/product_name=""
application/file_description=""
application/copyright=""
application/trademarks=""
application/export_angle=0
application/export_d3d12=0
application/d3d12_agility_sdk_multiarch=true
ssh_remote_deploy/enabled=false
ssh_remote_deploy/host="user@host_ip"
ssh_remote_deploy/port="22"
ssh_remote_deploy/extra_args_ssh=""
ssh_remote_deploy/extra_args_scp=""
ssh_remote_deploy/run_script="#!/usr/bin/env bash\nexport DISPLAY=:0\n\"{temp_dir}/{exe_name}\" {cmd_args}"
ssh_remote_deploy/cleanup_script="#!/usr/bin/env bash\nkill $(pgrep -x -f \"{temp_dir}/{exe_name} {cmd_args}\")\nrm -rf \"{temp_dir}\""
```

> Godot regenerates `export_presets.cfg` on every editor save. Do not hand-edit it while the editor is open.

> ⚠️ **Changed in Godot 4.7:** The "runnable" flag moved out of export presets — `runnable=` (shown in the example above for 4.3–4.6) is no longer a per-preset property in `export_presets.cfg`; the editor now tracks which preset is runnable separately. Don't be surprised when the line disappears from the file after saving in a 4.7 editor. See [GH-114930](https://github.com/godotengine/godot/pull/114930).

> **Godot 4.7+:** Sparse PCK exports (patch packs) support encrypting the file index, complementing the existing `encrypt_pck` / `encrypt_directory` preset options. ([GH-113920](https://github.com/godotengine/godot/pull/113920))

---

## 2. Platform-Specific Settings

| Platform  | Key Setting / Consideration                                                                                                                      |
|-----------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| **Windows** | Set `application/icon` (.ico file). Codesigning requires a `.pfx` certificate; set `codesign/enable=true` and supply `codesign/identity` + `codesign/password` via env vars. Without codesigning, Windows SmartScreen will warn users. |
| **Linux**   | No codesigning required. After export, run `chmod +x MyGame.x86_64` on the binary. Ship as a tarball or AppImage for distribution. |
| **macOS**   | Requires notarization for Gatekeeper to allow launch without warning. Set `codesign/enable=true` and `notarization/enable=true`. Provide the `codesign/identity` (Apple Developer ID). The `Info.plist` entries (bundle ID, version, display name, privacy usage descriptions) are set under `application/*` options in the preset. Notarization is done post-export via `xcrun notarytool`. |
| **Web**     | Requires `SharedArrayBuffer` for multi-threading — the web server must send `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers. Disable threads (`rendering/threads/thread_model=0`) if hosting on a server you cannot configure. Exported output is a `.html` + `.js` + `.wasm` + `.pck` bundle. |
| **Android** | Requires a keystore for release signing. Set `keystore/release` to the `.keystore` path and supply `keystore/release_user` + `keystore/release_password` via env vars. Declare permissions in the preset under `permissions/*`. Set `package/unique_name` to a reverse-DNS string (e.g., `com.studio.mygame`). |
| **iOS**     | Requires a valid Apple provisioning profile (`.mobileprovision`). Set `application/bundle_identifier`, `codesign/identity`, and `application/provisioning_profile`. Distribution builds require an App Store distribution certificate. |

---

## 3. Export from CLI

Run Godot in headless mode to export without opening the GUI. This is the standard approach for CI/CD.

### Release Export

```bash
godot --headless --export-release "Windows Desktop" build/windows/MyGame.exe
```

### Debug Export

```bash
godot --headless --export-debug "Windows Desktop" build/windows/MyGame.exe
```

### Export .pck Only (no executable)

Use `--export-pack` when you only want to ship updated game data alongside a fixed engine binary (e.g., DLC or patch distribution):

```bash
godot --headless --export-pack "Windows Desktop" build/windows/MyGame.pck
```

> **Godot 4.7+:** When exporting patch PCKs for Android, an APK or AAB can be provided as the base pack, extending PCK-patching workflows to Android builds. ([GH-116553](https://github.com/godotengine/godot/pull/116553))

### Packing In-Memory Data (Godot 4.7+)

`PCKPacker.add_file_from_buffer(target_path, data, encrypt = false)` packs a `PackedByteArray` straight into a PCK — no temp file on disk — which is handy when generating patch content from a build script:

```gdscript
var build_info: String = "v" + ProjectSettings.get_setting("application/config/version", "dev")
var packer := PCKPacker.new()
packer.pck_start("user://patch_1.pck")
packer.add_file_from_buffer("res://data/build_info.txt", build_info.to_utf8_buffer())
packer.flush()
```

```csharp
string buildInfo = "v" + ProjectSettings.GetSetting("application/config/version", "dev").AsString();
var packer = new PckPacker();
packer.PckStart("user://patch_1.pck");
packer.AddFileFromBuffer("res://data/build_info.txt", buildInfo.ToUtf8Buffer());
packer.Flush();
```

### Key CLI flags

| Flag | Purpose |
|------|---------|
| `--headless` | No display server; required for server/CI environments |
| `--export-release "Preset Name" path` | Export using release template |
| `--export-debug "Preset Name" path` | Export using debug template |
| `--export-pack "Preset Name" path` | Export .pck resource pack only |
| `--quit-after N` | Quit after N milliseconds (rarely needed for export) |

> The preset name in the CLI flag must match `name=` in `export_presets.cfg` exactly, including capitalisation and spaces.

---

## 4. CI/CD with GitHub Actions

Run `godot --headless --export-release` inside a GitHub Actions matrix that builds Windows, Linux, and Web artifacts on every push and tagged release. Use [`chickensoft-games/setup-godot@v2`](https://github.com/chickensoft-games/setup-godot) to install the engine + export templates (set `use-dotnet: true` for C# projects). Inject the version from `git describe` before export so `application/config/version` is correct in the binary.

See [references/ci-cd-github-actions.md](references/ci-cd-github-actions.md) for the full `.github/workflows/export.yml` with matrix presets, artifact upload, and Linux executable bit handling.

---

## 5. Versioning

### Reading the Version at Runtime

Store the version string in **Project → Project Settings → Application → Config → Version**. Then read it anywhere:

```gdscript
# version_label.gd
extends Label

func _ready() -> void:
    text = "v" + ProjectSettings.get_setting("application/config/version", "dev")
```

```csharp
// VersionLabel.cs
using Godot;

public partial class VersionLabel : Label
{
    public override void _Ready()
    {
        Text = "v" + ProjectSettings.GetSetting("application/config/version", "dev").AsString();
    }
}
```

### Auto-Versioning from Git Tags

Tag your release commit, then inject the version at export time. The CI workflow above does this via `sed`, but you can also run a pre-export GDScript tool (EditorScript) if you prefer to keep it in-engine:

```gdscript
# tools/inject_version.gd  — run with: godot --headless --script tools/inject_version.gd
@tool
extends EditorScript

func _run() -> void:
    var git_output: Array = []
    var exit_code := OS.execute("git", ["describe", "--tags", "--always", "--dirty"], git_output)
    if exit_code != 0:
        push_error("inject_version: git describe failed")
        return

    var version: String = (git_output[0] as String).strip_edges()
    ProjectSettings.set_setting("application/config/version", version)
    var err := ProjectSettings.save()
    if err != OK:
        push_error("inject_version: failed to save project.godot — error %d" % err)
    else:
        print("inject_version: set version to '%s'" % version)
```

Run it as part of a CI step before the export step:

```bash
godot --headless --script tools/inject_version.gd
godot --headless --export-release "Windows Desktop" build/windows/MyGame.exe
```

### Version Tag Convention

Use [Semantic Versioning](https://semver.org/) tags: `v1.2.3`. `git describe` then produces `v1.2.3-4-gabcdef` for commits after a tag, giving you fully traceable builds.

---

## 6. Distribution: itch.io and Steam

**itch.io** uses the [Butler](https://itch.io/docs/butler/) CLI: `butler push build/windows/ my-studio/my-game:windows --userversion "$VERSION"`. Channel names follow a convention (`windows`, `linux`, `macos`, `web`, `android`). In CI, the [`Ayowel/butler-to-itch@v1`](https://github.com/Ayowel/butler-to-itch) action pushes all artifacts at once; store the API key as the `BUTLER_API_KEY` secret.

**Steam** requires three pieces: the Steamworks SDK (non-redistributable, keep out of public repos), the [GodotSteam](https://godotsteam.com/) addon for engine bindings, and depot configurations driven by `steamcmd +run_app_build app_build.vdf`. Steam integration is outside the export pipeline itself.

See [references/distribution-itch-steam.md](references/distribution-itch-steam.md) for full butler install instructions, channel naming table, the `deploy-itch` GitHub Actions job, and the Steam component breakdown.

---

## 7. Shader Baker (Godot 4.5+)

Godot 4.5 introduces the **Shader Baker**, an export-time tool that pre-compiles shaders for the target platform. Without it, shaders compile at runtime on first use, causing visible hitches when new materials are first rendered in-game. The Shader Baker eliminates this stutter by doing the work at export time.

### Enabling

In **Project → Export**, open a preset and locate the **Shader Baker** section. Enable it and configure target backends (Vulkan, D3D12, Metal, GLES3) as needed.

> The Shader Baker increases export build time but has no effect on game download size or runtime memory. The pre-compiled cache is embedded in the `.pck` file.

### Impact by Platform

| Platform | Backend | Benefit |
|----------|---------|---------|
| macOS / Apple Silicon | Metal | Up to 20x load time reduction on complex shader graphs |
| Windows | D3D12 | Eliminates D3D12 pipeline state compilation stalls |
| Mobile (Android/iOS) | GLES3 | Faster first-render on mid-range hardware |
| Linux / Windows | Vulkan | Moderate improvement; Vulkan caches vary by driver |

### CI Workflow Note

The Shader Baker runs automatically when exporting via the editor GUI or CLI (`--export-release`). No extra steps are needed in CI — it is controlled by the preset configuration, not a separate CLI flag.

```bash
# Shader Baker runs as part of normal export (no extra flag needed).
godot --headless --export-release "Windows Desktop" build/windows/MyGame.exe
```

---

## 8. Windows Export — Native Resource Editing (Godot 4.5+)

Before Godot 4.5, modifying `.exe` metadata (version info, icon, copyright, company name) on Windows required the external `rcedit` tool. Godot 4.5 handles all of this natively at export time — no `rcedit` download or configuration needed.

### What is Edited Natively

| Export Preset Field | Effect on .exe |
|---------------------|---------------|
| `application/file_version` | File version shown in Properties → Details |
| `application/product_version` | Product version |
| `application/company_name` | Company name |
| `application/product_name` | Product name |
| `application/file_description` | Description |
| `application/copyright` | Legal copyright |
| `application/icon` | `.ico` file embedded as the executable icon |

### Setup

1. Open **Project → Export** → Windows Desktop preset.
2. Fill in the `application/*` fields under **Application** in the preset options.
3. Export normally — Godot writes the metadata into the `.exe` directly.

> **Removing rcedit from CI:** If your project previously downloaded `rcedit` in CI and called it as a post-export step, you can remove that step. The fields in the export preset replace it entirely for Godot 4.5+.

---

## 9. Checklist

- [ ] Export templates downloaded for the target Godot version (Editor → Export Templates)
- [ ] `export_presets.cfg` committed to version control
- [ ] Secrets (keystore passwords, codesign passwords, API keys) stored in env vars or CI secrets, never in the file
- [ ] Each preset has a unique `name=` that matches the CLI `--export-release` argument exactly
- [ ] Output directories created before the export command runs (`mkdir -p`)
- [ ] Linux binary marked executable after export (`chmod +x`)
- [ ] `application/config/version` in project.godot is populated at export time from a git tag
- [ ] Web export: hosting server sends `COOP` + `COEP` headers if threads are enabled
- [ ] Android release preset uses a signed keystore, not the debug keystore
- [ ] macOS builds intended for distribution are codesigned and notarized
- [ ] Artifacts are uploaded per-platform in CI so individual platform builds can be downloaded
- [ ] itch.io channels follow the naming convention (windows, linux, macos, web, android)
- [ ] Butler API key stored as a CI secret, not hardcoded
- [ ] Steam depot configs are kept out of public repositories
- [ ] Shader Baker enabled in export presets for macOS, D3D12, and mobile targets (Godot 4.5+)
- [ ] Windows `.exe` metadata (version, icon, company name) set in the export preset — rcedit no longer required (Godot 4.5+)
