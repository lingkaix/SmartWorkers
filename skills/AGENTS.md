# Agent Instructions (skills/)

These instructions apply to everything under `skills/`.

## Skill authoring guide (recommended)

Use `skills/AUTHORING.md` as the house style for new skills:
- Description writing that’s easy for both agents and humans to find/route (keywords + “Use when…” triggers).
- Consistent section layout (inputs → workflow → outputs → done → safety).
- Runner manifests (e.g. `agents/openai.yaml`) with a **short** `interface.short_description` and a short `$skill-name`-mentioning `interface.default_prompt`.
- Optional templates live in `skills/_templates/`.

## The local authoring loop (recommended)

When you edit anything under `skills/<role>/<skill-name>/`, do this loop before calling it “done”:

1) Validate (when available):

```sh
skills-ref validate "skills/<role>/<skill-name>"
```

2) Sync into `.codex/skills/` (required, local-only) so Codex tests the latest contract/scripts.
3) Smoke test:
   - Run any scripts referenced by the skill (prefer dry-run flags where possible), or
   - Ask Codex to execute the skill with a minimal safe input and verify outputs land in `temp/`/`artifacts/`.

## Codex sync (required, local-only)

After you **add a new skill** or **update an existing skill** in this repo (anything under `skills/<role>/<skill-name>/`), you must also sync it into a **project-local** Codex test setup so Codex picks up the latest contract and helpers.

- Target directory (project-local): `.codex/skills/<skill-name>/`
- Source directory: `skills/<role>/<skill-name>/`
- Keep the destination in sync (add/update/remove files as needed).

Suggested command:

```sh
mkdir -p ".codex/skills/<skill-name>/"
rsync -a --delete "skills/<role>/<skill-name>/" ".codex/skills/<skill-name>/"
```

Notes:
- Sync only skill files (`SKILL.md`, `scripts/`, `references/`, `assets/`, etc.). Never copy secrets.
- If the skill has a runner-specific manifest (e.g. `agents/openai.yaml`), sync that too.
