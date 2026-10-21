---
name: web-services
description: Use when calling web APIs or backends from Godot — HTTPRequest, REST/JSON clients, auth headers, downloads, TLS, WebSocketPeer clients, retries, and keeping secrets out of the build
---

# Web Services in Godot 4.3+

Talk to REST APIs, leaderboards, analytics, login services, and other HTTP/WebSocket backends. All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **multiplayer-basics** for real-time game networking with WebSocketMultiplayerPeer, **save-load** for persisting tokens and cached responses, **web-export** for CORS and browser limits, **mobile-development** for Android export permissions, **multithreading** for heavy response parsing off the main thread.

---

## 1. Picking the Tool

| Need | Use | Why |
|---|---|---|
| Ordinary REST call, file or image download | `HTTPRequest` node | Handles connect, redirects, gzip, timeout; emits one signal when done |
| Streaming a response, custom keep-alive, many requests to one host | `HTTPClient` | Low-level; you call `poll()` and drive the state machine yourself |
| Persistent two-way channel (chat, live events, lobby service) | `WebSocketPeer` | Client socket; call `poll()` every frame |
| Real-time gameplay sync with RPCs | `WebSocketMultiplayerPeer` | Plugs into `MultiplayerAPI` — see **multiplayer-basics** |

**One `HTTPRequest` node runs one request at a time.** A second `request()` while one is in flight returns `ERR_BUSY`. Create one node per concurrent request (Section 3) rather than queueing on a shared node.

---

## 2. A Single Request with `await`

`request()` only *starts* the request; its return value says whether it could be sent, not whether the server answered. The result arrives on `request_completed(result, response_code, headers, body)`.

```gdscript
func fetch_motd() -> void:
    var http := HTTPRequest.new()
    http.timeout = 10.0 # Default 0.0 means wait forever.
    add_child(http)

    var err := http.request("https://api.example.com/v1/motd")
    if err != OK:
        push_error("Could not start request: %s" % error_string(err))
        http.queue_free()
        return

    var res: Array = await http.request_completed
    http.queue_free()

    var result: int = res[0]
    var code: int = res[1]
    var body: PackedByteArray = res[3]
    if result != HTTPRequest.RESULT_SUCCESS:
        push_warning("Network failure (HTTPRequest.Result %d)" % result)
    elif code != 200:
        push_warning("Server answered HTTP %d" % code)
    else:
        print(body.get_string_from_utf8())
```

```csharp
public async void FetchMotd()
{
    var http = new HttpRequest { Timeout = 10.0 }; // Default 0.0 means wait forever.
    AddChild(http);

    Error err = http.Request("https://api.example.com/v1/motd");
    if (err != Error.Ok)
    {
        GD.PushError($"Could not start request: {err}");
        http.QueueFree();
        return;
    }

    Variant[] res = await ToSignal(http, HttpRequest.SignalName.RequestCompleted);
    http.QueueFree();

    long result = res[0].AsInt64();
    long code = res[1].AsInt64();
    byte[] body = res[3].AsByteArray();
    if (result != (long)HttpRequest.Result.Success)
        GD.PushWarning($"Network failure (HttpRequest.Result {result})");
    else if (code != 200)
        GD.PushWarning($"Server answered HTTP {code}");
    else
        GD.Print(body.GetStringFromUtf8());
}
```

Check **both** values: `result` is the transport outcome (DNS, TLS, timeout — `RESULT_CANT_RESOLVE`, `RESULT_TLS_HANDSHAKE_ERROR`, `RESULT_TIMEOUT`, …), `response_code` is the HTTP status. A 404 or 500 arrives with `RESULT_SUCCESS`.

---

## 3. A Reusable JSON API Client (Autoload)

Wrap the boilerplate once. Register this as an autoload named `Api`; every call spawns its own `HTTPRequest`, so calls can overlap.

