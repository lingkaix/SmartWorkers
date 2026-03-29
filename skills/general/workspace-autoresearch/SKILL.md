---
name: workspace-autoresearch
metadata:
  skill_version: "0.4.0"
description: "Review and iteratively improve a SmartWorkers-style workspace with a run-specific evaluator, research-guided iteration, and explicit keep-or-revert decisions. Use when an advanced user wants to auto-review or auto-improve `skills/`, `AGENTS.md`, `WORKFLOW.md`, `README.md`, docs, or folder organization and can provide clear goals, research directions, references, or domain-specific judgment."
compatibility: "Local filesystem required. Git available preferred for safe review and rollback. Best for SmartWorkers-style workspaces with `skills/`, `logs/`, and repo guidance files."
---

# Workspace Autoresearch

Use `README.md` for the design rationale and run model. Use `references/loop-protocol.md` when executing the run.

## Required inputs

- The workspace root path, defaulting to the current working directory
- A concrete optimization goal for this run
- In-scope paths that may be changed
- Read-only paths that must not be changed
- Guard conditions that must keep passing
- Optional but strongly preferred research guidance from the user:
  - directions to explore
  - reference files, links, or examples
  - domain-specific tips or heuristics
  - explicit judgments or non-obvious preferences
- Explicit user confirmation that they have backed up, committed, or otherwise protected the current workspace before significant edits and want the run to proceed
- Optional override for iteration count
  - Default and recommended: `10`
  - Do not exceed `10` unless the user explicitly asks for a different bound

## Workflow

1. Preflight and safety gate
   - Warn the user that the workspace may change significantly.
   - Tell the user to back up, commit, or otherwise protect current work before the loop starts.
   - Stop here until the user explicitly confirms they have done so and want the run to continue.
   - Treat the user's stated goal as authoritative by default.
   - Only ask for clarification when a concrete decision is missing and would change the run's execution or evaluation.
   - Define in-scope and read-only paths.
   - Define any guard conditions that must continue to hold.
   - Gather and record any user-provided research directions, reference materials, tips, or explicit decisions for this run.
   - When the run touches `skills/`, load `skills/AGENTS.md` and `skills/general/smart-skill-maker/references/AUTHORING.md` before generating the evaluator.

2. Create the run folder and evaluator
   - Create `logs/general/workspace-autoresearch/<run-id>/`.
   - Prefer the deterministic helper script to scaffold the run package:
     - From the repo source tree:
       - `bash skills/general/workspace-autoresearch/scripts/init_run.sh --workspace-root . --run-id <run-id> --goal "<goal>" --scope <path> --readonly <path> --guard "<guard>" --direction "<research direction>" --reference "<path-or-url>" --tip "<domain tip>" --decision "<explicit user decision>"`
     - From the installed Codex skill:
       - `bash .agents/skills/workspace-autoresearch/scripts/init_run.sh --workspace-root . --run-id <run-id> --goal "<goal>" --scope <path> --readonly <path> --guard "<guard>" --direction "<research direction>" --reference "<path-or-url>" --tip "<domain tip>" --decision "<explicit user decision>"`
   - Generate:
     - `README.md`
     - `goal.md`
     - `research.md`
     - `evaluator.md`
     - optional `evaluate.sh`
     - `run.json`
     - `results.tsv`
   - Use `assets/templates/evaluator.md.tmpl`, `assets/templates/research.md.tmpl`, `assets/templates/run.json.tmpl`, `assets/templates/results.tsv.tmpl`, and `assets/templates/run.README.md.tmpl` as starting points when generating the run package manually.
   - Show the generated evaluator to the user and wait for explicit approval before the first editing iteration.

3. Establish the baseline
   - Review the current state of all in-scope files before editing.
   - Re-read `research.md` before defining the baseline so the run starts from the user's expert framing, not only the agent's default assumptions.
   - Run the current evaluator checks against the unchanged workspace.
   - Record a baseline row in `results.tsv` as iteration `0` using the fixed columns:
     - `iteration`
     - `stage`
     - `decision`
      - `change_summary`
      - `checks_summary`
      - `evidence_used`
      - `decision_reason`
      - `touched_paths`
      - `rollback_artifact`
      - `outcome_summary`
      - `next_step`

