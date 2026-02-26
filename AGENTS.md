# Agent Instructions (SmartWorkers)

This file is for agent runners, developers, and maintainers of this repo (not end users). End-user docs live in `README.md`.

## Maintainer quickstart (create/update/test skills)

This repo treats a **role + its skills** as a “worker”. The maintainer loop is:

1) Write/update the skill contract in `skills/<role>/<skill-name>/SKILL.md`
2) Add deterministic helpers under `scripts/` as needed
3) Validate + smoke test
4) Sync the skill into `.codex/skills/` so Codex picks up the latest files

Toolchain setup (first time on a machine):

```sh
mise tasks run setup
```

## Config and secrets

- Put local config (API keys, credentials, endpoints) in `workers.jsonc`.
- Never commit real secrets. If the config structure needs sharing, update `workers.example.jsonc`.
- Outputs should go to a workspace/artifacts folder (don’t overwrite source inputs).

## Living documentation

- `README.md` is user-facing. Keep it simple and non-technical.
- Add/adjust maintainer rules here when workflows or standards change.

## Repo conventions

- `skills/<role>/<skill-name>/SKILL.md` is the public contract for a skill.
- Keep skills lean:
  - Essential steps in `SKILL.md`
  - Heavy docs/screenshots in `references/`
  - Mechanical steps in `scripts/`
- When creating skill scripts:
  - Prefer `.mjs` (Node.js/npm) for programmatic logic (e.g., calling APIs).
  - Prefer Bash for system commands / shell automation.
  - Use Python only when JS isn’t feasible (e.g., missing packages or tooling constraints).
- `temp/` is scratch and can be deleted at any time.

## Skills: specification + quality bar

This repo follows the AgentSkills specification (`https://agentskills.io/specification`). When adding/updating skills:

- `SKILL.md` must have YAML frontmatter + Markdown body.
- If `agents/openai.yaml` exists for a skill, keep it in sync with `SKILL.md` (display name/short description/default prompt should reflect the current skill contract).
- Prefer the style guide at `skills/AUTHORING.md` for wording, structure, and discoverability.
- Frontmatter required:
  - `name`: 1–64 chars, lowercase alphanumerics + hyphens only, no leading/trailing hyphen, no consecutive `--`, must match the parent directory name
  - `description`: 1–1024 chars describing what it does and when to use it
- Frontmatter optional (use when relevant):
  - `license`
  - `compatibility` (use this to note any required packages / internet access)
  - `metadata` (string→string map like author/version)
  - `allowed-tools` (experimental; support varies by runner)
- Recommended optional directories:
  - `scripts/` (executable helpers)
  - `references/` (extra docs loaded on-demand)
  - `assets/` (templates, static resources)
- Progressive disclosure:
  - Keep the main `SKILL.md` under ~500 lines; move details into `references/`.
  - Prefer file references from `SKILL.md` that are relative paths from the skill root and avoid deep reference chains.
- Validation:
  - Use the `skills-ref` validator when possible (e.g. `skills-ref validate ./skills/<role>/<skill-name>`).

Ensure the skill body includes:
  - when to use the skill (“use when…” / triggers)
  - required inputs (files, links, credentials, constraints)
  - step-by-step workflow
  - outputs (where written, filenames, formats)
  - definition of done (acceptance checks)
  - safety/quality checklist (accuracy, privacy, compliance) when relevant

## Skill-maker acceptance checks (definition of done)

For any skill you create/update, consider it “done” only when:

- The `SKILL.md` contract is explicit about required inputs, outputs, and stop/review points.
- Any required `workers.jsonc` keys are documented and placeholders are added when missing (never paste secrets).
- Outputs go to `temp/` (working) and `artifacts/` (final), without overwriting inputs.
- The skill validates (when `skills-ref` is available).
- The skill is synced to `.codex/skills/<skill-name>/` (required for local Codex testing).
- A quick smoke test run (or dry-run) completes without surprises.

### Description writing (discoverability)

- Treat `description` as a search/index field: front-load the main verb + object (what it does), then add “Use when…” triggers.
- Include key nouns users actually say (tool/product names, file types, common synonyms).
- Keep `agents/openai.yaml` `interface.short_description` **short** (think: UI label), and keep the richer detail in `SKILL.md`.

## Roles (use cases)

We group skills into **roles** so the agent behaves like an AI worker (not just an automation tool).

Maintainer conventions:

- Prefer skills within a role folder: `skills/<role>/<skill-name>/`
- Each role can have a short “role brief” (what the worker does, typical tasks, inputs/outputs, boundaries). If you add one, use `roles/<role>/README.md` and reference the skills it uses.

## Adding a new skill (maintainer checklist)

1) Create `skills/<role>/<skill-name>/SKILL.md` with spec-compliant frontmatter and the full workflow contract.
2) If needed, add deterministic helpers under `skills/<role>/<skill-name>/scripts/`.
3) If needed, add heavy reference material under `skills/<role>/<skill-name>/references/`.
4) Update `README.md` only if the change affects end users.
