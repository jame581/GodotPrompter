# Windows Export — Native Resource Editing (Godot 4.5+)

Reference for `skills/export-pipeline/SKILL.md` — which Windows `.exe` metadata fields Godot 4.5+ writes natively at export time, the setup steps, and removing `rcedit` from CI.

> ← Back to [SKILL.md](../SKILL.md)

---

Before Godot 4.5, modifying `.exe` metadata (version info, icon, copyright, company name) on Windows required the external `rcedit` tool. Godot 4.5 handles all of this natively at export time — no `rcedit` download or configuration needed.

### What is Edited Natively

| Export Preset Field | Effect on .exe |
|---------------------|---------------|
| `application/file_version` | File version shown in Properties → Details |
| `application/product_version` | Product version |
| `application/company_name` | Company name |
| `application/product_name` | Product name |
| `application/file_description` | Description |
| `application/copyright` | Legal copyright |
| `application/icon` | Icon image (ICO, PNG, WebP or SVG) converted and embedded as the executable icon |

### Setup

1. Open **Project → Export** → Windows Desktop preset.
2. Fill in the `application/*` fields under **Application** in the preset options.
3. Export normally — Godot writes the metadata into the `.exe` directly.

> **Removing rcedit from CI:** If your project previously downloaded `rcedit` in CI and called it as a post-export step, you can remove that step. The fields in the export preset replace it entirely for Godot 4.5+.
