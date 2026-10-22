# Downloads and Uploads

Reference for `skills/web-services/SKILL.md` — downloading to disk with progress, loading remote images, form-encoded posts, and multipart file uploads.

> ← Back to [SKILL.md](../SKILL.md)

---

## Download to Disk with Progress

Setting `download_file` streams the body to that path instead of returning it in `body`. Make sure the directory exists first, or the request fails with `RESULT_DOWNLOAD_FILE_CANT_OPEN`.

Don't set `timeout` here: it limits the **whole** transfer, so a large file on a slow connection would always end in `RESULT_TIMEOUT`. Leave it at `0.0` and give the player a cancel button (or cancel when `get_downloaded_bytes()` stops growing for, say, 30 s). Download to a temporary name and rename on success, so a failed transfer never leaves a truncated file at the real path.

```gdscript
extends Node

@onready var progress_bar: ProgressBar = %ProgressBar

var _http: HTTPRequest


func download(url: String, path: String) -> bool:
    DirAccess.make_dir_recursive_absolute(path.get_base_dir())
    var tmp_path := path + ".part"
    _http = HTTPRequest.new()
    _http.download_file = tmp_path # timeout stays 0.0: it would cap the whole transfer.
    add_child(_http)
    if _http.request(url) != OK:
        _http.queue_free()
        _http = null
        return false
    var res: Array = await _http.request_completed
    _http.queue_free()
    _http = null
    if res[0] != HTTPRequest.RESULT_SUCCESS or res[1] != 200:
        DirAccess.remove_absolute(tmp_path)
        return false
    return DirAccess.rename_absolute(tmp_path, path) == OK


func _process(_delta: float) -> void:
    if _http == null:
        return
    var total := _http.get_body_size() # -1 when unknown, and always -1 on Web.
    if total > 0:
        progress_bar.value = 100.0 * _http.get_downloaded_bytes() / total
```

```csharp
using System.Threading.Tasks;
using Godot;

public partial class Downloader : Node
{
    private ProgressBar _progressBar;
    private HttpRequest _http;

    public override void _Ready() => _progressBar = GetNode<ProgressBar>("%ProgressBar");

    public async Task<bool> Download(string url, string path)
    {
        DirAccess.MakeDirRecursiveAbsolute(path.GetBaseDir());
        string tmpPath = path + ".part";
        _http = new HttpRequest { DownloadFile = tmpPath }; // Timeout stays 0: it would cap the whole transfer.
        AddChild(_http);
        if (_http.Request(url) != Error.Ok)
        {
            _http.QueueFree();
            _http = null;
            return false;
        }
        Variant[] res = await ToSignal(_http, HttpRequest.SignalName.RequestCompleted);
        _http.QueueFree();
        _http = null;
        if (res[0].AsInt64() != (long)HttpRequest.Result.Success || res[1].AsInt64() != 200)
        {
            DirAccess.RemoveAbsolute(tmpPath);
            return false;
        }
        return DirAccess.RenameAbsolute(tmpPath, path) == Error.Ok;
    }

    public override void _Process(double delta)
    {
        if (_http == null)
            return;
        long total = _http.GetBodySize(); // -1 when unknown, and always -1 on Web.
        if (total > 0)
            _progressBar.Value = 100.0 * _http.GetDownloadedBytes() / total;
    }
}
```

From Godot 4.7, cancelling also deletes the partial file; on 4.3–4.6 it stays behind, which is why the recipe downloads to a `.part` name. Downloaded `.pck` content packs can then be mounted with `ProjectSettings.load_resource_pack()`.

---

## Loading a Remote Image

Pick the decoder from the `Content-Type` response header rather than the URL extension — CDNs often serve WebP from a `.png` URL.

```gdscript
func texture_from_response(headers: PackedStringArray, body: PackedByteArray) -> ImageTexture:
    var content_type := ""
    for header in headers:
        if header.to_lower().begins_with("content-type:"):
            content_type = header.substr(13).strip_edges().to_lower()
    var image := Image.new()
    var err: Error
    if content_type.begins_with("image/png"):
        err = image.load_png_from_buffer(body)
    elif content_type.begins_with("image/jpeg"):
        err = image.load_jpg_from_buffer(body)
    elif content_type.begins_with("image/webp"):
        err = image.load_webp_from_buffer(body)
    else:
        return null
    return ImageTexture.create_from_image(image) if err == OK else null
```

