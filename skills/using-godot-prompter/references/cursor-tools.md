# Cursor Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Cursor equivalent |
|-----------------|-------------------|
| `Read` (file reading) | `read_file` |
| `Write` (file creation) | `write_to_file` |
| `Edit` (file editing) | `edit_file` |
| `Bash` (run commands) | `run_terminal_command` |
| `Grep` (search file content) | `search_files` |
| `Glob` (search files by name) | `list_files` |
| `WebSearch` | `web_search` |
| `Task` tool (dispatch subagent) | No equivalent — single-session execution |

## Setup

Add GodotPrompter skills to your Cursor rules (`.cursorrules` or project settings) to make them available in the agent context.
