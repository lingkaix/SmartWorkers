# Subaru Source Pack Contract

This reference bundles the Subaru-specific context that was previously explored from working notes and log files, so the skill can travel cleanly with the repo.

## Accepted input modes

The gatherer supports two real input modes:

1. `online-gather`
- Use browser tools to inspect the dealer specials page and related live sources.
- The first Subaru test target is Serramonte Subaru:
  - `https://www.serramontesubaru.com/serramonte-subaru-specials.htm`
- The gatherer should use live source evidence, not guesswork.

2. `provided-folder`
- The end user may hand in a prepared folder shaped like `assets/worker-pack-template/`.
- That folder is the input bundle for normalization into the standard source-pack outputs.
- The skill should validate the folder and report any missing required files.

## What the gatherer must collect

For each selected vehicle, collect:
- dealer name
- campaign/event name
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

Also collect:
- model reference images
- logo files and lockups
- guideline notes
- required output sizes
- any prior approved references or car-history/log notes useful for continuity

## Subaru operating rules to preserve in the source pack

- VIN is the anchor.
- Year and trim must be exact.
- Keep `exact_fragment` and `normalized_value` separate.
- Missing or uncertain data should be flagged, not guessed.
- The source pack should support later steps without reopening the original brief.

## Vehicle selection guidance from the bundled Subaru notes

- Start from the dealer specials page.
- Pick 5 different car models.
- Prefer 3 models with the highest inventory.
- Prefer 2 more with the strongest price/APR deals.
- Lease information is the primary ad focus.
- Large “special off” dollar claims may be risky for approval; keep the truth set complete, but make sure the team can choose the correct display strategy later.

## Required sizes gathered for the campaign

Images:
- `1200x1200`
- `1200x628`
- `900x1600` or `1080x1920`
- `1920x1080`
- Chinese-only variant: `300x600`

## Sample recovered offer data from the packaged Subaru materials

These examples are included as a quality reference for what a complete record looks like.

### 2026 Forester Base

- dealer: `SERRAMONTE SUBARU`
- VIN: `4S4SLDA67T3030394`
- MSRP: `$31,840`
- residual: `$20,378`
- lease: `$199`
- term: `36 MONTHS / MO.+TAX`
- due at signing: `$3,995 DUE AT LEASE SIGNING`
- normalized disclaimer points:
  - down payment excludes tax, title, license, and dealer fees
  - lessee responsible for `$300` disposition fee
  - no security deposit required
  - `10,000` miles per year
  - offer expires `2026-03-31`

### 2026 Impreza Sport

- VIN: `JF1GUAFC4T8222403`
- MSRP: `$27,081`
- residual: `$18,138`
- payment: `$179`
- APR: `3.9%`
- term: `36 months`
- due at signing: `$3,998`

## Source-pack output expectation

The gatherer should produce:
- `campaign.json`
- `vehicles.json`
- `copy-pack.json`
- `assets-manifest.json`
- `generation-brief.json`
- `review-standards.json`
- `README.md`
