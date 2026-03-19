---
name: fal-veo3-image-to-video
description: Generate videos from a reference image using fal.ai Veo 3.1 image-to-video (`fal-ai/veo3.1/image-to-video`). Use when you need short video variants (ad b-roll, product shots, storyboards) from a still image, with final outputs saved to `artifacts/` and request/response logs saved to `logs/`.
---

# fal-veo3-image-to-video

## Required inputs

- A text prompt describing the desired motion/scene.
- One reference image (`--image`) as a local file or URL.
- A fal.ai API key in `workers.jsonc` (`fal.key`).

## Optional inputs

- Additional model parameters via `--param k=v` (repeatable).
  - Value coercions:
    - `true` / `false`
    - numbers (e.g. `24`, `0.7`)
    - `json:<JSON>` (e.g. `json:{"a":1}`)
    - `@path/to/file.json` (read JSON from file)
  - Nested keys are supported via dot notation (e.g. `--param camera.motion=fast`).
- `--sync-mode` to call `fal.run` directly instead of queue polling.
- `--image-field` to force the request field name for images (defaults to `image_url` for 1 image and `image_urls` for >1).

## Workflow

1) Prepare inputs
- Pick a clean, sharp source image (PNG/JPEG recommended).
- Write a prompt that specifies:
  - **Subject**: what stays consistent from the reference.
  - **Motion**: camera movement and/or subject movement.
  - **Style**: photoreal, cinematic, studio product shot, etc.

2) Run the generator
- Use the bundled script to call fal.ai.
- **Final deliverables go to `artifacts/`**; request/response logs and intermediate files stay in `logs/`.
  - Basic:
    - `node skills/car-ads-designer/fal-veo3-image-to-video/scripts/generate.mjs --prompt "..." --image path/to/ref.jpg`
  - Add model parameters (examples; use the model’s `llms.txt` for exact field names):
    - `node skills/car-ads-designer/fal-veo3-image-to-video/scripts/generate.mjs --prompt "..." --image ref.jpg --param seed=123 --param fps=24`
    - `node skills/car-ads-designer/fal-veo3-image-to-video/scripts/generate.mjs --prompt "..." --image ref.jpg --param generation=json:{\"steps\":30}`

3) Stop and request review (required)
- After generation completes, **do not take any further actions** (no auto-editing, no extra variants) until a human or designated reviewer confirms the outputs are acceptable.

4) Review outputs
- Inspect the **final** videos under `artifacts/...` first.
- If something looks off, use the working folder in `logs/...` to debug (it includes request/response payloads).

## Outputs

- Working folder under `logs/fal-veo3-image-to-video/<run-id>/` containing inputs and full request/response logs.
- Final folder under `artifacts/fal-veo3-image-to-video/<run-id>/` containing:
  - `README.md` (what was generated + where the working logs are)
  - One or more final videos (`video-1.mp4`, etc.)

## Reference

- For the model’s canonical field names and response shape, see `skills/car-ads-designer/fal-veo3-image-to-video/references/veo3.1-image-to-video.md`.

## Definition of done

- The script completes without errors and writes at least one video file under `artifacts/`.
- The output matches the prompt intent and is consistent with the reference image.
- A human (or designated agent reviewer) has reviewed the outputs and explicitly approved any next steps.

## Safety / quality checklist

- Do not commit API keys; keep them in local-only `workers.jsonc` and avoid printing them.
- Avoid generating copyrighted logos/marks you don’t have rights to use.
- Treat rendered text as unreliable; avoid high-stakes text (prices, legal claims) unless you will manually verify/correct.
- Don’t include sensitive personal data in prompts or images unless you have permission and a clear need.
