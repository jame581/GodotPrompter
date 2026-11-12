---
name: godot-grill
description: Use when a new Godot system or feature has open design decisions — asks them in batched rounds, each with a recommended answer, and records them before any design or code. Triggers on "grill me", "ask me first", "question me on the design", "what do I need to decide before building". Not for choosing nodes or APIs, bug fixes, or non-Godot work.
---

# Godot Grill

Settle the decisions only the developer can make, before anyone designs a scene tree or writes
code. The output is a **decision record**, not a design.

> **Related skills:** **godot-brainstorming** for the scene tree, signal map, and plan once decisions are settled, **scene-organization** for composition vs. inheritance trade-offs, **godot-mentor** for teaching-mode delivery of what follows.

## 1. Decisions, not facts

Ask only what **only the user knows**: intent, constraints, priorities, taste.

Node types, API signatures, and version differences are **facts**. Look them up
(`godot-brainstorming/references/node-selection.md`, the domain skills), decide, and record the
choice. Never spend a question on one.

Architecture choices — data home, state representation, save format — are decided **from** the
user's answers, not asked as technology picks. Ask the constraint behind them ("will designers
edit items in the Inspector?"), then map the answer to Resource `.tres` yourself.

| Question | Verdict |
|---|---|
| "Throwaway prototype, or a system other code builds on?" | Decision — ask |
| "Should the player be a `CharacterBody2D` or a `RigidBody2D`?" | Fact — decide, record it |
| "When two clients disagree, who is right?" | Decision — ask |
| "Can a `Tween` chain steps in 4.3?" | Fact — never ask |

## 2. The seeded dependency tree

Four roots have no prerequisites:

| Root | Options |
|---|---|
| **Scope** | throwaway slice / one feature / a system others build on |
| **Dimension** | 2D / 3D / 2.5D |
| **Language** | GDScript / C# / both |
| **Authority** | single-player / networked (and if networked, who is authoritative) |

| Settling this… | …unblocks |
|---|---|
| Scope | prunes branches: a throwaway slice skips persistence, data home, networking, and testing |
| Authority | state ownership (source of truth); signals vs. RPCs |
| Dimension | physics model; camera model |
| Language | interop boundary, when the answer is "both" |
| Scope + Dimension | entity model: composition vs. inheritance |
| Entity model | data home (Resource `.tres` / autoload / node-local `@export`); communication (signals up, calls down / EventBus / DI) |
| Authority + Entity model | state representation (enum FSM / node FSM / AnimationTree / none); persistence boundary |
| Data home + Persistence | save format (ConfigFile / JSON / Resource serialization) |

The right-hand column names what an answer lets **you** decide; ask the user the constraint
behind it, never the technology. The tree is a **seed, not a script**. Answers grow it — "networked" creates branches a
single-player answer never does. Skip any root the request or the project already answers
(`project.godot`, existing scripts). Most sessions visit few nodes.

## 3. Rounds

**Before round 1**, read where the project keeps decision records, checking in order: the user's
instructions or the project's agent instructions file (`CLAUDE.md`, `AGENTS.md`, …); then an
existing decisions or ADR directory. A recorded decision is a settled prerequisite: never re-ask
it; start the frontier past it.

The **frontier** is every open decision whose prerequisites are settled. Ask **at most 4** of
them per round, the ones that prune the most first; the rest move to the next round. Every
question has a recommended answer.

**Interactive rounds.** Ask a round with your question tool only if all of these hold:
(a) a tool whose job is to ask the user a multiple-choice question (Claude Code `AskUserQuestion`,
OpenCode `question`, Codex `request_user_input`, Copilot `ask_user`, Cursor "Ask questions", Grok
`ask_user_question`) is in the tool list you were given this turn (a tool your host lists only by name, a deferred
tool, counts as listed: load it the way the host loads deferred tools; that is not searching); (b) you were not launched by
another agent or given this task as a delegated brief; (c) this is a normal chat with the person,
not a one-shot or scripted run. Do not search for the tool or call it to test it. If it is not in
your tool list, or a call returns an error, a skip or a cancel, print this round as numbered text
(unless the reply answers it or takes the off-ramp, §4) and keep using text for the rest of the grill.

In the tool, each question gets 2–4 options, every one a real answer to the decision. The
recommended answer is the **first** option, its label ending in "(Recommended)" and its one-clause
reason in the description. Keep headers within 12 characters. Do not add an "Other" or "skip"
option: the host supplies the custom answer, and a typed or custom answer is how the user
overrules you or takes the off-ramp. Hosts whose limits are unverified get the same caps. If the
tool takes one question per call, call it once per question in the round. Set `multiSelect` only
when the decision allows several answers.

