> ← Back to [SKILL.md](../SKILL.md)

# itch.io and Steam Deployment

## itch.io

[Butler](https://itch.io/docs/butler/) is the official itch.io CLI for pushing builds.

### Install Butler

```bash
# Linux/macOS
curl -L https://broth.itch.ovh/butler/linux-amd64/LATEST/archive/default -o butler.zip
unzip butler.zip
chmod +x butler

# Or install via GitHub Actions:
# uses: Ayowel/butler-to-itch@v1
```

### Push a Build

```bash
butler push build/windows/ my-studio/my-game:windows
butler push build/linux/   my-studio/my-game:linux
butler push build/web/     my-studio/my-game:web
```

### Channel Naming Convention

| Channel name | Platform |
|---|---|
| `windows` | Windows 64-bit |
| `linux` | Linux 64-bit |
| `macos` | macOS universal |
| `web` | HTML5 / WebGL |
| `android` | Android APK/AAB |

Use `--userversion` to tag the build with your version string:

```bash
butler push build/windows/ my-studio/my-game:windows --userversion "$GAME_VERSION"
```

### GitHub Actions — Deploy to itch.io

Add this job after the export job to push all artifacts to itch.io:

```yaml
  deploy-itch:
    name: Deploy to itch.io
    needs: export
    runs-on: ubuntu-latest
    if: github.event_name == 'release'

    steps:
      - name: Download all build artifacts
        uses: actions/download-artifact@v4
        with:
          path: artifacts/

      - name: Push to itch.io
        uses: Ayowel/butler-to-itch@v1
        with:
          butler_key: ${{ secrets.BUTLER_API_KEY }}
          itch_user: my-studio
          itch_game: my-game
          version: ${{ github.ref_name }}
          files: |
            windows:artifacts/${{ env.EXPORT_NAME }}-windows-*/
            linux:artifacts/${{ env.EXPORT_NAME }}-linux-*/
            web:artifacts/${{ env.EXPORT_NAME }}-web-*/
```

Store your butler API key (from <https://itch.io/user/settings/api-keys>) as a GitHub Actions secret named `BUTLER_API_KEY`.

## Steam

For Steam distribution you need three components working together:

- **Steamworks SDK**: Download from the Steamworks partner site. It is not redistributable — do not commit it to a public repo. Reference it via a local path or a private artifact store in CI.
- **GodotSteam addon**: [GodotSteam](https://godotsteam.com/) is a community addon that wraps the Steamworks C++ SDK for use in GDScript and C#. It provides `Steam.init()`, achievements, stats, UGC, and networking. Install it as a Godot plugin; follow the GodotSteam docs for the exact version matching your Godot and Steamworks SDK versions.
- **Depot configuration**: In Steamworks Partner, define one depot per platform (Windows, Linux, macOS). Each depot maps to a set of files from your export output. The `steamcmd` CLI uploads depots to Steam using `app_build` scripts. Builds are staged in a local `content/` folder and pushed with `steamcmd +run_app_build app_build.vdf`.

Steam integration is outside the scope of the export pipeline itself — refer to the GodotSteam documentation and Steamworks SDK guides for full setup. For release deadlines, store assets, demo and Next Fest rules, see [steam-release-planning.md](steam-release-planning.md).
