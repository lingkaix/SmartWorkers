# SmartWorkers

SmartWorkers is a toolkit for using an AI agent (primarily **Codex**) like a dependable **AI worker**: you give it a job, it follows a repeatable playbook, and it produces reviewable outputs.

A “worker” in this repo is a **set of skills**: a step-by-step procedure (and sometimes helper scripts) that Codex can follow reliably.

## Who this is for

- Busy individuals and small teams who want consistent, repeatable results.
- Senior leaders who want outputs they can quickly review (clear deliverables, clear assumptions, clear file locations).
- Work that repeats: operations, reporting, customer support, recruiting, research, sales/admin tasks, content workflows.

## What you need

- Codex access
- A Codex project/workspace where you want to use the worker
- (Optional) API keys/credentials for certain workers (stored locally in `workers.jsonc`)

## Start in 5 minutes

1) Pick a worker from this repo under `skills/` (open its `SKILL.md` and follow “Required inputs”).
2) Install it into your Codex project (copy the worker into your project’s `.codex/skills/`).
3) If the worker requires keys/credentials:
   - Copy `workers.example.jsonc` into your project as `workers.jsonc`
   - Fill in only what the worker asks for
4) Tell Codex to use the worker and do the task.

Example prompt:

> Act as the **[RoleName]** worker. Use the installed worker skills.  
> Task: [what you want done].  
> Inputs: [files/links].  
> Output: write results to `artifacts/[something]/` (and working notes to `temp/[something]/`).

## Installing workers (skills)

Workers live in `skills/<role>/<skill-name>/`. To use one in your own Codex project, copy it into your project’s `.codex/skills/`:

1) In this repo, choose a worker:
   - `skills/<role>/<skill-name>/`
2) In your Codex project, create:
   - `.codex/skills/<skill-name>/`
3) Copy the worker folder contents into that destination.

If you prefer a one-line command (macOS/Linux):

```sh
rsync -a --delete "skills/<role>/<skill-name>/" "<your-codex-project>/.codex/skills/<skill-name>/"
```

Notes:
- The `skills/` folder is the source of truth for workers.
- End users should always install from `skills/`.

## Where outputs go

- `temp/` — drafts, logs, intermediate files (safe to delete)
- `artifacts/` — final deliverables (safe to review/share; don’t overwrite your inputs)

## What’s inside (simple map)

- `skills/` — the library of finished workers you can install into Codex
- `workers.jsonc` — your local-only keys/config (do not share publicly)

## Skill format

Skills in this repo follow the AgentSkills spec (`https://agentskills.io/specification`).

## For skill makers (maintainers)

If you’re creating/updating skills in this repo:

1) Read the AgentSkills spec: `https://agentskills.io/specification`
2) Install mise (toolchain manager, `https://mise.jdx.dev/`). And then set up the dev environment (above): `mise tasks run setup`
3) Use the `agent-skills` maintainer skill: `skills/general/agent-skills/SKILL.md`
