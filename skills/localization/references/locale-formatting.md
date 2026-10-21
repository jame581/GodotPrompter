> ← Back to [SKILL.md](../SKILL.md)

# Locale-Aware Formatting

## Numbers

```gdscript
# Locale-appropriate number formatting
var formatted: String = "%d" % 1234567
# Always outputs "1234567" — GDScript doesn't locale-format numbers

# Locale-aware formatting helper:
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

## Dates and Times

Godot has no built-in locale-aware date formatting — use `Time.get_datetime_dict_from_system()` and format manually per locale.

## C#

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

    // FormatCurrency/FormatDate follow the same pattern: same culture lookup with
    // ToString("C", culture) / ToString("d", culture).
}
```
