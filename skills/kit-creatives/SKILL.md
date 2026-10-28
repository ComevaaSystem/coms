---
name: kit-creatives
description: Generates ad creatives (Meta, LinkedIn, TikTok) from a VALIDATED brand kit, in Story 9:16, feed 4:5 and square 1:1, same tone and singularity as the kit. Trigger when the person asks for ads, social creatives, statics or stories for a brand that has a kit. Requires a validated kit (brand-kit) and a validated message angle; never invents style or claims.
---

# Kit Creatives

You are the ads arm of the service "where you create your AI-ready art
direction". Downstream of the kit and of the validated messaging:

```
validated brand kit (brand-kit) + validated, QC'd angle (brief-creas)
  -> templates per format -> signature backgrounds -> compositing
  -> verification -> PNG statics and motion cuts -> human pass -> launch
```

## The two contracts

- **The kit is the ONLY source of style.** Colors, type scale, radii,
  motion tokens, motifs, voice register. Introducing a color, a size or a
  component outside the kit fails the batch. Same reflex as
  kit-components: a missing value goes back as a question or a promoted
  token, never an inline invention.
- **No claim without a sourced fact.** Every hook references the fact that
  grounds it; figures marked as projections are barred from display. One
  promise per creative: two claims in one text block are refused.
  This is the structural edge no market tool has; never bypass it.

## Unit of generation

One CONCEPT = one validated angle, one hook formula, one visual anchor,
one CTA. One batch = one angle x N composition anchors x 3 formats.
Content (hook, proof, CTA, visual) is separated from the template: the
same payload feeds the three formats. Three independent creatives per
format is the amnesia failure mode of every ad generator.

Continuity rule inside a batch: same palette, same CTA family, same image
treatment on every frame; a viewer flipping through must read ONE brand.
Variety rule: never the same composition anchor twice in a row.

## Templates (HTML/CSS on the kit's tokens)

One template per composition anchor x format. Layer stack, bottom to top:
signature background, legibility scrim (a dedicated layer, never hope),
text block (hook / proof / CTA at the kit's sizes), logo as the provided
SVG. The AI image or shader never carries text; typography is always
composited in HTML. The logo and product photos are assets, never
regenerated. If the kit holds no official logo file, STOP and ask for it
before the first render, or fetch the original from the brand's own site;
a typographic recreation in a delivered creative is a review failure.

Safe zones live in the template as percentages AND are asserted
geometrically on the export (a CTA under a Reel's bottom UI is masked
with nothing breaking):

| Format | Canvas | Safe zone (Meta 2026 unified) |
|---|---|---|
| Story/Reel 9:16 | 1080x1920 | 14% top, 6% sides, 35% bottom free |
| Feed 4:5 | 1080x1350 | 6 to 8% inner margins; LinkedIn: keep bottom 250 to 340px light |
| Square 1:1 | 1080x1080 | central 80 to 85%, safest cross-device |

TikTok 9:16 is stricter: 130px top, 484px bottom, 140px right, 44px left.

Hook in the top third OF the safe zone, proof in the middle, CTA at the
bottom of the safe zone. Type minima at 1080px wide: hook 48px+, CTA 28px
bold, body 24px, all mapped to the kit's closed scale; check the render
at 50% zoom.

## Backgrounds

Signature backgrounds come from the kit's motifs, rendered either in CSS
(gradients, grain, shapes from the kit) or in Figma with shader fills and
effects (mesh gradient, noise, caustics, halftone...) exported as image
assets. Choose shaders that MEAN something for the brand; a shader used
because it exists is decoration. Photos get the kit's treatment (scrim,
mask, tone) before text goes anywhere near them.

## Rendering

- **Statics**: headless Chrome screenshot of the HTML at exact canvas
  size, deviceScaleFactor 2, wait for fonts. Naming:
  `{brand}-{angle}-{format}-{anchor}.png`.
- **Motion**: the same HTML template animated (GSAP / HyperFrames) with
  the kit's motion tokens, or Figma keyframes + video export when the
  designer must retouch the animation. Hook readable in the first second,
  promise landed before 3s, clean loop, 9 to 15s.

## Verification (on the render, not the intention)

Before delivery, every export passes: fonts actually rendered, no
overflow, contrast 4.5:1 on every text/background pair, type minima met,
safe-zone assertion on each text and CTA bounding box, vertical rhythm
(the gap between the text group and the CTA is at least 1.5x the gaps
inside the text group; a cramped CTA over a large void is the tell),
voice register regexes (the kit's closed rules).

The safe-zone and rhythm assertions are MEASURED, not eyeballed: each
template embeds a QA script that writes bounding-box metrics (overflow vs
safe zone, proof-to-CTA gap) into document.title on load; headless Chrome
with --dump-dom reads them back. Zero overflow is the only passing value.
Eyeballing routinely says "fine" on a Story whose CTA the measure finds
inside the masked zone. Fails are fixed in the HTML and re-exported; a
failed check is never hand-waved. If a check could not run, the delivery
opens with a degradation banner naming it.

Any French copy on the creatives goes through `relecteur-fr` before the
render, and the character counts are rechecked after every rewrite.

## Delivery

A batch ships as: the PNGs (and MP4s), a contact sheet page showing all
formats side by side, and the changelog (generated / added to the kit /
rules to confirm / open questions / considered and rejected). The human
pass decides what runs; this skill never publishes anywhere.

## What this skill never does

- It never runs without a validated kit AND a validated angle.
- It never generates text inside images, never regenerates a logo or a
  product visual.
- It never mixes two angles or two promises in one creative.
- It never uses an em dash, an en dash or a middle dot in any produced
  file.
- It never publishes to an ad platform; delivery ends at files + review.
