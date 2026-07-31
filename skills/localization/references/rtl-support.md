> ← Back to [SKILL.md](../SKILL.md)

# Right-to-Left (RTL) Support

For Arabic, Hebrew, Persian, and other RTL languages.

## Enabling RTL

```gdscript
# On any Control node
control.layout_direction = Control.LAYOUT_DIRECTION_RTL

# Or set globally in Project Settings:
# Internationalization → Rendering → Text Direction → RTL
```

```csharp
// On any Control node — note the enum is nested, not a flat constant.
control.LayoutDirection = Control.LayoutDirectionEnum.Rtl;

// Usually better than hard-coding Rtl: derive it from the app's own locale.
// (LayoutDirectionEnum.Locale is DEPRECATED — it is an alias for this one.)
control.LayoutDirection = Control.LayoutDirectionEnum.ApplicationLocale;

// The Project Settings route is identical:
// Internationalization → Rendering → Text Direction → RTL
```

## Per-Control Settings

| Property | Purpose |
|----------|---------|
| `layout_direction` | `INHERITED`, `APPLICATION_LOCALE` (auto, from the loaded translation), `LTR`, `RTL`, `SYSTEM_LOCALE` (auto, from the OS). `LOCALE` is **deprecated** — it is an alias for `APPLICATION_LOCALE` |
| `text_direction` | On Label/RichTextLabel: override text direction |
| `structured_text_type` | Handles special structures (URLs, paths, email) that shouldn't fully reverse |

## RichTextLabel BBCode for Mixed Direction

```gdscript
# Force LTR for a number or URL inside RTL text
rich_text.text = "النتيجة: [ltr]100/200[/ltr]"
```

```csharp
// Same BBCode from C# — it is markup in the string, not an API difference.
// BbcodeEnabled must be true or the tag renders literally.
richText.BbcodeEnabled = true;
richText.Text = "النتيجة: [ltr]100/200[/ltr]";
```

## Reacting to a locale change

`TranslationServer` has **no signals** — there is nothing to connect to. Godot delivers
`NOTIFICATION_TRANSLATION_CHANGED` (defined on `MainLoop` and inherited by `Node`) instead, so
override `_notification` and re-apply layout from there. Because you never subscribed, there is
no handler to disconnect and nothing to leak when the scene is freed.

```gdscript
# locale_aware_panel.gd — flip layout direction on locale change.
extends Control

func _ready() -> void:
    _apply_layout_for_locale()


func _notification(what: int) -> void:
    if what == NOTIFICATION_TRANSLATION_CHANGED:
        _apply_layout_for_locale()


func _apply_layout_for_locale() -> void:
    var locale := TranslationServer.get_locale()
    var is_rtl := TextServerManager.get_primary_interface().is_locale_right_to_left(locale)
    layout_direction = Control.LAYOUT_DIRECTION_RTL if is_rtl else Control.LAYOUT_DIRECTION_LTR
```

```csharp
// LocaleAwarePanel.cs — flip layout direction on locale change.
using Godot;

public partial class LocaleAwarePanel : Control
{
    public override void _Ready() => ApplyLayoutForLocale();

    // TranslationServer exposes NO signals — react to the engine notification instead.
    // Nothing to subscribe to means nothing to unsubscribe from, so there is no handler
    // to leak when the scene is freed.
    public override void _Notification(int what)
    {
        if (what == NotificationTranslationChanged)
            ApplyLayoutForLocale();
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
```

## Font Requirements

RTL scripts need fonts covering the relevant Unicode ranges — Godot's default font doesn't cover Arabic/Hebrew. Import Noto Sans Arabic (or similar) and assign via Theme.
