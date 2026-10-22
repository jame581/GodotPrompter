# JavaScriptBridge Recipes

Reference for `skills/web-export/SKILL.md` — letting the player upload a file, calling functions defined in your HTML page, talking to an embedding page, and reading URL parameters.

> ← Back to [SKILL.md](../SKILL.md)

All recipes are GDScript only: C# projects cannot export to Web in Godot 4. Guard every call with `OS.has_feature("web")` — on other platforms `JavaScriptBridge` methods return `null`.

---

## Uploading a File (Import a Save)

<!-- csharp-parity: n/a — C# projects cannot export to Web in Godot 4, so web-only code paths are GDScript only -->

The browser only opens a file picker from a user gesture, so call this from a button's `pressed` handler. `JavaScriptBridge.is_js_buffer()` and `js_buffer_to_packed_byte_array()` are **Godot 4.4+**.

```gdscript
signal file_imported(file_name: String, data: PackedByteArray)

var _on_change_cb: JavaScriptObject
var _on_load_cb: JavaScriptObject
var _input: JavaScriptObject
var _reader: JavaScriptObject
var _file_name := ""


func open_file_picker() -> void:
    if not OS.has_feature("web"):
        return
    var document := JavaScriptBridge.get_interface("document")
    _input = document.createElement("input")
    _input.type = "file"
    _input.accept = ".sav,.json"
    _on_change_cb = JavaScriptBridge.create_callback(_on_file_chosen)
    _input.addEventListener("change", _on_change_cb)
    _input.click()


func _on_file_chosen(_args: Array) -> void:
    if _input.files.length == 0:
        return
    var file: JavaScriptObject = _input.files[0]
    _file_name = file.name
    _reader = JavaScriptBridge.create_object("FileReader")
    _on_load_cb = JavaScriptBridge.create_callback(_on_file_loaded)
    _reader.addEventListener("load", _on_load_cb)
    _reader.readAsArrayBuffer(file)


func _on_file_loaded(_args: Array) -> void:
    var result: JavaScriptObject = _reader.result
    if JavaScriptBridge.is_js_buffer(result):
        file_imported.emit(_file_name, JavaScriptBridge.js_buffer_to_packed_byte_array(result))
```

Validate the imported bytes before loading them as a save — treat them like any untrusted file (see **save-load**). Pair this with `JavaScriptBridge.download_buffer()` for export.

---

## Calling a Function Defined in the Page

<!-- csharp-parity: n/a — C# projects cannot export to Web in Godot 4, so web-only code paths are GDScript only -->

Put shared JavaScript in the preset's `html/head_include` (or a custom HTML shell) and call it through `window`.

```html
<script>
  window.gameAnalytics = {
    track(eventName, value) { console.log("track", eventName, value); },
  };
</script>
```

```gdscript
func track(event_name: String, value: float) -> void:
    if not OS.has_feature("web"):
        return
    var analytics := JavaScriptBridge.get_interface("gameAnalytics")
    if analytics:
        analytics.track(event_name, value)
```

`get_interface()` returns `null` when the property doesn't exist on `window`, so a missing script doesn't crash the game (it does log a "No interface registered" error). Prefer this over `eval()`: no string building, and nothing to inject into.

---

## Talking to an Embedding Page

<!-- csharp-parity: n/a — C# projects cannot export to Web in Godot 4, so web-only code paths are GDScript only -->

When the game runs in an `<iframe>` (portals, itch.io, your own site), use `postMessage` in both directions. Always check the sender's origin on the receiving side.

```gdscript
const PARENT_ORIGIN := "https://www.example.com"

var _on_message_cb: JavaScriptObject


func _ready() -> void:
    if not OS.has_feature("web"):
        return
    _on_message_cb = JavaScriptBridge.create_callback(_on_message)
    JavaScriptBridge.get_interface("window").addEventListener("message", _on_message_cb)


func notify_parent(kind: String) -> void:
    if not OS.has_feature("web"):
        return
    var window := JavaScriptBridge.get_interface("window")
    window.parent.postMessage(JSON.stringify({"kind": kind}), PARENT_ORIGIN)


func _on_message(args: Array) -> void:
    var event: JavaScriptObject = args[0]
    if event.origin != PARENT_ORIGIN:
        return # Ignore messages from any other page.
    var msg: Variant = JSON.parse_string(str(event.data))
    if msg is Dictionary and msg.get("kind") == "pause":
        get_tree().paused = true
```

Never pass `"*"` as the target origin when the message carries anything private (scores tied to accounts, tokens).

---

## Reading URL Parameters

<!-- csharp-parity: n/a — C# projects cannot export to Web in Godot 4, so web-only code paths are GDScript only -->

Useful for level links, referral codes, or a `?debug=1` switch on a staging build.

```gdscript
func get_url_param(key: String) -> String:
    if not OS.has_feature("web"):
        return ""
    var query := str(JavaScriptBridge.get_interface("location").search).trim_prefix("?")
    for pair in query.split("&", false):
        var kv := pair.split("=")
        if kv[0].uri_decode() == key:
            return kv[1].uri_decode() if kv.size() > 1 else ""
    return ""
```

This parses `location.search` in GDScript rather than calling `URLSearchParams.get()`: a JavaScript method that shares a name with an `Object` method (`get`, `set`, `call`, `connect`, …) resolves to the Godot method instead.

Treat every URL parameter as player-controlled input: never feed it to `eval()`, file paths, or anything that unlocks paid content.
