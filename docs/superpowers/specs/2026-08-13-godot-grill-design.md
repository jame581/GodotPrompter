# godot-grill — decision-first design interrogation

**Date:** 2026-08-13
**Baseline:** v1.13.2 (55 skills, validator 0 errors / 53 warnings)
**Target:** 56 skills; the questioning half of the process layer
**Branch:** `release/v1.14.0`

---

## Problem

A user on Reddit, after using the plugin, reported three things:

1. Skills repeat what the models already know, which pollutes context.
2. Skills "have a strong tendency to instruct the model(s) to immediately fix/code, without
   reporting back or presenting choices to the developer."
3. Skills are "too restrictive and opinionated" — they should give more freedom but "force more
   reporting and questioning."

Their conclusion: *"I had way more comfort using a simple 'grill me' skill than a complex
toolset."*

Two of the three are already addressed on this branch. The SessionStart card now gates on
uncertainty and requires a reported choice (`fa5ba14`), and `inventory-system` +
`godot-brainstorming` moved recall content out of the always-loaded path (`b8afb76`).

What remains is the part their conclusion actually points at. GodotPrompter has no skill whose
job is to *interrogate*. `godot-brainstorming` asks "one clarifying question at a time" as
Step 1 of a four-step script whose real output is a scene tree and a plan. That is a design
skill with a questioning preamble, not an interrogation.

### Why the preamble is not enough

`grilling` — the skill the reporter preferred — works differently in a way that matters. It
models the problem as a **design tree** and works it in **rounds**. The *frontier* is every
decision whose prerequisites are already settled; it asks the whole frontier at once, numbered,
each with a recommended answer, then waits. Answers reshape the tree and push the frontier
outward. It ends when the frontier is empty.

Serial questioning cannot do this. Asking one question at a time means the order is fixed in
advance, so questions arrive before their prerequisites are settled, and the user answers in a
vacuum. Batched frontier rounds also cost fewer turns for more settled decisions, which is
plausibly the "comfort" the reporter described.

### Why a Godot-specific grill, and not just the generic one

The reporter is right that a generic workflow skill already works, and a reskin of `grilling`
would deserve their criticism rather than answer it. The defensible contribution is that
**Godot design decisions have a real dependency order**: networking authority gates state
ownership, which gates signal design; scope prunes whole branches; the entity model determines
what "component" means. That ordering is Godot architecture knowledge, not recall — exactly
the category the reporter said skills *should* be about ("skills should not be about what to
code, but about a workflow, and about architecture").

---

## Design

### 1. Position in the process layer

```
card gate ──► godot-grill ──► godot-brainstorming ──► domain skills
              (decisions)      (scene tree, signal     (implementation)
                                map, plan)
```

`godot-grill` owns questioning. `godot-brainstorming` keeps its design artifacts; its Step 1
becomes a delegation to `godot-grill`, and Steps 2–4 are unchanged.

`godot-mentor` is orthogonal — it is a delivery wrapper over whatever is produced, and composes
with both.

### 2. The seeded dependency tree

Four roots have no prerequisites and are askable immediately:

| Root | Options |
|---|---|
| **Scope** | throwaway slice / one feature / a system others build on |
| **Dimension** | 2D / 3D / 2.5D |
| **Language** | GDScript / C# / both |
| **Authority** | single-player / networked (and if networked, who is authoritative) |

Edges:

| Settling this… | …unblocks |
|---|---|
| Scope | prunes branches: a throwaway slice skips persistence, data home, networking, and testing entirely |
| Authority | state ownership (who is the source of truth); signals vs. RPCs |
| Dimension | physics model; camera model |
| Language | interop boundary, when the answer is "both" |
| Scope + Dimension | entity model: composition vs. inheritance |
| Entity model | data home (Resource `.tres` / autoload / node-local `@export`); communication (signals up, calls down / EventBus / DI) |
| Authority + Entity model | state representation (enum FSM / node FSM / AnimationTree / none); persistence boundary |
| Data home + Persistence | save format (ConfigFile / JSON / Resource serialization) |

The tree is a **seed, not a script**. Answers extend it — a "networked" answer grows branches a
single-player answer never creates. Nothing requires all nodes to be visited; §4's pruning
means most sessions visit few.

### 3. Decisions versus facts

Every node in the tree is something **only the user knows**: intent, constraints, priorities,
taste. This is the rule that keeps the skill from degenerating into a quiz.

Node-type selection, API signatures, and version differences are **facts**, and facts are the
model's job. `godot-grill` must look them up (`godot-brainstorming/references/node-selection.md`
and the domain skills) and must never spend a frontier question on one. Asking the user "should
this be a `CharacterBody2D` or a `RigidBody2D`?" is a bug in the grill, not a question.

