---
name: workspace-setup
metadata:
  skill_version: "1.0.0"
description: "Initialize a SmartWorkers-style agent workspace with repo-root guidance, `logs/`/`temp/`/`artifacts/`, a local `skills/` source tree, ignore rules, config templates, and global `mise` plus `npx skills` bootstrap guidance. Use when starting a new agent workspace, bootstrapping a fresh project folder for repeatable agent work, or standardizing README, WORKFLOW, AGENTS, and skill-management flow before adding more automation."
compatibility: "macOS/Linux (Windows via WSL2). Requires bash. Internet access may be needed for global `mise` or `npm` installs, `npx skills` installs, and optional `uv sync`."
---

# Workspace Setup

## Required inputs

- Repo root path, defaulting to the current working directory
- Whether the goal is a brand-new workspace or a partial/manual adoption into an existing repo
- Tool version constraints when the defaults are not acceptable:
  - Node `24`
  - Python `3.14`
- OS and shell constraints, especially whether the environment is macOS, Linux, or Windows via WSL2
- Whether networked installs are allowed for global runtime bootstrap, `npx skills` installs, or later dependency sync
- Whether the workspace should bootstrap Codex skill tooling during setup:
  - global `mise` runtimes
  - global `skills` npm package
  - `skill-creator`
  - `smart-skill-maker`

## Workflow

1. Confirm that this skill is the right tool for the target folder.
   - This initializer is for a new SmartWorkers-style workspace.
   - If the target repo already has a workspace-root `AGENTS.md`, do not force in-place setup. Either create a new empty folder and rerun with `--repo <new-folder>`, or switch to manual adoption of only the pieces the user wants.

2. Run the initializer directly against the target repo.
   - From the repo root:
     - `bash skills/general/workspace-setup/scripts/init_workspace.sh --repo <path>`
   - From the skill folder:
     - `bash scripts/init_workspace.sh --repo <path>`
   - The script writes directly into the repo root in one shot.
   - Existing files are never overwritten.
   - If `AGENTS.md` already exists at the repo root, stop and switch to manual adoption or a fresh folder.

3. Confirm the generated workspace skeleton landed correctly.
   - The initializer can generate:
     - `README.md` for a non-technical overview of the workspace and how to use it
     - `WORKFLOW.md` for recurring workflows the user wants agents to follow
     - `AGENTS.md` for workspace-root agent guidance and policy
     - `logs/AGENTS.md` for rules on agent scratch output
     - `temp/AGENTS.md` for rules on user-managed temporary files
     - `artifacts/AGENTS.md` for rules on deliverables and final outputs
     - `skills/AGENTS.md` for the workspace-local skill source tree
     - `.gitignore` to keep local-only and generated files out of git while preserving tracked guidance files
     - `.ignore` to keep important working folders visible to the agent even when `.gitignore` hides them
     - `workers.example.jsonc` as a safe config template the user can copy into local `workers.jsonc`
     - `package.json` for the Node workspace manifest
     - `pyproject.toml` for the Python project manifest used by `uv`
   - Check that `AGENTS.md`, `WORKFLOW.md`, `skills/AGENTS.md`, `.gitignore`, and `.ignore` fit the workspace the user is actually setting up.
   - Check that generated guidance files include the workspace-setup generator version and template spec version so maintainers can identify which conventions produced them.

4. Handle existing repos conservatively.
   - The script never overwrites existing files.
   - If a file already exists and the repo should still adopt the workspace conventions, merge in only the missing sections manually while preserving existing project-specific content.
   - Treat this as a new-workspace initializer, not a blind upgrader for mature repos.

5. Bootstrap global tools when the machine does not already have them and the user approves install steps.
   - Because Codex runs commands inside a sandbox, the runtime tools it depends on should be available globally.
   - Preferred global runtime baseline:
     - `mise use -g node@24 python@3.14 uv@latest`
   - During first-time bootstrap, prefer `mise exec` for the install commands themselves so they work immediately in the current shell even before shell startup files are reloaded.
   - If `mise` is missing, install it globally first by following the official guide:
     - `https://mise.jdx.dev/getting-started.html`
   - After npm is available, check whether the `skills` package is installed globally:
     - `mise exec node@24 -- npm list -g skills --depth=0`
   - If `skills` is missing, install it globally:
     - `mise exec node@24 -- npm install -g skills`
   - Install `skill-creator` for Codex:
     - `mise exec node@24 -- npx skills add -a codex -y https://github.com/anthropics/skills/tree/main/skills/skill-creator`
   - Install `smart-skill-maker` for Codex:
     - Prefer local disk source when the SmartWorkers repo is already on disk:
       - `mise exec node@24 -- npx skills add -a codex -y <smartworkers-source>/skills/general/agent-skills/skills/smart-skill-maker`
     - Otherwise fall back to the canonical GitHub source:
       - `mise exec node@24 -- npx skills add -a codex -y https://github.com/lingkaix/SmartWorkers/tree/main/skills/general/agent-skills/skills/smart-skill-maker`
   - The initializer script can help with this directly:
     - `bash skills/general/workspace-setup/scripts/init_workspace.sh --repo <path> --install`

6. Use `npx skills` as the only install/update tool for agent skills in the workspace.
   - Install or refresh skills with:
     - `npx skills add -a codex -y <source>`
   - Apply a locally authored skill from the workspace source tree with:
     - `npx skills add -a codex -y ./skills --skill <skill-name>`
   - Check for updates with:
     - `npx skills check`
   - Update installed skills with:
     - `npx skills update`
   - Do not manually copy or patch `.agents/skills/`; let `npx skills` manage the installed agent copy.

