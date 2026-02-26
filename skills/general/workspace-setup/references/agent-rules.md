## AGENTS.md authoring guide (SmartWorkers)

Use this as a guide when creating or updating a workspace-root `AGENTS.md`.

An `AGENTS.md` file is for **agent runners, developers, and maintainers** of the repo (not end users). It should be short, practical, and optimized for how agents actually work.

### Goals

- Make the “right thing” the default for agents working in this workspace.
- Keep end-user docs out of `AGENTS.md` (they belong in `README.md`).
- Encode repo-specific conventions that are easy to miss (secrets, outputs, skill layout).
- Prefer “do X” guidance over long explanations.

### What to include in `AGENTS.md`

At minimum, cover:

- **Config & secrets** (where config lives; what not to do).
- **Outputs** (where intermediate and final files go).
- **Repo conventions** (how skills are structured and where “public contract” docs live).
- **Maintenance rules** (what to update when workflows change).

If your repo has multiple subprojects or languages, also include:

- How to run tests / lint (commands).
- Key directories and ownership (where to edit what).
- Any “don’t touch” areas (generated files, vendor folders).

### Runtime and toolchain policy (mise)

This workspace uses `mise` to manage runtimes and coding tools (see the repo’s `.mise.toml`).

- When diagnosing issues, always check what tool versions are active: `mise current`
- When running commands, prefer `mise exec -- <cmd>` so you use the workspace-managed tools, for example:
  - `mise exec -- node -v`
  - `mise exec -- python --version`
  - `mise exec -- uv --version`
- If a script provides a `mise` task, prefer running the task instead of retyping steps.
- If you need dependencies to run code, use the workspace toolchain:
  - Install runtimes via `mise install` (or the repo’s `mise` tasks).
  - Install Node deps with `npm` in this repo (avoid global installs).
  - Install/sync Python deps with `uv` (`uv venv --seed`, `uv sync`; avoid global `pip install`).

### Secret and config policy (SmartWorkers)

- Workspace-root `workers.jsonc` is the **single source of truth** for API keys, secrets, and endpoints.
- Never ask users to paste secrets into chat.
- Never “work around” missing config by using env vars, hardcoding, or interactive prompts.
- Never print or log secrets from `workers.jsonc` (it’s OK to say “`openai.apiKey` is missing”, but not the value).

#### Missing or invalid required config: guide user, then stop

If a skill requires a config value and it’s **missing** or appears **invalid** (for example: API authentication fails), do the following:

1) Add or update a placeholder hint in `workers.jsonc` (do not invent values), for example:

```jsonc
{
  "openai": {
    "apiKey": "[PLEASE ENTER KEY HERE]"
  }
}
```

2) Stop the task.
3) Give the user non-technical, actionable next steps:

   - Open the file `workers.jsonc` at the **top level of the repo**.
   - Find the setting called `openai.apiKey` (or the exact key name you referenced in your error message).
   - Replace the placeholder text with the real key value (keep the quotes; don’t add extra spaces).
   - Save the file.
   - Re-run the task.

4) If the value is present but still fails auth, tell the user what to do next:

   - Double-check they edited the correct file: workspace-root `workers.jsonc` (not `workers.example.jsonc`).
   - Ensure the key is copied fully (no missing characters, no newline at the end).
   - If they’re not sure the key is valid, they may need to generate a new key in the provider’s dashboard and update `workers.jsonc`.

5) If the user can’t fix it (or it seems complex), guide them to seek help from a technical person and provide an “inspection bundle” they can forward:

   - The exact error message (with any secrets removed).
   - The command they ran (preferably the `mise exec -- ...` form).
   - The output of `mise current`.
   - The relevant config path name (for example: `openai.apiKey`) and confirmation of whether it’s present (never the value).

#### Skill script failures: stop and report (don’t “work around”)

Once a user has specified a skill (or you have decided to use one) and you are running its scripts: if you hit failures that look like a **bug**, **remote service/server outage**, **network issue**, **rate limit**, or similar “external dependency” problem, stop and report.

