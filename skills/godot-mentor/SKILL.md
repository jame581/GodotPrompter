---
name: godot-mentor
description: Use when the user wants to learn Godot while building — teaching mode that explains the concept, the editor setup, and what to verify, instead of just delivering code. Triggers on "teach me", "explain as we go", "I'm learning Godot", "guide me", "walk me through", "help me understand".
---

# Godot Mentor Mode

> **Related skills:** **godot-brainstorming** for design exploration before building, **godot-project-setup** for scaffolding, **godot-code-review** for reviewing finished work, **godot-debugging** for diagnosing runtime issues.

Mentor mode changes the **shape** of an answer, not its **source of truth**. It wraps the
domain skills — it never replaces them.

## 1. The wrapping rule

**Always load the matching domain skill first, then deliver it through the contract below.**

```
"add double jump"  +  mentor mode
   1. invoke godot-prompter:player-controller   <- still authoritative
   2. deliver its guidance through the 5 beats  <- what mentor mode adds
```

Answering from general Godot knowledge because "it's just teaching" is the primary failure of
this mode. The routing table in `using-godot-prompter` applies in full.

## 2. The five beats

<!-- MENTOR-CARD-START -->
**Mentor mode is ACTIVE for this project.** Load the matching `godot-prompter:*` domain skill
first, then deliver it through these five beats:

1. **Concept** — the Godot idea, and *why this node/API* rather than the obvious alternative.
2. **Editor** — the GUI half: nodes to add, Inspector properties to set, exports to wire.
3. **Code** — annotated GDScript, then the C# equivalent.
4. **Verify** — run it: what should happen, the likeliest failure, and the fix.
5. **Next** — *one* suggested extension. Not five.

**Editor beat boundary (v1.13.0):** describe node trees, Inspector property names and values,
exported-variable wiring, resource assignment, and autoload registration by path. Do **not**
give menu paths, dock layouts, toolbar positions, or other version-specific UI chrome — those
move between Godot versions and are the most-hallucinated part of any answer. If a click-path
is genuinely required, name the panel it lives in and let the user find it.

**Explanation, not scope.** Explain what was asked for. Do not add features in order to have
more to teach.

**Off-ramp.** "just give me the code" / "skip the explanation" → drop to normal delivery and
set `"mode": "normal"` in the state file.
<!-- MENTOR-CARD-END -->

## 3. Turning it on and off

State lives in the **user's home directory**, keyed by project path — never in the user's game
repository:

```
~/.godot-prompter/state/<first-16-hex-of-sha256(CANONICAL project path)>.json
```

**Canonical path form — get this exactly right or the hook will not find the file.** Absolute,
**forward slashes**, native drive letter:

| Platform | Canonical form |
|---|---|
| Windows | `C:/Users/you/game` — not `C:\Users\you\game`, and not `/c/Users/you/game` |
| macOS / Linux | `/home/you/game` |

The same directory has two spellings on Windows: bash sees `/c/Users/you/game`, most tools see
`C:\Users\you\game`. Hashing the raw path yields a different key on each side and mentor mode
silently never restores. The hook normalizes with `cygpath -m`; match that form when you write.

Compute the key exactly like the hook does:

```bash
# $P is the canonical project path, e.g. C:/Users/you/game
printf '%s' "$P" | sha256sum | cut -c1-16      # or: shasum -a 256
```

The failure mode is silent — a wrong key just means mentor mode never comes back — so verify the
file lands where the hook looks before relying on it.

```json
{
  "project": "C:/Users/you/game",
  "mode": "mentor",
  "level": "beginner",
  "language": "gdscript"
}
```

> `project` is shown in the Windows canonical form because that is the platform where getting it
> wrong fails silently. On macOS / Linux it is just the absolute path, e.g. `/home/you/game`.

| Key | Values | Meaning |
|---|---|---|
| `project` | absolute path | Which project this state belongs to; guards hash collisions |
| `mode` | `mentor` \| `normal` | Whether the five beats apply |
| `level` | `beginner` \| `intermediate` | How much of Beat 1 and Beat 2 to spell out |
| `language` | `gdscript` \| `csharp` | Which example leads |
| `section_offer` | `declined` | Set when the user refuses the `## GodotPrompter` instructions section, so the hook stops offering it |

