# WebSocket Client

Reference for `skills/web-services/SKILL.md` — a `WebSocketPeer` client with polling, JSON events, and the connection rules (TLS, auth, heartbeat, reconnect).

> ← Back to [SKILL.md](../SKILL.md)

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
