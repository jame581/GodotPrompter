# REST Client Patterns

Reference for `skills/web-services/SKILL.md` — retries with backoff, cancelling in-flight requests, and refreshing an expired auth token. All patterns build on the `Api` autoload from Section 3 of the skill.

> ← Back to [SKILL.md](../SKILL.md)

---

## Retry with Exponential Backoff

Retry only what is safe to repeat: transport failures, `429 Too Many Requests`, and `5xx`. Never retry `4xx` client errors (bad input, unauthorized) — they will fail the same way. Retrying a non-idempotent `POST` can create duplicates unless the server accepts an idempotency key.

```gdscript
# In api.gd
const MAX_ATTEMPTS := 4


func request_json_with_retry(path: String, method: HTTPClient.Method = HTTPClient.METHOD_GET, payload: Variant = null) -> Dictionary:
    var delay := 0.5
    var res := {}
    for attempt in MAX_ATTEMPTS:
        res = await request_json(path, method, payload)
        var retryable: bool = res.code == 0 or res.code == 429 or res.code >= 500
        if res.ok or not retryable:
            return res
        await get_tree().create_timer(delay + randf() * 0.25).timeout # Jitter spreads out retry storms.
        delay *= 2.0
    return res
```

```csharp
// In Api.cs
private const int MaxAttempts = 4;

public async Task<ApiResult> RequestJsonWithRetry(string path, HttpClient.Method method = HttpClient.Method.Get, Variant payload = default)
{
    double delay = 0.5;
    ApiResult res = default;
    for (int attempt = 0; attempt < MaxAttempts; attempt++)
    {
        res = await RequestJson(path, method, payload);
        bool retryable = res.Code == 0 || res.Code == 429 || res.Code >= 500;
        if (res.Ok || !retryable)
            return res;
        await ToSignal(GetTree().CreateTimer(delay + GD.Randf() * 0.25), SceneTreeTimer.SignalName.Timeout); // Jitter spreads out retry storms.
        delay *= 2.0;
    }
    return res;
}
```

`code == 0` also covers failures a retry cannot fix (a malformed URL, a rejected certificate). If that matters, add the `HTTPRequest.Result` to the result and retry only `RESULT_CANT_CONNECT`, `RESULT_CANT_RESOLVE`, `RESULT_CONNECTION_ERROR`, `RESULT_NO_RESPONSE`, and `RESULT_TIMEOUT`.

If the server sends a `Retry-After` header on a `429`, prefer its value over the computed delay. The headers are element `[2]` of the `request_completed` result — each entry is a `"Name: value"` string.

---

## Cancelling In-Flight Requests

`HTTPRequest.cancel_request()` aborts the request and **does not emit `request_completed`**, so anything awaiting it waits forever. To cancel safely, keep a reference to the node, cancel it, and emit your own completion so awaiting code can resume.

```gdscript
# search_box.gd — cancel the previous search when the player keeps typing.
extends LineEdit

signal results_ready(items: Array)

var _http: HTTPRequest


func _on_text_changed(new_text: String) -> void:
    if _http:
        _http.cancel_request()
        _http.queue_free()
    _http = HTTPRequest.new()
    _http.timeout = 8.0
    add_child(_http)
    _http.request_completed.connect(_on_search_completed.bind(_http))
    _http.request("https://api.example.com/v1/search?q=" + new_text.uri_encode())


func _on_search_completed(result: int, code: int, _headers: PackedStringArray, body: PackedByteArray, http: HTTPRequest) -> void:
    if http != _http:
        return # A newer search replaced this one.
    _http = null
    http.queue_free()
    if result == HTTPRequest.RESULT_SUCCESS and code == 200:
        var data: Variant = JSON.parse_string(body.get_string_from_utf8())
        if data is Array:
            results_ready.emit(data)
```

```csharp
using Godot;

public partial class SearchBox : LineEdit
{
    [Signal] public delegate void ResultsReadyEventHandler(Godot.Collections.Array items);

    private HttpRequest _http;

    private void OnTextChanged(string newText)
    {
        if (_http != null)
        {
            _http.CancelRequest();
            _http.QueueFree();
        }
        var http = new HttpRequest { Timeout = 8.0 };
        _http = http;
        AddChild(http);
        http.RequestCompleted += (result, code, headers, body) => OnSearchCompleted(result, code, body, http);
        http.Request("https://api.example.com/v1/search?q=" + newText.URIEncode());
    }

    private void OnSearchCompleted(long result, long code, byte[] body, HttpRequest http)
    {
        if (http != _http)
            return; // A newer search replaced this one.
        _http = null;
        http.QueueFree();
        if (result == (long)HttpRequest.Result.Success && code == 200)
        {
            Variant data = Json.ParseString(body.GetStringFromUtf8());
            if (data.VariantType == Variant.Type.Array)
                EmitSignal(SignalName.ResultsReady, data.AsGodotArray());
        }
    }
}
```

Signal-driven code (connect, don't `await`) is the simplest way to make cancellation safe: a cancelled request just never calls back. For type-ahead search, also debounce with a short `Timer` so you are not starting a request per keystroke.

---

## Refreshing an Expired Token

When an access token expires, the API answers `401`. Refresh once, then replay the original request. Guard against a refresh loop: if the refresh itself fails, sign the player out.

```gdscript
# In api.gd
var refresh_token: String = ""


func request_authed(path: String, method: HTTPClient.Method = HTTPClient.METHOD_GET, payload: Variant = null) -> Dictionary:
    var res := await request_json(path, method, payload)
    if res.code != 401 or refresh_token.is_empty():
        return res
    var refreshed := await request_json("/auth/refresh", HTTPClient.METHOD_POST, {"refresh_token": refresh_token})
    if not refreshed.ok or not (refreshed.data is Dictionary):
        auth_token = ""
        refresh_token = ""
        return res # Caller sees the 401 and shows the login screen.
    auth_token = refreshed.data.get("access_token", "")
    return await request_json(path, method, payload)
```

```csharp
// In Api.cs
public string RefreshToken { get; set; } = "";

public async Task<ApiResult> RequestAuthed(string path, HttpClient.Method method = HttpClient.Method.Get, Variant payload = default)
{
    ApiResult res = await RequestJson(path, method, payload);
    if (res.Code != 401 || RefreshToken == "")
        return res;
    ApiResult refreshed = await RequestJson("/auth/refresh", HttpClient.Method.Post,
        new Godot.Collections.Dictionary { { "refresh_token", RefreshToken } });
    if (!refreshed.Ok || refreshed.Data.VariantType != Variant.Type.Dictionary)
    {
        AuthToken = "";
        RefreshToken = "";
        return res; // Caller sees the 401 and shows the login screen.
    }
    var tokens = refreshed.Data.AsGodotDictionary();
    AuthToken = tokens.ContainsKey("access_token") ? tokens["access_token"].AsString() : "";
    return await RequestJson(path, method, payload);
}
```

If several requests can hit `401` at once, share one pending refresh (store it in a member and have later callers await the same completion signal) so you don't fire parallel refresh calls that invalidate each other's tokens.
