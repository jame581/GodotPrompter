> ← Back to [SKILL.md](../SKILL.md)

# CSV Plural and Context Support (Godot 4.6+)

Godot 4.6 extends the CSV translation format with two optional header columns (`?context`, `?plural`) and an optional `?pluralrule` row, enabling features previously only available in PO files.

## New CSV Columns and Rows

| Addition | Purpose |
|----------|---------|
| `?context` column | Disambiguates identical keys with different meanings (e.g. "file" as a noun vs. "to file" as a verb) |
| `?plural` column | The plural source string for that key (PO's `msgid_plural`); further plural forms go on the following rows, with an empty key |
| `?pluralrule` row (key in the first column) | Optional per-locale gettext rule override, e.g. `nplurals=2; plural=(n >= 2);` in that locale's column |

## Example CSV with Context and Plural

Each locale column holds its first plural form on the key's row and one more form per continuation row. Czech has three forms, so it needs two continuation rows; English and German need one.

```csv
keys,?context,?plural,en,cs,de
ITEM_FILE,noun,,File,Soubor,Datei
ITEM_FILE,verb,,File,Uložit,Ablegen
ENEMY_COUNT,,ENEMY_COUNT_PLURAL,%d enemy,%d nepřítel,%d Feind
,,,%d enemies,%d nepřátelé,%d Feinde
,,,,%d nepřátel,
```

## Using Context in Code

```gdscript
# Translate with context to disambiguate identical keys
var file_noun: String = tr("ITEM_FILE", "noun")    # "File" (object)
var file_verb: String = tr("ITEM_FILE", "verb")    # "File" (action)

# Without context there is no match: tr() returns the key itself ("ITEM_FILE")
var file_default: String = tr("ITEM_FILE")
```

```csharp
// Translate with context
string fileNoun = Tr("ITEM_FILE", "noun");
string fileVerb = Tr("ITEM_FILE", "verb");
```

## Using Plural in Code

```gdscript
# tr_n() picks the plural form for the current locale; you format the number in yourself.
var enemy_count := 3
var msg: String = tr_n("ENEMY_COUNT", "ENEMY_COUNT_PLURAL", enemy_count) % enemy_count
```

```csharp
int enemyCount = 3;
string msg = TrN("ENEMY_COUNT", "ENEMY_COUNT_PLURAL", enemyCount).Replace("%d", enemyCount.ToString());
```

> **When to use PO vs CSV:** CSV now covers context and plurals for any number of plural forms — add one continuation row per extra form. Control auto-translation skips context and plural rows, so translate those strings in code with `tr()` / `tr_n()`. PO remains the better fit for translator tooling and comments.
