---
type: llm
focus: last_message
---
The answer must use the Dialogue Manager 4 API, not version 3. Pass only if ALL hold: (1) the stable per-line key is read from `static_id` (C#: `StaticId`); (2) the answer does not tell the user to set `DialogueManager.translation_source`, `TranslationSource`, `DMConstants.TranslationSource` or any equivalent translation-backend property (removed in version 4 — lines always go through `tr()`, with the static ID as the key by default); (3) the code does not use the version 3 names `translation_key` / `TranslationKey`, `passed_title` / `PassedTitle`, `get_titles()` or `first_title`. Mentioning a version 3 name only to say it was renamed or removed is fine.
