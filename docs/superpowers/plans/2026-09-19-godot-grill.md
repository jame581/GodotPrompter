# godot-grill Implementation Plan

**Status:** shipped in v1.14.0 (2026-09-20)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `godot-grill`, a skill that settles a Godot feature's open design decisions in batched frontier rounds (scope first, each question with a recommended answer) and records them, and route new-or-unclear work through it.

**Architecture:** One new process skill (`skills/godot-grill/SKILL.md`, no GDScript/C# — so no parity work) plus wiring: the SessionStart card's gate row retargets from `godot-brainstorming` to `godot-grill`, and `godot-brainstorming` Step 1 delegates to it. Behaviour is checked with `claude plugin eval` cases written first (red), then re-run after the skill exists (green).

**Tech Stack:** Markdown skills; Node validator (`scripts/validate-skills.mjs`), `npm test`, `claude plugin eval`.

**Spec:** `docs/superpowers/specs/2026-08-13-godot-grill-design.md`

## Global Constraints

- `SKILL.md` under 16 KB (validator error at ≥ 16 KB); the drafted skill is ~7 KB.
- SessionStart card (`SESSION-CARD` region) ≤ 3 KB (3072 bytes); currently 2889. The gate-row edit must keep it under.
- Never paste the `SESSION-CARD` / `MENTOR-CARD` marker strings into a fenced example (`card-marker-duplicate`).
- `skills/index.json` is generated — run `npm run build:skill-index` after adding the skill or changing a Related-skills line; never hand-edit it.
- No agent or `.codex/` changes, no hook changes (spec: Integration points).
- Do not touch `bump-version.mjs`, manifest descriptions, or `docs/token-budget.md` — the skill count (55 → 56) is synced at release by `bump-version.mjs` and the token table is regenerated at release (CONTRIBUTING step 2).
- Scanner rule: never write a full-access sandbox mode, a never-ask approval policy, or a bypass approval mode literally in any `.md` (validator `scanner-risky-approval`).
- Eval runs: always `--judge-model sonnet --no-publish`. Grill cases are prefixed `grill-`; the mentor suite is `--case "0*"`.

## File map

| File | Task | Responsibility |
|---|---|---|
| `evals/grill-01-new-system/` | 1 | Should-fire case: round 1 shape |
| `evals/grill-02-skip-questions/` | 1 | Off-ramp in the first message: no questions, assumptions stated |
| `evals/grill-03-neg-bugfix/` | 1 | Must-not-fire: a bug fix routes straight to work |
| `evals/GRILL.md` | 1, 6 | Grill eval baseline and results |
| `evals/FOLLOWUPS.md` | 1 | Mentor run command gains `--case "0*"` |
| `skills/godot-grill/SKILL.md` | 2 | The skill |
| `skills/index.json` | 2, 3 | Regenerated |
| `skills/using-godot-prompter/SKILL.md` | 3 | Card gate row, Core/Process list, Workflow §1 |
| `skills/godot-brainstorming/SKILL.md` | 3 | Step 1 delegates; Related skills line |
| `README.md` | 4 | Counts and Core/Process table |
| `CHANGELOG.md` | 4 | Unreleased → Added |
| `tests/agent-integration/TEST_PLAN.md` | 5 | Category 6: off-ramp, record shortens the grill |

---

### Task 1: Grill eval cases (red)

**Files:**
- Create: `evals/grill-01-new-system/prompt.md` and `graders/{trigger-grill,scope-first,numbered-recommended,no-fact-questions,no-code-yet}.md`
- Create: `evals/grill-02-skip-questions/prompt.md` and `graders/{trigger-grill,no-questions,assumptions-stated}.md`
- Create: `evals/grill-03-neg-bugfix/prompt.md` and `graders/{trigger-grill,no-questions,fixes-bug}.md`
- Create: `evals/GRILL.md`
- Modify: `evals/FOLLOWUPS.md` (run command)

**Interfaces:**
- Produces: case names `grill-01-new-system`, `grill-02-skip-questions`, `grill-03-neg-bugfix`; grader `trigger-grill` matches Skill input `godot-grill` (Task 2 must name the skill exactly that).

- [ ] **Step 1: Write case grill-01 (should fire)**

`evals/grill-01-new-system/prompt.md`:

```markdown
---
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
I want to add an inventory to my Godot game. Grill me on the design before we build anything.
```

`graders/trigger-grill.md`:

```markdown
---
type: tool_used
tool: Skill
input_match: godot-grill
---
```

`graders/scope-first.md`:

```markdown
---
type: llm
focus: last_message
---
Pass if the answer asks the user about scope (throwaway prototype / one feature / a system other code will build on, or equivalent wording) in this message, and asks at most about 5 questions in total. Fail if it asks no scope question, or asks more than about 5 questions at once.
```

`graders/numbered-recommended.md`:

```markdown
---
type: llm
focus: last_message
---
Pass if the questions are numbered (Q1, Q2, … or 1., 2., …) and EVERY question carries a recommended answer the user could accept as-is. Fail if any question has no recommendation, or if the answer asks a single unnumbered question and waits.
```

`graders/no-fact-questions.md`:

```markdown
---
type: llm
focus: last_message
---
Pass if every question asks about something only the user can know — intent, constraints, priorities, taste (e.g. scope, grid vs. list, stacking rules, whether items persist). Fail if any question asks the user to choose a Godot node type, class, or API (e.g. "Control or Node2D?", "Resource or Dictionary?", "ItemList or GridContainer?") — those are facts the assistant should decide.
```

`graders/no-code-yet.md`:

````markdown
---
type: regex
target: last_message
match: not_contains
---
```gdscript
````

- [ ] **Step 2: Write case grill-02 (off-ramp in the first message)**

`evals/grill-02-skip-questions/prompt.md`:

```markdown
---
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
Design a save system for my Godot 4 platformer. Skip the questions and just build it — make whatever calls you need.
```

`graders/no-questions.md`:

```markdown
---
type: llm
focus: last_message
weight: 2
---
The user said to skip the questions. Pass if the answer asks the user no design questions and proceeds to a design or implementation. A closing offer ("want me to adjust X?") is not a design question. Fail if it asks the user to decide anything before proceeding.
```

`graders/assumptions-stated.md`:

```markdown
---
type: llm
focus: last_message
---
Pass if the answer explicitly lists the design assumptions it made on the user's behalf (e.g. save format, what gets saved, number of slots, where files live), as a list or table the user can scan and overrule. Fail if the assumptions are only implicit in the code.
```

Also copy `graders/trigger-grill.md` from grill-01 into this case unchanged. The grill **may** fire here (§4 handles an off-ramp in the first message); what matters is that it asks nothing.

- [ ] **Step 3: Write case grill-03 (must not fire)**

`evals/grill-03-neg-bugfix/prompt.md`:

```markdown
---
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
I ported my player from Godot 3 to Godot 4.3 and `velocity = move_and_slide(velocity)` now errors. What's wrong?
```

`graders/no-questions.md`:

```markdown
---
type: llm
focus: last_message
weight: 2
---
This is a bug report with enough information to answer. Pass if the answer diagnoses and fixes it without first asking the user design questions. Fail if it opens a questioning round (numbered design questions, scope questions) instead of answering.
```

`graders/fixes-bug.md`:

```markdown
---
type: llm
focus: last_message
---
Pass if the answer identifies that Godot 4's move_and_slide() takes no arguments (velocity is a property set before the call) and shows the corrected call. Fail otherwise.
```

Also copy `graders/trigger-grill.md` from grill-01 into this case unchanged. A `tool_used: Skill` grader is a with-arm-only **indicator** and never scored; on this case the desired reading is `Skill called 0x` (it prints as ✗ — the same as `trigger-mentor` on the mentor negatives 06/07). Any call count above 0 means the description over-triggers.

- [ ] **Step 4: Point the mentor run command at mentor cases only**

In `evals/FOLLOWUPS.md`, replace the run command block with:

````markdown
```
claude plugin eval . --case "0*" --ablation with-without --judge-model sonnet --no-publish
```
````

- [ ] **Step 5: Run the grill cases to confirm red**

Run: `claude plugin eval . --case "grill-*" --ablation with-without --judge-model sonnet --no-publish`
Expected (≈ 18 runs, ≈ $5, ≈ 15 min; exit code 1 is normal — the default `--threshold 1.0` fails any case below a perfect score): `grill-01` with-arm fails `trigger-grill` (Skill called 0x — the skill does not exist yet) and most likely `numbered-recommended`; `grill-02`/`grill-03` may already pass (they guard against over-triggering, so they must stay green after Task 2).

- [ ] **Step 6: Record the baseline in `evals/GRILL.md`**

````markdown
# godot-grill eval — baseline and results

Suite: 3 cases (1 should-fire, 2 guards against over-triggering) for `godot-grill`.

```
claude plugin eval . --case "grill-*" --ablation with-without --judge-model sonnet --no-publish
```

## Red — before the skill exists (`results/<timestamp>`)

| Case | With | Without | Δ | Notes |
|---|---|---|---|---|
| grill-01-new-system | | | | |
| grill-02-skip-questions | | | | |
| grill-03-neg-bugfix | | | | |
````

Fill the rows from the run's summary table (`CASE WITH W/OUT Δ` block at the end of the output) and put the results folder name in the heading.

- [ ] **Step 7: Commit**

```bash
git add evals/grill-01-new-system evals/grill-02-skip-questions evals/grill-03-neg-bugfix evals/GRILL.md evals/FOLLOWUPS.md
git commit -m "test(evals): add godot-grill eval cases (red baseline)"
```

---

### Task 2: The `godot-grill` skill

**Files:**
- Create: `skills/godot-grill/SKILL.md`
- Modify: `skills/index.json` (generated)

**Interfaces:**
- Consumes: skill name `godot-grill` (Task 1's `trigger-grill` grader).
- Produces: decision-record path `docs/godot-prompter/decisions/YYYY-MM-DD-<topic>.md` and the hand-off "`godot-brainstorming` from Step 2" that Task 3 wires on the other side.

- [ ] **Step 1: Write `skills/godot-grill/SKILL.md`**

````markdown
---
name: godot-grill
description: Use when a new Godot system or feature has open design decisions — interrogates them in batched rounds, scope first, each question with a recommended answer, and records the answers before any design or code. Triggers on "grill me", "ask me first", "question me on the design", "what do I need to decide before building". Not for choosing between nodes or APIs, and not for bug fixes.
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

**Before round 1**, read `docs/godot-prompter/decisions/` in the user's project. A recorded
decision is a settled prerequisite: never re-ask it; start the frontier past it.

The **frontier** is every open decision whose prerequisites are settled. Ask the whole frontier
in one message, numbered, each with a recommended answer:

```text
❓ **Q1** — **<title>**: <the question, with its options>

➡️ <recommended answer, and why in one clause>
```

Then stop and wait. A question whose prerequisite is still open belongs to a later round.

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

Write to `docs/godot-prompter/decisions/YYYY-MM-DD-<topic>.md` in the user's project — or the
decisions folder the project's agent instructions name. The path must stay stable: the next grill
reads it back.

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
| One question at a time | Order fixed in advance; questions arrive before their prerequisites; more turns | Ask the whole frontier |
| Asking a fact | Spends the user's attention on the model's job | Look it up, decide, record |
| A question with no recommendation | The user answers in a vacuum; rounds slow down | Every question gets ➡️ |
| Grilling a bug fix or an explicit ask | The over-correction this skill must not become | Route to the domain skill |
| Re-asking a recorded decision | Feels like amnesia; wastes the record | Read `docs/godot-prompter/decisions/` first |
| Coding after the last answer | Skips the shared-understanding check | Confirm, then hand off |

## Checklist

- [ ] Read existing decision records before round 1
- [ ] Round 1 settled scope first
- [ ] Every question is a decision — numbered, with a recommended answer
- [ ] Whole frontier per round; waited after each
- [ ] Off-ramp taken → assumptions listed
- [ ] Record written (or in the final message when files cannot be written)
- [ ] Frontier emptied → user confirmed before design or code; off-ramp → no gates, built on the listed assumptions
````

- [ ] **Step 2: Regenerate the skill index**

Run: `npm run build:skill-index`
Expected: `wrote skills/index.json`; `git diff --stat skills/index.json` shows one new `godot-grill` entry.

- [ ] **Step 3: Validate**

Run: `node scripts/validate-skills.mjs 2>&1 | grep -E "godot-grill|error\(s\)"`
Expected: `0 error(s)`, no `godot-grill` lines (the two fenced blocks are `text`/`markdown`, so C# parity does not apply). Then `wc -c skills/godot-grill/SKILL.md` — expect ~7 KB, far under 16 KB.

Run: `npm test 2>&1 | grep -E "^ℹ fail"`
Expected: three lines, each `ℹ fail 0`.

- [ ] **Step 4: Commit**

```bash
git add skills/godot-grill skills/index.json
git commit -m "feat(godot-grill): decision-first design interrogation in frontier rounds"
```

---

### Task 3: Wire it into the process layer

**Files:**
- Modify: `skills/using-godot-prompter/SKILL.md` — card gate row (line ~75, inside `SESSION-CARD`), Workflow §1 (line ~118), Core/Process list (line ~166)
- Modify: `skills/godot-brainstorming/SKILL.md` — Related skills line (line 10), Step 1 (lines 18–23)
- Modify: `skills/index.json` (generated)

**Interfaces:**
- Consumes: `godot-grill` exists (Task 2); its hand-off targets "`godot-brainstorming`, from Step 2".

- [ ] **Step 1: Retarget the card gate row**

In `skills/using-godot-prompter/SKILL.md`, replace

```text
| New system, or the requirements are unclear | `godot-brainstorming` — design first, then build |
```

with

```text
| New system, or the requirements are unclear | `godot-grill` — settle decisions, then design and build |
```

- [ ] **Step 2: Check the card budget**

Run:

```bash
node -e "const s=require('fs').readFileSync('skills/using-godot-prompter/SKILL.md','utf8').replace(/\r/g,'');console.log(Buffer.byteLength(s.match(/<!-- SESSION-CARD-START -->([\s\S]*?)<!-- SESSION-CARD-END -->/)[1]))"
```

Expected: 2896 — ≤ 3072 (baseline 2889; the new row is 7 bytes longer).

- [ ] **Step 3: Update Workflow §1 and the Core/Process list**

Replace

```text
### 1. Design Phase
Load `godot-prompter:godot-brainstorming` — it guides you through:
- Asking clarifying questions about the game/system
```

with

```text
### 1. Design Phase
Load `godot-prompter:godot-grill` first when design decisions are open — it settles them in rounds and records them. Then `godot-prompter:godot-brainstorming` guides you through:
```

(the three remaining bullets stay). In the Core / Process list, after the `godot-brainstorming` line, add:

```text
- `godot-grill` — Settle open design decisions in rounds, scope first, and record them
```

- [ ] **Step 4: Delegate brainstorming Step 1**

In `skills/godot-brainstorming/SKILL.md`, replace the whole `### Step 1: Understand the request` block (heading plus its five lines) with:

```text
### Step 1: Settle the decisions
If the request has open design decisions (scope, dimension, authority, data home, …), invoke `godot-prompter:godot-grill` and let it run to its end. Skip it when a record in `docs/godot-prompter/decisions/` already covers this feature, or the user has stated the decisions. Either way, check what already exists (code, scenes, assets). Carry the record into Step 2 — approaches must respect its settled rows.
```

And change the Related skills line to:

```text
> **Related skills:** **godot-grill** for settling open design decisions first, **scene-organization** for scene tree composition patterns, **component-system** for component-based architecture, **event-bus** for signal-based communication design.
```

- [ ] **Step 5: Regenerate, validate, test**

Run: `npm run build:skill-index && node scripts/validate-skills.mjs 2>&1 | tail -1 && npm test 2>&1 | grep -E "^ℹ fail"`
Expected: `wrote skills/index.json`, `0 error(s), 53 warning(s).`, three `ℹ fail 0` lines (the hook suite reads the real card, so a broken card region fails here).

- [ ] **Step 6: Commit**

```bash
git add skills/using-godot-prompter/SKILL.md skills/godot-brainstorming/SKILL.md skills/index.json
git commit -m "feat(card): route new-or-unclear work through godot-grill"
```

---

### Task 4: README and CHANGELOG

**Files:**
- Modify: `README.md` (badge line 5, summary line 15, Design Phase ~line 149, Core/Process heading line 212 and table)
- Modify: `CHANGELOG.md` (`## [Unreleased]` → `### Added`)

- [ ] **Step 1: Update README counts and table**

- Line 5: `Skills-55` → `Skills-56` and `Skills: 55` → `Skills: 56`.
- Line 15: `**55 skills**` → `**56 skills**`.
- `### Core / Process (7 skills)` → `### Core / Process (8 skills)`, and after the `godot-brainstorming` row add:

```text
| `godot-grill` | Settle open design decisions in rounds — scope first, each question with a recommended answer, recorded |
```

Verify: `grep -c "56" README.md` prints `2` (lines 5 and 15 — `grep -c` counts lines), and `grep -n "55 skills\|Skills-55" README.md` prints nothing.

- `### 1. Design Phase` (README.md ~line 149): replace

```text
Ask the agent to brainstorm a feature. It loads `godot-brainstorming` and walks you through:
- Clarifying questions about your game/system
```

with

```text
Ask the agent to brainstorm a feature. When design decisions are open it loads `godot-grill` first, which asks them in numbered rounds with a recommended answer each and records your choices. Then `godot-brainstorming` walks you through:
```

(the three remaining bullets stay).

- [ ] **Step 2: Add the CHANGELOG entry**

Under `## [Unreleased]` → `### Added` (above the existing `scanner-risky-approval` entry), insert:

```text
- **`godot-grill` skill.** Settles a feature's open design decisions before anyone designs or
  codes: it asks every decision whose prerequisites are settled in one numbered round, each with a
  recommended answer, scope first, and writes the answers to
  `docs/godot-prompter/decisions/`. Later grills read the record, so settled decisions are never
  re-asked. Node types and APIs are facts the skill looks up, never questions. The SessionStart
  card now routes new-or-unclear work here, and `godot-brainstorming` Step 1 delegates to it.
```

- [ ] **Step 3: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: list godot-grill in the README and CHANGELOG"
```

---

### Task 5: Agent integration tests

**Files:**
- Modify: `tests/agent-integration/TEST_PLAN.md` (append after Test 5.8)

- [ ] **Step 1: Append Category 6**

```markdown
---

## Category 6: Decision-first design (v1.14.0)

### Test 6.1: Off-ramp mid-grill

**Setup:** Godot project, no `docs/godot-prompter/decisions/`.

**Prompt:** "grill me on an inventory system" — answer round 1, then reply "just build it".

**Expected:**
- Round 1 asks scope first, numbered, each question with a ➡️ recommendation
- After "just build it": no further questions; assumptions for the open decisions are listed;
  `docs/godot-prompter/decisions/<date>-inventory.md` exists with the settled rows and the
  assumptions under **Open / deferred**, marked **assumed**

**Pass criteria:** no question asked after the off-ramp, and every open decision appears as a
listed assumption.

---

### Test 6.2: The record shortens the grill

**Setup:** the project from 6.1, with its decision record committed.

**Prompt:** "grill me on adding equipment slots to the inventory"

**Expected:** no question re-asks a row in the existing record (scope, item data home, bag
model); round 1 starts at equipment-specific decisions.

**Pass criteria:** zero re-asked recorded decisions. Re-asking any one is a FAIL.

---

### Test 6.3: No grill for a bug fix

**Prompt:** "I ported my player to Godot 4 and `velocity = move_and_slide(velocity)` now errors"

**Expected:** a direct diagnosis — `move_and_slide()` takes no arguments in Godot 4 — with no
questioning round.

**Pass criteria:** the card's "Known change, explicit ask, bug fix" row wins; `godot-grill` is
not invoked.
```

- [ ] **Step 2: Commit**

```bash
git add tests/agent-integration/TEST_PLAN.md
git commit -m "test(agent-integration): add godot-grill off-ramp, record, and bug-fix cases"
```

---

### Task 6: Eval green run

**Files:**
- Modify: `evals/GRILL.md`

- [ ] **Step 1: Re-run the grill cases**

Run: `claude plugin eval . --case "grill-*" --ablation with-without --judge-model sonnet --no-publish`
Expected: `grill-01` with-arm passes `trigger-grill` in 3/3 runs, and `scope-first`, `numbered-recommended`, `no-fact-questions`, `no-code-yet` in ≥ 2/3; `grill-02` and `grill-03` with-arm scores are within 0.15 of the red run (scores swing by up to 0.14 between n=3 runs — see `evals/FOLLOWUPS.md`), and `no-questions` passes 3/3 on both. grill-03's `trigger-grill` indicator reads `Skill called 0x` in every run. Exit code 1 is normal (default `--threshold 1.0`).

If `grill-03` calls the skill, or its `no-questions` drops, the description is over-triggering: tighten the frontmatter `description` (it must name *open design decisions*, not "any feature") and re-run before continuing.

- [ ] **Step 2: Mentor regression run**

The grill description competes with mentor prompts such as case 02 ("Guide me through adding a health bar"). Run: `claude plugin eval . --case "0*" --ablation with-without --judge-model sonnet --no-publish` (≈ 50 min, ≈ $15 — run it alone, not alongside another eval: they share one rate limit).
Expected: each case's with-arm score within 0.15 of the latest table in `evals/FOLLOWUPS.md`, and negatives 06/07 at Δ 0. If a mentor case drops and its answer opens with numbered design questions, the grill is stealing it — tighten the description and re-run both suites.

- [ ] **Step 3: Record green results**

Append to `evals/GRILL.md`:

```markdown
## Green — with the skill (`results/<timestamp>`)

| Case | With | Without | Δ | Notes |
|---|---|---|---|---|
| grill-01-new-system | | | | |
| grill-02-skip-questions | | | | |
| grill-03-neg-bugfix | | | | |
```

Fill it from the run summary, noting any grader below 3/3 by name. Add one line with the mentor regression result (mean Δ and any case outside tolerance).

- [ ] **Step 4: Commit**

```bash
git add evals/GRILL.md
git commit -m "test(evals): record godot-grill green run"
```

---

## Deviations from the spec

- Card change is **+7 bytes** (2889 → 2896), not byte-neutral as the spec says — still well under 3072.
- The decision-record path is fixed as the spec says, but a project's agent instructions may name another folder. A plain override, not the Plan Storage lookup order, because the next grill must find the records again. Superseded during the final review; see the `godot-grill` Added entry under `[Unreleased]` in CHANGELOG.md, which states the project's own convention takes precedence.
- Evals and `skills/index.json` did not exist when the spec was written; Tasks 1, 2, 3, 6 add them.

## Out of scope (from the spec, plus one found while planning)

- The eight remaining compression targets, a `grill-with-docs` variant, section-ordering enforcement in the validator.
- `agents/godot-game-architect.md:22` tells the architect to read `godot-brainstorming` for its design process; it will reach the grill only through brainstorming's Step 1. Pointing it at `godot-grill` directly is an agent change (and a `.codex/` regeneration) — the spec rules agent changes out, so it is a follow-up.
