# Worker Pack Template

This folder is the packaged template for the `provided-folder` input mode of `$ads-info-gatherer`.

The end user should prepare a folder with this structure and then provide that folder path to the skill.

Expected structure:
- `01_sources/` — raw source files from the dealer or campaign
- `02_extracted/` — extracted previews, OCR/text dumps, raw asset files, checksums
- `03_structured/` — structured notes or partially prepared truth data

The gatherer should read this folder, validate it, preserve it as working evidence in `logs/car-ads-designer/ads-info-gatherer/<task-id>/`, and normalize it into the standard source-pack outputs in `artifacts/car-ads-designer/ads-info-gatherer/<task-id>/`.
Only the selected downstream-ready assets should be copied into the final source pack; the full raw bundle stays traceable in `logs/`.
