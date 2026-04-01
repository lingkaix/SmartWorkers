# Subaru Dealer Ads Workflow

Use this workflow for Subaru dealer ad work: gathering ad data, selecting models, collecting official assets, generating ad images, reviewing/regenerating, creating SVG copy, overlaying copy, and finishing a multi-size or multi-model ad suite.

## Startup Check

Before running the Subaru ad workflow, verify the essentials are ready.

### Check

1. Confirm the required skills exist in the repo:
   - `$ads-info-gatherer`
   - `$ads-suite-pipeline`
   - `$fal-nano-banana-2-image-gen`
2. Confirm the active local skill copies are synced in `.agents/skills/` when this workspace uses installed local copies:
   - `.agents/skills/ads-info-gatherer/`
   - `.agents/skills/ads-suite-pipeline/`
   - `.agents/skills/fal-nano-banana-2-image-gen/` if this workspace keeps a local copy
3. Confirm the required tools/config are available:
   - Node.js for the Nano Banana generator script
   - internet access if gathering or generation needs it
   - `workers.jsonc` with the required API key(s), especially `fal.key`
   - `workers.jsonc` with Subaru Marketing credentials if Subaru asset gathering needs login:
     - `subaruMarketing.username`
     - `subaruMarketing.password`

### Self-Setup

If setup is incomplete, the agent should fix the local parts first before asking the user for help.

1. Install or sync missing skills from the SmartWorkers source repo if needed:
   - canonical source: `https://github.com/lingkaix/SmartWorkers`
   - if this workspace is already a checkout of that repo, sync from local `skills/`
   - otherwise install the needed skills from that GitHub repo into `.agents/skills/`
2. Re-check that the skill folders and bundled references exist after sync.
3. If Node.js or another local tool is missing, give the user a short explanation of what is missing and why it blocks the task.
4. If `workers.jsonc` is missing or the required key is absent, ask the user only for the necessary info:
   - which key is missing
   - where it should be stored
   - which skill or workflow needs it
   - for Subaru Marketing access, use:
     ```jsonc
     {
       "subaruMarketing": {
         "username": "[PLEASE ENTER USERNAME HERE]",
         "password": "[PLEASE ENTER PASSWORD HERE]"
       }
     }
     ```
5. Do not start generation or authenticated Subaru asset gathering until required keys and tools are present.

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

### Completion Expectation

1. Treat a Subaru ad request as an end-to-end workflow request by default, not as a request to stop at an intermediate checkpoint.
2. Do not stop after the source pack, first draft, first approved size, review notes, or partial suite if the next workflow step can be executed safely.
3. Continue through gathering, generation, review, regeneration, SVG copy, overlays, size expansion, model expansion, and final handoff until the full requested workflow is complete.
4. Pause only when there is a real blocker or meaningful risk, such as missing required credentials, paid approval requirements, ambiguous source truth, upstream service failure, broken tooling, or a high-risk design/content decision that should not be guessed.
5. When a pause is required, report the exact blocker, what has already been completed, what remains, and the next action needed to resume.

### Subaru Ads Info Gathering

#### Source Rules

1. `https://www.subarumarketing.com/` is enough for Subaru OEM source gathering.
   Use Subaru Marketing for Subaru product assets and Subaru event materials.
2. The actual ad assets should still come from `https://www.subarumarketing.com/main.aspx`.
   Use that page for model product images, logos, and other OEM creative assets.
3. Use dealer sites only for ads info and event info discovery.
   Dealer specials pages are for offers, dealer context, stock checks, and local campaign or event details.
4. Dealer images are low-resolution and must not be treated as final ad assets.
5. Dealer images may still be downloaded as model-reference backups.
   Keep them in case the team later finds that an OEM asset was matched to the wrong model, trim, look, or style.
6. If Subaru Marketing requires login and `workers.jsonc` does not already contain `subaruMarketing.username` and `subaruMarketing.password`, stop and ask the user to add them there.

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

1. For dealer ads info, start from the dealer specials page.
   The first Subaru target is `https://www.serramontesubaru.com/serramonte-subaru-specials.htm` unless the user supplies another dealer source.
2. Crawl all deals on the list before making any picks.
3. After the full crawl, pick 5 dealer deals to make ads unless the user says otherwise.
4. Unless the user gives a different mix, aim for:
   - 3 models with the strongest live inventory
   - 2 more with the strongest lease, APR, or retail offers
5. Prefer popular Subaru models when they are available on the list.
   Forester, Outback, and Crosstrek are the default priority examples.
6. Prefer deals that are visibly marked or promoted as special offers.
   Examples include `special`, `$xxx off`, or similar highlighted wording on the card or image.
7. Before a deal can be picked for ads, click into its linked detail page and confirm the exact model name, look, and style.
8. If the linked detail page is missing, broken, or effectively unavailable, treat that deal as out of stock for the dealer.
   Do not pick that deal to make ads.
9. Keep rejected deals in the notes with the reason they were excluded.
   This prevents the same out-of-stock or mismatched deal from being reconsidered later.

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
- Leave review files, issue lists, and pass or fail records with the outputs

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
- Do not stop the workflow early just to provide a progress update when the next step is already clear and safe to execute.
- Default behavior is to finish the whole workflow in one run unless a real blocker or risk requires escalation.