**Text rounds** — no tool, a subagent, or a non-interactive run — number the questions in one
message:

```text
❓ **Q1** — **<title>**: <the question, with its options>

➡️ <recommended answer, and why in one clause>
```

Then stop and wait. A question whose prerequisite is still open belongs to a later round.
Everything you ask is in the numbered list: no closing "also, what genre…?" after it. Anything
worth asking gets a number and a ➡️; anything else waits for the next round.

**After each round's answers**, on either path, print a compact **Decided so far** table —
decision → answer → (recommended | alternative | custom) — then derive the next frontier. The
table never ends on a question; the next round asks them.

**Round 1 is small and settles scope first** — scope prunes the most tree. A "throwaway slice"
answer commonly ends the session at round 2.

After each round, re-derive the frontier from the answers. If an answer contradicts a recorded
decision, say so and ask whether to reopen it — never overwrite a record silently.

## 4. Ending the grill

The grill ends when the frontier is empty, or on the **off-ramp**: "just build it" / "skip the
questions" / "stop grilling", in any round, including the first message. Then stop asking, and
**list every assumption you are now making** for the open decisions, where the user can scan
and overrule them.

**On the off-ramp there are no confirmation or approval gates:** list the assumptions, write the
record, and build — with the matching domain skill, or `godot-brainstorming` from Step 2 without
its per-section check-ins.

**When the frontier empties**, write the record (§5), confirm shared understanding in one
message, and wait. Then hand off:

- it needs a scene tree, signal map, or plan → `godot-brainstorming`, from Step 2
- it is a single known change → the matching domain skill

## 5. The decision record

GodotPrompter has no decisions folder of its own. Write the record where this project keeps
them, checking in order: the user's instructions or the project's agent instructions file
(`CLAUDE.md`, `AGENTS.md`, …); then an existing decisions or ADR directory. If none applies, ask
the user, suggesting `docs/decisions/`, or use `docs/decisions/` when you cannot ask (a subagent
or non-interactive run). Name the file `YYYY-MM-DD-<topic>.md`. The path must stay stable: the
next grill reads it back.

```markdown
# <Topic> — decisions

| Decision | Choice | Why | Revisit when |
|---|---|---|---|
| Bag model | Fixed 20 slots | Grid UI already designed | a weight system is wanted |
| Item data | Resource `.tres` | Inspector editing, typed exports | items exceed ~200 |

## Open / deferred
- Equipment stat aggregation — deferred to a later pass.
- Save slots — **assumed** 1 (off-ramp); revisit before shipping.
```

`Revisit when` keeps a decision reopenable, not binding. Off-ramp assumptions go under
**Open / deferred**, marked **assumed**. If you cannot write files, put the record in your final
message instead.

## 6. Anti-patterns

| Anti-pattern | Why it is wrong | Instead |
|---|---|---|
| One question per round | Order fixed in advance; questions arrive before their prerequisites; more turns | Ask the frontier, up to 4 per round; a tool that takes one question per call asks the round as consecutive calls |
| An "Other" or "skip" option in the question tool | Wastes a slot; the host already offers a custom answer | Every option a real answer, recommended first |
| Asking a fact | Spends the user's attention on the model's job | Look it up, decide, record |
| A question with no recommendation | The user answers in a vacuum; rounds slow down | Every question gets ➡️, or a first option marked "(Recommended)" |
| A trailing question outside the numbered list | It has no recommendation and is easy to miss when answering by number | Number it or put it in the tool call, or hold it for the next round |
| Grilling a bug fix or an explicit ask | The over-correction this skill must not become | Route to the domain skill |
| Re-asking a recorded decision | Feels like amnesia; wastes the record | Read where the project keeps decision records first |
| Coding after the last answer | Skips the shared-understanding check | Confirm, then hand off |

## Checklist

- [ ] Read existing decision records before round 1
- [ ] Round 1 settled scope first
- [ ] Every question is a decision, with a recommended answer (numbered, or first option "(Recommended)")
- [ ] Frontier asked up to 4 per round (question tool when listed, else numbered text); waited after each
- [ ] "Decided so far" table printed after each round
- [ ] Off-ramp taken → assumptions listed
- [ ] Record written (or in the final message when files cannot be written)
- [ ] Frontier emptied → user confirmed before design or code; off-ramp → no gates, built on the listed assumptions
