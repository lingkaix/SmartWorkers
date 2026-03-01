---
name: agent-skills
description: "Create, update, and validate Agent Skills (`SKILL.md`, optional helper files, optional `agents/openai.yaml`) using the AgentSkills specification. Use when adding a new skill to `skills/<role>/`, making a skill spec-compliant, or scaffolding templates/scripts for skill maintainers."
compatibility: "Local filesystem access required. Optional: `skills-ref` for validation."
---

# Agent Skills (authoring + maintenance)

## When to use

- You’re asked to add a new skill under `skills/<role>/<skill-name>/`.
- You need to make an existing skill comply with the AgentSkills spec (frontmatter, structure, naming rules).
- You want a consistent scaffold (SKILL.md template + optional `agents/openai.yaml`) and a predictable maintainer loop.

## Maintainer quickstart (repo conventions)

This repo treats a **role + its skills** as a “worker”. The maintainer loop is:

1) Write/update the skill contract in `skills/<role>/<skill-name>/SKILL.md`
2) Add deterministic helpers under `scripts/` as needed
3) Validate + smoke test
4) Sync the skill into `.codex/skills/` so Codex picks up the latest files

Required for all skill changes: review the skill using `skills/general/agent-skills/references/AUTHORING.md` (checklist + structure + style).

### Config and secrets

- Put local config (API keys, credentials, endpoints) in `workers.jsonc`.
- Never commit real secrets. If the config structure needs sharing, update `workers.example.jsonc`.
- Never paste/print keys from `workers.jsonc`; only confirm whether values are present.

### Repo layout

- `skills/<role>/<skill-name>/SKILL.md` is the public contract for a skill.
- Keep skills lean:
  - Essential steps in `SKILL.md`
  - Heavy docs/screenshots in `references/`
  - Mechanical steps in `scripts/`
- Outputs:
  - Working scratch: `temp/`
  - Final deliverables: `artifacts/`

### Spec + quality bar (AgentSkills)

This repo follows the AgentSkills specification (`https://agentskills.io/specification`).

- Use `https://github.com/openai/skills` as the reference implementation for writing style, structure, and “good examples”.
- `SKILL.md` must have YAML frontmatter + a Markdown body.
- Frontmatter required:
  - `name`: 1–64 chars, lowercase alphanumerics + hyphens only, no leading/trailing hyphen, no consecutive `--`, must match the parent directory name
  - `description`: 1–1024 chars describing what it does and when to use it
- Frontmatter optional (use when relevant):
  - `license`
  - `compatibility` (required packages / internet access)
  - `metadata` (string→string map like author/version)
  - `allowed-tools` (runner support varies)

If `agents/openai.yaml` exists for a skill, keep it in sync with `SKILL.md` (display name/short description/default prompt should reflect the current contract).

## Required inputs

- Target role (e.g. `general`, `car-ads-designer`)
- Skill name (must match AgentSkills naming rules; must match the folder name)
- Skill description (“Verb + object… Use when…”)
- Whether to include runner UI metadata (`agents/openai.yaml`) for discoverability
- Whether to validate with `skills-ref` (if installed)

## Workflow

1) Identify what you’re doing:

   - Update an existing skill: `skills/<role>/<skill-name>/`
   - Create a new skill: pick `<role>` + `<skill-name>` (folder name must match frontmatter `name`)

2) Review checklist (required):

   - Use `skills/general/agent-skills/references/AUTHORING.md` to review the current/generated skill before applying changes.

3) Scaffold (new skills only; safe default: generate into `temp/` first):

   - From `skills/general/agent-skills`:
     - `bash scripts/new_skill.sh --role <role> --name <skill-name>`

4) Edit the skill contract (new or existing):

   - Ensure `SKILL.md` frontmatter:
     - `name` matches the folder name exactly
     - `description` is clear and searchable
   - Ensure the body includes: required inputs → workflow → outputs → definition of done → safety checklist
   - If `agents/openai.yaml` exists, keep it in sync with `SKILL.md` (UI metadata, not the contract)

5) Apply (new skills only):

   - Re-run with `--apply`
   - Do not overwrite an existing skill directory without an explicit plan and review

6) Validate (optional but recommended when available):

   - `skills-ref validate "skills/<role>/<skill-name>"`

7) Sync into the local Codex test setup (required):

   - Follow `skills/AGENTS.md`:
     - `mkdir -p ".codex/skills/<skill-name>/"`
     - `rsync -a --delete "skills/<role>/<skill-name>/" ".codex/skills/<skill-name>/"`

## Assets

- Templates live in:
  - `skills/general/agent-skills/assets/templates/SKILL.md`
  - `skills/general/agent-skills/assets/templates/agents/openai.yaml`
- Authoring reference (required review checklist):
  - `skills/general/agent-skills/references/AUTHORING.md`
- Writing style + examples reference:
  - `https://github.com/openai/skills`

## Outputs

- Preview output (default):
  - `temp/agent-skills/<timestamp>/<role>/<skill-name>/`
- Applied skill output (with `--apply`):
  - `skills/<role>/<skill-name>/`

## Definition of done

- `skills/<role>/<skill-name>/SKILL.md` follows the AgentSkills spec (valid frontmatter + clear workflow contract)
- The skill passes the `skills/general/agent-skills/references/AUTHORING.md` review checklist
- Any helper scripts (if present) run deterministically and write to `temp/`/`artifacts/` (not overwriting inputs)
- Validation passes when available: `skills-ref validate "skills/<role>/<skill-name>"`
- Skill is synced to `.codex/skills/<skill-name>/` for local Codex testing

## Safety / quality checklist

- Do not commit secrets.
- Do not paste/print keys from `workers.jsonc`; only confirm whether values are present.
- Stop and request review before destructive changes or paid actions.
- Keep heavy docs in `references/` and link them from `SKILL.md` (progressive disclosure).