```gdscript
# api.gd — autoload "Api"
extends Node

const BASE_URL := "https://api.example.com/v1"
const TIMEOUT_SEC := 10.0

var auth_token: String = ""


## Returns {ok: bool, code: int, data: Variant, error: String}.
func request_json(path: String, method: HTTPClient.Method = HTTPClient.METHOD_GET, payload: Variant = null) -> Dictionary:
    var http := HTTPRequest.new()
    http.timeout = TIMEOUT_SEC
    add_child(http)

    var headers := PackedStringArray(["Accept: application/json"])
    var body := ""
    if payload != null:
        headers.append("Content-Type: application/json")
        body = JSON.stringify(payload)
    if not auth_token.is_empty():
        headers.append("Authorization: Bearer " + auth_token)

    var err := http.request(BASE_URL + path, headers, method, body)
    if err != OK:
        http.queue_free()
        return {"ok": false, "code": 0, "data": null, "error": "request() failed: " + error_string(err)}

    var res: Array = await http.request_completed
    http.queue_free()
    if res[0] != HTTPRequest.RESULT_SUCCESS:
        return {"ok": false, "code": 0, "data": null, "error": "transport error %d" % res[0]}

    var code: int = res[1]
    var text := (res[3] as PackedByteArray).get_string_from_utf8()
    var data: Variant = JSON.parse_string(text) if not text.is_empty() else null
    return {"ok": code >= 200 and code < 300, "code": code, "data": data, "error": "" if code < 400 else text}
```

```csharp
// Api.cs — autoload "Api"
using System.Collections.Generic;
using System.Threading.Tasks;
using Godot;

public partial class Api : Node
{
    private const string BaseUrl = "https://api.example.com/v1";
    private const double TimeoutSec = 10.0;

    public string AuthToken { get; set; } = "";

    public readonly record struct ApiResult(bool Ok, long Code, Variant Data, string Error);

    public async Task<ApiResult> RequestJson(string path, HttpClient.Method method = HttpClient.Method.Get, Variant payload = default)
    {
        var http = new HttpRequest { Timeout = TimeoutSec };
        AddChild(http);

        var headers = new List<string> { "Accept: application/json" };
        string body = "";
        if (payload.VariantType != Variant.Type.Nil)
        {
            headers.Add("Content-Type: application/json");
            body = Json.Stringify(payload);
        }
        if (AuthToken != "")
            headers.Add("Authorization: Bearer " + AuthToken);

        Error err = http.Request(BaseUrl + path, headers.ToArray(), method, body);
        if (err != Error.Ok)
        {
            http.QueueFree();
            return new ApiResult(false, 0, default, $"Request() failed: {err}");
        }

        Variant[] res = await ToSignal(http, HttpRequest.SignalName.RequestCompleted);
        http.QueueFree();
        if (res[0].AsInt64() != (long)HttpRequest.Result.Success)
            return new ApiResult(false, 0, default, $"Transport error {res[0]}");

        long code = res[1].AsInt64();
        string text = res[3].AsByteArray().GetStringFromUtf8();
        Variant data = text == "" ? default : Json.ParseString(text);
        return new ApiResult(code is >= 200 and < 300, code, data, code < 400 ? "" : text);
    }
}
```

Call it from anywhere:

```gdscript
var res := await Api.request_json("/scores", HTTPClient.METHOD_POST, {"name": "Ada", "score": 1200})
if not res.ok:
    show_error(res.error)
```

```csharp
var api = GetNode<Api>("/root/Api");
var res = await api.RequestJson("/scores", HttpClient.Method.Post, new Godot.Collections.Dictionary { { "name", "Ada" }, { "score", 1200 } });
if (!res.Ok)
    ShowError(res.Error);
```

Retries with exponential backoff, request cancellation on scene change, and an auth refresh flow: [references/rest-client-patterns.md](references/rest-client-patterns.md).

---

## 4. JSON Pitfalls

