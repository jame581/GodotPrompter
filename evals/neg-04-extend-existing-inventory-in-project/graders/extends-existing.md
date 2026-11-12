---
type: llm
focus: last_message
---
The project already has `ItemData` (scripts/inventory/item_data.gd, with `get_tooltip()`), `Inventory`, `ItemDatabase`, `InventorySlot` (sets `tooltip_text = item.get_tooltip()`) and item `.tres` files in data/items. Pass only if the answer (1) adds a rarity enum or equivalent with common/rare/epic as an `@export` on the existing `ItemData`, (2) shows it in the tooltip by changing `ItemData.get_tooltip()` or `InventorySlot`, and (3) builds on those existing classes. Fail if it introduces a parallel item class, a new inventory or slot system, or a new tooltip system instead of editing the existing ones, or if rarity is missing from the tooltip. The run is read-only, so an answer that says it could not write the files but shows the edits still passes; judge only the edits shown. Optional extras such as updating the .tres files or a colour do not matter.
