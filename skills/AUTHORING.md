# Skill authoring guide

This is a maintainer guide for writing skills that are easy to:
- route (agents can match the right skill quickly),
- skim (humans can review safely),
- run (inputs/outputs are explicit and reproducible).

In this repo, a **worker** is a **role** plus a curated set of skills that role uses. Optimizing skills for maintainers means optimizing the edit → validate → test loop.

## Directory + naming

- Skill root: `skills/<role>/<skill-name>/`
- Skill contract: `skills/<role>/<skill-name>/SKILL.md`
- Optional helpers: `scripts/` (deterministic automation), `assets/` (templates), `references/` (heavy docs)
- `name` in frontmatter must match `<skill-name>` exactly.
- Start from the template when possible: `skills/_templates/SKILL.md`

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

Example:

```yaml
interface:
  short_description: "Extract structured data from PDFs."
  default_prompt: "Use $pdf to extract text and tables from a PDF into JSON/CSV."
```

Put the richer “Use when… / outputs / auth” detail in `SKILL.md`.

## Progressive disclosure patterns

- Keep `SKILL.md` as the navigation + essential workflow.
- Put variant-specific details (frameworks/providers/products) in `references/` and link them explicitly.
- Avoid deep reference chains (prefer one hop from `SKILL.md` → reference file).

## What *not* to add

Avoid extra docs that don’t help an agent do the job:
- `README.md`, `CHANGELOG.md`, “quick reference” files, and other process artifacts
- Long background essays that don’t change the procedure or constraints

## SKILL.md body: recommended outline

Use these headings so both agents and humans know where to look:

1) `## Required inputs`
- Required files/paths/URLs (with formats)
- Required `workers.jsonc` keys (and placeholders to add if missing)
- Constraints (time, budget, offline-only, privacy)

2) `## Workflow`
- Numbered steps, each with explicit commands and stop points
- Prefer “generate to `temp/`/`artifacts/` then review” for risky changes
- Call out where the agent must ask for confirmation (e.g. before spending money, deleting files, publishing)

3) `## Outputs`
- Exact folder(s), filenames, and formats
- Working/intermediate files go under `temp/`; final deliverables go under `artifacts/`
- Group each task run into its own subfolder, and include a `README.md` that records status + file list

4) `## Definition of done`
- Verifiable checks (files exist, commands succeed, acceptance criteria met)

5) `## Safety / quality checklist`
- Secrets handling and redaction
- Compliance and IP notes (when relevant)
- Accuracy expectations and how to validate

Optional sections (use when helpful, keep short):
- `## Non-goals` (what the skill will not do)
- `## Troubleshooting` (common failures + fixes)
- `## Examples` (1–2 minimal invocations)

## The maintainer loop (edit → validate → test)

Recommended “done” workflow after changing a skill:

1) Validate (if `skills-ref` is available):
   - `skills-ref validate "skills/<role>/<skill-name>"`
2) Sync to the project-local Codex test setup (required): follow `skills/AGENTS.md`
3) Smoke test:
   - Run any referenced helper scripts with minimal safe inputs (prefer dry-run flags), and/or
   - Invoke Codex with a small prompt that triggers the skill and verify outputs land in `temp/`/`artifacts/`.

## Workflow writing tips (agent-friendly)

- Prefer imperative, deterministic steps (“Run X”, “Write Y to Z”).
- Make inputs/outputs explicit at each step (agents shouldn’t guess paths).
- Use consistent vocabulary:
  - “Required inputs” (not “Prereqs” in one skill and “Inputs” in another)
  - “Outputs” and “Definition of done” in every skill
- Add a “Stop and request review” step when results are subjective or high impact.

## Validation (optional but recommended)

- Run the AgentSkills validator when available:
  - `skills-ref validate ./skills/<role>/<skill-name>`
- Spot-check that `agents/openai.yaml` (if present) matches the `SKILL.md` name/display name and uses a short description.

## Required config pattern (must-stop-on-missing)

When a skill requires API keys, credentials, or endpoints:

- Use workspace-root `workers.jsonc` as the single source of truth (do not route around it by asking for raw keys or using env vars).
- Keep user config minimal: prefer a small number of stable sections and sensible defaults (don’t invent many one-off keys).
- If `workers.jsonc` is missing a required value:
  1) Add a **placeholder hint** to `workers.jsonc` (example: `"apiKey": "[PLEASE ENTER KEY HERE]"`).
  2) Stop the task and ask the user to fill in `workers.jsonc`.
  3) Tell the user to restart/re-run the task after updating config.
- Never print secrets from `workers.jsonc` into chat/logs.

## Output convention (temp vs artifacts, with per-task README)

For any non-trivial task:

- Create a task folder under `temp/` for in-progress work (drafts, logs, intermediate generations).
- Create a matching task folder under `artifacts/` for the final deliverable(s).
- Each task folder must contain a `README.md` with:
  - task name / purpose
  - current status (in-progress / blocked / done)
  - key decisions + how to reproduce
  - a thorough file list with brief descriptions

Suggested paths:
- Working: `temp/<role>/<skill-name>/<timestamp-or-task-id>/`
- Final: `artifacts/<role>/<skill-name>/<timestamp-or-task-id>/`
