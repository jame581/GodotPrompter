---
type: llm
focus: last_message
weight: 2
---
Pass if the answer explains that HTTPRequest `timeout` limits the whole transfer (the total request time), not inactivity, so a large download on a slow connection hits it even while bytes keep arriving, AND advises leaving `timeout` at its default `0.0` (no timeout, or removing it) for large downloads, using a stall check instead (for example cancelling when `get_downloaded_bytes()` stops growing for a period) or a player cancel button. Fail if the answer only suggests raising the timeout to a larger fixed number, treats it as an idle/inactivity timeout, or does not say the timeout covers the whole transfer.
