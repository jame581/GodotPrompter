> ← Back to [SKILL.md](../SKILL.md)

# CSV Plural and Context Support (Godot 4.6+)

Godot 4.6 extends the CSV translation format with three optional header columns that enable features previously only available in PO files.

## New CSV Columns

| Column header | Purpose |
|---------------|---------|
| `?context` | Disambiguates keys with the same string but different meanings (e.g. "file" as a noun vs. "to file" as a verb) |
| `?plural` | Provides the plural form of the string (for the source locale) |
| `?pluralrule` | CLDR plural rule index for the source locale (0 = one, 1 = other, etc.) |

## Example CSV with Context and Plural

```csv
keys,?context,?plural,en,cs,de
ITEM_FILE,noun,,File,Soubor,Datei
ITEM_FILE,verb,,File,Uložit,Ablegen
ENEMY_COUNT,,{n} enemies,{n} enemy / {n} enemies,{n} nepřítel / {n} nepřátelé,{n} Feind / {n} Feinde
```

## Using Context in Code

```gdscript
# Translate with context to disambiguate identical keys
var file_noun: String = tr("ITEM_FILE", "noun")    # "File" (object)
var file_verb: String = tr("ITEM_FILE", "verb")    # "File" (action)

# Without context — returns the first match for the key
var file_default: String = tr("ITEM_FILE")
```

```csharp
// Translate with context
string fileNoun = Tr("ITEM_FILE", "noun");
string fileVerb = Tr("ITEM_FILE", "verb");
```

## Using Plural in Code

```gdscript
# Pluralize with tr_n() — works with CSV plural columns in 4.6+
var enemy_count := 3
var msg: String = tr_n("ENEMY_COUNT", "ENEMY_COUNT", enemy_count)
# Godot substitutes the correct plural form based on the current locale's rules
```

```csharp
int enemyCount = 3;
string msg = TrN("ENEMY_COUNT", "ENEMY_COUNT", enemyCount);
```

> **When to use PO vs CSV:** If you only need context and simple one/other plural rules, the new CSV columns cover most cases. For languages with three or more plural forms (Russian, Polish, Arabic), continue using PO format with full `msgstr[n]` plural arrays.
