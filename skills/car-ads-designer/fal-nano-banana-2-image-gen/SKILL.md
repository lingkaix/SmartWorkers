---
name: fal-nano-banana-2-image-gen
description: "Generate images from text prompts using fal.ai Nano Banana 2 (fal-ai/nano-banana-2). Use when you need fast text-to-image variants for ads, concepts, or backgrounds."
compatibility: Requires Node.js 18+ with internet access and a fal.ai API key in `workers.jsonc` (`fal.key`).
---

# fal-nano-banana-2-image-gen

## Required inputs

- `--prompt "..."` (required)
- `workers.jsonc` with `fal.key` (required)

## Optional inputs

- Output sizes / aspect ratios:
  - `--image-size <preset>` (repeatable) or `--sizes a,b,c` (comma-separated presets)
  - `--size <WxH>` (repeatable pixel-size hint; sent as `{ width, height }` when supported)
- `--negative-prompt`, `--seed`, `--num-images`, and other model parameters:
  - `--param key=value` (repeatable; supports dot-paths for nesting)
  - `--body-json path/to/body.json` (merge arbitrary JSON into the request body)

## Workflow

1) Prepare inputs
- Write a prompt that is specific and testable:
  - **Subject**: what the image is of.
  - **Composition**: angle, crop, framing, background.
  - **Lighting + color**: time of day, soft/hard light, mood.
  - **Style**: photoreal, studio product shot, cinematic, etc.
- If you need to avoid certain elements (logos, text, hands, extra objects), use `--negative-prompt`.

2) Run
- Use the bundled script to call fal.ai.
- **Final deliverables go to `artifacts/`**; request/response logs and intermediate files stay in `logs/`.
  - Basic:
    - `node skills/car-ads-designer/fal-nano-banana-2-image-gen/scripts/generate.mjs --prompt "..." --image-size square_hd`
  - Multiple sizes (one call, multiple requests):
    - `node skills/car-ads-designer/fal-nano-banana-2-image-gen/scripts/generate.mjs --prompt "..." --image-size square_hd --image-size landscape_16_9`
  - Pass extra model parameters (from the model's `llms.txt` / docs):
    - `node skills/car-ads-designer/fal-nano-banana-2-image-gen/scripts/generate.mjs --prompt "..." --param guidance_scale=4.5 --param steps=30`

3) Stop and request review (required when subjective/high impact)
- After generation completes, **do not take any further actions** (no auto-retouching, no upscaling, no additional variants) until a human or designated reviewer confirms the outputs are acceptable.

4) Review outputs
- Inspect the **final** images under `artifacts/...` first.
- If something looks off, use the working folder in `logs/...` to debug (it includes request/response payloads).

## Outputs

- Working folder under `logs/fal-nano-banana-2-image-gen/<run-id>/` containing inputs and full request/response logs.
- Final folder under `artifacts/fal-nano-banana-2-image-gen/<run-id>/` containing:
  - `README.md` (what was generated + where the working logs are)
  - One or more final images (and per-size subfolders when multiple sizes are requested)

## Definition of done

- The script completes without errors and writes at least one image file under `artifacts/`.
- The output matches the prompt intent.
- A human (or designated agent reviewer) has reviewed the outputs and explicitly approved any next steps.

## Safety / quality checklist

- Do not commit secrets.
- Do not paste/print keys from `workers.jsonc`; only confirm whether values are present.
- Avoid generating copyrighted logos/marks you don’t have rights to use.
- Treat rendered text as unreliable; avoid high-stakes text (prices, legal claims) unless you will manually verify/correct.
- Don’t include sensitive personal data in prompts unless you have permission and a clear need.
