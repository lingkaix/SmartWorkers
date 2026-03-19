# Review Checklist

Use this checklist for both clean-image review and final-composite review.

## Clean image review

- Vehicle matches the intended year, model, trim, and overall identity
- Viewpoint and body details are close enough to the approved source expectation
- No accidental letters or high-stakes text in the generated image
- Composition feels intentional and usable for later overlay
- Top and bottom clean zones are preserved for copy and legal text
- Seasonal and regional mood fit the campaign
- No obvious artifacts, distortion, blur bands, or malformed details
- The result is consistent with the approved anchor style

## Final composite review

- All clean-image checks still hold
- Headline / offer / dealer / legal text matches the approved truth set
- VIN, trim, prices, and disclaimer text are exact
- Legal text is readable
- Logo usage and clear space are compliant
- Footer spacing and text collisions are resolved
- Export size and aspect ratio match the requested size
- The output is safe to deliver

## Output contract

Every review should produce:
- `review.json` with `pass` or `fail`
- a flat issue list with severity and fix guidance
- `review.md` with a short human-readable summary
