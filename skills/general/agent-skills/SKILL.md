---
name: agent-skills
description: "Apply SmartWorkers house style when creating or updating repo skills in `skills/<role>/<skill-name>/`. Use when a skill should follow repo conventions for `workers.jsonc`, `temp/` and `artifacts/`, naming, templates, references and scripts layout, or local sync into `.agents/skills/`; pair with `$skill-creator` for drafting, testing, and iteration."
compatibility: "Local filesystem access required. Optional: `skills-ref` for validation."
---

# Agent Skills

This skill is the SmartWorkers house-style companion to `$skill-creator`.

Use `$skill-creator` for the generic create, test, evaluate, and improve loop. Use this skill to keep repo-specific conventions consistent across every skill in `skills/`.

## Required inputs

- Target role and skill name
- Whether the task is creating a new skill or updating an existing one
- Any SmartWorkers-specific requirements for config, outputs, naming, or helper-file layout
- Whether the skill should also include `agents/openai.yaml`

## Workflow

1. Hand off the generic skill-authoring loop to `$skill-creator`.
   - Do not duplicate the whole draft, eval, and iteration workflow here.
   - Reach for this skill when the missing piece is SmartWorkers-specific structure or repo policy.

2. Start from the repo's canonical authoring materials.
   - Use `skills/general/agent-skills/assets/templates/SKILL.md` as the default scaffold.
   - Use `skills/general/agent-skills/references/AUTHORING.md` as the house-style reference.
   - Keep `skills/AGENTS.md` small and operational: it is for local sync and maintainer reminders, not the full writing guide.

3. Apply SmartWorkers house rules while editing the skill.
   - Keep routing information primarily in frontmatter `description`, including "Use when..." phrasing and searchable nouns.
   - Put local config requirements in `workers.jsonc`, and document safe placeholders in `workers.example.jsonc` when the structure should be shared.
   - Put draft and intermediate work in `temp/<role>/<skill-name>/<task-id>/`.
   - Put final deliverables in `artifacts/<role>/<skill-name>/<task-id>/`.
   - Keep the skill body lean: essential workflow in `SKILL.md`, heavy material in `references/`, deterministic mechanics in `scripts/`, reusable files in `assets/`.
   - Keep `name` aligned with the folder name and keep `agents/openai.yaml` aligned with the current contract when present.

4. Scaffold safely when a new skill folder is needed.
   - From `skills/general/agent-skills`:
     - `bash scripts/new_skill.sh --role <role> --name <skill-name>`
   - Preview output goes to `temp/agent-skills/<timestamp>/<role>/<skill-name>/`.
   - Use `--apply` only after reviewing the scaffold and making any SmartWorkers-specific adjustments.

5. Validate and sync the final result.
   - Re-read the finished skill against `references/AUTHORING.md`.
   - Run `skills-ref validate "skills/<role>/<skill-name>"` when `skills-ref` is installed.
   - Sync to the project-local test copy by following `skills/AGENTS.md`.

## Outputs

- `skills/<role>/<skill-name>/SKILL.md`
- Optional companion files under `scripts/`, `assets/`, `references/`, and `agents/openai.yaml`
- Preview scaffolds under `temp/agent-skills/<timestamp>/<role>/<skill-name>/`
- Synced local test copy under `.agents/skills/<skill-name>/`

## Definition of done

- The skill follows the SmartWorkers template and authoring guide
- Frontmatter is valid, searchable, and matched to the folder name
- Config handling, temp and artifact paths, and helper-file layout follow repo conventions
- `agents/openai.yaml` matches the skill contract when present
- The finished skill has been synced to `.agents/skills/<skill-name>/` for local testing

## Safety / quality checklist

- Do not commit secrets or print values from `workers.jsonc`; only confirm whether required keys are present.
- Do not let SmartWorkers-specific rules drift into multiple conflicting sources; update the template and authoring guide when the house style changes.
- Stop for review before destructive changes, paid actions, or edits that would rename a widely used skill.
