# Workspace Autoresearch Loop Protocol

Use this protocol when the skill is actively running a workspace-improvement loop.

## 1. Preflight

Before editing:

1. Warn the user that the workspace may change significantly.
2. Tell the user to back up, commit, or otherwise protect the current state first.
3. Stop here until the user explicitly confirms the run may continue.
4. Treat the user's stated goal as authoritative unless a concrete execution decision is still missing.
5. Declare:
   - in-scope paths
   - read-only paths
   - guard conditions
   - iteration bound
6. When the run touches `skills/`, load `skills/AGENTS.md` and `skills/general/smart-skill-maker/references/AUTHORING.md` before generating the evaluator.
7. Record user-provided research directions, references, tips, and explicit decisions in `research.md`.

## 2. Generate the run package

Create:

- `README.md`
- `goal.md`
- `research.md`
- `evaluator.md`
- optional `evaluate.sh`
- `run.json`
- `results.tsv`

Use the evaluator to define what "better" means for this run. Do not start editing until the evaluator is concrete enough to judge keep or revert decisions.
Show the generated evaluator to the user and wait for explicit approval before iteration `1`.

`results.tsv` must use this fixed header:

`iteration	stage	decision	change_summary	checks_summary	evidence_used	decision_reason	touched_paths	rollback_artifact	outcome_summary	next_step`

## 3. Record a baseline

Run the current evaluator against the unchanged workspace and record iteration `0`.
Re-read `research.md` before defining the baseline so the starting point reflects the user's expert framing.

The baseline should summarize:

- current strengths
- current weaknesses
- failing checks
- obvious risks

## 4. Iteration routine

For iteration `N`:

1. Read `run.json`.
2. If `current_iteration >= max_iterations`, stop.
3. `current_iteration` means completed iterations. Only begin iteration `N` when `current_iteration == N - 1`.
4. Read `research.md`, `evaluator.md`, and the most recent `results.tsv` rows.
5. Choose one focused improvement.
6. Create `iteration-<NN>/plan.md` and save pre-change copies of all touched files under `iteration-<NN>/before/`.
7. Create `iteration-<NN>/research-notes.md` when the iteration uses new evidence, examples, or source material.
8. For a rename or move, record both old and new paths in `plan.md`.
9. Apply the change.
10. Run evaluator checks.
11. Decide:
   - `keep`
   - `revert`
   - `no-op`
12. If the decision is `revert`, restore from `iteration-<NN>/before/` and remove files created only by the iteration.
13. Log the result, including evidence used, decision reason, touched paths, and rollback artifact.
14. Set `current_iteration` to `N`, append `N` to `completed_iterations`, and record the iteration outcome in `iteration_statuses`.
15. Update `run.json`.

## 5. Decision rule

Keep the change only if it is better under the current evaluator.

Revert the change when:

- it fails a guard
- it violates scope
- it introduces more confusion than it removes
- it creates inconsistent docs or broken references
- it does not materially improve the run goal

## 6. Stop rule

The loop must stop when the bound is reached.

Default:

- `max_iterations = 10`

Do not start an additional iteration after the cap has been reached. Write the summary instead.

## 7. Summary

At the end of the run, write:

- completed improvements
- reverted attempts
- unresolved issues
- suggested follow-up scope for a future run
