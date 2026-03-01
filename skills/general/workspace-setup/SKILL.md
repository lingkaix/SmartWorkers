---
name: workspace-setup
description: "Initialize a SmartWorkers-style **agent workspace** for any kind of work (sales, ops, recruiting, creative, research, software): generates a reviewable workspace skeleton (`README.md`, `AGENTS.md`, `temp/`, `artifacts/`, `.gitignore`, `.ignore`, `workers.example.jsonc`) and a required code-execution toolchain baseline (`.mise.toml`, `pyproject.toml`, `package.json`) via `mise` + `uv`."
compatibility: "macOS/Linux (Windows via WSL2). Requires bash. Internet access typically required for mise/uv runtime downloads."
---

# Workspace setup (agent workspace + required toolchain)

## Required inputs

- Repo root path (default: current working directory)
- Whether to **apply** changes to the repo root or generate to `temp/` for review first (recommended)
- Target tool versions (defaults: Node `24`, Python `3.14`, Bun `latest`, uv `latest`)
- OS/shell constraints (macOS/Linux; Windows requires WSL2)
- Whether internet access is allowed (mise/uv typically download tool artifacts)

## Workflow

1) Ensure workspace-root agent guidance is present and up to date:

   - If the repo **already has** a workspace-root `AGENTS.md`, **stop** and create a **new empty folder** for the new workspace; then re-run this skill with `--repo <new-folder>`.
   - If the repo does **not** have `AGENTS.md`, `scripts/init_workspace.sh --apply` will create it from `assets/templates/AGENTS.md.tmpl` (never overwriting existing files).
   - All important workspace rules and details must live in the workspace-root `AGENTS.md` (don’t leave critical policy only in skill docs or references).

2) Ensure key workspace folders and local rules exist:

   - Confirm `temp/` exists and contains `temp/AGENTS.md`.
   - Confirm `artifacts/` exists and contains `artifacts/AGENTS.md`.
   - Ensure these per-folder `AGENTS.md` files are tracked in git even if the rest of the folder is ignored.
   - `scripts/init_workspace.sh` will (when applying) create `temp/AGENTS.md` and `artifacts/AGENTS.md` if missing (never overwriting existing ones).

3) Generate baseline workspace files (safe default: write to `temp/`):

   - From the skill folder:
     - `cd skills/general/workspace-setup`
     - `bash scripts/init_workspace.sh`
   - Alternative (from repo root): `bash skills/general/workspace-setup/scripts/init_workspace.sh`
   - This generates:
     - `README.md` (non-technical overview + how to use the workspace)
     - `AGENTS.md` (workspace policy)
     - `temp/AGENTS.md` and `artifacts/AGENTS.md` (folder-local rules)
     - `.gitignore` (keeps `workers.jsonc` untracked; ignores `temp/**` + `artifacts/**` but re-includes their `AGENTS.md`)
     - `.ignore` (re-includes `temp/` + `artifacts/` for agent visibility even when `.gitignore` hides them)
     - `workers.example.jsonc` (copy to `workers.jsonc` locally; never commit secrets)
     - `.mise.toml`, `package.json`, `pyproject.toml` (required toolchain baseline for running helper scripts and automation)
   - Review what was generated in `temp/workspace-setup/` before applying.

4) Apply to the repo root when ready:

   - From the skill folder:
     - `cd skills/general/workspace-setup`
     - `bash scripts/init_workspace.sh --apply`
   - Alternative (from repo root): `bash skills/general/workspace-setup/scripts/init_workspace.sh --apply`
   - With `--apply`, the script never overwrites existing files.
   - If any of those files already exist, generate to `temp/workspace-setup/` first, then:
     - **Backup** the current file (keep it under `temp/workspace-setup/backups/`).
     - **Merge** the generated file into the existing one, **always respecting existing values** (treat generated as defaults; only add missing keys/sections/lines).
     - Replace the repo-root file with the merged result.

## Assets

- Template files live in `assets/templates/` and are rendered by `scripts/init_workspace.sh`:
  - `.mise.toml.tmpl`
  - `package.json.tmpl`
  - `pyproject.toml.tmpl`
  - `gitignore.recommended`
  - `workers.example.jsonc.tmpl`
  - `AGENTS.md.tmpl`
  - `temp.AGENTS.md.tmpl`
  - `artifacts.AGENTS.md.tmpl`

5) Install toolchain (required for code execution)

   - Ensure `mise` is installed and activated (shell hook) per https://mise.jdx.dev/getting-started.html
   - Then run one of:
     - `mise install`
     - `mise tasks run setup` (installs runtimes and bootstraps Python via uv)
   - Or let the initializer run it (only when applying):
     - `bash scripts/init_workspace.sh --apply --install --uv-sync`

## Automation vs manual edits

- Prefer `scripts/init_workspace.sh` when you want a fast, deterministic baseline workspace skeleton for agent work plus a runnable toolchain.
- Prefer manual edits when the workspace already has policies/structure and you only want to adopt parts of the conventions.

## Troubleshooting

- If any setup step fails: stop, clean the workspace, and report the failure in plain language with exact commands/log output and next-step suggestions.

## Outputs

- `README.md` (non-technical overview + how to use the workspace)
- `.mise.toml` (tool versions + helper tasks)
- `.gitignore` (workspace ignore patterns; generated candidate if one already exists)
- `.ignore` (Codex file-visibility overrides; re-includes working folders like `temp/` and `artifacts/`)
- `AGENTS.md` (workspace-root agent rules)
- `workers.example.jsonc` (example config; do not put real keys here)
- `package.json` (Node workspace manifest)
- `pyproject.toml` (Python deps; uv reads/writes this)
- `temp/workspace-setup/` (generated previews when not using `--apply`)
  - After you apply, `AGENTS.md` should live at the workspace root (not under `temp/`).
- `temp/AGENTS.md` (rules for scratch outputs)
- `artifacts/AGENTS.md` (rules for deliverables)

## Definition of done

- `README.md` exists in the workspace root and is readable by non-technical users
- `AGENTS.md` exists in the workspace root and is readable by humans
- `temp/` exists and contains `temp/AGENTS.md`
- `artifacts/` exists and contains `artifacts/AGENTS.md`
- `.ignore` exists in the repo root
- `.gitignore` exists and keeps `workers.jsonc` untracked
- `workers.example.jsonc` exists and documents how to create `workers.jsonc`
- `mise --version` works and `mise install` succeeds
- `node -v` reports `v24.x` (or your chosen version)
- `python --version` reports `3.14.x` (or your chosen version)

## Safety / quality checklist

- Do not overwrite existing `.mise.toml` or `pyproject.toml` without reviewing diffs.
- Do not add secrets to `workers.example.jsonc`, `pyproject.toml`, or `.mise.toml`.
- `.ignore` changes agent visibility; do not read/print secrets unless explicitly required.
- Keep generated outputs in `temp/` unless intentionally applying to the repo.
