---
name: smart-skill-maker
description: "Create or improve SmartWorkers-style skills from a workspace-local `skills/` source tree, then apply them to Codex with `npx skills`. Use when you want one guided tool for new skill creation, skill upgrades, or moving an installed skill back into editable source while keeping SmartWorkers conventions."
---

# Smart Skill Maker

This is the only skill-authoring tool to use inside a SmartWorkers workspace.

It uses `$skill-creator` as the core drafting and improvement engine, then adds SmartWorkers-specific conventions and the required `npx skills` apply flow.

## Required inputs

- Target role and skill name
- Whether the task is creating a new skill or improving an existing one
- The workspace root path
- Whether the source copy already exists under `skills/<role>/<skill-name>/`
- Whether the skill should also include `agents/openai.yaml`
- The worker role the skill belongs to

## Workflow

1. Confirm the workspace authoring prerequisites.
   - `skill-creator` should already be installed for Codex.
   - `npx skills` should already be available.
   - The workspace should have a local `skills/` folder with `skills/AGENTS.md`.

2. Make `skills/` the source of truth.
   - For a new skill, create `skills/<role>/<skill-name>/`.
   - Treat `<role>` as the worker identity and usage scope. A role is not just a tool category; it represents a real worker with related skills and one or more workflows.
   - Similar capabilities may appear in different roles when the real job, workflow, or acceptance criteria differ. For example, a copy writer and an ads designer may both have image-generation skills, but those skills should still stay role-specific if the worker expectations are different.
   - For an existing installed skill with no source copy yet, copy `.agents/skills/<skill-name>/` into `skills/<role>/<skill-name>/` first, using the role that worker should own.
   - After that point, edit only the source copy in `skills/`.

3. Use `$skill-creator` for the draft or improvement loop.
   - Let `$skill-creator` handle generic skill drafting, refinement, and iteration.
   - Keep SmartWorkers-specific structure here:
     - routing detail in frontmatter `description`
     - safe placeholders in `workers.example.jsonc`
     - working files in `logs/`
     - final deliverables in `artifacts/`
     - reusable helpers in `scripts/`, `assets/`, and `references/`

4. Apply SmartWorkers conventions before finishing.
   - Keep `name` aligned with the skill folder name.
   - Keep the skill body lean and operational.
   - Keep `agents/openai.yaml` in sync when present.
   - Avoid secrets and real credentials in skill files.

5. Apply the source skill to Codex with `npx skills`.
   - From the workspace root, run:
     - `npx skills add -a codex -y ./skills --skill <skill-name>`
   - Use `npx skills` as the only install/update path into `.agents/skills/`.
   - Do not manually patch `.agents/skills/<skill-name>/`.

6. Report the result.
   - Name the source folder under `skills/`.
   - Confirm the apply command used.
   - Confirm the installed Codex copy is now managed by `npx skills`.

## Outputs

- Source skill under `skills/<role>/<skill-name>/`
- Installed Codex skill managed under `.agents/skills/<skill-name>/`
- Any working notes or review material under `logs/`

## Definition of done

- The source copy exists under `skills/<role>/<skill-name>/`
- The skill follows SmartWorkers conventions
- The updated skill has been applied to Codex with `npx skills add -a codex -y ./skills --skill <skill-name>`
- No manual source-of-truth edits were left only inside `.agents/skills/`

## Safety / quality checklist

- Do not treat `.agents/skills/` as the editable source of truth.
- Do not mix manual copying into `.agents/skills/` with `npx skills` updates.
- Do not commit secrets or paste credential values into skill files.
