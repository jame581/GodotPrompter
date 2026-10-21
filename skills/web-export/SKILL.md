---
name: web-export
description: Use when shipping a Godot game to the browser — Web export preset options, threads vs no-threads and COOP/COEP headers, hosting on itch.io or your own server, PWA, JavaScriptBridge, user:// persistence, audio and input limits, and load size
---

# Web Export in Godot 4.3+

Ship a Godot 4.x game as HTML5/WebAssembly. This covers what is different from a desktop export: the renderer, threading and server headers, browser interop, persistence, and the input and audio rules browsers enforce. All examples target Godot 4.3+ with no deprecated APIs.

**C# projects cannot export to Web in Godot 4** — the .NET editor refuses the export (still true in 4.7.2). The code in this skill is GDScript only for that reason; a C# game that needs a browser build must be ported to GDScript or stay on Godot 3.

> **Related skills:** **export-pipeline** for presets, CLI export and CI/CD, **web-services** for HTTP and WebSockets from the browser, **rendering-pipeline** for what the Compatibility renderer can and cannot do, **audio-system** for buses and playback, **save-load** for save formats.

---

## 1. What Changes on Web

| Area | On Web |
|---|---|
| Renderer | Always **Compatibility** (WebGL 2) — `rendering/renderer/rendering_method.web` defaults to `gl_compatibility`. No SDFGI, VoxelGI, volumetric fog, SSR, FSR, or screen-space AA |
| Scripting | GDScript and GDExtension only. No C# |
| Threads | Optional. Off by default; turning them on needs special server headers (Section 3) |
| Audio | Sample playback through the Web Audio API by default — `AudioEffect`s on buses do not apply (Section 6) |
| Files | `user://` lives in the browser's IndexedDB; there is no access to the player's disk except downloads and file-picker uploads |
| Networking | HTTP via the browser's `fetch` (CORS applies), WebSockets and WebRTC only — no raw TCP/UDP, so no ENet |
| Processes | No `OS.execute()`, `OS.create_process()`, or quitting the tab |

Design for this from the start if web is a primary target. Porting a Forward+ game late means re-lighting it.

---

## 2. The Export Preset

Add a **Web** preset in **Project → Export** (export templates must be installed). The options that matter:

