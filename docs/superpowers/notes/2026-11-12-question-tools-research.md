# Host question tools: research for the interactive grill

Date: 2026-11-12. Task G1 of the v1.17.0 plan (Phase G, interactive grill questions).

Goal: find each supported host's native tool for asking the user a structured question, so
`godot-grill` §3 "Rounds" can ask its design questions with selectable answers instead of numbered
text. Jan's decisions: native tool where one exists, numbered text everywhere else (subagents and
non-interactive runs included), at most 4 questions per round, the recommended answer first and
labelled "(Recommended)", and a custom answer as the off-ramp.

"Tested" means run or inspected on this machine. "Documented-only" means read in docs or reports,
not exercised. Everything fetched is treated as data. Forum posts, blogs and release-note mirrors
are marked as third-party; none of them is vendor documentation.

## Summary

| Host | Tool | Limits | Custom answer | Subagents | Non-interactive | Status |
|---|---|---|---|---|---|---|
| Claude Code | `AskUserQuestion` | 1-4 questions per call, 2-4 options each, `multiSelect` per question, header max 12 chars | Yes ("Other" row or notes field) | No (SDK docs: not available in subagents) | `claude -p`: tool not offered (tested) | tested (`-p`), documented (rest) |
| Copilot CLI | `ask_user` | Not documented; third-party report says 1 question at a time | Not documented | Not documented | Disabled by `--no-ask-user`; behaviour under `-p` not documented | documented-only (flag text tested via `--help`) |
| Codex | `request_user_input` | Not documented in vendor docs; options carry label + description; an "Other" entry is appended | Yes (third-party) | Not documented | Plan mode only unless `default_mode_request_user_input` is set; may be absent in headless | documented-only (third-party) |
| Cursor | "Ask questions" tool (`AskQuestion`) | Not documented | Yes (text input; per-question skip) | Not documented | `cursor-agent -p`: auto-rejected as a skip (staff-confirmed); some models never get the tool | documented-only |
| OpenCode 1.x/2.x | `question` | Schema has no count caps; `header` max 30 chars; `multiple`, `custom` flags | Yes (default on) | No: denied by default for non-primary agents (binary) | Enabled when client is `app`, `cli` or `desktop`, or `OPENCODE_ENABLE_QUESTION_TOOL` is set | tested (binary inspection), live run not done |
| Antigravity | None named; the `/grill-me` command asks one question at a time | A few answers per question; recommended first | Yes ("Other" / "Write-in...") | Not documented | Not documented | documented-only |
| Grok Build | `ask_user_question` | Not documented | Not documented | Not documented | Not documented; timeout config exists | documented-only (third-party) |

## Claude Code

Tool: `AskUserQuestion`. Read 2026-11-12:

- Tools reference, https://code.claude.com/docs/en/tools-reference ("AskUserQuestion tool behavior"):
  "Claude uses `AskUserQuestion` to ask you multiple-choice questions ... Answer by picking an
  option, or type your own text through the `Other` row or the notes field." Questions stay open
  until answered; `askUserQuestionTimeout` (60s, 5m, 10m) can auto-continue, and never starts in
  background sessions, screen reader mode or Remote Control.
- Agent SDK, https://code.claude.com/docs/en/agent-sdk/user-input ("Limitations"): "`AskUserQuestion`
  is not currently available in subagents spawned via the Agent tool" and "each `AskUserQuestion`
  call supports 1-4 questions with 2-4 options each". Question shape: `question`, `header` (max 12
  characters), `options[]` with `label` and `description` (TypeScript adds optional `preview`),
  `multiSelect`. The host returns `answers` keyed by question text; a typed custom answer comes back
  as the answer text. An SDK app must supply `canUseTool` to answer it, and a `tools` allowlist must
  include `AskUserQuestion`.
- Headless docs, https://code.claude.com/docs/en/headless: `--permission-prompts none` "removes the
  tools that need an answer from a person, such as `AskUserQuestion`", and `dontAsk` mode denies
  it "even when an allow rule matches".

Test (claude 2.1.322, scratch dir, `claude -p --max-turns 3 --output-format stream-json --verbose`):