4. Run the bounded loop
   - Before each iteration, read `run.json`.
    - If `current_iteration >= max_iterations`, stop immediately and write the final summary.
    - `current_iteration` means completed iterations.
    - To begin iteration `N`, `current_iteration` must equal `N - 1`.
   - Re-read `research.md`, `evaluator.md`, and the latest `results.tsv` rows before choosing the next change.
   - For each iteration, make one focused improvement only.
   - Before editing, create `iteration-<NN>/` and save rollback artifacts for every file you plan to touch:
     - pre-change file copies under `iteration-<NN>/before/`
     - a short `plan.md` naming the intended change and touched paths
     - a short `research-notes.md` when this iteration uses new evidence, examples, or user-provided materials
     - for renames or moves, record both old and new paths in `plan.md`
   - Run the evaluator checks.
    - Decide `keep`, `revert`, or `no-op`.
    - If the decision is `revert`, restore files from `iteration-<NN>/before/` and remove files created only by that iteration before moving on.
    - Log the outcome in `results.tsv`.
   - After logging iteration `N`, set `current_iteration` to `N`, append `N` to `completed_iterations`, and record the result in `iteration_statuses`.
   - Update `run.json` before considering another iteration.

5. Stop on time and summarize
   - After the final allowed iteration, set `run.json` `status` to `completed`.
   - Write `summary.md` with:
     - what improved
     - what was reverted
     - remaining problems
     - suggested next run

## Log and output conventions

- Working records: `logs/general/workspace-autoresearch/<run-id>/`
- Default run files:
  - `README.md`
  - `goal.md`
  - `research.md`
  - `evaluator.md`
  - `evaluate.sh` when useful
  - `run.json`
  - `results.tsv`
  - `summary.md`
- Per-iteration notes or evidence:
  - `logs/general/workspace-autoresearch/<run-id>/iteration-01/`
  - through `iteration-10/` or the configured maximum

## Outputs

- `logs/general/workspace-autoresearch/<run-id>/README.md` — run status and file index
- `logs/general/workspace-autoresearch/<run-id>/goal.md` — run goal and scope
- `logs/general/workspace-autoresearch/<run-id>/research.md` — user-provided directions, references, tips, and explicit decisions for the run
- `logs/general/workspace-autoresearch/<run-id>/evaluator.md` — run-specific standards and keep/revert rules
- `logs/general/workspace-autoresearch/<run-id>/run.json` — iteration ledger and stop control
- `logs/general/workspace-autoresearch/<run-id>/results.tsv` — baseline plus per-iteration outcomes with fixed header `iteration	stage	decision	change_summary	checks_summary	evidence_used	decision_reason	touched_paths	rollback_artifact	outcome_summary	next_step`
- `logs/general/workspace-autoresearch/<run-id>/summary.md` — end-of-run summary

## Defaults & rules

- Default to a bounded run of exactly `10` iterations.
- Do not begin substantial edits until the user has been warned to back up and has explicitly confirmed the run may proceed.
- Treat this as an advanced-user skill. Prefer concise alignment and explicit decisions over tutorial-style guidance.
- Do not use a fixed evaluator across all runs. Generate a new evaluator for each run from the user's goal.
- When the run touches `skills/`, ground the evaluator in `skills/AGENTS.md` and `skills/general/smart-skill-maker/references/AUTHORING.md`.
- Always get explicit user approval of the generated evaluator before iteration `1`.
- Treat user-provided research directions, references, tips, and explicit decisions as first-class run inputs. Record them in `research.md` and use them actively during planning and evaluation.
- Do not combine unrelated changes in one iteration.
- Prefer workspace-governance targets such as `skills/`, `README.md`, `AGENTS.md`, `WORKFLOW.md`, docs, and file organization.
- Do not expand into broad product-code refactors unless the user explicitly includes them in scope.
- Revert weak or regressive changes instead of letting them accumulate.
- Treat `run.json` as the source of truth for whether the loop may continue.

## Definition of done

- The run folder exists under `logs/general/workspace-autoresearch/<run-id>/`
- The evaluator was generated specifically for the current run
- User-provided research guidance was recorded in `research.md` when available
- A baseline was recorded before iterative edits
- Each iteration made one focused change and recorded a decision
- The loop stopped at the configured bound
- The final summary clearly states what improved and what remains

## Safety / quality checklist

- Do not skip the backup warning.
- Do not proceed past preflight without explicit user confirmation.
- Do not print secrets from local config files.
- Do not let the evaluator drift after the run starts without explicit user agreement.
- Do not ignore explicit user decisions or domain-specific constraints recorded in `research.md`.
- Do not start an iteration without first saving rollback artifacts for the planned touched files.
- Do not exceed the iteration cap.
- Do not make destructive or broad-scope changes outside the declared scope.
- Keep logs readable enough that a human can audit the run afterward.
