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

## Per-Control Settings

| Property | Purpose |
|----------|---------|
| `layout_direction` | `LTR`, `RTL`, `LOCALE` (auto from current locale), `INHERITED` |
| `text_direction` | On Label/RichTextLabel: override text direction |
| `structured_text_type` | Handles special structures (URLs, paths, email) that shouldn't fully reverse |

## RichTextLabel BBCode for Mixed Direction

```gdscript
# Force LTR for a number or URL inside RTL text
rich_text.text = "النتيجة: [ltr]100/200[/ltr]"
```

## C# parity

```csharp
// LocaleAwarePanel.cs — flip layout direction on locale change.
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
        // TranslationServer outlives every scene — without this, each panel
        // leaks a delegate reference for the process lifetime.
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

// RichTextLabel mixed-direction — same BBCode as GDScript, assigned in C#.
public partial class ScoreLabel : RichTextLabel
{
    public void SetArabicScore(int score, int max)
    {
        BbcodeEnabled = true;
        Text = $"النتيجة: [ltr]{score}/{max}[/ltr]";
    }
}
```

## Font Requirements

RTL scripts need fonts covering the relevant Unicode ranges — Godot's default font doesn't cover Arabic/Hebrew. Import Noto Sans Arabic (or similar) and assign via Theme.
