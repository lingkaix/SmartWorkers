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
   - `workers.jsonc` with Subaru Marketing credentials if Subaru asset gathering needs login:
     - `subaruMarketing.username`
     - `subaruMarketing.password`

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
   - for Subaru Marketing access, use:
     ```jsonc
     {
       "subaruMarketing": {
         "username": "[PLEASE ENTER USERNAME HERE]",
         "password": "[PLEASE ENTER PASSWORD HERE]"
       }
     }
     ```
5. Do not start generation until required keys and tools are present.

### Ask User For

Ask the user only when the agent cannot self-setup the missing requirement.

- Missing API keys such as `fal.key`
- Missing credentials for live data sources
- Missing Subaru Marketing credentials under `subaruMarketing.username` and `subaruMarketing.password`
- Missing external accounts, approvals, or access-controlled assets
- Confirmation before any paid or externally authenticated action

## Subaru Ad Loop

### Trigger
- Use this workflow for Subaru dealer ad work: gathering ad data, generating ad images, reviewing/regenerating, creating SVG copy, overlaying copy, and finishing a multi-size or multi-model ad suite.
- Default skill shape:
  - `$ads-info-gatherer` for the source pack
  - `$ads-suite-pipeline` for the full downstream loop
  - `$fal-nano-banana-2-image-gen` as the image-maker inside the pipeline

### Subaru Ads Info Gathering

#### Source Rules
1. Treat `https://www.subarumarketing.com/main.aspx` as the official source for Subaru ad assets.
   Use it for model product images and other OEM creative assets.
2. Use dealer sites only for ad info and event info.
   Dealer specials pages are for offers, dealer context, and stock checks.
   Dealer images are low-resolution and must not be treated as final ad assets.
3. Dealer images may still be downloaded as fallback model references.
   Keep them only to help catch a wrong trim/model image later.
4. If Subaru Marketing requires login and `workers.jsonc` does not already contain `subaruMarketing.username` and `subaruMarketing.password`, stop and ask the user to add them there.

#### Sub-Agent Pattern
1. Use sub-agents by default for the gathering phase to keep the main agent context clean.
2. The main agent should act as coordinator only:
   - define the dealer source page and target dealer
   - define the output run folder
   - dispatch bounded gathering tasks
   - read back only summaries and normalized outputs
3. Prefer splitting gathering into parallel sub-agent tasks such as:
   - dealer specials crawl and deal extraction
   - click-through validation for model name, look, and stock status
   - Subaru Marketing asset lookup and download planning
4. Each sub-agent should write compact notes and structured outputs to the task run folder so the main agent can ingest results without re-reading the whole crawl.

#### Dealer Specials Selection Rules
1. Crawl the full specials list before choosing models.
2. Default target is 5 car models for ad creation unless the user says otherwise.
3. Unless the user gives a different mix, aim for:
   - 3 models with the strongest live inventory
   - 2 more with the strongest lease, APR, or retail offers
4. Prefer popular Subaru models when they are available on the list.
   Forester, Outback, and Crosstrek are the default priority examples.
5. Prefer deals that are visibly promoted as special offers.
   Examples include tiles or copy that call out `special`, `$xxx off`, or similar highlighted offer language.
6. Click into each deal from the specials page to confirm the exact model name, look, and style before selecting it.
7. If the linked detail page is missing, broken, or effectively unavailable, treat that model as out of stock and do not pick it for ads.
8. Keep rejected candidates in the notes with the reason they were excluded.
   This prevents the same out-of-stock or mismatched model from being reconsidered later.

### Steps
1. Start by gathering the campaign truth set.
   Save exact fragments and normalized values separately.
   Include retail details, dealer info, event info, stock validation notes, VIN-anchored vehicle data when available, disclaimers, car logs/history, source images, logos, guidelines, and generation constraints.
   Gather with sub-agents when possible and keep the main agent focused on consolidation.
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

### Subaru Source-Pack Contract

#### Accepted Input Modes
1. `online-gather`
   - Use browser tools to inspect the dealer specials page and related live sources.
   - Use live source evidence, not guesswork.
2. `provided-folder`
   - The user may hand in a prepared folder shaped like `assets/worker-pack-template/`.
   - Validate the folder and report any missing required files before downstream generation starts.

#### Required Gathered Fields
- dealer name
- campaign or event name
- event date range
- year
- model
- trim
- VIN
- MSRP
- residual
- lease monthly payment and term, or APR offer when applicable
- due-at-signing or down-payment details
- disclaimer text
- offer expiry date
- source URLs, screenshots, or document references for every field
- model reference images
- logo files and lockups
- guideline notes
- required output sizes
- prior approved references or car-history notes useful for continuity

#### Required Sizes
- `1200x1200`
- `1200x628`
- `900x1600` or `1080x1920`
- `1920x1080`
- Chinese-only variant: `300x600`

### Inputs
- Dealer specials page or screenshots
- Subaru Marketing credentials in `workers.jsonc` when required
- OEM model images, logos, and event guideline files from `https://www.subarumarketing.com/main.aspx`
- Dealer images only as low-resolution fallback references

### Outputs
- Working logs, prompts, drafts, reviews, sub-agent notes, and intermediate files go to `logs/<short-desc>/<run-folder>/`
- Final structured source packs and approved deliverables go to `artifacts/<short-desc>/<run-folder>/`
- Leave review files, issue lists, and pass/fail records with the outputs

### Guardrails
- VIN is the anchor and cannot be changed for layout reasons.
- Year and trim must be exact.
- Keep exact text fragments and normalized interpretations separate.
- Use Subaru Marketing assets as the default OEM visual source.
- Do not use dealer-site images as final ad assets.
- Lease terms are usually the main ad content.
- Love Promise branding is time-bound and must follow the active Subaru guideline.
- CTV placements require larger, more legible text and a `1920x1080` export.
- Design should reflect the season, holiday timing, vehicle character, and dealer region.
- California dealers may use California scenery; New York dealers should use New York-relevant scenery.
- Keep enough clean top and bottom zones for later copy.
- Do not generate text inside the base image stage.
- Do not do multiple sizes at once before `1200x1200` is approved.
- Do not start the other model suites before one full suite is approved and available as the reference design.
- Do not select a dealer special until its linked detail page has been checked for the exact model and live availability.
- If exact copy does not fit, adjust layout; do not invent, shorten, or beautify retail facts or disclaimers.
