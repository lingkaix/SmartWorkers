# Skill authoring guide

This is a maintainer guide for writing skills that are easy to:
- route (agents can match the right skill quickly),
- skim (humans can review safely),
- run (inputs/outputs are explicit and reproducible).

Use `https://github.com/openai/skills` as the default style reference for examples, writing patterns, and “what good looks like” when creating or updating any skill in this repo.

In this repo, a **worker** is a **role** plus a curated set of skills that role uses. Optimizing skills for maintainers means optimizing the edit → validate → test loop.

## Ownership split

- Use `$skill-creator` for the general skill lifecycle: draft, test, compare, improve, and tune descriptions.
- Use `skills/general/smart-skill-maker/SKILL.md` for the installed SmartWorkers-specific authoring workflow and house rules that `$skill-creator` would not know by default.
- Use this document as the canonical SmartWorkers authoring reference.
- Use `skills/general/smart-skill-maker/assets/templates/SKILL.md` as the default scaffold.
- Keep `skills/AGENTS.md` short and operational. It should point maintainers at this guide and define local sync behavior, not duplicate the full style guide.

## Directory + naming

- Skill root: `skills/<role>/<skill-name>/`
- Skill contract: `skills/<role>/<skill-name>/SKILL.md`
- Optional helpers: `scripts/` (deterministic automation), `assets/` (templates), `references/` (heavy docs)
- `name` in frontmatter must match `<skill-name>` exactly.
- `metadata.skill_version` must be incremented every time the skill is updated.
- Start from the template when possible: `skills/general/smart-skill-maker/assets/templates/SKILL.md`
- Use repo-relative paths in docs, examples, markdown links, and commands whenever a file inside the workspace is being referenced.
- Do not hardcode machine-specific absolute filesystem paths from a maintainer workstation.

## Role semantics

- A role is the worker identity and usage scope, not just a technical label.
- Think of a role as a real worker: it should have a clear scope, a coherent set of skills, and one or more workflows it can execute end to end.
- Similar capabilities may appear in different roles when the requirements differ by position. For example, a copy writer and an ads designer may both use image-generation skills, but the prompts, constraints, review criteria, and workflow should remain role-specific.
- When placing a skill under `skills/<role>/`, choose the role based on the worker who owns the outcome, not the underlying tool being used.

## SmartWorkers house rules

### Config and secrets

- Put local config, credentials, and API keys in `workers.jsonc`.
- If the config structure should be shared, document the shape in `workers.example.jsonc` instead of committing real values.
- In the skill body, name the required `workers.jsonc` keys but never print or paste their values.

### Working folders and naming

- Drafts, logs, intermediate renders, and review copies belong in `logs/<role>/<skill-name>/<task-id>/`.
- Final deliverables belong in `artifacts/<role>/<skill-name>/<task-id>/`.
- Prefer a stable `<task-id>` such as a date stamp, slug, or ticket-style identifier.
- When a skill writes multiple files for one run, include a `README.md` in the task folder that records status and the file list.

### Contract boundary

- Put most routing guidance in frontmatter `description`, not in a long "When to use" section.
- Keep `SKILL.md` focused on required inputs, workflow, outputs, done checks, and safety expectations.
- Move long examples, provider variants, or domain deep dives into `references/`.
- Move deterministic repeated steps into `scripts/`.
- Put reusable templates and static helper assets in `assets/`.

### Runner metadata

- If `agents/openai.yaml` exists, treat it as UI metadata, not the source of truth for the skill contract.
- Keep it in sync with the current `SKILL.md`.

## Context economy (why structure matters)

- Only the YAML frontmatter (`name` + `description`) is always in context for routing.
- The `SKILL.md` body is loaded only after the skill triggers.
- `references/` should be loaded on-demand (linked from `SKILL.md`) to keep the core contract lean.

## Frontmatter: `description` house style (searchable)

Treat `description` as an index field. Recommended structure (1–2 sentences):

1) **What it does**: start with a verb + object, include the domain noun(s) people search for.
2) **When to use**: include “Use when…” triggers with common user phrasing/synonyms.
3) **Operational detail (optional)**: outputs location + required `workers.jsonc` keys.

Checklist:
- Start with a strong verb: “Generate…”, “Edit…”, “Download…”, “Extract…”, “Deploy…”, “Validate…”
- Front-load keywords (first ~80 chars matter most): product/tool name, domain, file type.
- Include synonyms users say (“background removal” vs “cutout”, “scrape” vs “download”).
- Prefer concrete nouns over adjectives; avoid filler like “powerful”, “seamless”, “best”.
- Keep it scannable (avoid long semicolon chains).

Examples:

- Good:
  - “Extract text and tables from PDFs into JSON/CSV. Use when given a PDF and asked to summarize, QA, or export structured data; write final outputs to `artifacts/`.”
  - “Deploy a static site to Cloudflare Pages. Use when asked to publish/host a web app; requires `workers.jsonc` `cloudflare.apiToken`.”

- Weak (hard to route/search):
  - “Helps with PDFs in many ways.”
  - “Does deployment.”

## `agents/openai.yaml` UI metadata (short, quoted)

If `agents/openai.yaml` exists, treat it as UI metadata for skill lists/chips, not the skill contract.

Recommended shape:

```yaml
interface:
  display_name: "Human-facing title"
  short_description: "Short UI blurb"
  default_prompt: "Use $skill-name to do X for Y."
```

Conventions (mirrors upstream `openai/skills`):
- Quote all string values.
- Keep `interface.short_description` short (roughly 25–64 chars), one sentence, no operational detail.
- Keep `interface.default_prompt` short (typically 1 sentence) and explicitly mention `$<skill-name>`.

Put the richer “Use when… / outputs / auth” detail in `SKILL.md`.

## Progressive disclosure patterns

- Keep `SKILL.md` as the navigation + essential workflow.
- Put variant-specific details (frameworks/providers/products) in `references/` and link them explicitly.
- Avoid deep reference chains (prefer one hop from `SKILL.md` → reference file).

## SKILL.md body: recommended outline

Use these headings so both agents and humans know where to look:

1) `## Required inputs`
- Required files/paths/URLs (with formats)
- Required `workers.jsonc` keys (and placeholders to add if missing)
- Constraints (time, budget, offline-only, privacy)

2) `## Workflow`
- Numbered steps, each with explicit commands and stop points
- Prefer “generate to `logs/`/`artifacts/` then review” for risky changes
- Call out where the agent must ask for confirmation (e.g. before spending money, deleting files, publishing)

3) `## Outputs`
- Exact folder(s), filenames, and formats
- Working/intermediate files go under `logs/`; final deliverables go under `artifacts/`
- Group each task run into its own subfolder, and include a `README.md` that records status + file list

4) `## Definition of done`
- Verifiable checks (files exist, commands succeed, acceptance criteria met)

5) `## Safety / quality checklist`
- Secrets handling and redaction
- Compliance and IP notes (when relevant)
- Accuracy expectations and how to validate

## The maintainer loop (edit → validate → apply → test)

Recommended “done” workflow after changing a skill:

1) Validate (if `skills-ref` is available):
   - `skills-ref validate "skills/<role>/<skill-name>"`
2) Apply to the project-local Codex test setup with `npx skills` (required): follow `skills/AGENTS.md`
   - Before applying, bump `metadata.skill_version` for the updated skill.
3) Smoke test:
   - Run any referenced helper scripts with minimal safe inputs (prefer dry-run flags), and/or
   - Invoke Codex with a small prompt that triggers the skill and verify outputs land in `logs/`/`artifacts/`.
