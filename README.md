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
2) Install it into your Codex project with `npx skills`.
3) If the worker requires keys/credentials:
   - Copy `workers.example.jsonc` into your project as `workers.jsonc`
   - Fill in only what the worker asks for
4) Tell Codex to use the worker and do the task.

Example prompt:

> Act as the **[RoleName]** worker. Use the installed worker skills.  
> Task: [what you want done].  
> Inputs: [files/links].  
> Output: write results to `artifacts/[something]/` (and working notes/evidence to `logs/[something]/`).

## Installing workers (skills)

Workers live in `skills/<role>/<skill-name>/`. To use one in your own Codex project, install it with `npx skills`:

```sh
npx skills add -a codex -y https://github.com/lingkaix/SmartWorkers --skill <skill-name>
```

Notes:
- The `skills/` folder is the source of truth for workers.
- Use `npx skills` as the only install/update tool for Codex skills.
- For workspace-local skill development, keep source copies under `skills/` and apply them with `npx skills add -a codex -y ./skills --skill <skill-name>`.

## Where outputs go

- `logs/` — agent working notes, provenance, raw/intermediate files, and run records
- `temp/` — user-managed temporary files or scratch space during active work
- `artifacts/` — final deliverables (safe to review/share; don’t overwrite your inputs)

## What’s inside (simple map)

- `skills/` — the library of finished workers you can install into Codex
- `workers.jsonc` — your local-only keys/config (do not share publicly)

## Skill format

Skills in this repo follow the AgentSkills spec (`https://agentskills.io/specification`).

## For skill makers (maintainers)

If you’re creating/updating skills in this repo:

1) Read the AgentSkills spec: `https://agentskills.io/specification`
2) Install global runtimes with `mise` when needed: `mise use -g node@24 python@3.14 uv@latest`
3) Ensure the `skills` npm package is available globally: `mise exec node@24 -- npm list -g skills --depth=0 || mise exec node@24 -- npm install -g skills`
4) Install `skill-creator` for Codex: `mise exec node@24 -- npx skills add -a codex -y https://github.com/anthropics/skills/tree/main/skills/skill-creator`
5) Install `smart-skill-maker` for Codex from local disk when this repo is already cloned: `mise exec node@24 -- npx skills add -a codex -y ./skills/general/smart-skill-maker`
6) Use `smart-skill-maker` for create/improve work and SmartWorkers skill-maintenance work: `skills/general/smart-skill-maker/SKILL.md`
