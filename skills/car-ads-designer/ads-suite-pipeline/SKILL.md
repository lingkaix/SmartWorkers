---
name: ads-suite-pipeline
description: Run the full dealer car-ad production pipeline from source pack to final approved deliverables: generate clean images with Nano Banana, review/regenerate, build SVG copy, overlay it, and finish consistent multi-size or multi-model suites. Use whenever the user asks to produce a full ad suite, iterate sizes, review and improve generations, add offer copy, or keep a car campaign visually consistent across models and placements.
compatibility: Local filesystem access required. May rely on image-generation skills with internet/API access. Uses `temp/` for working files and `artifacts/` for final deliverables.
---

# ads-suite-pipeline

## Required inputs

- A campaign request or a source pack from `$ads-info-gatherer`
- Target vehicle models
- Requested sizes
- Any approved reference designs or prior approved suites

## Workflow

1. Create a run folder:
   - Working: `temp/car-ads-designer/ads-suite-pipeline/<task-id>/`
   - Final: `artifacts/car-ads-designer/ads-suite-pipeline/<task-id>/`
2. Confirm the source pack is ready.
   - If the user did not provide one, run `$ads-info-gatherer` first
   - Load `references/subaru-campaign-rules.md` when working on Subaru dealer campaigns
3. Choose one anchor model and one anchor size.
   - The anchor size is always `1200x1200`
   - Do not start any other size before the `1200x1200` base image passes review
4. Generate the clean base image with `$fal-nano-banana-2-image-gen`.
   - Generate images without letters
   - No dealer text, no pricing, no disclaimer text, no logo text blocks
   - Keep enough clean space for later copy and legal overlay
   - Preserve the intended vehicle identity, trim, and viewpoint as closely as the source pack requires
5. Review the clean image and loop until pass.
   - Load `references/review-checklist.md`
   - Check vehicle fidelity, composition quality, clean zones, seasonal/regional fit, and suite consistency
   - Write `review.json` and `review.md`
   - If the result is `fail`, write a narrow regeneration brief and generate again
   - Do not continue until the current size passes
6. After the clean `1200x1200` base image passes, create final copy layers.
   - Build copy as SVG, not raster text
   - Use exact approved copy only
   - Never invent, beautify, shorten, or paraphrase VINs, prices, trims, or legal text unless the source pack explicitly approves that variation
7. Overlay the SVG copy onto the approved base image.
   - Export one composite candidate for the current size
   - Review the final composite against the same checklist, plus text fidelity, logo safe space, disclaimer readability, and footer collisions
   - If failed, adjust layout/overlay and review again until pass
8. Finish the rest of the sizes for the same model one by one.
   - Use the approved `1200x1200` design as the anchor reference for the rest of the size suite
   - For each size: clean image -> review loop -> SVG copy -> overlay -> final review loop
9. After one full model suite is approved, use it as the style anchor for the remaining vehicle models.
   - Other model suites may then run simultaneously if useful
   - Keep the suite visually consistent with the approved anchor suite
10. Write a complete handoff.
   - Record the source pack, anchor model, anchor size, requested sizes, pass/fail history, and final deliverables

## References

- Load `references/review-checklist.md` whenever reviewing either the clean image or the final composite.
- Load `references/subaru-campaign-rules.md` for the bundled Subaru workflow, size requirements, approval rules, and style-continuity notes.

## Outputs

- `source-pack/` — copied or linked source pack used for the run
- `models/<model>/<size>/clean/` — clean-image prompts, generations, and reviews
- `models/<model>/<size>/copy/` — SVG copy assets and copy layout metadata
- `models/<model>/<size>/final/` — composited candidates, final reviews, and approved deliverables
- `README.md` — run summary, anchor suite, and final status

Keep working iterations in `temp/car-ads-designer/ads-suite-pipeline/<task-id>/` and save approved outputs in `artifacts/car-ads-designer/ads-suite-pipeline/<task-id>/`.

## Definition of done

- The anchor model has an approved full size suite
- Every requested size for every requested model has either an approved final asset or an explicit blocked status
- Review files explain every failed attempt and every approved deliverable
- The final handoff makes it obvious which files are safe to deliver
- The task folder includes a `README.md` that identifies the anchor suite and approved outputs

## Safety / quality checklist

- Do not skip the `1200x1200` anchor approval
- Do not generate final ad text inside the base image stage
- Do not proceed to the next size before the current size passes
- Do not start later model suites before one full reference suite is approved
- Treat VIN, trim, pricing, and disclaimer mistakes as blockers
- If exact copy does not fit, adjust layout instead of altering the facts
