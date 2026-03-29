# Workspace Autoresearch

`workspace-autoresearch` is a SmartWorkers skill for bounded, evaluator-driven improvement of a workspace's operating system: skills, `AGENTS.md`, workflows, docs, folder structure, and file organization.

It is inspired by:

- Andrej Karpathy's `autoresearch`: constrained scope, scalar metric, tiny experiments, automatic rollback, and logged iteration history.
- Udit Goenka's `autoresearch`: explicit setup, goal-to-metric planning, guard rails, bounded iterations, and a reusable autonomous loop.

This skill adapts those ideas to SmartWorkers workspaces, where the target is usually not model quality but workspace clarity, maintainability, consistency, and operability.

## Intended users

This skill is for advanced users, not beginners.

It assumes the user:

- understands workspace structure, documentation systems, and iterative review loops
- can state a concrete goal and make clear decisions when tradeoffs appear
- has domain knowledge relevant to the workspace being improved
- can provide research directions, source materials, examples, tips, or judgment criteria when needed
- can review and approve the generated evaluator before the loop begins

The agent may discuss tradeoffs with the user, but it should not default to tutorial-style hand-holding. The default posture is concise alignment, explicit decisions, and efficient execution.

## What users should prepare

Before using this skill, the user should be ready to provide:

- a clear run goal
- scope and read-only boundaries
- guard conditions
- backup confirmation
- any available research directions, references, examples, tips, or explicit preferences that should shape the run

Good inputs include:

- paths or URLs to reference material
- examples of strong or weak workspace patterns
- naming, structure, or documentation preferences
- domain-specific heuristics
- non-obvious constraints the agent should preserve

## Why this skill exists

Workspace improvement work tends to go wrong in two ways:

- The agent stays too high-level and produces advice instead of useful edits.
- The agent changes too much at once, drifts from the user's real goal, and leaves the workspace harder to review.

This skill is designed to avoid both problems. It turns "please clean this workspace up" into a controlled run with a visible goal, a run-specific evaluator, small reversible edits, and a hard stop.

## Design principles

### 1. Backup before autonomy

Before any meaningful edit cycle starts, the skill must warn the user that the workspace may change significantly and tell them to back up or commit current work first.

The skill must not silently assume rollback is enough. Git history helps, but it is not a substitute for an explicit backup warning.

This is a hard gate, not a courtesy note. After giving the warning, the skill must pause and wait for explicit user confirmation before creating patches or beginning the iteration loop.

### 2. Goal first, edits second

The skill does not begin by changing files. It begins by confirming the target and any missing decisions that materially affect execution.

Examples:

- "Make the workspace easier for Codex to use"
- "Clean up the skill source tree and remove confusing duplication"
- "Standardize `AGENTS.md`, `README.md`, and `WORKFLOW.md` so new contributors know how to work here"
- "Improve folder layout and naming without changing business logic"

For advanced users, the default is to treat the stated goal as authoritative. Clarification is only needed when a real execution or evaluation decision is missing.

### 2.5. User research input is a first-class artifact

This skill is not limited to what the agent can infer from the workspace. The user may and should provide:

- research directions
- domain references
- examples
- heuristics
- tips
- explicit decisions

Those inputs should be recorded in:

- `logs/general/workspace-autoresearch/<run-id>/research.md`

The run should actively use that file during evaluator generation, baseline creation, and per-iteration planning.

### 3. Dynamic evaluator per run

The evaluator must be generated fresh for each run.

This is a core design choice. Different runs optimize for different things, so a fixed evaluator would quickly become either too generic or actively misleading.

Each run creates its own evaluator files under:

- `logs/general/workspace-autoresearch/<run-id>/goal.md`
- `logs/general/workspace-autoresearch/<run-id>/evaluator.md`
- optional `logs/general/workspace-autoresearch/<run-id>/evaluate.sh`

The generated evaluator captures:

- the user's goal in plain language
- in-scope files and read-only areas
- what "better" means for this run
- required checks
- keep rules
- revert rules
- the run's iteration cap
- the research sources and explicit user judgments used to shape the run

The evaluator is the judge for that run. The agent should not switch standards mid-run unless the user explicitly changes the goal and approves regenerating the evaluator.

When the run touches `skills/`, the evaluator must be grounded in SmartWorkers house rules rather than improvised from memory. At minimum, the agent should load:

- `skills/AGENTS.md`
- `skills/general/smart-skill-maker/references/AUTHORING.md`

The generated evaluator should record which standards sources were used.
It should also record which user-provided references, directions, and decisions shaped the evaluator.

