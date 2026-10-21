# Versioning

Reference for `skills/export-pipeline/SKILL.md` — reading the project version at runtime, injecting it from git tags before export, and the tag convention.

> ← Back to [SKILL.md](../SKILL.md)

---

## 5. Versioning

### Reading the Version at Runtime

Store the version string in **Project → Project Settings → Application → Config → Version**. Then read it anywhere:

```gdscript
# version_label.gd
extends Label

func _ready() -> void:
    text = "v" + ProjectSettings.get_setting("application/config/version", "dev")
```

```csharp
// VersionLabel.cs
using Godot;

public partial class VersionLabel : Label
{
    public override void _Ready()
    {
        Text = "v" + ProjectSettings.GetSetting("application/config/version", "dev").AsString();
    }
}
```

### Auto-Versioning from Git Tags

Tag your release commit, then inject the version at export time. The CI workflow in [ci-cd-github-actions.md](ci-cd-github-actions.md) does this via `sed`, but you can also run a pre-export GDScript tool (EditorScript) if you prefer to keep it in-engine:

```gdscript
# tools/inject_version.gd  — run with: godot --headless --script tools/inject_version.gd
@tool
extends EditorScript

func _run() -> void:
    var git_output: Array = []
    var exit_code := OS.execute("git", ["describe", "--tags", "--always", "--dirty"], git_output)
    if exit_code != 0:
        push_error("inject_version: git describe failed")
        return

    var version: String = (git_output[0] as String).strip_edges()
    ProjectSettings.set_setting("application/config/version", version)
    var err := ProjectSettings.save()
    if err != OK:
        push_error("inject_version: failed to save project.godot — error %d" % err)
    else:
        print("inject_version: set version to '%s'" % version)
```

Run it as part of a CI step before the export step:

```bash
godot --headless --script tools/inject_version.gd
godot --headless --export-release "Windows Desktop" build/windows/MyGame.exe
```

### Version Tag Convention

Use [Semantic Versioning](https://semver.org/) tags: `v1.2.3`. `git describe` then produces `v1.2.3-4-gabcdef` for commits after a tag, giving you fully traceable builds.