7. Use `smart-skill-maker` as the only create/improve skill tool inside the workspace.
   - `smart-skill-maker` uses `skill-creator` as its core authoring engine, then layers SmartWorkers conventions on top.
   - The workspace-local `skills/` folder is the source of truth for skills being created or upgraded.
   - For a new skill, create it under `skills/<role>/<skill-name>/`.
   - Keep the skill `name` stable for install/update commands, and record revisions in frontmatter `metadata.skill_version` instead of appending versions to the skill name.
   - A role is the worker identity and usage scope, not a generic tool category. Put similar capabilities into different roles when the real job, workflow, or acceptance criteria differ.
   - When improving an already installed skill and no source copy exists yet, first copy the current installed copy from `.agents/skills/<skill-name>/` into `skills/<role>/<skill-name>/`, where `<role>` is the worker the skill belongs to.
   - After the skill is created or updated in `skills/`, apply the update to Codex with:
     - `npx skills add -a codex -y ./skills --skill <skill-name>`

8. Bootstrap repo-local dependencies only when needed and only with clear approval.
   - Optional Python bootstrap:
     - `bash skills/general/workspace-setup/scripts/init_workspace.sh --repo <path> --uv-sync`
   - If the repo later adds Node or other tool-specific dependencies, install them with the repo-local package manager and lockfile rather than using ad-hoc global packages.
   - Prefer mature, widely used tools before handwritten code for domain-specific jobs when they are a clear fit.
   - Good examples:
     - `ffmpeg` for video and audio conversion/extraction
     - `ImageMagick` for image conversion, compositing, and batch transforms
     - `uv` for Python environments and dependency sync
   - Avoid obscure community utilities unless there is a clear reason and the user or maintainer has approved them.

9. Report what was created, skipped, or left for manual follow-up.
   - Call out any files that were skipped because they already existed.
   - Confirm the repo-root files and per-folder `AGENTS.md` files now exist where expected.
   - Report the workspace-setup generator version and template spec version used for generated guidance files.
   - If global bootstrap was requested, report the status of `mise`, npm, `npx skills`, `skill-creator`, and `smart-skill-maker`.

## Temp and output conventions

- Applied workspace files live at the repo root plus `logs/`, `temp/`, and `artifacts/`.
- Workspace-local skill sources live under `skills/`.
- Any manual adoption notes or merge records should go under `logs/workspace-setup/`.

## Outputs

- Repo-root guidance and setup files:
  - `README.md`
  - `WORKFLOW.md`
  - `AGENTS.md`
  - `.gitignore`
  - `.ignore`
  - `workers.example.jsonc`
  - `package.json`
  - `pyproject.toml`
- Folder-local guidance:
  - `logs/AGENTS.md`
  - `temp/AGENTS.md`
  - `artifacts/AGENTS.md`
  - `skills/AGENTS.md`
- Optional installed agent skills under `.agents/skills/` when setup also bootstraps or applies skills

## Defaults & rules

- Default to direct apply. This skill is meant to finish setup in one shot for non-technical users.
- Treat this as a new-workspace initializer, not a blind in-place upgrader for mature repos.
- Keep real secrets in `workers.jsonc`; `workers.example.jsonc` should stay safe to commit.
- Prefer the script for deterministic setup, and manual edits only when the user wants partial adoption into an existing repo.
- Prefer global `mise` for Codex runtimes when Node, Python, npm, npx, or uv are missing.
- Use `npx skills` as the only install/update tool for agent skills in the workspace.
- Use `smart-skill-maker` as the only create/improve skill tool in the workspace.
- Keep the source of truth for authored skills under `skills/`, then apply them to Codex with `npx skills add -a codex -y ./skills --skill <skill-name>`.
- Keep skill names stable; use frontmatter `metadata.skill_version` and generated version banners to distinguish revisions instead of embedding versions in the skill name.
- Prefer mature, well-known CLI tools before custom one-off code when those tools are a clear fit for the task.
- Avoid random community utilities unless they are clearly justified and approved.
- Ask before running install steps that download dependencies or modify the local runtime environment or global toolchain.

## Definition of done

- The repo root has `README.md`, `WORKFLOW.md`, `AGENTS.md`, `.gitignore`, `.ignore`, `workers.example.jsonc`, `package.json`, and `pyproject.toml` unless intentionally skipped because matching files already existed
- `logs/`, `temp/`, `artifacts/`, and `skills/` exist with their corresponding `AGENTS.md` files where expected
- The generated files accurately reflect the user's tool-version and workspace-structure constraints
- The generated guidance files show the workspace-setup generator version and template spec version
- If global bootstrap was requested, `mise`, npm, and `npx skills` are available globally or failures were reported clearly with next steps
- If dependency bootstrap was requested, the required commands completed successfully or failures were reported clearly with next steps
- If skills were part of setup, `skill-creator` and `smart-skill-maker` are installed for Codex and `npx skills` is the documented install/update path

## Safety / quality checklist

- Do not overwrite existing repo files without review; use manual adoption when a repo already has its own structure.
- Do not put secrets in `workers.example.jsonc`, `package.json`, or `pyproject.toml`.
- `.ignore` changes what the agent can see; avoid reading or printing secret material unless the task truly requires it.
- Treat runtime, tool, and package installation as a separate approval point because it downloads software and changes the local environment.
- Do not manually edit `.agents/skills/` as the source of truth for authored skills.
- Prefer established tools with stable docs and broad adoption over obscure utilities or hand-rolled replacements.
