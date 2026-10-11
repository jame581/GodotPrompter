> ← Back to [SKILL.md](../SKILL.md)

# Editor Locale Preview (Godot 4.5+)

Godot 4.5 adds a live locale preview to the editor — see how your UI looks in any configured locale (translated text, RTL layout, font changes) without running the game.

## How to Use

1. Open a scene in the **2D** editor and click **View** in the viewport toolbar.
2. Open the **Preview Translation** submenu.
3. Select a locale from the list of loaded translations (e.g., `ja`, `cs`, `ar`).
4. The editor viewport updates immediately to reflect the selected locale.

## Benefits

- Spot layout issues from longer translated text without entering Play mode.
- Verify RTL layout direction for Arabic, Hebrew, and Persian.
- Confirm Control nodes with text properties use `tr()` keys (untranslated keys show as-is in non-English preview).
- Faster translation QA — iterate directly in the editor.

> Reset by choosing **None** in the **Preview Translation** submenu. The preview is editor-only and doesn't affect exported builds.
