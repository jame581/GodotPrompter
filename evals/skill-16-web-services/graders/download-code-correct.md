---
type: llm
focus: last_message
---
Pass if any code shown uses Godot 4 APIs only (HTTPRequest with `download_file`, `request()`, `request_completed`, `get_downloaded_bytes()`, `get_body_size()`, `await`, `DirAccess`) and none of the Godot 3 forms (`yield`, `connect("signal", obj, "method")`, `download_file` set after `request()`, `HTTPClient` polling used where HTTPRequest suffices). Also pass if no code is shown. Fail if the code uses Godot 3 APIs or sets `timeout` to a fixed value as the fix for slow downloads.
