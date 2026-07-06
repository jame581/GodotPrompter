---
name: localization
description: Use when implementing localization (i18n/l10n) — TranslationServer, CSV/PO translation files, locale switching, RTL support, and pluralization in Godot 4.3+
---

# Localization in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **godot-ui** for Control nodes and theme management, **save-load** for persisting language settings, **responsive-ui** for layout adjustments per locale.

---

## 1. Core Concepts

### How Godot Localization Works

1. **Wrap all user-facing strings** in `tr()` — Godot's translation function
2. **Create translation files** (CSV or PO) mapping keys to translated strings
3. **Import translation files** as `Translation` resources
4. **Switch locale at runtime** via `TranslationServer.set_locale()`

All `Control` nodes with `text`, `tooltip_text`, or `placeholder_text` properties are automatically translated if the value matches a translation key.

### Translation Key Strategies

| Strategy | Example Key | Pros | Cons |
|----------|-------------|------|------|
| Semantic keys | `MENU_START_GAME` | Clear intent, easy to find | Need a default language fallback |
| English-as-key | `Start Game` | Readable code, no mapping file for English | Keys break if English text changes |

> **Recommendation:** Use semantic keys (`MENU_START_GAME`) for production projects. Use English-as-key only for prototypes or solo projects.

---

## 2. Translation Files

### CSV Format

The simplest format. First column is the key, subsequent columns are locale codes.

```csv
keys,en,cs,de,ja
MENU_START,Start Game,Začít hru,Spiel starten,ゲームスタート
MENU_OPTIONS,Options,Nastavení,Optionen,オプション
MENU_QUIT,Quit,Ukončit,Beenden,終了
PLAYER_HEALTH,Health: %d,Zdraví: %d,Gesundheit: %d,体力: %d
ITEM_COLLECTED,%s collected!,%s sebráno!,%s gesammelt!,%sを入手！
```

Save as `translations.csv` in your project. Godot auto-detects the format on import.

**Import settings** (Import dock):
- **Delimiter**: Comma (default) or Tab
- **Translations** section: enable/disable individual locales

### PO Format (Gettext)

Industry-standard format. Better for professional translation teams and tools like Poedit, Weblate, Crowdin.

**Create a POT template** (`messages.pot`):

```
msgid "MENU_START"
msgstr ""

msgid "MENU_OPTIONS"
msgstr ""

msgid "MENU_QUIT"
msgstr ""

msgid "PLAYER_HEALTH"
msgstr ""
```

**Create locale files** (e.g., `cs.po` for Czech):

```
msgid "MENU_START"
msgstr "Začít hru"

msgid "MENU_OPTIONS"
msgstr "Nastavení"

msgid "MENU_QUIT"
msgstr "Ukončit"

msgid "PLAYER_HEALTH"
msgstr "Zdraví: %d"
```

### Registering Translations

**Project Settings → Localization → Translations → Add...** → select your `.csv` or `.po` files.

Or register at runtime:

```gdscript
var translation := load("res://translations/cs.po") as Translation
TranslationServer.add_translation(translation)
```

```csharp
var translation = GD.Load<Translation>("res://translations/cs.po");
TranslationServer.AddTranslation(translation);
```

> ⚠️ **Changed in Godot 4.7:** `OptimizedTranslation.generate()` now returns `bool` (was `void`) to report success. GDScript-compatible and C# source-compatible, but binary-incompatible for C# — recompile precompiled plugins that call it. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

### POT Generation Hooks (Godot 4.7+)

A custom `EditorTranslationParserPlugin` can override the `_customize_strings()` virtual — called once after all files are parsed during POT generation — to add or remove entries from the final list of extracted strings:

```gdscript
@tool
extends EditorTranslationParserPlugin

func _customize_strings(strings: Array[PackedStringArray]) -> Array[PackedStringArray]:
    strings.append(PackedStringArray(["Test 1", "context", "test 1 plurals", "test 1 comment"]))
    # Drop internal strings that begin with "$".
    return strings.filter(func(s): return not s[0].begins_with("$"))
```