- Do not try to bypass the failure by writing ad-hoc one-off scripts, switching to an unrelated local implementation, or otherwise changing the agreed approach without user direction.
- Report the exact command, the error output, and the likely category (bug vs config vs network vs upstream service), plus a clear next step for the user (retry later, check network, update `workers.jsonc`, file an issue, etc.).

### Output locations (SmartWorkers)

- Put intermediate/working files under `temp/`.
- Put final deliverables under `artifacts/`.
- Group each task run into a dedicated subfolder under both `temp/` and `artifacts/`, and keep the **run folder name identical** in both places.
  - Use this naming format (local time): `YYYYMMDD-HHMMSS-<epochMs>-<short-desc>`
  - Example: `artifacts/subaru-brz-ads/20260301-212955-1709309395257-subaru-brz-ads/` (and the matching `temp/subaru-brz-ads/20260301-212955-1709309395257-subaru-brz-ads/`)
- If you create one-off scripts or temporary resources for a task, put them inside that task’s `temp/<short-desc>/<run-folder>/` subfolder (not as new top-level folders in the repo root).
- Each task subfolder in `temp/` or `artifacts/` must include a `README.md` that records progress and lists files.
- When you complete a task (success or failure), provide a short report: result/status, delivered outputs (paths), the process you followed, and evaluation/suggestions for next steps.

### Workspace skeleton (required files/folders)

When setting up or polishing a workspace, ensure these **key folders** exist and are documented with local rules:

- `temp/` (scratch, can be deleted anytime)
  - Must contain `temp/AGENTS.md` describing usage, restrictions, and what belongs here.
- `artifacts/` (final deliverables)
  - Must contain `artifacts/AGENTS.md` describing what counts as a deliverable, expected structure, and any restrictions.

If a key folder is missing, create it. If its `AGENTS.md` is missing or outdated, create/polish it.
These per-folder `AGENTS.md` files should be tracked in git even if the rest of the folder is ignored.

### Recommended `AGENTS.md` template

Use this template as a baseline (adjust names/paths for your workspace):

```md
# Agent Instructions (SmartWorkers)

This file is for agent runners, developers, and maintainers of this repo (not end users). End-user docs live in `README.md`.

## Config and secrets

- Put local config (API keys, credentials, endpoints) in `workers.jsonc`.
- Never commit real secrets. If the config structure needs sharing, update `workers.example.jsonc`.
- Do not ask users to paste raw secrets into chat.
- Do not “work around” missing config by using env vars, hardcoding, or interactive prompts.

## Toolchain (mise)

- This repo uses `mise` to manage runtimes and coding tools (see `.mise.toml`).
- Prefer `mise exec -- <cmd>` when running commands (example: `mise exec -- node -v`).
- When debugging “wrong version” issues, check `mise current`.

## Outputs

- Intermediate files go in `temp/`; final deliverables go in `artifacts/`.
- Create a per-task subfolder and include a short `README.md` that lists produced files.
- Ensure `temp/AGENTS.md` and `artifacts/AGENTS.md` exist and describe rules for those folders.

## Repo conventions

- Skill public contract: `skills/<role>/<skill-name>/SKILL.md`
- Keep skills lean:
  - Essential steps in `SKILL.md`
  - Heavy docs/screenshots in `references/`
  - Mechanical steps in `scripts/`
```

### Update checklist

When polishing or updating a workspace-root `AGENTS.md`:

- Ensure the file is **repo-specific** (no generic boilerplate that contradicts reality).
- Keep it **scannable** (headings + short bullets).
- Confirm the **secrets** policy matches the actual config mechanism used by the repo.
- Confirm the **mise** guidance matches the actual `.mise.toml` used by the repo.
- Confirm the **output** policy matches how the repo is actually organized.
- Ensure key folders exist (`temp/`, `artifacts/`) and each has its own `AGENTS.md` documenting local rules.
- If you add skill structure rules, ensure they match existing folders and naming.
