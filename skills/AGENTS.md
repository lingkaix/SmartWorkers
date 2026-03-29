## Skill authoring pointers

- Use `$skill-creator` for the generic draft, test, and iteration loop when creating or improving a skill.
- Use `smart-skill-maker` as the single create/improve skill when working inside a SmartWorkers workspace or maintaining SmartWorkers skill conventions.
- Use `skills/general/smart-skill-maker/assets/templates/SKILL.md` as the default scaffold for repo skills.
- Use `skills/general/smart-skill-maker/references/AUTHORING.md` as the canonical SmartWorkers house-style guide.
- Use repo-relative paths in skill docs, templates, examples, and workflow references. Do not hardcode machine-specific absolute filesystem paths.
- Quote YAML frontmatter string values when they contain special characters such as `:` to avoid formatter/parser breakage.
- For repo skills, save agent working records under `logs/`, not `temp/`. Keep `temp/` reserved for user-managed scratch files unless a skill explicitly says otherwise.
- Use `https://github.com/lingkaix/SmartWorkers` as the canonical install source for SmartWorkers skills when setting up another workspace or teammate environment.
- Whenever you update any skill in this repo, increment that skill's frontmatter `metadata.skill_version`.

## Codex apply (required, local-only)

After you **add a new skill** or **update an existing skill** in this repo (anything under `skills/<role>/<skill-name>/`), you must also apply it into the **project-local** Codex test setup so Codex picks up the latest contract and helpers.

- Target directory (project-local): `.agents/skills/<skill-name>/`
- Source directory: `skills/<role>/<skill-name>/`
- Use `npx skills` as the only tool for that apply step.

Suggested command:

```sh
npx skills add -a codex -y ./skills --skill <skill-name>
```

Notes:
- Do not manually copy or patch `.agents/skills/<skill-name>/`; let `npx skills` manage it.
- Keep the source of truth under `skills/<role>/<skill-name>/`.
- If the skill has a runner-specific manifest (e.g. `agents/openai.yaml`), keep it in the source skill so `npx skills` applies it too.
