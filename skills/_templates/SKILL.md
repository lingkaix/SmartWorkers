---
name: <skill-name>
description: <Verb + object + key nouns>. Use when <common user triggers / synonyms>.
compatibility: Local filesystem access required and require `workers.jsonc` keys when applicable.
---

# <Skill display name>

## When to use

- <Trigger 1 in the user’s words>
- <Trigger 2 / synonym>

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

## Temp and output conventions

- Temp/intermediate: `temp/<role>/<skill-name>/<task-id>/` (drafts, logs, intermediate generations)
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
