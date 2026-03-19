# Subaru Campaign Rules

This reference bundles the Subaru-specific workflow and approval rules that the pipeline should follow.

## Core production order

1. Gather the campaign truth set first.
2. Generate the clean base image without text.
3. Start with `1200x1200`.
4. Review and regenerate until `1200x1200` passes.
5. Use the approved `1200x1200` as the anchor for the rest of that model's size suite.
6. Add SVG copy only after the clean image passes.
7. Review the final composite and iterate until pass.
8. Finish one full model suite before using it as the style anchor for other models.
9. After the first full suite is stable, later model suites may run simultaneously.

## Required sizes

Images:
- `1200x1200`
- `1200x628`
- `900x1600` or `1080x1920`
- `1920x1080`
- Chinese-only variant: `300x600`

## Important approval rules

- VIN cannot be changed for design reasons.
- Year and trim must be exact.
- Disclaimer content must remain accurate.
- Lease terms are typically the main ad content.
- Logo safe space must be respected.
- Love Promise branding is time-bound and must follow the active guideline.
- CTV requires larger, more legible text and a `1920x1080` export.

## Style and scene guidance

- Design should reflect season, holiday, vehicle character, and dealer region.
- California dealers may use California scenery; New York dealers should use New York-relevant scenery.
- Vehicle and background should feel harmonious.
- Keep enough clean top and bottom zones for later copy.

## Packaged Subaru notes used to derive these rules

These bundled rules were consolidated from the repo's Subaru workflow materials and recovered sample ad data so teammates do not need to depend on any `temp/` files.