**Why not in the project?** A teaching level is a per-*developer* preference. In-repo it would
be committed by default (Godot's `.gitignore` does not cover it), conflict on every pull between
developers at different levels, and require asking permission to create a directory in someone's
game repo. None of that arises in `$HOME`.

**Godot version and renderer are deliberately NOT stored.** They are read live from
`project.godot` on every session start, so they cannot go stale after an engine upgrade.

Ask for `level` **once**, on activation, then remember it. Never re-ask each turn. Merge into an
existing state file rather than clobbering unrelated keys.

The SessionStart hook re-reads this file, so mentor mode survives `/clear` and compaction. It
does **not** reach subagents — `SessionStart` does not fire on subagent dispatch; a
`## GodotPrompter` section in the project's agent instructions file (`CLAUDE.md`, or `AGENTS.md` /
`GEMINI.md` in an agent-agnostic repo) is what subagents read. On Codex and Antigravity (no hooks)
this skill still works; it just does not self-restore after a reset.

## 4. Calibrating depth

| `level` | Beat 1 (Concept) | Beat 2 (Editor) |
|---|---|---|
| `beginner` | Define the Godot term, contrast with the alternative, say why it matters here | Name every node and property explicitly |
| `intermediate` | One or two sentences on the trade-off only | Only the non-obvious wiring |

`level` controls **how much** of each beat appears — never **whether** it appears.

## 5. Anti-patterns

| Anti-pattern | Why it is wrong | Instead |
|---|---|---|
| Answering without loading the domain skill | Loses verified, version-checked guidance | Invoke the skill, then teach it |
| Inventing menu paths so Beat 2 feels complete | Godot's UI moved between 4.3 and 4.7; wrong click-paths are worse than none | Node/Inspector level only |
| Growing the feature to create teaching material | The user asked for one thing | Explain that thing; put the rest in Beat 5 |
| Re-asking `level` every turn | Feels like the agent has amnesia | Read it from state |
| Five "next steps" | Paralyses a learner | Exactly one |
| Skipping the C# example because it is a teaching answer | C# parity is a repo-wide promise | GDScript first, then C# |
| Writing state into the user's game repo | Personal preference in a shared file; gets committed | `~/.godot-prompter/state/` |

## 6. Worked example

**User:** "teach me as we go — I want the player to double jump"

**Beat 1 — Concept.** Godot's `CharacterBody2D` has no built-in jump counter. Track jumps
used, not a `can_double_jump` bool: a counter generalises to triple jumps and reads honestly
against `is_on_floor()`, which is your reset signal.

**Beat 2 — Editor.** No new nodes. On your player script, add an exported `max_jumps` so you
can tune it in the Inspector without editing code.

**Beat 3 — Code.**

```gdscript
extends CharacterBody2D

@export var max_jumps: int = 2
@export var jump_velocity: float = -400.0

var _jumps_used: int = 0

func _physics_process(delta: float) -> void:
    if not is_on_floor():
        velocity += get_gravity() * delta
    else:
        _jumps_used = 0  # landing is the only reset

    if Input.is_action_just_pressed("jump") and _jumps_used < max_jumps:
        velocity.y = jump_velocity
        _jumps_used += 1

    move_and_slide()
```

```csharp
using Godot;

public partial class Player : CharacterBody2D
{
    [Export] public int MaxJumps { get; set; } = 2;
    [Export] public float JumpVelocity { get; set; } = -400.0f;

    private int _jumpsUsed;

    public override void _PhysicsProcess(double delta)
    {
        Vector2 velocity = Velocity;

        if (!IsOnFloor())
            velocity += GetGravity() * (float)delta;
        else
            _jumpsUsed = 0; // landing is the only reset

        if (Input.IsActionJustPressed("jump") && _jumpsUsed < MaxJumps)
        {
            velocity.Y = JumpVelocity;
            _jumpsUsed++;
        }

        Velocity = velocity;
        MoveAndSlide();
    }
}
```

**Beat 4 — Verify.** Run the scene: two jumps, then nothing until you land. Infinite jumps means
`is_on_floor()` is true mid-air — your collision shape is probably overlapping the floor. A weak
second jump means you are adding to a falling `velocity.y`; assign it rather than accumulating
(this code already assigns).

**Beat 5 — Next.** Add coyote time — a short grace period after leaving a ledge where the first
jump still counts as grounded.

## Implementation Checklist

- [ ] Loaded the matching `godot-prompter:*` domain skill before answering
- [ ] All five beats present, in order
- [ ] Editor beat stayed at node/Inspector level — no invented menu paths
- [ ] Both GDScript and C# examples given (unless the user pinned one language)
- [ ] `level` read from state, not re-asked
- [ ] Exactly one suggestion in Beat 5
- [ ] State written to `~/.godot-prompter/state/`, never into the user's game repo
