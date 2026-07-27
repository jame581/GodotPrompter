: << 'CMDBLOCK'
@echo off
REM Cross-platform polyglot wrapper for GodotPrompter hook scripts.
REM On Windows: cmd.exe runs the batch portion, which finds and calls bash.
REM On Unix: the shell treats this as a script (: is a no-op in bash).
REM
REM Adapted from the Superpowers plugin (MIT, Jesse Vincent).
REM https://github.com/obra/superpowers
REM
REM Hook scripts use extensionless filenames so Claude Code's Windows
REM auto-detection -- which prepends "bash" to any command containing .sh --
REM doesn't double-invoke them.
REM
REM NOTE: bash on PATH is often C:\Windows\System32\bash.exe (the WSL launcher),
REM which cannot resolve C:\... paths. Git for Windows bash is tried first.

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo run-hook.cmd: missing script name >&2
    exit /b 1
)

set "HOOK_DIR=%~dp0"

if exist "C:\Program Files\Git\bin\bash.exe" (
    "C:\Program Files\Git\bin\bash.exe" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b !ERRORLEVEL!
)
if exist "C:\Program Files (x86)\Git\bin\bash.exe" (
    "C:\Program Files (x86)\Git\bin\bash.exe" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b !ERRORLEVEL!
)

where bash >nul 2>nul
if !ERRORLEVEL! equ 0 (
    bash "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b !ERRORLEVEL!
)

REM No bash found - exit silently. The plugin degrades to pre-v1.13.0 behaviour
REM rather than breaking the user's session.
exit /b 0
CMDBLOCK

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
exec bash "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