- **Every JSON number parses as `float`.** `{"id": 5}` gives `5.0`. Cast before using it as an index, enum, or dictionary key: `int(data["id"])` in GDScript, `data["id"].AsInt32()` in C#. `==` compares `5.0 == 5` as true, but `match` patterns are type-strict, and a dictionary keyed by `5` has no entry for `5.0`.
- **`JSON.parse_string()` returns `null` on bad input** and logs an error. When you need the line and message, use an instance: `var json := JSON.new(); if json.parse(text) != OK: print(json.get_error_message(), json.get_error_line())`.
- **Validate shape before indexing.** Check `data is Dictionary and data.has("items")` — a server error page in HTML parses to `null`, and an empty array is still `ok`.
- **A stringify → parse round trip turns ints into floats** (`stringify` itself writes `5`, the parse brings back `5.0`), and `JSON.stringify(obj)` only works on Variant types — convert custom objects or Resources to a Dictionary first.

---

## 5. Downloads, Uploads, and Images

| Task | How |
|---|---|
| Save straight to disk | Set `http.download_file = "user://cache/pack.zip"` before `request()`; the body is written there, not returned |
| Progress bar | Poll `get_downloaded_bytes()` against `get_body_size()` (`-1` when the server sends no length, and always `-1` on Web) |
| Cap the size | `body_size_limit` (bytes) → `RESULT_BODY_SIZE_LIMIT_EXCEEDED` |
| Binary upload | `request_raw(url, headers, HTTPClient.METHOD_PUT, bytes)` with a `Content-Type` header |
| Show a remote image | `Image.new().load_png_from_buffer(body)` (or `_jpg_`, `_webp_`), then `ImageTexture.create_from_image(image)` |

Image, form-encoded, and multipart recipes with C#: [references/downloads-and-uploads.md](references/downloads-and-uploads.md).

---

## 6. TLS and Secrets

- **HTTPS works out of the box** against the bundled CA list. For a self-signed or private CA, load the `.crt` and pass `TLSOptions.client(cert)` via `http.set_tls_options()`. `TLSOptions.client_unsafe()` skips validation — never ship it.
- **Anything in the export is readable.** API keys in scripts, `project.godot`, or an encrypted PCK can be pulled out by a determined player. Keep privileged keys (payment, admin, third-party paid APIs) on a server you control and have the game call that server.
- **Per-player tokens** (session or refresh tokens) can live in `user://`; treat them as revocable, not secret.
- **Send credentials in headers or a POST body**, never as GET query parameters — URLs end up in logs.
- TLS 1.2 is supported everywhere and TLS 1.3 from **Godot 4.4**; on 4.3 a TLS 1.3-only server fails with `RESULT_TLS_HANDSHAKE_ERROR`, as does any server limited to TLS 1.1 or older.

---

## 7. Platform Notes

| Platform | Gotcha |
|---|---|
| Android | Enable the **INTERNET** permission in the export preset, or every request fails |
| Web | Requests go through the browser: the server must send CORS headers (`Access-Control-Allow-Origin`), and plain `http://` from an `https://` page is blocked as mixed content. See **web-export** |
| Dedicated server | Same API; run requests from the server so keys never reach clients — see **dedicated-server** |

---

## 8. WebSocket Client

`WebSocketPeer` is a plain client socket. Nothing happens unless you call `poll()` regularly.

```gdscript
extends Node

var socket := WebSocketPeer.new()


func _ready() -> void:
    var err := socket.connect_to_url("wss://events.example.com/live")
    if err != OK:
        push_error("WebSocket connect failed: %s" % error_string(err))
        set_process(false)


func _process(_delta: float) -> void:
    socket.poll()
    match socket.get_ready_state():
        WebSocketPeer.STATE_OPEN:
            while socket.get_available_packet_count() > 0:
                var msg: Variant = JSON.parse_string(socket.get_packet().get_string_from_utf8())
                if msg is Dictionary:
                    _handle_event(msg)
        WebSocketPeer.STATE_CLOSED:
            print("Closed: %d %s" % [socket.get_close_code(), socket.get_close_reason()])
            set_process(false)


func send_event(data: Dictionary) -> void:
    if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
        socket.send_text(JSON.stringify(data))
```

