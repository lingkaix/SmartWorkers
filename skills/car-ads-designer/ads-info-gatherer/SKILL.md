---
name: ads-info-gatherer
description: Gather dealer car-ad source packs, VIN-anchored retail data, source assets, and review inputs for later ad generation. Use when the user asks to gather ad info online from a dealer site, browse and extract specials-page details, or normalize a user-provided worker-pack folder into the truth set used for car-ad generation and review.
compatibility: Local filesystem access required. Internet access plus browser/page-interaction tools are required for online gathering. Write working files to `logs/` and final source packs to `artifacts/`.
---

# ads-info-gatherer

## Required inputs

- One of these input modes:
  - `online-gather`:
    - dealer/campaign request or brief
    - dealer site URL
    - any available source docs or screenshots
  - `provided-folder`:
    - a user-supplied folder shaped like `assets/worker-pack-template/`
- Any active workflow, brief, or client playbook that defines campaign-specific rules

## Workflow

1. Create a run folder:
   - Working: `logs/car-ads-designer/ads-info-gatherer/<task-id>/`
   - Final: `artifacts/car-ads-designer/ads-info-gatherer/<task-id>/`
2. Decide the input mode.
   - For `online-gather`, use browser tools such as web fetch + Playwright-style page interaction to inspect the dealer site and related sources
   - For `provided-folder`, validate the folder contents and normalize them into the same source-pack outputs
3. In `online-gather` mode:
   - Go to the dealer specials page or other user-provided live source URLs
   - Select the target vehicle set according to the active workflow, brief, or client instructions
   - Gather retail details, disclaimers, source images, logos, and campaign rules from the live sources
   - Save source links and extraction evidence
4. In `provided-folder` mode:
   - Read the folder shaped like `assets/worker-pack-template/`
   - Use the raw sources, extracted assets, and structured notes from that folder as the input bundle
   - Validate that the provided files are sufficient for downstream ad generation
5. Gather the truth set for each vehicle:
   - Dealer name
   - Campaign/event name and date range
   - Year, model, trim
   - VIN, MSRP, residual
   - Lease/APR/retail terms
   - Disclaimer text and expiry date
   - Inventory or selection rationale if available
6. Gather everything needed for later image work:
   - Car model reference images
   - Logo files and safe-space notes
   - Event guideline notes
   - Car logs/history or prior approved references
   - Required size list
7. Keep provenance explicit:
   - Save `exact_fragment` separately from `normalized_value`
   - Record where each field came from
   - Mark uncertain fields with a confidence level
8. Produce a reusable source pack for downstream skills.

## References

- Use the active workflow, source-pack contract, or client brief for campaign-specific selection rules, OEM source priorities, and required sizes.

## Assets

- `assets/worker-pack-template/` is the packaged template for the user-supplied folder mode.

## Outputs

- `campaign.json` — campaign-level metadata
- `vehicles.json` — VIN-anchored vehicle truth set
- `copy-pack.json` — approved copy/disclaimer source text
- `assets-manifest.json` — car images, logos, prior references, and file paths
- `generation-brief.json` — what the image generator needs for clean-image creation
- `review-standards.json` — rules later used by the reviewer
- `README.md` — what was gathered, what is missing, and confidence notes

Write working notes to `logs/car-ads-designer/ads-info-gatherer/<task-id>/` and copy the final pack to `artifacts/car-ads-designer/ads-info-gatherer/<task-id>/`.

## Definition of done

- Every requested vehicle has a truth record or an explicit missing-data note
- Exact vs normalized values are separated
- Downstream skills can run without re-reading the raw brief
- The final source pack is saved under `artifacts/`
- The task folder includes a `README.md` that lists the produced files and any known gaps
- The same output contract is produced whether the inputs came from online gathering or a provided folder

## Safety / quality checklist

- Do not invent VINs, trims, or retail facts
- Do not collapse uncertain source text into “final truth”
- Keep secrets and credentials out of saved artifacts
- Flag missing source assets instead of silently substituting unrelated ones
- In online mode, do not continue past access-controlled sources until the required credentials are available