### 4. One focused change per iteration

Each iteration should make one coherent improvement, not a grab bag of unrelated edits.

Good examples:

- normalize `skills/AGENTS.md` wording and remove duplicated guidance
- add a missing section to workspace `README.md`
- move one set of mislocated docs into a clearer folder and update references
- standardize one skill folder to current SmartWorkers conventions

Bad examples:

- rename half the repo and rewrite docs in one pass
- mix folder moves, README rewrite, workflow redesign, and skill contract changes in one iteration

This rule keeps the loop debuggable and makes reverts cheap.

### 5. Mechanical checks where possible, explicit judgment where necessary

Workspace quality is partly subjective, so the skill should not pretend every decision can be reduced to a single number.

Instead, each run uses two evaluator layers:

- `evaluator.md` for human-readable standards and judgment criteria
- optional `evaluate.sh` for mechanical checks such as file presence, naming consistency, dead links, required headings, duplicate paths, or command success

If something cannot be measured directly, the evaluator should still define concrete review questions so the keep/discard decision is not arbitrary.

### 6. Bounded autonomy by default

Unlike Karpathy's original overnight loop, this skill is bounded by default.

The default run is exactly 10 iterations. The purpose is:

- keep the run reviewable
- prevent unbounded churn in important docs or structure
- create a natural checkpoint for the user

The loop stops after iteration 10 and summarizes the outcome. It does not keep going "because there might be more to improve."

### 7. Enforce the stop with a ledger, not only prompt wording

The run uses a state file:

- `logs/general/workspace-autoresearch/<run-id>/run.json`

This file tracks:

- `run_id`
- `status`
- `goal`
- `max_iterations`
- `current_iteration`
- `completed_iterations`
- `iteration_statuses`
- `scope`
- `readonly`
- `guard`

The loop must read `run.json` before every new iteration.

Stop rules:

- If `current_iteration >= max_iterations`, stop immediately.
- Do not start iteration 11 when `max_iterations` is 10.
- After finishing iteration 10, update `status` to `completed` and write the final summary.

State transition rules:

- `current_iteration` means completed iterations, not planned iterations.
- It starts at `0` before any experimental edit.
- To begin iteration `N`, `current_iteration` must equal `N - 1`.
- After iteration `N` is evaluated and logged, set `current_iteration` to `N` even if the result is `revert` or `no-op`.
- Append `N` to `completed_iterations` after the outcome is logged.
- Record the final decision for that iteration in `iteration_statuses`.

This is more reliable than relying on "remember to stop after 10" in free-form instructions.

### 8. Keep or revert every experiment

Every iteration ends with a decision:

- `keep`
- `revert`
- `no-op`

If the change fails the run evaluator, breaks a guard, or creates worse structure, it should be reverted before moving on.

To make `revert` real instead of aspirational, every iteration must create rollback artifacts before editing:

- `iteration-<NN>/plan.md` with the intended change and touched paths
- `iteration-<NN>/before/` with pre-change copies of every touched file
- old and new paths recorded in `plan.md` for any rename or move

If the iteration is rejected, restore from `before/` and remove files created only by that iteration.

The skill should prefer visible, auditable reversibility over vague "we'll fix it later" accumulation.

### 9. Scope is mandatory

The run must define what can change.

Typical v1 scope:

- `skills/`
- `README.md`
- `AGENTS.md`
- `WORKFLOW.md` and `workflows/`
- workspace docs and non-code organization files

Typical read-only areas:

- `.git/`
- `artifacts/`
- generated outputs unrelated to the current run
- business logic or product code not covered by the goal

This keeps the skill focused on workspace quality rather than accidentally becoming a broad code refactor tool.

### 10. History should teach the next step

Each iteration is logged so the agent can learn from what already worked.

The run log lives under:

- `logs/general/workspace-autoresearch/<run-id>/results.tsv`

The file should use a fixed header so later iterations can read it reliably:

`iteration	stage	decision	change_summary	checks_summary	evidence_used	decision_reason	touched_paths	rollback_artifact	outcome_summary	next_step`

Rules:

- iteration `0` is the baseline row
- `stage` is one of `baseline` or `iteration`
- `decision` is one of `baseline`, `keep`, `revert`, `no-op`
- `checks_summary` should name the checks actually run, not generic text
- `evidence_used` should cite the research material, examples, or standards used in the decision
- `decision_reason` should explain why the change was kept, reverted, or skipped
- `touched_paths` should list the actual files or directories changed
- `rollback_artifact` should identify the iteration rollback folder or note `none`
- `next_step` should be short and actionable

