> ← Back to [SKILL.md](../SKILL.md)

# CI/CD with GitHub Actions

Full workflow exporting Windows (.exe), Linux (.x86_64), and Web (.html) builds on every push to `main` and on tagged releases.

```yaml
# .github/workflows/export.yml
name: Export Godot Game

on:
  push:
    branches: [main]
  release:
    types: [published]

env:
  GODOT_VERSION: "4.3"
  EXPORT_NAME: "MyGame"

jobs:
  export:
    name: Export — ${{ matrix.preset }}
    runs-on: ubuntu-latest

    strategy:
      fail-fast: false
      matrix:
        include:
          - preset: "Windows Desktop"
            artifact: windows
            output_path: build/windows/MyGame.exe

          - preset: "Linux/X11"
            artifact: linux
            output_path: build/linux/MyGame.x86_64

          - preset: "Web"
            artifact: web
            output_path: build/web/index.html

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0   # needed for git describe (versioning)

      - name: Set up Godot ${{ env.GODOT_VERSION }}
        uses: chickensoft-games/setup-godot@v2
        with:
          version: ${{ env.GODOT_VERSION }}
          use-dotnet: false   # set true for C# projects
          include-templates: true

      - name: Create output directory
        run: mkdir -p $(dirname ${{ matrix.output_path }})

      - name: Inject version from git tag
        run: |
          VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "0.0.0-dev")
          echo "GAME_VERSION=$VERSION" >> $GITHUB_ENV
          # Patch project.godot so ProjectSettings.get_setting("application/config/version") returns it
          sed -i "s/^config\/version=.*/config\/version=\"$VERSION\"/" project.godot || true

      - name: Export — ${{ matrix.preset }}
        run: |
          godot --headless --export-release "${{ matrix.preset }}" "${{ matrix.output_path }}"

      - name: Mark Linux binary executable
        if: matrix.artifact == 'linux'
        run: chmod +x ${{ matrix.output_path }}

      - name: Upload artifact — ${{ matrix.artifact }}
        uses: actions/upload-artifact@v4
        with:
          name: ${{ env.EXPORT_NAME }}-${{ matrix.artifact }}-${{ env.GAME_VERSION }}
          path: build/${{ matrix.artifact }}/
          if-no-files-found: error
```

> For C# (Mono) projects set `use-dotnet: true` in the `setup-godot` step. The action will install the .NET SDK automatically.
