---
name: ads-suite-pipeline
description: "Run the full dealer car-ad production pipeline from source pack or approved anchor design to final approved deliverables: generate clean images, review/regenerate, build SVG copy overlays, and finish consistent multi-size or multi-model suites. Use whenever the user asks to produce a full ad suite, continue from an approved ad, adapt one campaign across sizes/models, review and improve generations, or keep retail offer copy exact while moving from source pack to deliverable assets."
compatibility: Local filesystem access required. Relies on downstream image-generation/editing skills that may need internet/API access and `workers.jsonc` credentials such as `fal.key`. Use `logs/` for working files and `artifacts/` for final deliverables.
---

# ads-suite-pipeline

## Required inputs

- One of these starting points:
  - a source pack from `$ads-info-gatherer`
  - an existing approved anchor design or approved partial suite the user wants to extend
- Target vehicle models and requested sizes
- Approved retail truth set for copy/disclaimer content
- Any approved reference designs, prior approved suites, or campaign-specific style guardrails
- Budget/approval expectations if the run may require many paid image-generation retries

## Workflow

1. Create a run folder:
   - Working: `logs/car-ads-designer/ads-suite-pipeline/<task-id>/`
   - Final: `artifacts/car-ads-designer/ads-suite-pipeline/<task-id>/`
   - Start a `README.md` immediately with the request summary, chosen task id, known source materials, and current status
2. Confirm the campaign truth set is ready.
   - If the user did not provide a usable source pack or approved anchor asset, run `$ads-info-gatherer` first
   - Copy or link the approved source inputs into `source-pack/` inside the run folder
   - Load the active workflow, brand playbook, or campaign brief when client-specific rules apply
3. Decide the starting mode.
   - `fresh-suite`: no approved anchor exists yet, so choose one anchor model and start at `1200x1200`
   - `continuation`: an approved anchor design already exists, so reuse it and continue with the remaining sizes/models without re-opening already approved work unless the user asks
4. Set the anchor plan.
   - The anchor size is `1200x1200` unless the user already supplied an approved anchor asset for a different starting point
   - Do not start any other size before the anchor design for the current model is approved
   - Do not start later model suites before one full reference suite is approved
5. Generate or reuse the clean anchor image.
   - For `fresh-suite`, generate the clean base image with `$fal-nano-banana-2-image-gen`
   - For `continuation`, reuse the approved clean/base asset and document where it came from
   - Generate images without letters
   - No dealer text, no pricing, no disclaimer text, no logo text blocks
   - Keep enough clean space for later copy and legal overlay
   - Preserve the intended vehicle identity, trim, and viewpoint as closely as the source pack requires
   - Pause for review before broad creative changes or unusually large paid rerun batches
6. Review the clean image and loop until pass.
   - Load `references/review-checklist.md`
   - Check vehicle fidelity, composition quality, clean zones, seasonal/regional fit, and suite consistency
   - Write `review.json` and `review.md`
   - If the result is `fail`, write a narrow regeneration brief and generate again
   - Do not continue until the current clean/base asset passes
7. After the clean/base asset passes, create final copy layers.
   - Build copy as SVG, not raster text
   - Use exact approved copy only
   - Never invent, beautify, shorten, or paraphrase VINs, prices, trims, or legal text unless the source pack explicitly approves that variation
   - Save copy sources, SVG exports, and layout notes under `models/<model>/<size>/copy/`
8. Overlay the SVG copy onto the approved base image.
   - Export one composite candidate for the current size
   - Review the final composite against the same checklist, plus text fidelity, logo safe space, disclaimer readability, and footer collisions
   - If failed, adjust layout/overlay and review again until pass
   - Keep failed candidates in the working folder and only place approved finals in the deliverables area
9. Finish the rest of the sizes for the same model one by one.
   - Use the approved anchor design as the reference for the rest of that model's size suite
   - For each size: clean image -> review loop -> SVG copy -> overlay -> final review loop
10. After one full model suite is approved, use it as the style anchor for the remaining vehicle models.
   - Other model suites may then run simultaneously if useful
   - Keep the suite visually consistent with the approved anchor suite
11. Write a complete handoff.
   - Record the source pack or approved anchor input, anchor model, anchor size, requested sizes, pass/fail history, and final deliverables
   - Make it obvious which files are drafts, which are blocked, and which are approved to deliver

## References

- Load `references/review-checklist.md` whenever reviewing either the clean image or the final composite.
- Use the active workflow, approved source pack, or campaign brief for client-specific sizes, approval rules, and branding constraints.

## Outputs

- Working folder: `logs/car-ads-designer/ads-suite-pipeline/<task-id>/`
  - `README.md` — live status, request summary, next step, and blocked items
  - `source-pack/` — copied or linked source materials used in the run
  - `models/<model>/<size>/clean/` — prompts, generations, regeneration briefs, and clean-image reviews
  - `models/<model>/<size>/copy/` — SVG copy assets, approved text source, and layout metadata
  - `models/<model>/<size>/final/` — candidate composites, final reviews, and rejected variants
- Final deliverables: `artifacts/car-ads-designer/ads-suite-pipeline/<task-id>/`
  - `README.md` — handoff summary, anchor suite, approved outputs, and any explicit blockers
  - `source-pack/` — final linked or copied truth-set bundle used for the approved run
  - `models/<model>/<size>/final/` — only approved deliverables safe to hand off

Keep intermediate generations, failed candidates, and review loops in `logs/`. Keep only approved handoff materials in `artifacts/`.

## Defaults & rules

- Default to `1200x1200` as the first anchor size unless the user already supplied an approved anchor design to continue from.
- Default to finishing one model suite before starting the next, even if multiple models were requested.
- If copy/facts are incomplete or contradictory, stop and resolve the truth set before generating more finals.
- If exact copy does not fit, adjust layout instead of altering the facts.
- Treat generated text inside an image as unusable until it has been rebuilt from the approved truth set as SVG.

## Definition of done

- The anchor model has an approved full size suite
- Every requested size for every requested model has either an approved final asset or an explicit blocked status
- Review files explain every failed attempt and every approved deliverable
- The working folder and final handoff each include a `README.md`
- The final handoff makes it obvious which files are safe to deliver
- `artifacts/` contains only approved deliverables and their supporting handoff notes

## Safety / quality checklist

- Do not skip the `1200x1200` anchor approval
- Do not generate final ad text inside the base image stage
- Do not proceed to the next size before the current size passes
- Do not start later model suites before one full reference suite is approved
- Treat VIN, trim, pricing, and disclaimer mistakes as blockers
- Keep failed or uncertain outputs out of the final deliverables folder
- Do not approve layout changes that compromise disclaimer readability or logo safe space
