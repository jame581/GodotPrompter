# Debugging native code

Native (C++/Rust) extensions can't be stepped through with Godot's script debugger — you debug them like any other shared library, with the engine as the host process. Back to [GDExtension](../SKILL.md).

## Hot reload

`reloadable = true` in the `.gdextension` `[configuration]` block lets the editor reload the library when you recompile, without restarting the editor. This works in **debug builds only**. It's invaluable while iterating on a class, but turn it off (or simply ship release binaries) for exported games.

## Debug vs release libraries

The `[libraries]` keys carry a build-config feature tag:

```ini
[libraries]
windows.debug.x86_64 = "res://bin/gdexample.windows.template_debug.x86_64.dll"
windows.release.x86_64 = "res://bin/gdexample.windows.template_release.x86_64.dll"
```

- `template_debug` binaries carry debug symbols and assertions — load these while developing in the editor and in debug exports.
- `template_release` binaries are optimized — these must be present in a release export or the native node type won't exist at runtime.

Keep both built so the editor (debug) and your shipped game (release) each load the right one.

## Attaching a native debugger

Godot's tutorial doesn't ship a GDB/LLDB walkthrough; the implied path is to attach a native debugger to the running Godot process:

- Build the extension with **debug symbols** (`template_debug` / unoptimized).
- Launch the editor or game, then **attach** GDB (Linux), LLDB (macOS), or the Visual Studio / WinDbg debugger (Windows) to the `godot` / game process.
- Set breakpoints in your extension's source; trigger the code path from the game.
- On Windows you can also launch Godot as the debuggee directly from Visual Studio with your `.pdb` next to the `.dll`.

## Sanitizer builds

For memory and undefined-behaviour bugs, build the extension (and ideally a matching Godot) with sanitizers enabled — e.g. `-fsanitize=address` / `-fsanitize=undefined` via your SCons/CMake flags — then run the game under that build to catch use-after-free, out-of-bounds, and UB that a normal debugger would miss.
