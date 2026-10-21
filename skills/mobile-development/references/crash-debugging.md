# Crash Debugging (Android)

Back to [Mobile Development](../SKILL.md).

Android native crashes (in the engine, GDExtensions, or plugins) surface as stripped, unsymbolicated stack traces. To turn them into readable function names you need **native debug symbols matching the exact build**.

## Getting debug symbols

- **Official templates** ship per-release native debug symbol zips — download the one matching your engine version and template (debug vs release, arch).
- **Custom engine builds:** add `debug_symbols=yes separate_debug_symbols=yes` to your SCons command (apply to the last arch built).

## Symbolicating a crash

- **Play Console:** upload the native debug symbols (App bundle explorer → Native debug symbols) and Google symbolicates ANR/crash reports automatically.
- **Locally** with the Android NDK:

```bash
ndk-stack -sym <path-to-symbols-dir> -dump crash.txt
```

`<path-to-symbols-dir>` holds the unstripped `.so` files; `crash.txt` is the captured logcat backtrace.

## Live debugging

Stream device logs over USB (or Wi-Fi `adb`):

```bash
adb logcat
```

Filter to the Godot tag to cut noise:

```bash
adb logcat -s godot
```

Watch for the `*** *** *** ***` fatal-signal banner — the frames below it are the crash backtrace to feed `ndk-stack`.