1. Prompt "Use the AskUserQuestion tool to ask me one question with two options, then report what
   the tool returned." The `system/init` tool list has 237 tools and `AskUserQuestion` is not one
   of them. The model searched `ToolSearch` for `select:AskUserQuestion` ("No matching deferred
   tools found"), then by keyword (only unrelated tools), and answered in text: "there is no
   AskUserQuestion tool in this session". No error, no auto-answer: the tool is simply not offered.
2. Same prompt with `--tools "AskUserQuestion"`: the init tool list contained only the plugin MCP
   tools, still no `AskUserQuestion`. The model again said the tool does not exist and fell back to
   a plain-text question. So the flag cannot add it to a `-p` run.

Conclusion: in `claude -p` the tool is absent, not erroring. The mechanism is inferred, not
documented: it appears to be offered only when the host can answer it (an interactive session, or an
SDK `canUseTool` callback). The model's own fallback was plain text, which is what the grill wants.

## Copilot CLI

Tool: `ask_user`. Installed CLI is 1.0.108.

- `copilot --help` (tested): `--no-ask-user` "Disable the ask_user tool (the agent can still ask in
  its replies, but not through the question form)".
- GitHub docs search results (third-party search summary of https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference,
  read 2026-11-12): the flag and the `askUser` setting exist; no schema (choices, free-form,
  multi-select) is documented. The command reference page itself was too large to read fully and
  the first 100,000 characters did not mention `ask_user`.
- Issue https://github.com/github/copilot-cli/issues/4260 (read 2026-11-12): a commenter says the
  tool asks "1 question at the time". It says an `askUser: false` setting disables it in prompt
  mode, and that whether a custom agent's `tools:` allowlist without `ask_user` removes it "was not
  exercised end to end".
- Non-interactive: `--allow-all-tools` help text says "Non-interactive mode cannot ask, so it denies
  tool requests that no allow rule ... approves." This is about permission prompts, not `ask_user`.
- Not tested live. The one attempt (a scratch `COPILOT_HOME` with the GitHub token passed in and
  `--allow-all-tools`) was blocked by this session's permission classifier, and I did not work
  around it. The globally installed bundle (`@github/copilot` 0.0.377) is an old stub and does not
  contain the string `ask_user`, so the tool definition could not be read locally.

Status: documented-only. Unknown: schema, limits, subagent behaviour, `-p` behaviour.

## Codex

