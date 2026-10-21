# Research notes: web-services, rendering-pipeline, web-export (2026-10-21)

Facts behind the three new skills, checked against the engine source at the `4.3-stable` and
`4.7.2-stable` tags (and `4.4`/`4.5`/`4.6-stable` where a version boundary mattered).

## Sources and findings

| Claim | Source |
|---|---|
| Web preset options and defaults: `variant/thread_support` false, `vram_texture_compression/for_desktop` true, `for_mobile` false, `html/canvas_resize_policy` Adaptive, `html/focus_canvas_on_start` true, `progressive_web_app/ensure_cross_origin_isolation_headers` true | `platform/web/export/export_plugin.cpp` `get_export_options()`, 4.3 and 4.7.2 |
| `threads/emscripten_pool_size` (8) and `threads/godot_pool_size` (4) exist from 4.5, shown only with thread support | same file at 4.4/4.5/4.6/4.7.2; `get_export_option_visibility()` |
| Feature tags `threads`/`nothreads`, `web_extensions`/`web_noextensions`, `wasm32`, `s3tc`/`etc2` | `get_preset_features()` |
| `web_android`, `web_ios`, `web_macos`, `web_windows`, `web_linuxbsd` read the user agent | `platform/web/js/libs/library_godot_os.js`, present at 4.3 |
| C# cannot export to Web: "Exporting to Web is currently not supported in Godot 4 when using C#/.NET" | `export_plugin.cpp` under `MODULE_MONO_ENABLED`, 4.7.2 |
| The editor's Run in Browser server sends COOP/COEP | `platform/web/export/editor_http_server.cpp` |
| PWA service worker injects isolation headers (`___GODOT_ENSURE_CROSSORIGIN_ISOLATION_HEADERS___`) | `export_plugin.cpp` `_build_pwa()` |
| `user://` synced to IndexedDB when a file closes | `platform/web/os_web.cpp` `file_access_close_callback` |
| `JavaScriptBridge` exists on every platform; stubs return null off-Web | `platform/web/api/api.cpp` |
| `is_js_buffer`, `js_buffer_to_packed_byte_array` are 4.4+ | `doc/classes/JavaScriptBridge.xml`, 4.3 vs 4.4 |
| `audio/general/default_playback_type.web` = Sample; AudioEffects unsupported in Sample | `doc/classes/ProjectSettings.xml` |
| `HTTPRequest.cancel_request()` does not emit `request_completed` | `scene/main/http_request.cpp`, 4.7.2 |
| JSON numbers parse via `String.to_float()` | `doc/classes/JSON.xml` |
| `HTTPClient.get_body_size()` always -1 on Web; CORS note; TLS 1.2/1.3 only | `doc/classes/HTTPClient.xml` |
| `WebSocketPeer.heartbeat_interval` is 4.4+, no effect on Web; `handshake_headers` unsupported on Web | `modules/websocket/doc_classes/WebSocketPeer.xml`, 4.3 vs 4.4 |
| FSR 1, FSR 2, MetalFX Temporal, TAA: Forward+ only. MetalFX Spatial: Forward+/Mobile. Compatibility: bilinear/nearest only, no FXAA/SMAA | `servers/rendering/renderer_viewport.cpp` 4.7.2 (`viewport_set_scaling_3d_mode`, `viewport_set_screen_space_aa`, `viewport_set_use_taa`); 4.3 has the same FSR/TAA checks |
| MetalFX modes 4.4+, SMAA 4.5+, Nearest scaling 4.7+ | `doc/classes/Viewport.xml` enums across tags |
| `RenderingServer.get_current_rendering_method()` is 4.4+ (skill uses `get_setting_with_override` for 4.3) | `doc/classes/RenderingServer.xml` |
| Compatibility light limits 8 per object / 32 total; Forward+ 512 clustered elements | `doc/classes/ProjectSettings.xml` |
| LightmapGI bakes only from Forward+/Mobile capable devices | `doc/classes/LightmapGI.xml` |

## Example checks

Every `gdscript` block in the three skills was parsed with Godot 4.7.2 (`GDScript.reload()`),
fragments wrapped in a function and missing helpers stubbed. One error was fixed
(`var forward_plus :=` on a Variant comparison in `graphics-settings.md`). Every `csharp` block was
compiled against `Godot.NET.Sdk` 4.7.2 (net8.0), with partial-class wrappers for fragments: 0
errors, 0 warnings. Nothing was run in a game or a browser.

## Not verified

- Ubershaders and background pipeline compilation arriving in 4.4 (from the 4.4 release notes, not
  the source).
- Browser behaviors (autoplay policy, gesture requirements, tab throttling, storage eviction) are
  browser rules, not Godot source.
- The itch.io "SharedArrayBuffer support" embed option name.
