---
name: ads-info-gatherer
metadata:
  skill_version: "1.0.0"
description: "Use when the user needs a dealer car-ad source pack built from live web sources or a provided worker-pack folder, with VIN-anchored retail truth, source assets, and provenance preserved for downstream generation and review."
compatibility: "Local filesystem access required. Internet access plus browser/page-interaction tools are required for online gathering. Keep working evidence and raw assets in `logs/`; keep the reusable final source pack and selected handoff assets in `artifacts/`."
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
   - Start a `README.md` immediately with the request summary, chosen task id, source URLs or provided-folder path, and current status
   - Keep raw evidence and working copies under the working folder, for example `sources/`, `evidence/`, `raw-assets/`, and `notes/`
   - Reserve the final folder for the normalized source pack plus the selected downstream-ready asset copies
2. Decide the input mode.
   - For `online-gather`, use browser tools such as web fetch + Playwright-style page interaction to inspect the dealer site and related sources
   - For `provided-folder`, validate the folder contents and normalize them into the same source-pack outputs
3. In `online-gather` mode:
   - Go to the dealer specials page or other user-provided live source URLs
   - Select the target vehicle set according to the active workflow, brief, or client instructions
   - Gather retail details, disclaimers, source images, logos, and campaign rules from the live sources
   - Save source links, screenshots, downloads, and extraction evidence under the working folder
4. In `provided-folder` mode:
   - Read the folder shaped like `assets/worker-pack-template/`
   - Use the raw sources, extracted assets, and structured notes from that folder as the input bundle
   - Preserve the provided raw bundle as working evidence; if files are copied into the run, place them under the working folder rather than directly in the final pack
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
   - Keep all fetched or provided media assets under the working folder first, even if only some of them will later be promoted into the final source pack
7. Keep provenance explicit:
   - Save `exact_fragment` separately from `normalized_value`
   - Record where each field came from
   - Mark uncertain fields with a confidence level
   - For every retained media asset, record the original source plus both the working-copy path and the final-pack path when a downstream-ready copy is included
8. Produce a reusable source pack for downstream skills.
   - Copy only the selected downstream-critical assets into `artifacts/.../assets/`
   - Do not leave a downstream-required image or logo only in `logs/`

## References

- Use the active workflow, source-pack contract, or client brief for campaign-specific selection rules, OEM source priorities, and required sizes.

## Assets

- `assets/worker-pack-template/` is the packaged template for the user-supplied folder mode.

## Outputs

- Working folder: `logs/car-ads-designer/ads-info-gatherer/<task-id>/`
  - `README.md` — live status, request summary, source list, and known gaps
  - `sources/` — saved URLs, downloaded pages, PDFs, or provided raw inputs
  - `evidence/` — screenshots, extraction notes, OCR/text dumps, and field-level provenance
  - `raw-assets/` — all fetched or provided candidate media assets kept for traceability
- `campaign.json` — campaign-level metadata
- `vehicles.json` — VIN-anchored vehicle truth set
- `copy-pack.json` — approved copy/disclaimer source text
- `assets/` — selected downstream-ready copies of the images, logos, and references actually needed later
- `assets-manifest.json` — car images, logos, prior references, source URLs, working paths, final-pack paths, intended use, and confidence notes
- `generation-brief.json` — what the image generator needs for clean-image creation
- `review-standards.json` — rules later used by the reviewer
- `README.md` — what was gathered, what was promoted into the final pack, what is missing, and confidence notes

Write working notes, raw evidence, and candidate media assets to `logs/car-ads-designer/ads-info-gatherer/<task-id>/`. Copy the normalized final pack plus selected downstream-ready assets to `artifacts/car-ads-designer/ads-info-gatherer/<task-id>/`.

## Definition of done

- Every requested vehicle has a truth record or an explicit missing-data note
- Exact vs normalized values are separated
- Downstream skills can run without re-reading the raw brief
- Raw evidence, downloads, and candidate media assets are preserved under `logs/`
- The final source pack is saved under `artifacts/`
- The final source pack is self-contained for downstream work and includes any assets that later skills must actually open
- The task folder includes a `README.md` that lists the produced files and any known gaps
- The same output contract is produced whether the inputs came from online gathering or a provided folder

## Safety / quality checklist

- Do not invent VINs, trims, or retail facts
- Do not collapse uncertain source text into “final truth”
- Keep secrets and credentials out of saved artifacts
- Flag missing source assets instead of silently substituting unrelated ones
- Do not treat `logs/` as the only home for assets that downstream skills must open later; promote those assets into the final pack as well
- In online mode, do not continue past access-controlled sources until the required credentials are available
