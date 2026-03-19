## Codex sync (required, local-only)

After you **add a new skill** or **update an existing skill** in this repo (anything under `skills/<role>/<skill-name>/`), you must also sync it into a **project-local** Codex test setup so Codex picks up the latest contract and helpers.

- Target directory (project-local): `.agents/skills/<skill-name>/`
- Source directory: `skills/<role>/<skill-name>/`
- Keep the destination in sync (add/update/remove files as needed).

Suggested command:

```sh
mkdir -p ".agents/skills/<skill-name>/"
rsync -a --delete "skills/<role>/<skill-name>/" ".agents/skills/<skill-name>/"
```

Notes:
- Sync only skill files (`SKILL.md`, `scripts/`, `references/`, `assets/`, etc.). Never copy secrets.
- If the skill has a runner-specific manifest (e.g. `agents/openai.yaml`), sync that too.
