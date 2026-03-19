---
name: fal-qwen-image-edit
description: Generate and edit images from reference images using fal.ai Qwen (`fal-ai/qwen-image-edit-2511`). Use when you need image-to-image edits/variations, background swaps, style alignment, or multiple aspect-ratio outputs (e.g., square + 16:9) from the same prompt.
compatibility: Requires Node.js 18+ with internet access and a fal.ai API key in `workers.jsonc` (`fal.key`).
---

# fal-qwen-image-edit

## Required inputs

- A text prompt describing the desired result.
- One or more reference images (`--ref`) as local files or URLs.
  - Typically: 1 “base” image to edit + optional extra reference/style images.
- A fal.ai API key in `workers.jsonc` (`fal.key`).

## Optional inputs

- Output sizes / aspect ratios:
  - `--image-size <preset>` (repeatable) or `--sizes a,b,c` (comma-separated presets)
  - `--size <WxH>` (repeatable pixel-size hint; mapped to the closest supported preset)
  - Presets: `square_hd`, `square`, `portrait_4_3`, `landscape_4_3`, `portrait_16_9`, `landscape_16_9`
- `--negative-prompt`, `--seed`, `--num-images`, and other quality controls supported by the script.

## Workflow

1) Prepare inputs
- Collect the base image and any extra references (PNG/JPEG recommended).
- Write a prompt that is specific and testable:
  - **Subject**: what should be preserved/changed from the base image.
  - **Composition**: angle, crop, framing, background.
  - **Lighting + color**: time of day, soft/hard light, mood.
  - **Style**: photoreal, studio product shot, cinematic, etc.
- If you need to avoid certain elements (logos, text, hands, extra objects), use `--negative-prompt`.

2) Run the generator
- Use the bundled script to call fal.ai.
- **Final deliverables go to `artifacts/`**; request/response logs and intermediate files stay in `logs/`.
  - Basic:
    - `node skills/car-ads-designer/fal-qwen-image-edit/scripts/generate.mjs --prompt "..." --ref path/to/base.jpg`
  - Multiple sizes (one call, multiple requests):
    - `node skills/car-ads-designer/fal-qwen-image-edit/scripts/generate.mjs --prompt "..." --ref base.jpg --image-size square_hd --image-size landscape_16_9`
  - Pixel-size hints (mapped to presets):
    - `node skills/car-ads-designer/fal-qwen-image-edit/scripts/generate.mjs --prompt "..." --ref base.jpg --size 1024x1024 --size 1920x1080`

3) Stop and request review (required)
- After generation completes, **do not take any further actions** (no auto-retouching, no upscaling, no additional variants) until a human or designated reviewer confirms the outputs are acceptable.

4) Review outputs
- Inspect the **final** images under `artifacts/...` first.
- If something looks off, use the working folder in `logs/...` to debug (it includes request/response payloads).

## Outputs

- Working folder under `logs/fal-qwen-image-edit/<run-id>/` containing inputs and full request/response logs.
- Final folder under `artifacts/fal-qwen-image-edit/<run-id>/` containing:
  - `README.md` (what was generated + where the working logs are)
  - One or more final images (and per-size subfolders when multiple sizes are requested)

## Definition of done

- The script completes without errors and writes at least one image file under `artifacts/`.
- The output matches the prompt intent and aligns with the provided reference image(s).
- A human (or designated agent reviewer) has reviewed the outputs and explicitly approved any next steps.

## Safety / quality checklist

- Do not commit API keys; keep them in local-only `workers.jsonc` and avoid printing them.
- Avoid generating copyrighted logos/marks you don’t have rights to use.
- Treat rendered text as unreliable; avoid high-stakes text (prices, legal claims) unless you will manually verify/correct.
- Don’t include sensitive personal data in prompts or images unless you have permission and a clear need.
