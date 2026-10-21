# Version Migration

Reference for `skills/save-load/SKILL.md` — incremental migration from older save versions on load.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Version Migration

Always store a `version` integer in every save file. Apply migrations incrementally so any old save can be brought forward to the current format regardless of how many versions it has missed.

```gdscript
func _migrate(data: Dictionary) -> Dictionary:
	var version: int = data.get("version", 0)

	if version < 1:
		# v0 → v1: inventory did not exist, add empty array
		data["player"]["inventory"] = []
		version = 1

	if version < 2:
		# v1 → v2: skills system added, seed from empty array
		data["player"]["skills"] = []
		version = 2

	# v2 → v3: add stamina stat with default value
	if version < 3:
		data["player"]["stamina"] = 100
		version = 3

	data["version"] = CURRENT_VERSION
	return data
```

```csharp
using Godot;
using Godot.Collections;

public partial class SaveMigrator : Node
{
    private const int CurrentVersion = 3;

    public Dictionary Migrate(Dictionary data)
    {
        int version = data.ContainsKey("version") ? (int)data["version"] : 0;

        if (version < 1)
        {
            // v0 → v1: inventory did not exist, add empty array
            if (!data.ContainsKey("player"))
                data["player"] = new Dictionary();
            ((Dictionary)data["player"])["inventory"] = new Array();
            version = 1;
        }

        if (version < 2)
        {
            // v1 → v2: skills system added, seed from empty array
            if (!data.ContainsKey("player"))
                data["player"] = new Dictionary();
            ((Dictionary)data["player"])["skills"] = new Array();
            version = 2;
        }

        if (version < 3)
        {
            // v2 → v3: add stamina stat with default value
            if (!data.ContainsKey("player"))
                data["player"] = new Dictionary();
            ((Dictionary)data["player"])["stamina"] = 100;
            version = 3;
        }

        data["version"] = CurrentVersion;
        return data;
    }
}
```

Key rules:
- Each migration block is additive — it only adds or transforms, never removes data
- Use `data.get("key", default)` defensively within migration blocks
- The version field must be written back before returning

---

