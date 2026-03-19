---
name: workspace-setup
description: "Initialize a SmartWorkers-style agent workspace with repo-root guidance, `logs/`/`temp/`/`artifacts/`, ignore rules, config templates, and a `mise` plus `uv` toolchain baseline. Use when starting a new agent workspace, bootstrapping a fresh project folder for repeatable agent work, or standardizing README, WORKFLOW, AGENTS, and runtime setup before adding more skills or automation."
compatibility: "macOS/Linux (Windows via WSL2). Requires bash. Internet access is typically required for `mise` and `uv` downloads."
---

# Workspace Setup

## Required inputs

- Repo root path, defaulting to the current working directory
- Whether to generate a preview under `logs/workspace-setup/` first or apply directly to the repo root
- Tool version constraints when the defaults are not acceptable:
  - Node `24`
  - Python `3.14`
  - Bun `latest`
  - uv `latest`
- OS and shell constraints, especially whether the environment is macOS, Linux, or Windows via WSL2
- Whether networked installs are allowed, because `mise install`, `npm i`, and `uv` bootstrap steps typically download dependencies
- Whether the goal is a brand-new workspace or a partial/manual adoption into an existing repo

## Workflow

1. Confirm that this skill is the right tool for the target folder.
   - This initializer is for a new SmartWorkers-style workspace.
   - If the target repo already has a workspace-root `AGENTS.md`, do not force `--apply`; either create a new empty folder and rerun with `--repo <new-folder>`, or switch to manual adoption of only the pieces the user wants.

2. Choose preview mode first unless the user explicitly wants direct application.
   - From the repo root:
     - `bash skills/general/workspace-setup/scripts/init_workspace.sh --repo <path>`
   - From the skill folder:
     - `bash scripts/init_workspace.sh --repo <path>`
   - Without `--apply`, the script writes reviewable output to `logs/workspace-setup/`.

3. Review the generated workspace skeleton before applying it.
   - The initializer can generate:
     - `README.md` for a non-technical overview of the workspace and how to use it
     - `WORKFLOW.md` for recurring workflows the user wants agents to follow
     - `AGENTS.md` for workspace-root agent guidance and policy
     - `logs/AGENTS.md` for rules on agent scratch output
     - `temp/AGENTS.md` for rules on user-managed temporary files
     - `artifacts/AGENTS.md` for rules on deliverables and final outputs
     - `.gitignore` to keep local-only and generated files out of git while preserving tracked guidance files
     - `.ignore` to keep important working folders visible to the agent even when `.gitignore` hides them
     - `workers.example.jsonc` as a safe config template the user can copy into local `workers.jsonc`
     - `.mise.toml` for runtime versions and helper tasks
     - `package.json` for the Node workspace manifest
     - `pyproject.toml` for the Python project manifest used by `uv`
   - Make sure the generated files fit the user's project, especially the guidance in `AGENTS.md`, the workflow framing in `WORKFLOW.md`, and the ignore behavior in `.gitignore` and `.ignore`.

4. Apply only when the target is ready.
   - Run:
     - `bash skills/general/workspace-setup/scripts/init_workspace.sh --repo <path> --apply`
   - The script never overwrites existing files.
   - If a file already exists and the repo should still adopt the workspace conventions, generate the preview first, back up the current file under `logs/workspace-setup/backups/`, then merge in the missing sections manually while preserving existing project-specific content.

5. Install runtimes and bootstrap tooling only with clear approval.
   - Networked setup options:
     - `bash skills/general/workspace-setup/scripts/init_workspace.sh --repo <path> --apply --install --uv-sync`
     - `mise install`
     - `mise tasks run setup`
   - The script's `--install` path installs runtimes, globally installs the `skills` CLI, and adds `skill-creator` for local Codex use.
   - Use this step when the user wants a runnable automation baseline, not just the file scaffold.

6. Report what was created, skipped, or left for manual follow-up.
   - Call out any files that were skipped because they already existed.
   - If the workspace was only previewed, point the user to `logs/workspace-setup/`.
   - If the workspace was applied, confirm the repo-root files and per-folder `AGENTS.md` files now exist where expected.

## Temp and output conventions

- Preview output goes to `logs/workspace-setup/`.
- Manual merge backups should live under `logs/workspace-setup/backups/`.
- Applied workspace files live at the repo root plus `logs/`, `temp/`, and `artifacts/`.

## Outputs

- Repo-root guidance and setup files:
  - `README.md`
  - `WORKFLOW.md`
  - `AGENTS.md`
  - `.gitignore`
  - `.ignore`
  - `workers.example.jsonc`
  - `.mise.toml`
  - `package.json`
  - `pyproject.toml`
- Folder-local guidance:
  - `logs/AGENTS.md`
  - `temp/AGENTS.md`
  - `artifacts/AGENTS.md`
- `logs/workspace-setup/` for generated previews when not applying directly

## Defaults & rules

- Default to preview mode for safety and reviewability.
- Treat this as a new-workspace initializer, not a blind in-place upgrader for mature repos.
- Keep real secrets in `workers.jsonc`; `workers.example.jsonc` should stay safe to commit.
- Prefer the script for deterministic setup, and manual edits when the user only wants part of the convention set.
- Ask before running install steps that download dependencies or modify the local runtime environment.

## Definition of done

- In preview mode, `logs/workspace-setup/` contains a complete candidate workspace skeleton ready for review
- In apply mode, the repo root has `README.md`, `WORKFLOW.md`, `AGENTS.md`, `.gitignore`, `.ignore`, `workers.example.jsonc`, `.mise.toml`, `package.json`, and `pyproject.toml` unless intentionally skipped because matching files already existed
- `logs/`, `temp/`, and `artifacts/` exist with their corresponding `AGENTS.md` files
- The generated files accurately reflect the user's tool-version and workspace-structure constraints
- If install steps were requested, the required runtime bootstrap commands completed successfully or failures were reported clearly with next steps

## Safety / quality checklist

- Do not overwrite existing repo files without review; use preview output plus manual merge when a repo already has its own structure.
- Do not put secrets in `workers.example.jsonc`, `.mise.toml`, `package.json`, or `pyproject.toml`.
- `.ignore` changes what the agent can see; avoid reading or printing secret material unless the task truly requires it.
- Keep generated preview files under `logs/` unless the user explicitly wants the workspace applied.
- Treat toolchain installation as a separate approval point because it downloads software and changes the local environment.
