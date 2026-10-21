# Deployment

Reference for `skills/dedicated-server/SKILL.md` — Dockerfile, Linux VPS setup, systemd service file, log rotation.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Deployment

### Dockerfile

The server binary must be the Linux server export (`dedicated_server` feature enabled). Build a minimal container from the exported binary and its PCK file.

```dockerfile
# Dockerfile
FROM ubuntu:22.04

# Install runtime dependencies for ENet and audio stub (even headless needs libc).
RUN apt-get update && apt-get install -y --no-install-recommends \
        libfontconfig1 \
        libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the exported server binary and PCK.
# Replace "my_game_server" with your actual export name.
COPY export/my_game_server.x86_64 ./my_game_server
COPY export/my_game_server.pck    ./my_game_server.pck

RUN chmod +x ./my_game_server

EXPOSE 7777/udp

ENV SERVER_PORT=7777
ENV SERVER_MAX_PLAYERS=8
ENV SERVER_TICK_RATE=60

ENTRYPOINT ["./my_game_server", "--headless"]
```

**Build and run:**

```bash
docker build -t my-game-server:latest .
docker run -d \
    -p 7777:7777/udp \
    -e SERVER_MAX_PLAYERS=16 \
    --name game-server \
    my-game-server:latest
```

### Linux VPS Setup

After uploading the server binary to a VPS (e.g. via `scp` or a CI artifact):

```bash
# 1. Make the binary executable.
chmod +x /opt/my-game/my_game_server.x86_64

# 2. Open the UDP port in the firewall (ufw example).
sudo ufw allow 7777/udp

# 3. Test a one-shot run to check for missing libraries.
/opt/my-game/my_game_server.x86_64 --headless --port 7777
```

If you see `error while loading shared libraries`, install the missing package reported and re-run.

### systemd Service File

```ini
# /etc/systemd/system/my-game-server.service
[Unit]
Description=My Game Dedicated Server
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=gameserver
WorkingDirectory=/opt/my-game
ExecStart=/opt/my-game/my_game_server.x86_64 --headless --port 7777 --max-players 16
Restart=on-failure
RestartSec=5s

# Redirect stdout/stderr to the journal (viewable with journalctl).
StandardOutput=journal
StandardError=journal
SyslogIdentifier=my-game-server

# Optional resource limits.
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

**Enable and start:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable my-game-server
sudo systemctl start  my-game-server
sudo systemctl status my-game-server
```

### Log Output

Godot prints to stdout by default. With the systemd service above, use `journalctl` to inspect logs:

```bash
# Follow live output:
sudo journalctl -u my-game-server -f

# Last 100 lines:
sudo journalctl -u my-game-server -n 100

# Since last boot:
sudo journalctl -u my-game-server -b
```

To write structured logs from GDScript, prefix lines with a tag so they are easy to `grep`:

```gdscript
func log_info(msg: String) -> void:
    print("[INFO]  %s  %s" % [Time.get_datetime_string_from_system(), msg])

func log_error(msg: String) -> void:
    push_error("[ERROR] %s  %s" % [Time.get_datetime_string_from_system(), msg])
```

When exporting a C# dedicated server, ensure the .NET runtime is bundled in the export preset (Project → Export → Dotnet → Include Scripts Content = enabled, and the target system has the matching `dotnet` runtime installed).

```csharp
using Godot;

public partial class ServerBoot : Node
{
    public override void _Ready()
    {
        if (OS.HasFeature("dedicated_server"))
        {
            RenderingServer.SetRenderLoopEnabled(false);
            GD.Print($"Dedicated server build — display: {DisplayServer.GetName()}");
            StartGameLoop();
        }
    }

    private void StartGameLoop()
    {
        // Server tick loop entry point
    }

    private void LogInfo(string msg)
    {
        GD.Print($"[INFO]  {Time.GetDatetimeStringFromSystem()}  {msg}");
    }

    private void LogError(string msg)
    {
        GD.PushError($"[ERROR] {Time.GetDatetimeStringFromSystem()}  {msg}");
    }
}
```

---

