---
type: llm
focus: last_message
---
Pass only if the dialog script hides one option and reveals the other with `turn_off_options(["AskKey"])` and `turn_on_options(["AskGarden"])`, each given an Array, or with the per-option equivalents `turn_off()` / `turn_on()` called on a `PopochiuDialogOption` (for example the `opt` argument or `get_option("AskGarden")`); `turn_off_forever_options([...])` / `turn_off_forever()` also counts for hiding. Fail if `turn_on_options` / `turn_off_options` is called with a bare string instead of an Array, or if the answer uses other method names such as `hide_option`, `show_option`, `enable_option`, `remove_option` or `set_option_visible`.
