---
name: save-load
description: Use when implementing save/load systems — ConfigFile, JSON, Resource serialization, save game architecture
---

# Save / Load Systems in Godot 4.3+

Choose the right serialization strategy for your data type. All examples target Godot 4.3+ with no deprecated APIs.

> **Related skills:** **resource-pattern** for custom Resource data containers, **inventory-system** for inventory serialization patterns, **godot-project-setup** for SaveManager autoload setup.

---

## 1. Strategy Comparison

| Strategy          | Best For                        | Readable | Editor Support | Notes                              |
|-------------------|---------------------------------|----------|----------------|------------------------------------|
| ConfigFile        | Settings, simple key-value data | Yes      | No             | Built-in INI-style, no extra deps  |
| JSON              | Game saves, flexible structures | Yes      | No             | Cross-platform, version-migratable |
| Resource .tres    | Editor-integrated data          | Yes      | Yes            | **NOT secure — never load untrusted files** |
| Resource .res     | Fast binary data                | No       | Yes            | **NOT secure — never load untrusted files** |

> **Security warning:** Loading `.tres` or `.res` files executes arbitrary GDScript embedded in the resource. Never load Resource files from untrusted sources (user-uploaded files, downloaded mods). Use ConfigFile or JSON for user-generated save data.

---

## 2. ConfigFile — Settings

`ConfigFile` writes INI-style sections — ideal for audio / video / controls settings (small, designer-debuggable). Use `set_value(section, key, value)` then `save(path)`; load with `load(path)` and `get_value(section, key, default)`.

> See [references/configfile.md](references/configfile.md) for the full GDScript + C# settings save/load + typical settings-menu wiring.

---

## 3. JSON — Game Saves

`JSON.stringify(dict)` to serialize, `JSON.parse_string(text)` to deserialize. Read/write through `FileAccess`. Best for game saves where you want human-readable files. Build a Dictionary that captures all gameplay state (player position, inventory, world flags), serialize, write to `user://save_<slot>.json`.

> See [references/json-saves.md](references/json-saves.md) for the full GDScript + C# save/load implementation, including FileAccess wrapping and error handling.

> ⚠️ **Changed in Godot 4.7:** `JSON.stringify(data, indent = "", sort_keys = true, full_precision = false)` now serializes an empty `Dictionary` compactly as `{}` even when an `indent` is passed ([GH-115883](https://github.com/godotengine/godot/pull/115883)). Save files written with an indent change formatting for empty-dict fields after upgrading — anything that diffs or hashes save output byte-for-byte must tolerate the new form. Parsing is unaffected.

---

## 4. Save Architecture Pattern

For larger games, attach a `SaveableComponent` to each persistent node. Each component declares `save_callable` and `load_callable`. The save manager iterates components by ID, calls each one's save callable, builds a master Dictionary.

> See [references/save-architecture.md](references/save-architecture.md) for the full `SaveableComponent` + save-manager implementation.

---

## 5. Save File Locations

`user://` resolves to a platform-specific writable directory outside the project folder.

| Platform | Path                                                                          |
|----------|-------------------------------------------------------------------------------|
| Windows  | `%APPDATA%\Godot\app_userdata\<project-name>\`                                |
| macOS    | `~/Library/Application Support/Godot/app_userdata/<project-name>/`           |
| Linux    | `~/.local/share/godot/app_userdata/<project-name>/`                          |

> Always use `user://` for save data, never `res://`. The `res://` path is read-only in exported builds.

---

## 6. Version Migration

Save files outlive the schema that wrote them. Always include `"version": <int>` at the top of the saved Dictionary; on load, switch on the version and migrate older saves forward incrementally (`v1 → v2 → v3 → current`). Never break old saves — always migrate.

> See [references/version-migration.md](references/version-migration.md) for the full migration helper pattern.

---

## 7. Implementation Checklist

- [ ] Use ConfigFile for settings, JSON for game saves (not Resources)
- [ ] Every save file includes a `version` integer field
- [ ] Save path uses `user://`, never `res://`
- [ ] Call `DirAccess.make_dir_recursive_absolute()` before writing saves
- [ ] Vector2/Vector3 serialized as separate `x`/`y`/`z` floats (JSON has no Vector type)
- [ ] All file operations check return codes and call `push_error()` on failure
- [ ] `_migrate()` handles every version from 0 to current, applied incrementally
- [ ] Resource files (.tres/.res) are never used for player-controlled save data
- [ ] `get_save_slots()` and `delete_save()` helpers exist for UI slot management
- [ ] Saveable nodes use stable IDs that do not change between sessions