```csharp
private static ImageTexture TextureFromResponse(string[] headers, byte[] body)
{
    string contentType = "";
    foreach (string header in headers)
    {
        if (header.ToLower().StartsWith("content-type:"))
            contentType = header.Substring(13).Trim().ToLower();
    }
    var image = new Image();
    Error err;
    if (contentType.StartsWith("image/png"))
        err = image.LoadPngFromBuffer(body);
    else if (contentType.StartsWith("image/jpeg"))
        err = image.LoadJpgFromBuffer(body);
    else if (contentType.StartsWith("image/webp"))
        err = image.LoadWebpFromBuffer(body);
    else
        return null;
    return err == Error.Ok ? ImageTexture.CreateFromImage(image) : null;
}
```

Cache downloaded avatars to `user://cache/` with `image.save_png()` and key them by URL hash (`url.md5_text()`) so repeat sessions don't re-download.

---

## Form-Encoded POST

Some older APIs and OAuth token endpoints want `application/x-www-form-urlencoded` instead of JSON. Use `HTTPClient.query_string_from_dict()` to build the body.

```gdscript
var http := HTTPRequest.new()
add_child(http)
var fields := {"grant_type": "refresh_token", "refresh_token": refresh_token}
var body := HTTPClient.new().query_string_from_dict(fields)
http.request("https://auth.example.com/token", ["Content-Type: application/x-www-form-urlencoded"], HTTPClient.METHOD_POST, body)
```

```csharp
var http = new HttpRequest();
AddChild(http);
var fields = new Godot.Collections.Dictionary { { "grant_type", "refresh_token" }, { "refresh_token", RefreshToken } };
string body = new HttpClient().QueryStringFromDict(fields);
http.Request("https://auth.example.com/token", new[] { "Content-Type: application/x-www-form-urlencoded" }, HttpClient.Method.Post, body);
```

---

## Multipart File Upload

Godot has no multipart helper; build the body bytes yourself and send them with `request_raw()`. Typical use: uploading a screenshot or crash log.

```gdscript
func upload_screenshot(url: String, png: PackedByteArray) -> void:
    var boundary := "----godot%d" % Time.get_ticks_usec()
    var body := PackedByteArray()
    body.append_array(("--%s\r\n" % boundary).to_utf8_buffer())
    body.append_array("Content-Disposition: form-data; name=\"file\"; filename=\"shot.png\"\r\n".to_utf8_buffer())
    body.append_array("Content-Type: image/png\r\n\r\n".to_utf8_buffer())
    body.append_array(png)
    body.append_array(("\r\n--%s--\r\n" % boundary).to_utf8_buffer())

    var http := HTTPRequest.new()
    http.timeout = 30.0
    add_child(http)
    http.request_completed.connect(func(_r, _c, _h, _b): http.queue_free())
    http.request_raw(url, ["Content-Type: multipart/form-data; boundary=" + boundary], HTTPClient.METHOD_POST, body)
```

```csharp
public void UploadScreenshot(string url, byte[] png)
{
    string boundary = $"----godot{Time.GetTicksUsec()}";
    var body = new System.Collections.Generic.List<byte>();
    body.AddRange($"--{boundary}\r\n".ToUtf8Buffer());
    body.AddRange("Content-Disposition: form-data; name=\"file\"; filename=\"shot.png\"\r\n".ToUtf8Buffer());
    body.AddRange("Content-Type: image/png\r\n\r\n".ToUtf8Buffer());
    body.AddRange(png);
    body.AddRange($"\r\n--{boundary}--\r\n".ToUtf8Buffer());

    var http = new HttpRequest { Timeout = 30.0 };
    AddChild(http);
    http.RequestCompleted += (result, code, headers, responseBody) => http.QueueFree();
    http.RequestRaw(url, new[] { "Content-Type: multipart/form-data; boundary=" + boundary }, HttpClient.Method.Post, body.ToArray());
}
```

Grab the PNG bytes with `get_viewport().get_texture().get_image().save_png_to_buffer()`.