```csharp
#if TOOLS
using System.Linq;
using Godot;

public partial class CommentAwareParser : EditorTranslationParserPlugin
{
    public override Godot.Collections.Array<string[]> _CustomizeStrings(Godot.Collections.Array<string[]> strings)
    {
        strings.Add(new[] { "Test 1", "context", "test 1 plurals", "test 1 comment" });
        // Drop internal strings that begin with "$".
        return new Godot.Collections.Array<string[]>(strings.Where(s => !s[0].StartsWith("$")));
    }
}
#endif
```

> **Godot 4.7+:** The POT generator also extracts `Control.accessibility_name` and `accessibility_description`, so accessibility strings become translatable without listing them manually. ([GH-117134](https://github.com/godotengine/godot/pull/117134))

---

## 3. Using tr() in Code

### GDScript

```gdscript
# Basic translation
var label_text: String = tr("MENU_START")  # "Start Game" or translated equivalent

# With format arguments
var health_text: String = tr("PLAYER_HEALTH") % current_health
# "Health: 85" or "Zdraví: 85"

# With string arguments
var collected_text: String = tr("ITEM_COLLECTED") % item_name
# "Sword collected!" or "Meč sebráno!"

# Pluralization (Godot 4.x)
var count := 5
var msg: String = tr_n("ONE_ENEMY", "MANY_ENEMIES", count)
# Requires PO files with plural forms
```

### C#

```csharp
string labelText = Tr("MENU_START");
string healthText = string.Format(Tr("PLAYER_HEALTH"), currentHealth);

// Pluralization
string msg = TrN("ONE_ENEMY", "MANY_ENEMIES", count);
```

### Automatic Control Translation

`Label`, `Button`, `RichTextLabel`, and other Control nodes automatically translate their `text` property if it matches a translation key. Set the text to the key:

```
Button.text = "MENU_START"   → displays "Start Game" (en) or "Začít hru" (cs)
```

> **Tip:** If you don't want automatic translation on a specific Control, set its `auto_translate_mode` to `DISABLED`.

> **Godot 4.7+:** `Control.translation_context: StringName` sets a per-control translation context, used when translating the control's displayed text and when generating translation templates — the property equivalent of `tr()`'s context argument (C#: `TranslationContext`). ([GH-115340](https://github.com/godotengine/godot/pull/115340))

---

## 4. Switching Locale at Runtime

### GDScript

```gdscript
# Switch language
func set_language(locale_code: String) -> void:
    TranslationServer.set_locale(locale_code)
    # All Control nodes with translation keys update automatically

# Get current locale
var current: String = TranslationServer.get_locale()  # e.g. "en", "cs", "de"

# Get available locales
var locales: PackedStringArray = TranslationServer.get_loaded_locales()
```

### C#

```csharp
public void SetLanguage(string localeCode)
{
    TranslationServer.SetLocale(localeCode);
}

string current = TranslationServer.GetLocale();
```

### Language Selection Menu

```gdscript
extends Control

@onready var language_button: OptionButton = %LanguageButton

var _locales: Array[Dictionary] = [
    {"code": "en", "name": "English"},
    {"code": "cs", "name": "Čeština"},
    {"code": "de", "name": "Deutsch"},
    {"code": "ja", "name": "日本語"},
]

func _ready() -> void:
    for locale in _locales:
        language_button.add_item(locale["name"])

    # Set current selection
    var current_locale: String = TranslationServer.get_locale()
    for i in _locales.size():
        if _locales[i]["code"] == current_locale:
            language_button.selected = i
            break

    language_button.item_selected.connect(_on_language_selected)

func _on_language_selected(index: int) -> void:
    TranslationServer.set_locale(_locales[index]["code"])
    # Save preference — SettingsManager is a user-created autoload (see save-load skill)
    SettingsManager.set_setting("general", "locale", _locales[index]["code"])
```

---

## 5. Right-to-Left (RTL) Support

For Arabic, Hebrew, Persian, and other RTL languages.

### Enabling RTL

```gdscript
# On any Control node
control.layout_direction = Control.LAYOUT_DIRECTION_RTL

# Or set globally in Project Settings:
# Internationalization → Rendering → Text Direction → RTL
```

### Per-Control Settings

| Property | Purpose |
|----------|---------|
| `layout_direction` | `LTR`, `RTL`, `LOCALE` (auto from current locale), `INHERITED` |
| `text_direction` | On Label/RichTextLabel: override text direction |
| `structured_text_type` | Handle special structures (URLs, file paths, email) that shouldn't fully reverse |

### RichTextLabel BBCode for Mixed Direction

```gdscript
# Force LTR for a number or URL inside RTL text
rich_text.text = "النتيجة: [ltr]100/200[/ltr]"
```

### C# parity

```csharp
// LocaleAwarePanel.cs — flip layout direction whenever the locale changes.
using Godot;

public partial class LocaleAwarePanel : Control
{
    public override void _Ready()
    {
        ApplyLayoutForLocale();
        TranslationServer.Singleton.LocaleChanged += ApplyLayoutForLocale;
    }

    public override void _ExitTree()
    {
        // TranslationServer outlives every scene — without this unsubscribe,
        // each panel instance leaks a delegate reference for the lifetime of the process.
        TranslationServer.Singleton.LocaleChanged -= ApplyLayoutForLocale;
    }

    private void ApplyLayoutForLocale()
    {
        string locale = TranslationServer.Singleton.GetLocale();
        bool isRtl = TextServerManager.GetPrimaryInterface().IsLocaleRightToLeft(locale);
        LayoutDirection = isRtl
            ? Control.LayoutDirectionEnum.Rtl
            : Control.LayoutDirectionEnum.Ltr;
    }
}

// RichTextLabel mixed-direction example — same BBCode as GDScript, just assigned in C#.
public partial class ScoreLabel : RichTextLabel
{
    public void SetArabicScore(int score, int max)
    {
        BbcodeEnabled = true;
        Text = $"النتيجة: [ltr]{score}/{max}[/ltr]";
    }
}
```

### Font Requirements

RTL scripts need fonts that support the relevant Unicode ranges. Godot's default font does not cover Arabic/Hebrew. Import a font like Noto Sans Arabic and assign it via Theme.

---

## 6. Locale-Aware Formatting

### Numbers

```gdscript
# Format numbers with locale-appropriate separators
var formatted: String = "%d" % 1234567
# Always outputs "1234567" — GDScript doesn't locale-format numbers

# For locale-aware number formatting, use a helper:
func format_number(value: int) -> String:
    var s := str(value)
    var result := ""
    var count := 0
    for i in range(s.length() - 1, -1, -1):
        if count > 0 and count % 3 == 0:
            result = "," + result  # or "." for European locales
        result = s[i] + result
        count += 1
    return result
```

### Dates and Times

Godot doesn't provide built-in locale-aware date formatting. Use `Time.get_datetime_dict_from_system()` and format manually per locale.

### C#

```csharp
using Godot;
using System.Globalization;

public partial class LocaleFormatter : Node
{
    public string FormatNumber(double value)
    {
        var culture = CultureInfo.GetCultureInfo(TranslationServer.GetLocale().Replace("_", "-"));
        return value.ToString("N", culture);
    }

    // FormatCurrency and FormatDate follow the same pattern — same culture lookup,
    // ToString("C", culture) and ToString("d", culture) respectively.
}
```

---

## 7. Project Organization

### Recommended File Structure

```
res://
├── translations/
│   ├── game.csv           # Main game translations
│   ├── ui.csv             # UI-specific translations
│   └── items.csv          # Item names and descriptions
├── fonts/
│   ├── default_font.ttf   # Latin, Cyrillic
│   └── cjk_font.ttf       # Chinese, Japanese, Korean
└── themes/
    └── default_theme.tres  # Font assignments per locale if needed
```

### Translation Keys Convention

```
# Category_Context_Description
MENU_MAIN_START          # Main menu, start button
MENU_MAIN_QUIT           # Main menu, quit button
HUD_HEALTH_LABEL         # In-game HUD, health label
DIALOGUE_NPC_GREETING    # NPC dialogue, greeting line
ITEM_SWORD_NAME          # Inventory item name
ITEM_SWORD_DESC          # Inventory item description
```

---

## 8. Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Translation key shows instead of text | Translation file not registered in Project Settings | Add to Project Settings → Localization → Translations |
| Text doesn't update on locale switch | Using string literals instead of `tr()` | Wrap all user-facing strings in `tr()` |
| Label shows key after scene change | Translation resource not loaded yet | Register translations in Project Settings (not at runtime) |
| RTL text renders LTR | `layout_direction` not set | Set to `RTL` or `LOCALE` on root Control |
| Font doesn't display characters | Missing Unicode range in font | Import a font that covers the target script (Noto Sans recommended) |
| Pluralization doesn't work with CSV | CSV doesn't support plural forms | Use PO format for languages with complex plural rules |
| `%s` in translation shows literal `%s` | Using `tr()` result as key instead of formatting it | Use `tr("KEY") % value`, not `tr("KEY" % value)` |

---

## 9. Editor Locale Preview (Godot 4.5+)

Godot 4.5 adds a live locale preview to the editor. You can see how your UI looks in any configured locale — translated text, RTL layout, font changes — without running the game.

### How to Use

1. Open **Project → Project Settings → Internationalization**.
2. Find the **Preview Language** dropdown.
3. Select a locale from the list of registered translations (e.g., `ja`, `cs`, `ar`).
4. The editor viewport updates immediately to reflect the selected locale.

### Benefits

- Identify layout issues caused by longer translated text without entering Play mode.
- Verify RTL layout direction for Arabic, Hebrew, and Persian.
- Confirm that all Control nodes with text properties are properly wrapped in `tr()` keys (untranslated keys show up as-is in non-English preview).
- Faster translation QA — iterate directly in the editor.

> Reset to the default locale by selecting the blank or `en` entry in the **Preview Language** dropdown. The preview applies only in the editor and does not affect exported builds.

---

## 10. CSV Plural and Context Support (Godot 4.6+)

Godot 4.6 extends the CSV translation format with three optional header columns — `?context`, `?plural`, and `?pluralrule` — bringing context disambiguation and simple one/other plurals (previously PO-only) to CSV. For languages with three or more plural forms (Russian, Polish, Arabic), keep using PO format with full `msgstr[n]` plural arrays.

Column reference, example CSV, and `tr()` / `tr_n()` usage (GDScript + C#): [references/csv-plural-context.md](references/csv-plural-context.md).

---

## 11. Implementation Checklist

- [ ] All user-facing strings use `tr()` (or are set as translation keys on Control nodes)
- [ ] Translation files (CSV or PO) are registered in Project Settings → Localization → Translations
- [ ] Language can be switched at runtime via `TranslationServer.set_locale()`
- [ ] Language preference is saved and restored on game launch
- [ ] Fonts cover all target language character sets (Latin, CJK, Arabic, etc.)
- [ ] RTL languages have `layout_direction` set to `RTL` or `LOCALE` on root UI containers
- [ ] Format strings (`%s`, `%d`) are applied AFTER `tr()`, not before
- [ ] Translation keys follow a consistent naming convention
- [ ] UI layout adapts to longer/shorter text in different languages (no hardcoded widths)
- [ ] PO format is used for languages with complex plural rules
- [ ] Editor Locale Preview (Project Settings → Internationalization → Preview Language) is used for translation QA instead of test runs (Godot 4.5+)
- [ ] CSV `?context` column used when the same key has different meanings in different UI contexts (Godot 4.6+)
- [ ] CSV `?plural` / `?pluralrule` columns used for simple one/other plurals in CSV workflow; PO format used for languages with 3+ plural forms (Godot 4.6+)