This inherits directly from `grilling`'s "Finding *facts* is your job, never the user's," and it
is why the node-selection table moved to `references/` in `b8afb76` rather than being deleted:
the grill needs it, the user does not.

### 4. Session mechanics

**Rounds.** Ask the whole current frontier in one message. Number each question and give a
recommended answer, in `grilling`'s format:

```
❓ **Q1** — **<title>**: <body, including options>

➡️ <recommended answer>
```

Then wait. A question whose prerequisite is still open in this round belongs to a later round.

**Round 1 is always small and always settles scope first**, because scope prunes the most tree.
A "throwaway slice" answer commonly ends the whole session at round 2.

**Off-ramp, available in any round.** `"just build it"` / `"skip the questions"` / `"stop
grilling"` → stop asking, write the decision record with what is settled, **state explicitly
what is now being assumed**, and proceed. This mirrors the existing `godot-mentor` off-ramp
convention.

**Termination.** The session ends when the frontier is empty or the off-ramp is taken. Do not
proceed to implementation until the user confirms shared understanding.

### 5. The decision record

Written to `docs/godot-prompter/decisions/YYYY-MM-DD-<topic>.md` in the user's project, beside
the existing `plans/` and `specs/` conventions.

```markdown
# <Topic> — decisions

| Decision | Choice | Why | Revisit when |
|---|---|---|---|
| Bag model | Fixed 20 slots | Grid UI already designed | a weight system is wanted |
| Item data | Resource `.tres` | Inspector editing, typed exports | items exceed ~200 |

## Open / deferred
- Equipment stat aggregation — deferred to a later pass.
```

**The record is read at the start of every grill.** An existing decision is a settled
prerequisite, so its dependents are already unblocked and the row is never re-asked. This is
what makes the reporter's ADR advice compound: the first feature in a project is grilled
thoroughly, the second cheaply.

The `Revisit when` column exists so a recorded decision does not calcify. A record is a starting
point that can be reopened, not a constraint.

---

## Integration points

| Touch point | Change |
|---|---|
| `skills/godot-grill/SKILL.md` | New. Est. 4–5 KB, well under the 16 KB cap. No code blocks, so C# parity does not apply. |
| SessionStart card (`using-godot-prompter`) | Gate row retargets `godot-brainstorming` → `godot-grill`. **Byte-neutral** (100 b either way); card stays at 2889 / 3072. |
| `using-godot-prompter` skill index | Add a Core/Process entry. |
| `godot-brainstorming` | Step 1 delegates to `godot-grill`. |
| `bump-version.mjs` | No manual edit — it counts `skills/*/SKILL.md` and rewrites "N domain-specific skills" at release. 55 → 56 automatically. |
| Agents / `.codex/` mirrors | None. This is a skill, not an agent. |
| Hooks | None. No `npm run test:hooks` requirement beyond the standard run. |

---

## Testing

1. `node scripts/validate-skills.mjs` — frontmatter, cross-references, card region markers and
   budget, size budget.
2. `npm test` — validator plus hook suites, to confirm the card edit breaks nothing.
3. `tests/agent-integration/TEST_PLAN.md` gains two cases:
   - **Off-ramp** — a grill in progress, user says "just build it"; expect the record written,
     assumptions stated, no further questions.
   - **Record shortens the grill** — a project with an existing decision record; expect settled
     rows not re-asked and the frontier to start further out.

---

## Risks

**Over-triggering.** A grill on trivial work is the exact over-correction this branch has been
avoiding. Mitigated on two levels: the card gate only routes new-or-unclear systems here, and
scope-first pruning ends small sessions in one or two rounds. The off-ramp is the backstop.

**Overlap with `godot-brainstorming`.** Two process skills invite ambiguity about which to
invoke. Mitigated by a clean split — grill produces *decisions*, brainstorming produces
*structure* — and by brainstorming delegating rather than duplicating.

**Recommended answers becoming the answer.** Every question ships a recommendation, which risks
the user rubber-stamping. Accepted: it is what makes batched rounds fast, and the `Revisit when`
column plus the explicit "Open / deferred" list keep decisions reopenable.

---

## Out of scope

- Any change to the remaining eight compression targets from the step-2 audit
  (`player-controller`, `ability-system`, `camera-system`, `event-bus`, `hud-system`,
  `dialogue-system`, `godot-code-review`, `component-system`). Tracked separately for v1.14.0.
- A `grill-with-docs` equivalent that grills against external documentation.
- Section-ordering enforcement in `validate-skills.mjs`, noted while fixing `inventory-system`.