```csharp
using Godot;

public partial class LiveEvents : Node
{
    private readonly WebSocketPeer _socket = new();

    public override void _Ready()
    {
        Error err = _socket.ConnectToUrl("wss://events.example.com/live");
        if (err != Error.Ok)
        {
            GD.PushError($"WebSocket connect failed: {err}");
            SetProcess(false);
        }
    }

    public override void _Process(double delta)
    {
        _socket.Poll();
        switch (_socket.GetReadyState())
        {
            case WebSocketPeer.State.Open:
                while (_socket.GetAvailablePacketCount() > 0)
                {
                    Variant msg = Json.ParseString(_socket.GetPacket().GetStringFromUtf8());
                    if (msg.VariantType == Variant.Type.Dictionary)
                        HandleEvent(msg.AsGodotDictionary());
                }
                break;
            case WebSocketPeer.State.Closed:
                GD.Print($"Closed: {_socket.GetCloseCode()} {_socket.GetCloseReason()}");
                SetProcess(false);
                break;
        }
    }

    public void SendEvent(Godot.Collections.Dictionary data)
    {
        if (_socket.GetReadyState() == WebSocketPeer.State.Open)
            _socket.SendText(Json.Stringify(data));
    }
}
```

- Use `wss://` with the server's real hostname (not an IP) so the certificate matches; Web exports require it on `https` pages.
- `handshake_headers` (for an auth header) is ignored on Web — authenticate with the first message after connecting. If a URL parameter is unavoidable, use a short-lived single-use ticket, never the long-lived token (URLs end up in logs).
- **Godot 4.4+:** `heartbeat_interval` sends automatic ping frames to keep idle connections alive (no effect on Web).
- Reconnect with backoff on `STATE_CLOSED` rather than spinning `connect_to_url()` every frame.

---

## 9. Common Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| `request()` returns `ERR_BUSY` (44) | Reused one `HTTPRequest` for overlapping calls | One node per in-flight request |
| `request()` returns `ERR_UNCONFIGURED` | Node not in the tree yet | `add_child()` before `request()` |
| Request hangs forever | `timeout` left at `0.0` | Set `timeout` (5–15 s) on API calls; big downloads need a stall check instead (`timeout` covers the whole transfer) |
| Works in editor, fails on Android | Missing INTERNET permission | Tick it in the export preset |
| Works on desktop, fails on Web | CORS or mixed content | Fix server headers; use HTTPS/WSS |
| `id` is `5.0`, not `5` | JSON numbers are floats | Cast with `int()` |
| Body empty, file appears in `user://` | `download_file` was set | Clear it for in-memory requests |
| Request never completes after a scene change | The `HTTPRequest` was a child of a node that got freed, so the coroutine never resumes | Parent requests to an autoload (Section 3); don't touch freed nodes after the `await` |

---

## 10. Checklist

- [ ] One `HTTPRequest` per concurrent request; each is `queue_free()`d after completion
- [ ] `timeout` set on API calls; large downloads use a stall check or cancel button instead
- [ ] Both the transport `result` and the HTTP `response_code` are checked
- [ ] JSON numbers cast to `int` where integers are expected; parsed data shape validated
- [ ] No privileged API keys in the client build; a server proxies paid or admin APIs
- [ ] Credentials sent in headers or POST bodies over HTTPS, never in GET URLs
- [ ] `TLSOptions.client_unsafe()` not used outside local testing
- [ ] Android preset has the INTERNET permission
- [ ] Web build tested against the real server (CORS headers, HTTPS/WSS only)
- [ ] WebSocket `poll()` called every frame; reconnects back off
- [ ] Failures surface to the player (retry button, offline message) instead of failing silently
