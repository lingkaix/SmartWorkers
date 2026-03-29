---
name: <skill-name>
description: "<Verb + object + key nouns>. Use when <common user triggers / synonyms>."
compatibility: "<E.g. Local filesystem required. macOS/Linux. Internet required for X.>"
---

# <Skill display name>

Use frontmatter `description` as the main routing field. Keep the body focused on SmartWorkers-style inputs, workflow, outputs, and safety.
Use repo-relative paths when referencing workspace files or folders; do not hardcode workstation-specific absolute filesystem paths.

## Required inputs

- `workers.jsonc` entries (create from `workers.example.jsonc` if missing):
  - <path.to.key>: "<value>"
- <Required file(s)/link(s), formats>
- <Constraints (offline-only, time/budget limits, privacy)>

## Workflow

1) Prepare inputs
- <How to gather/validate inputs>

2) Run
- <Exact command(s)>

3) Stop and request review (required when subjective/high impact)
- <What to review and what needs explicit approval>

## Log and output conventions

- Working/intermediate: `logs/<role>/<skill-name>/<task-id>/` (drafts, logs, intermediate generations)
- Final outputs: `artifacts/<role>/<skill-name>/<task-id>/`
- Each task folder must include a `README.md` that tracks progress and lists files

## Outputs

- `artifacts/<role>/<skill-name>/<task-id>/`:
  - `README.md` — task status, progress notes, and a complete file list
  - <filename.ext> — <what it contains>

## Defaults & rules

- <Default behavior if user is ambiguous>
- <Do not do X without explicit approval>

## Definition of done

- <Command exits 0>
- <Outputs exist and meet acceptance criteria>

## Safety / quality checklist

- Do not commit secrets.
- Do not paste/print keys from `workers.jsonc`; only confirm whether values are present.
- Validate outputs (spot-check, diff, sampling).
- Confirm before destructive or paid actions.
