# Workflow Guide

Keep this file short, practical, and current.

## Startup Check

Before running the Subaru ad workflow, verify the essentials are ready.

### Check

1. Confirm the required skills exist in the repo:
   - `$ads-info-gatherer`
   - `$ads-suite-pipeline`
   - `$fal-nano-banana-2-image-gen`
2. Confirm the active local skill copies are synced in `.agents/skills/`:
   - `.agents/skills/ads-info-gatherer/`
   - `.agents/skills/ads-suite-pipeline/`
   - `.agents/skills/fal-nano-banana-2-image-gen/` if this workspace keeps a local copy
3. Confirm the required tools/config are available:
   - Node.js for the Nano Banana generator script
   - internet access if generation or live gathering needs it
   - `workers.jsonc` with the required API key(s), especially `fal.key`

### Self-Setup

If setup is incomplete, the agent should fix the local parts first before asking the user for help.

1. Install or sync missing skills from the SmartWorkers source repo:
   - canonical source: `https://github.com/lingkaix/SmartWorkers`
   - if this workspace is already a checkout of that repo, sync from local `skills/`
   - otherwise install the needed skills from that GitHub repo into `.agents/skills/`
2. Re-check that the skill folders and bundled references exist after sync.
3. If Node.js or another local tool is missing, give the user a short explanation of what is missing and why it blocks the task.
4. If `workers.jsonc` is missing or the required key is absent, ask the user only for the necessary info:
   - which key is missing
   - where it should be stored
   - which skill needs it
5. Do not start generation until required keys and tools are present.

### Ask User For

Ask the user only when the agent cannot self-setup the missing requirement.

- Missing API keys such as `fal.key`
- Missing credentials for live data sources
- Missing external accounts, approvals, or access-controlled assets
- Confirmation before any paid or externally authenticated action

## Subaru Ad Loop

### Trigger
- Use this workflow for Subaru dealer ad work: gathering ad data, generating ad images, reviewing/regenerating, creating SVG copy, overlaying copy, and finishing a multi-size or multi-model ad suite.
- Default skill shape:
  - `$ads-info-gatherer` for the source pack
  - `$ads-suite-pipeline` for the full downstream loop
  - `$fal-nano-banana-2-image-gen` as the image-maker inside the pipeline

### Steps
1. Start by gathering the campaign truth set.
   Save exact fragments and normalized values separately.
   Include retail details, dealer info, VIN-anchored vehicle data, disclaimers, car logs/history, source images, logos, guidelines, and generation constraints.
2. Generate the clean image base first.
   Generate images without letters.
   Always start with `1200x1200`.
   Review and regenerate until `1200x1200` passes before moving to any other size.
3. Build the remaining sizes one by one for the same model.
   Always use the approved `1200x1200` design as the reference anchor for the rest of that model's size suite.
4. After the clean base image passes, create SVG copy layers from approved text only.
   Overlay the SVGs onto the approved image.
   Review and improve until the final composite passes.
5. If there are multiple car models, finish one full approved suite first.
   Use that approved suite as the style reference for the remaining models.
   After the first full suite is locked, later model suites may run simultaneously.
6. Finish with a clear handoff.
   Report the source pack used, the anchor model and anchor size, what passed, what was regenerated, and where the deliverables were written.

### Inputs
- [subaru-source-pack.md](../skills/car-ads-designer/ads-info-gatherer/references/subaru-source-pack.md)
- [subaru-campaign-rules.md](../skills/car-ads-designer/ads-suite-pipeline/references/subaru-campaign-rules.md)
- [review-checklist.md](../skills/car-ads-designer/ads-suite-pipeline/references/review-checklist.md)
- Dealer specials page or screenshots
- OEM model images, logos, and event guideline files

### Outputs
- Working logs, prompts, drafts, reviews, and intermediate files go to `temp/<role>/<skill-name>/<task-id>/`
- Final structured source packs and approved deliverables go to `artifacts/<role>/<skill-name>/<task-id>/`
- Leave review files, issue lists, and pass/fail records with the outputs

### Guardrails
- VIN is the anchor and cannot be changed for layout reasons.
- Keep exact text fragments and normalized interpretations separate.
- Do not generate text inside the base image stage.
- Do not do multiple sizes at once before `1200x1200` is approved.
- Do not start the other model suites before one full suite is approved and available as the reference design.
- If exact copy does not fit, adjust layout; do not invent, shorten, or beautify retail facts or disclaimers.