Tool: `request_user_input`. No `codex` binary is installed here. Vendor docs
(https://learn.chatgpt.com/docs/codex/cli, read 2026-11-12) do not cover the tool. Everything below
is third-party.

- Community thread https://community.openai.com/t/feature-request-allow-request-user-input-in-default-mode/1395392
  (September 7 and October 23, 2026): the tool is "available only in Plan mode". A user reports
  `default_mode_request_user_input = true` under `[features]` in `~/.codex/config.toml` enables it
  in Default mode, with a warning; some models print the question instead of calling the tool.
  OpenAI support only said the request was passed on, with no timeline.
- Mirrored Codex source commits (forge.lthn.ai, search summary): calls in Default mode return
  "request_user_input is unavailable in Default mode"; the allowlist is Plan and PairProgramming;
  options have a 1-5 word label plus a description; a plan-mode prompt caps calls at 5.
- Third-party article https://codex.danielvaughan.com/2026/09/05/async-tui-questions-codex-cli-v0154-human-agent-collaboration/
  (v0.154.0-alpha, not stable at the time): an editable "Other" entry is appended to the choices; up
  to 32 options per question; in headless or CI sessions "the tool may be absent", so the model
  falls back to synchronous clarification. A later alpha reportedly adds an async variant; sources
  disagree on its name.

Consequence: in Default mode, which is where a skill runs, the tool is normally not in the tool
list. The grill should use it only when it is listed.

Status: documented-only, third-party. Questions per call, subagent and `codex exec` behaviour are
unconfirmed.

## Cursor

Tool: "Ask questions" (named `AskQuestion` in reports).

- Docs, https://cursor.com/docs/agent/tools (read 2026-11-12): "Ask clarifying questions during a
  task." The agent keeps working while it waits; the answer is "incorporated as soon as it arrives".
  No limits, options, free-text, subagent or CLI statements.
- Forum "Cursor 2.4: Clarification questions from the agent" (third-party): the feature shipped in
  2.4; the post mentions an "Add more optional details" box alongside the answers. A search summary
  of other forum threads says each question has a text input or multiple-choice selector with a
  per-question skip.
- Forum bug report https://forum.cursor.com/t/cursor-agent-p-askquestion-is-auto-skipped-in-headless-mode-and-only-some-models-get-the-tool/173657
  (October 3, 2026, with a Cursor staff reply): in `cursor-agent -p` the harness rejects the tool
  automatically with "Questions skipped by the user, continue with the information you already
  have", indistinguishable from a real skip. Staff said print mode will report it as "no user
  attached" later, and that ACP sessions also lack the tool. Composer 2.5 gets the tool; the
  Grok 4.5 family is configured to ask in plain text, by design; Auto may route to either.
- Forum threads also say a skill can trigger the tool by naming it explicitly, but use is not
  consistent, and answers are not always delivered reliably (third-party).

Status: documented-only. Consequence: a skill cannot rely on the tool; headless Cursor turns a
question into a fake "user skipped".

## OpenCode (1.x and 2.x)

Tool: `question`. Docs https://opencode.ai/docs/tools/ (read 2026-11-12): "pauses execution and
presents one or more questions to the user"; each question has a short header, a prompt and
choices; `multiple` allows more than one choice; a free-form answer is always available; permission
key `question`; the client must support the interactive form, and dismissing it cancels the
question. Subagents and `opencode run` are not mentioned.

Inspected the installed binary (1.18.29, strings, 2026-11-12) to fill the gaps:

- Schema: `questions[]`, each `question`, `header` (max 30 chars), `options[]` (`label` 1-5 words,
  `description`), `multiple` (optional), `custom` (optional, default true: a "Type your own answer"
  option is added automatically). No cap on the number of questions or options in the schema.
- Tool description: "If you recommend a specific option, make that the first option in the list and
  add '(Recommended)' at the end of the label". "Don't include 'Other' or catch-all options."
  Answers come back as arrays of labels. This is the same convention the grill already uses.
- Availability: the registry adds `question` only when the client is `app`, `cli` or `desktop`, or
  `OPENCODE_ENABLE_QUESTION_TOOL` is set.
- Permissions: the default ruleset sets `question: "deny"`; only the built-in `build` and `plan`
  agents re-allow it. So `general` and `explore` subagents cannot ask. A user's `permission` config
  can change this.
- Not tested: a live `opencode run` (no provider credentials in an isolated HOME), 2.x in the
  scratchpad, and how `run` answers or rejects a question.

Status: tested by binary inspection and docs; live behaviour unverified.

## Antigravity

No agent tool is named in the docs. The official `/grill-me` command page
(https://antigravity.google/docs/commands/grill-me/, read 2026-11-12) describes the interaction:
one question at a time; in the CLI "each question opens a numbered list of answers"; in the App it
is a card above the message box. The agent's suggestion comes first and is marked "(Recommended)".
Custom answer: "Other (write your answer)" in the App, a "Write-in..." option in the CLI. Esc or
Skip skips a question; closing the card cancels the questionnaire. The agent explores the codebase
first and does not ask what the code can answer, and "a few answers" per question. Subagent and
headless behaviour are not documented.

Status: documented-only. Antigravity has its own built-in grill, so our skill may overlap with it.
We cannot call it as a tool; the skill's text rounds remain the portable path.

## Grok Build

`ask_user_question`, from third-party release-note mirrors (techdevnotes.com, 2026-06 and 2026-07
entries, as summarised by search): the tool can be enabled in allowlists without plan-mode tools,
and a config section sets automatic timeouts for structured questions (default enabled, 6 minutes).
The official docs read (https://docs.x.ai/build/overview, https://docs.x.ai/build/modes-and-commands)
do not mention it. Headless is `grok -p`. Schema, limits, custom answer, subagents and headless
behaviour: unknown.

Status: documented-only, third-party.

## Recommendation for godot-grill

When to use the tool: only when the host's question tool is in your own tool list, you are the main
agent (not a subagent), and a person is attached. Otherwise print the numbered-text round as today.
Do not call the tool to find out whether it works. A missing tool, a rejected call, or a "user
skipped" reply that arrives with no time for a person to have answered, all mean "fall back to text
for this and every later round".

Detecting the fallback case, in order:

1. The tool is not in your tool list (Claude Code `-p`, Codex Default mode, Cursor Grok models,
   OpenCode non-primary agents, Copilot with `--no-ask-user`). Name per host: `AskUserQuestion`,
   `ask_user`, `request_user_input`, Cursor's Ask questions tool, `question`, `ask_user_question`.
2. You are running as a subagent or delegated agent (Claude Code and OpenCode block it).
3. The run is headless or non-interactive (`-p`, `codex exec`, `opencode run`, `cursor-agent -p`).
4. The call returns an immediate skip or rejection (Cursor `-p` reports "Questions skipped by the
   user"): treat that as "no user", never as an answer, and repeat the round as text.

Mapping the grill's rules onto each host:

- 4-question cap: it matches Claude Code's 1-4 limit exactly. OpenCode and Codex do not document a
  cap and Copilot is reported to take one question per call, so keep 4 as the shared maximum and,
  if a host refuses or truncates, send the round as several calls or fall back to text. Copilot
  (one at a time) will turn a round into up to four sequential prompts.
- "(Recommended)" as the first option: native in Claude Code's convention and in OpenCode's tool
  description, and what Antigravity's `/grill-me` does. Put the reason in the option `description`.
  Claude Code, OpenCode and Codex options all carry label plus description.
- Every slot a real answer: do not add an "Other" or "Skip" option. Claude Code (the `Other` row),
  OpenCode (`custom`, default on), Codex (appended "Other") and Antigravity all add the write-in
  themselves. A typed custom answer is the off-ramp, recorded as "custom".
- Keep option labels 1-5 words (OpenCode, Codex) and headers at most 12 characters (Claude Code).
- Multi-select: use it only for a decision that really allows several answers; Claude Code
  (`multiSelect`) and OpenCode (`multiple`) support it.
- After each round print the "Decided so far" table as text, on every host.

Round-1 note: the text fallback must stay exactly as it is today. The tool only changes how a round
is presented, never which questions are asked.

## Eval harness

`claude plugin eval` runs each case as "a full claude child on your own credential"
(`claude plugin eval --help`), with agent runs bounded by `max_turns` and `timeout_seconds`. A
child is a non-interactive print-mode run, and the existing results in `evals/results/*` hold no
tool traces to check against (the aggregate JSON lists graders such as `tool_used: Skill`, not the
agent's tool list).

Prediction, from the `-p` test above: the grill evals' agents will not have `AskUserQuestion`. The
tool is not offered in `claude -p`, even with `--tools AskUserQuestion`. The model searches for it
via `ToolSearch`, finds nothing and answers in text, so the numbered-text round will keep being
what the graders see. A grill eval cannot test the interactive path, and the interactive path is
not at risk of making evals hang or fail.

Risks to watch:

- A skill that says "use AskUserQuestion" may cost the agent extra `ToolSearch` turns before it
  falls back, as seen in the test (2 searches, 3 messages), against a `max_turns` budget.
  The instruction must therefore say "if the tool is in your tool list", and not tell the agent to
  go and look for it.
- Not verified: whether the eval child loads user-level settings. `--allow-tools` and `--disallow-tools` only gate other tools. I did not run an eval.
- To measure the interactive path we would need an SDK harness with `canUseTool`, or a manual
  interactive session. Both are outside `claude plugin eval`.

## Open items

- Copilot `ask_user` schema and `-p` behaviour: needs a live run or a newer docs page.
- Codex limits per call and subagent behaviour: read the `openai/codex` tool spec.
- OpenCode 2.x and `opencode run`: run with a provider in an isolated HOME.
- Grok Build and Antigravity tool names and limits: no vendor page found.