| Option | Default | Set it when |
|---|---|---|
| `variant/thread_support` | `false` | You need threads and can serve COOP/COEP headers (Section 3) |
| `variant/extensions_support` | `false` | The project uses GDExtension (needs the extension's web build) |
| `vram_texture_compression/for_desktop` | `true` | S3TC/BPTC textures for desktop browsers |
| `vram_texture_compression/for_mobile` | `false` | Turn on for phone browsers (ETC2/ASTC); costs a second texture set in the PCK |
| `html/canvas_resize_policy` | Adaptive | `None` / `Project` when embedding in a fixed-size page element |
| `html/focus_canvas_on_start` | `true` | Keep on so keyboard input works without a first click |
| `html/experimental_virtual_keyboard` | `false` | Mobile browsers need an on-screen keyboard for `LineEdit` |
| `html/head_include` | empty | Extra `<head>` tags — analytics, meta tags, fonts |
| `html/custom_html_shell` | empty | Replace the whole loading page with your own template |
| `progressive_web_app/enabled` | `false` | Installable, offline-capable build (Section 4) |
| `threads/emscripten_pool_size`, `threads/godot_pool_size` (Godot 4.5+) | 8, 4 | Only shown with thread support; lower them to reduce memory |

The output is an `.html` page plus `.js`, `.wasm`, `.pck`, and audio worklet files — upload all of them together. The default filename for the page should be `index.html` for most hosts.

CLI export works as on desktop: `godot --headless --export-release "Web" build/web/index.html`.

---

## 3. Threads or No Threads

Threaded builds use `SharedArrayBuffer`, which browsers only enable on a **cross-origin isolated** page. The server must send both headers on every file of the export (the page, its scripts, and the worker scripts):

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

| | No threads (default, Godot 4.3+) | Threads |
|---|---|---|
| Hosting | Any static host | Needs the two headers above, or the PWA workaround |
| Audio | Sample playback, low latency | Sample playback by default; stream mode crackles more |
| Embeds, ads, third-party iframes | Work | Break unless they also send CORP/CORS headers (`require-corp` blocks them) |
| `WorkerThreadPool` | Tasks run inline on the main thread, so heavy work stalls frames | Real background threads |
| `Thread` | **`start()` returns `OK` but the function never runs** | Real background threads |
| Feature tag | `nothreads` | `threads` |

**Default to no threads.** Turn them on only when profiling shows a real need (heavy procedural generation, physics on background threads), and you control the server or use a host that sets the headers. Code that must behave differently can check `OS.has_feature("threads")` — and any `Thread`-based code (level generation, loaders) **must**, or it silently does nothing on the default build. `WorkerThreadPool` is the portable choice.

Godot's own **Remote Debug → Run in Browser** server sends the headers, so a threaded build can work locally and fail once uploaded. Test on the real host.

---

## 4. Hosting

| Host | What to do |
|---|---|
| **itch.io** | Upload a ZIP with `index.html` at its root, set the project kind to HTML. For threaded builds tick **SharedArrayBuffer support** in the embed options |
| **GitHub Pages, plain static hosts** | No custom headers: ship the no-threads build, or enable PWA with `progressive_web_app/ensure_cross_origin_isolation_headers` (default `true`) so a service worker adds the headers after the first load |
| **Your own server / CDN** | Send COOP/COEP for threads, serve `.wasm` as `application/wasm`, and precompress `.wasm` and `.pck` with Brotli or gzip |

Server config snippets (nginx, Apache, Netlify, Cloudflare Pages), compression, and cache headers: [references/hosting.md](references/hosting.md).

The **PWA** option also makes the game installable and playable offline. After you publish an update, `JavaScriptBridge.pwa_needs_update()` turns `true` (and `pwa_update_available` is emitted); call `JavaScriptBridge.pwa_update()` to reload into the new version — it reloads every open tab.

---

## 5. Detecting the Platform and Talking to JavaScript

<!-- csharp-parity: n/a — C# projects cannot export to Web in Godot 4, so web-only code paths are GDScript only -->

Use feature tags, not `OS.get_name()` string checks:

```gdscript
func _ready() -> void:
    if OS.has_feature("web"):
        $QuitButton.hide() # A tab cannot be closed from inside the game.
        if OS.has_feature("web_ios") or OS.has_feature("web_android"):
            _use_touch_controls()
```

`web_android`, `web_ios`, `web_macos`, `web_windows`, and `web_linuxbsd` read the browser's user agent. Use them to pick controls or quality, never as a security check.

`JavaScriptBridge` calls into the page. It exists on every platform but only does something on Web, so guard calls with `OS.has_feature("web")`.

```gdscript
var _on_resize_cb: JavaScriptObject # Keep a reference, or the callback is collected and never fires.


func _ready() -> void:
    if not OS.has_feature("web"):
        return
    var window := JavaScriptBridge.get_interface("window")
    _on_resize_cb = JavaScriptBridge.create_callback(_on_browser_resize)
    window.addEventListener("resize", _on_resize_cb)
    var lang: String = JavaScriptBridge.eval("navigator.language", true)
    print("Browser language: ", lang)


func _on_browser_resize(args: Array) -> void:
    print("Browser resized: ", args[0].type)


func export_save_file(data: PackedByteArray) -> void:
    # Call from an input event (button press): browsers may block downloads that aren't.
    JavaScriptBridge.download_buffer(data, "savegame.dat")
```

Callbacks receive one `Array` holding the JavaScript arguments. `eval()` runs arbitrary JavaScript — never pass it strings built from player input or network data.

Uploads, calling functions defined in your HTML shell, and sending events to the embedding page: [references/javascript-bridge.md](references/javascript-bridge.md).

---

## 6. Audio

- **Browsers block audio until the player interacts with the page.** Start the game behind a "Click to play" screen (or the default loading page's click) so the first sound isn't swallowed.
- `audio/general/default_playback_type.web` is **Sample**: sounds are handed to the Web Audio API for low latency. `AudioEffect`s on buses (reverb, filters, `AudioEffectCapture`, `AudioEffectSpectrumAnalyzer`) do not apply in this mode. Forcing **Stream** restores effects at the cost of latency and crackling — test before choosing it.
- Prefer Ogg Vorbis for music and short WAV for SFX; MP3 also works. See **audio-system** and **assets-pipeline**.

---

## 7. Saving and Persistence

`user://` is backed by IndexedDB and synced when a file is closed. `ConfigFile`, `FileAccess`, and `ResourceSaver` work unchanged.

<!-- csharp-parity: n/a — C# projects cannot export to Web in Godot 4, so web-only code paths are GDScript only -->

```gdscript
func save_settings(cfg: ConfigFile) -> void:
    cfg.save("user://settings.cfg") # Flushed to IndexedDB when the file closes.
    if OS.has_feature("web") and not OS.is_userfs_persistent():
        $SaveWarning.text = "Saves won't survive closing this tab (private browsing or storage blocked)."
        $SaveWarning.show()
```

- **Private browsing, storage-blocking settings, and cleared site data wipe `user://`.** Check `OS.is_userfs_persistent()` and tell the player.
- Storage is **per origin**: the same game on another domain (or a new itch.io upload URL) starts with empty saves. Offer export/import of save files (Section 5) for anything players would hate to lose.
- Browsers may evict storage under disk pressure. For accounts and cross-device saves use a backend — see **web-services**.

---

## 8. Input, Window, and Performance Limits

| Behavior | Rule |
|---|---|
| Fullscreen, mouse capture, pointer lock, clipboard writes | Only work from inside an input event handler (a click or key press), not from `_ready()` or a timer |
| Keyboard focus | Lost when the player clicks outside the canvas; keep `html/focus_canvas_on_start` on and show a "click to focus" hint |
| Browser shortcuts | `Ctrl+W`, `Ctrl+T`, `F11` and similar may be handled by the browser, not the game — don't bind core actions to them |
| Frame rate | The browser drives frames with `requestAnimationFrame`; background tabs are throttled or paused, so pause the game on `NOTIFICATION_WM_WINDOW_FOCUS_OUT` |
| Memory | WebAssembly memory is limited; large levels and uncompressed textures crash low-end and mobile browsers first |
| Load size | Every megabyte of `.pck` and `.wasm` is downloaded before play — trim unused assets and compress on the server |

Load-size checklist (export filters, texture formats, custom template builds without unused modules): [references/hosting.md](references/hosting.md#reducing-download-size).

---

## 9. Common Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Blank page, console says `SharedArrayBuffer is not defined` | Threaded build on a server without COOP/COEP | Export with thread support off, or add the headers |
| Works locally, fails after upload | The editor's test server sends headers your host doesn't | Test on the real host; ship no-threads |
| Opening `index.html` from disk fails | Browsers block WebAssembly from `file://` | Serve over HTTP, even locally |
| Game looks flat or dark compared to desktop | Compatibility renderer drops advanced lighting | Bake lightmaps; design for Compatibility (see **rendering-pipeline**) |
| No sound until the second click | Autoplay policy | Click-to-play screen before the first sound |
| Reverb/filters missing | Sample playback ignores bus effects | Accept it, or use Stream playback for that project |
| Saves gone next visit | Private window or new origin | Warn via `is_userfs_persistent()`; offer save export |
| HTTP requests fail only in the browser | CORS or mixed content | Fix server headers; HTTPS/WSS only (see **web-services**) |
| `request_fullscreen` / mouse capture ignored | Not called from an input event | Trigger it from a button press |
| Web export fails with "not supported in Godot 4 when using C#/.NET" | .NET editor builds cannot target Web | Port to GDScript, or export a GDScript-only project from the standard editor |

---

## 10. Checklist

- [ ] Project designed and lit for the Compatibility renderer
- [ ] No C# in the project; GDExtension only with `variant/extensions_support` and web binaries
- [ ] Thread support off unless needed and the host sends COOP/COEP (or the PWA service worker handles it)
- [ ] `vram_texture_compression/for_mobile` enabled if phone browsers are a target
- [ ] Tested on the actual host, not only the editor's Run in Browser server
- [ ] Click-to-play screen before audio starts; game pauses when the tab loses focus
- [ ] Fullscreen, mouse capture and downloads triggered from input events
- [ ] `OS.is_userfs_persistent()` checked; players can export important saves
- [ ] Quit button hidden on Web; platform checks use `OS.has_feature("web")`
- [ ] `JavaScriptBridge` callbacks stored in member variables; `eval()` never fed untrusted strings
- [ ] `.wasm` served as `application/wasm`; `.wasm` and `.pck` compressed on the server
- [ ] Download size checked; unused assets excluded from the Web preset
