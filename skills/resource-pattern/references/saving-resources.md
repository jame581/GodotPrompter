# Saving Custom Resources

Reference for `skills/resource-pattern/SKILL.md` — `ResourceSaver.save()` for persistent state. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 9. Saving Custom Resources

Use `ResourceSaver` to write Resources to disk at runtime (procedurally generated content, unlocked items, etc.).

### GDScript

```gdscript
func save_resource(res: Resource, path: String) -> bool:
    var err := ResourceSaver.save(res, path)
    if err != OK:
        push_error("Failed to save resource to '%s' — error %d" % [path, err])
        return false
    return true


# .tres — human-readable text, good for debugging and version control
save_resource(my_item, "user://generated/custom_sword.tres")

# .res — binary, smaller and faster to load, use in production builds
save_resource(my_item, "user://generated/custom_sword.res")
```

### C#

```csharp
public bool SaveResource(Resource res, string path)
{
    var err = ResourceSaver.Save(res, path);
    if (err != Error.Ok)
    {
        GD.PushError($"Failed to save resource to '{path}' — error {err}");
        return false;
    }
    return true;
}

// .tres — human-readable, for debugging and version control
SaveResource(myItem, "user://generated/custom_sword.tres");

// .res — binary, faster to load, use in production
SaveResource(myItem, "user://generated/custom_sword.res");
```

**Format guidance:**

| Format | Pros | Cons | Use When |
|---|---|---|---|
| `.tres` | Human-readable, diffable, debuggable | Larger file, slower to parse | Development, version control, user-editable files |
| `.res` | Compact binary, faster to load | Not human-readable | Production builds, shipped game data |

> **Security:** Never load `.tres` or `.res` files from untrusted sources (user uploads, downloaded mods). They can execute embedded GDScript. Use JSON for user-controlled data.

---

