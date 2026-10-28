---
name: kit-components
description: Generates the component batch of a VALIDATED brand kit, by AI, in Figma, bound to the kit variables, ready for the senior designer's second pass. Trigger after a brand-kit DA is validated, when the person asks to generate, extend or batch components from an existing kit. Never before validation, never to create or change a DA (that is brand-kit).
---

# Kit Components

You are step 4 of the service "where you create your AI-ready art
direction":

```
1. intake -> 2. first DA draft + brand book (brand-kit)
  -> 3. senior designer pass, then validation
  -> 4. AI generation of the components (THIS SKILL)
  -> 5. second designer pass -> 6. AI-ready transformation
```

Your output goes to a SENIOR DESIGNER'S second pass. You produce volume
with discipline: many components, zero invented decisions.

## The kit is a contract

Input: a validated kit, that is a Figma file with variable collections,
text styles, effect styles, the motif, picto, motion and states pages,
plus the brand book and tokens.json when they exist. **When the kit ships
a `render-meta` block (fileKey, variable and style ids, pages, variant
axes, sourceHash), this skill is a RENDERER of it**: consume the ids as
given, rediscover nothing, guess no layer name, fail fast if the block is
missing or its sourceHash no longer matches tokens.json (the kit drifted:
stop and say so, do not reconcile silently). Read everything FIRST. Then:

- **Never reopen a design decision.** Colors, radii, type scale, motion,
  icon rules are settled. You apply them.
- **Never improvise a missing value.** If a component needs a token or rule
  the kit does not have (a warning color, a table row height), STOP, ask,
  add it to the kit as a variable or written rule, then build. An inline
  hardcoded value is a future inconsistency with your name on it.
- **Exception, the promoted value.** A value VISIBLE in the validated
  preview (a 15px button label, a 12px caption) is already validated: do
  not stall on it. Promote it to a proper token or text style, use it, and
  log it in the changelog under "Added to the kit on the way". Only values
  never seen anywhere require a question before building.
- **Everything binds.** Fills, strokes, radii, spacing bind to the kit's
  variables; text takes the kit's text styles; shadows take the effect
  styles. A component with a hardcoded hex fails review.

## Choosing the batch

Ask WHICH components, suggesting a list derived from the destination
recorded at the interview (site, landing, blog, FAQ, social) and from what
the preview already shows. The person ticks, adds, removes. Never decide
the list alone. Group into batches of 4 to 8; deliver batch by batch.

## Build rules (Figma)

Load the figma-use and figma-generate-library skills and follow them. On
top, the service's own rules:

- One component per `use_figma` call, sequential, validated by screenshot.
- Every interactive component ships its STATES as variants: rest, hover,
  focus, disabled, plus loading where it applies, taken from the kit's
  states page, not reinvented.
- Hover variants encode the kit's motion rules (what moves, which shadow
  step); note duration and easing in the component description.
- Icons via INSTANCE_SWAP, following the kit's icon rule (contained OR
  bare, never mixed).
- Photo, diagram and illustration slots stay labeled placeholders.
- Deterministic names (`Bouton / Primaire`, `Carte / Photo` in a French
  kit), variant properties in the kit's language.
- **The component description is a SELF-SUFFICIENT PLAN**, not a note for
  a reader with taste. Eight fields: usage (when, when not), motion note
  (duration, easing, what moves, frequency budget), tokens it depends on,
  target CSS class, **Reuse** (the named exemplar to copy), **Scope**
  (Inherits / To check / Excluded), **Validation** (the observable result
  proving it is applied) and **Stop conditions** (stop if token X is
  missing in the target). An executor with no context must be able to
  apply the component; that is the literal promise of step 6.

Hard-earned Figma gotchas:

- **A bound fill can silently degrade to its base black.** Screenshot after
  every component and CHECK THE COLORS; a gray or near-black surface that
  should be a brand color means the variable binding was lost.
- **Opacity set on a variable-bound paint is silently dropped** (renders
  at 1). For translucent decorative layers (washes, glows, scrims), use a
  plain SOLID color with opacity instead of a bound paint, and note it in
  the changelog if the value mirrors a token.
- **An imported SVG arrives wrapped in a FRAME that carries a fill.**
  Recoloring every node with a non-empty fills array paints the whole
  bounding box solid. Recolor VECTOR nodes only; empty the wrapper's
  fills. And upload URLs from the asset-upload tool are single-use, one
  per file: request one per asset and POST them in parallel.
- **New pages may not appear in the person's Figma client.** Before
  debugging, verify with `figma.root.children`, then tell them to reload
  (Cmd+R). The document is usually right and their client stale.
- **Name for the web.** Component and variant names must translate
  mechanically to CSS classes and props (`Bouton / Primaire` ->
  `.btn-primary`, `État=Survol` -> `:hover`), because the library's final
  destination is a real website. Note the class name in the description.

## The designer pass is the output

Each batch ends with a review page: all components laid out on a grid with
their variants visible, a changelog, and a screenshot shared in the
conversation. The designer must be able to review WITHOUT opening each
component. Interaction states are one dimension of the grid; CONTENT WEAR
is the other: each component also renders under an unbreakable 60-char
string, zero items, 1000 items, a one-word label, German-length text, an
emoji, a changing number, with a line naming the wear axes set aside and
why. The annotated board IS the report.

The changelog has five fixed headings, none optional:

1. **Generated**: the list, with variant counts.
2. **Added to the kit on the way**: promoted values.
3. **New rules to confirm**: decisions you had to make that the kit did
   not cover.
4. **Open questions**: gaps only a human can settle (missing alert color,
   naming conflicts), plus any normalization where the kit's token
   overrode a drifted preview value.
5. **Considered and rejected**: 2 to 5 real candidates the generation
   almost did, each with the reason it did not; the most useful content
   of the whole document for the designer pass.

Next to the verdict, list the checks that did NOT run. If a verification
could not run at all (no browser, no screenshot, Figma unavailable), the
delivery OPENS with a degradation banner naming it: a silently skipped
verification is the costliest failure mode, because the designer believes
it happened.

## What this skill never does

- It never runs on a kit that is not validated (that is brand-kit's job to
  obtain).
- It never redesigns, extends or "improves" the DA. Gaps go back as
  questions, not as initiatives.
- It never ships a component with hardcoded values, missing states, or an
  empty description.
- It never uses an em dash, an en dash or a middle dot in any produced
  file.
- It never uses AI-cliche components (the badge pill with a colored dot is
  the canonical offender): forms come from the kit and its inspirations.
