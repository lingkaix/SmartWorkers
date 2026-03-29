---
name: agent-skills
description: "Maintain SmartWorkers skill-authoring conventions for repo skills and the workspace-facing `smart-skill-maker` flow. Use when updating repo rules for `skills/<role>/<skill-name>/`, the `skills/general/agent-skills/skills/smart-skill-maker/` tool, or how local source skills are applied to Codex with `npx skills`."
compatibility: "Local filesystem access required. Optional: `skills-ref` for validation."
---

# Smart Skill Maker Maintainer

This skill keeps SmartWorkers skill-authoring conventions consistent in two places:

- repo skills under `skills/<role>/<skill-name>/`
- the workspace-facing `smart-skill-maker` skill under `skills/general/agent-skills/skills/smart-skill-maker/`

Use `$skill-creator` for the generic create, test, evaluate, and improve loop. Use this maintainer skill to keep repo-specific conventions and the workspace-facing authoring flow aligned.

## Required inputs

- Target role and skill name
- Whether the task is creating a new skill or updating an existing one
- Any SmartWorkers-specific requirements for config, outputs, naming, or helper-file layout
- Whether the skill should also include `agents/openai.yaml`
- Whether the workspace-facing `smart-skill-maker` skill must also change

## Workflow

1. Hand off the generic skill-authoring loop to `$skill-creator`.
   - Do not duplicate the whole draft, eval, and iteration workflow here.
   - Reach for this skill when the missing piece is SmartWorkers-specific structure or repo policy.

2. Start from the repo's canonical authoring materials.
   - Use `skills/general/agent-skills/assets/templates/SKILL.md` as the default scaffold.
   - Use `skills/general/agent-skills/references/AUTHORING.md` as the house-style reference.
   - Keep `skills/AGENTS.md` small and operational: it is for local apply behavior and maintainer reminders, not the full writing guide.

3. Apply SmartWorkers house rules while editing the skill.
   - Keep routing information primarily in frontmatter `description`, including "Use when..." phrasing and searchable nouns.
   - Put local config requirements in `workers.jsonc`, and document safe placeholders in `workers.example.jsonc` when the structure should be shared.
   - Put draft and intermediate work in `logs/<role>/<skill-name>/<task-id>/`.
   - Put final deliverables in `artifacts/<role>/<skill-name>/<task-id>/`.
   - Keep the skill body lean: essential workflow in `SKILL.md`, heavy material in `references/`, deterministic mechanics in `scripts/`, reusable files in `assets/`.
   - Keep `name` aligned with the folder name and keep `agents/openai.yaml` aligned with the current contract when present.
   - When the authoring workflow changes, update `skills/general/agent-skills/skills/smart-skill-maker/` too so workspace behavior stays aligned with repo policy.

4. Scaffold safely when a new repo skill folder is needed.
   - From `skills/general/agent-skills`:
     - `bash scripts/new_skill.sh --role <role> --name <skill-name>`
   - Preview output goes to `logs/agent-skills/<timestamp>/<role>/<skill-name>/`.
   - Use `--apply` only after reviewing the scaffold and making any SmartWorkers-specific adjustments.

5. Validate and apply the final result with `npx skills`.
   - Re-read the finished skill against `references/AUTHORING.md`.
   - Run `skills-ref validate "skills/<role>/<skill-name>"` when `skills-ref` is installed.
   - Apply repo skill changes to the local Codex environment by following `skills/AGENTS.md`.
   - If `smart-skill-maker` changed, apply it with:
     - `npx skills add -a codex -y ./skills/general/agent-skills/skills --skill smart-skill-maker`

## Outputs

- `skills/<role>/<skill-name>/SKILL.md`
- Optional companion files under `scripts/`, `assets/`, `references/`, and `agents/openai.yaml`
- Workspace-facing authoring skill under `skills/general/agent-skills/skills/smart-skill-maker/`
- Preview scaffolds under `logs/agent-skills/<timestamp>/<role>/<skill-name>/`
- Applied local Codex skill install managed by `npx skills`

## Definition of done

- The skill follows the SmartWorkers template and authoring guide
- Frontmatter is valid, searchable, and matched to the folder name
- Config handling, log and artifact paths, and helper-file layout follow repo conventions
- `agents/openai.yaml` matches the skill contract when present
- The finished skill has been applied to the local Codex environment with `npx skills`
- If the authoring workflow changed, `smart-skill-maker` was updated too

## Safety / quality checklist

- Do not commit secrets or print values from `workers.jsonc`; only confirm whether required keys are present.
- Do not let SmartWorkers-specific rules drift into multiple conflicting sources; update the template and authoring guide when the house style changes.
- Do not let repo policy and the workspace-facing `smart-skill-maker` workflow drift apart.
- Stop for review before destructive changes, paid actions, or edits that would rename a widely used skill.