The log helps the agent avoid repeating failed directions and helps the user review the run afterward.

## Run lifecycle

### Phase 0. Preflight

The skill:

1. warns the user to back up or commit first
2. waits for explicit user confirmation before continuing
3. clarifies the goal
4. defines scope and read-only areas
5. defines guard conditions
6. loads any standards sources needed for the in-scope areas
7. records user-provided research directions, references, tips, and explicit decisions in `research.md`
8. creates the run folder
9. generates the evaluator
10. creates `run.json`
11. creates the run `README.md` and `results.tsv`
12. shows the evaluator to the user and waits for explicit approval

### Phase 1. Baseline

The skill evaluates the current workspace before any edits and records:

- the initial condition
- the biggest problems relevant to the goal
- any mechanical check results
- the baseline summary in `results.tsv`

### Phase 2. Iteration loop

For each iteration from 1 to 10:

1. read `run.json`
2. confirm `current_iteration == N - 1`
3. re-read `research.md`, `evaluator.md`, and recent results
4. pick the next small change
5. save rollback artifacts under `iteration-<NN>/`
6. make the change
7. run the checks from the current evaluator
8. decide keep, revert, or no-op
9. if reverted, restore from the saved rollback artifacts
10. log the result, including evidence used and decision rationale
11. update `run.json`, including `iteration_statuses`

### Phase 3. Final summary

After the last allowed iteration, the skill writes a concise run summary:

- what improved
- what was reverted
- what still needs work
- recommended next run, if any

## Generated run artifacts

Each run should create a folder like:

`logs/general/workspace-autoresearch/<run-id>/`

Recommended contents:

- `README.md` — run status and file index
- `goal.md` — plain-language objective and constraints
- `research.md` — user-provided directions, references, examples, tips, and explicit decisions
- `evaluator.md` — run-specific standards and keep/revert criteria
- `evaluate.sh` — optional mechanical checks
- `run.json` — state ledger for iteration control
- `results.tsv` — one row per iteration plus baseline
- `iteration-01/` through `iteration-10/` — notes, diffs, or evaluation outputs as needed
- `summary.md` — final result

Each iteration folder should include:

- `plan.md`
- `before/`
- `research-notes.md` when the iteration uses new evidence or source material
- optional evaluation notes or command outputs

`results.tsv` should start with this header row:

`iteration	stage	decision	change_summary	checks_summary	evidence_used	decision_reason	touched_paths	rollback_artifact	outcome_summary	next_step`

## Evaluator generation model

The evaluator should be generated from the user's goal, not from a fixed universal rubric.

Example input goal:

> Make this workspace easier to maintain by reducing duplicated skill guidance, clarifying `AGENTS.md`, and cleaning up the docs structure without touching product code.

Example evaluator consequences:

- prioritize duplication removal and doc clarity
- allow edits in `skills/`, `README.md`, `AGENTS.md`, `workflows/`
- forbid edits to unrelated application code
- require cross-reference updates when files move
- treat "more files but less clarity" as a regression

For a different goal, such as "improve skill discoverability and install guidance," the evaluator would change accordingly.

## V1 boundaries

This first version is intended for workspace governance, not general repo optimization.

Good v1 targets:

- skill contracts and descriptions
- `AGENTS.md`
- `README.md`
- `WORKFLOW.md`
- docs structure
- folder naming and organization
- duplicated guidance and missing cross-references

Not a default v1 target:

- product feature code
- dependency upgrades
- CI/CD redesign
- broad renaming across the entire repo unless explicitly requested

## SmartWorkers-specific adaptation

This skill should follow repo conventions:

- source of truth under `skills/`
- run records under `logs/`
- final user-facing deliverables under `artifacts/` only when a run intentionally produces them
- `npx skills` as the install/apply path into `.agents/skills/`

When the run touches `skills/`, evaluator generation should explicitly use these references as standards sources:

- `skills/AGENTS.md`
- `skills/general/smart-skill-maker/references/AUTHORING.md`

It should also align with existing house rules in:

- `skills/AGENTS.md`
- `skills/general/smart-skill-maker/references/AUTHORING.md`

## What success looks like

A good run should feel like this:

- the user understands what the agent is trying to improve
- the evaluator makes the run's judgment criteria explicit
- the user explicitly approves the evaluator before the loop begins
- the user's domain knowledge and research guidance visibly influence the run
- changes are small enough to review
- weak changes are reverted instead of accumulating
- the loop stops exactly when promised
- the workspace is measurably clearer, more consistent, or easier to operate

If those conditions are not true, the skill should be revised before being trusted on larger workspaces.
