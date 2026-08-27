# Brand Kit, Figma plugin

The control panel for a brand system. One gesture, the whole file follows:
the variables (colors, radii), plus everything Figma variables cannot carry,
the CTA and capsule gradients, the grain effects, the frosted glass.

## Starting from zero

On an empty file the plugin offers **Initialize brand kit**: it creates the
"Brand" variable collection and every token it needs, with the panel defaults
or with a pasted tokens.json. From there:

1. Design using the variables (they show up in Figma's color and radius
   pickers under "Brand")
2. Anything drawn with a raw hex that matches a token gets caught later by
   **Re-link matching colors**
3. For a new client file, the richer path is to duplicate the reference file
   (tokens, components, reference boards) rather than starting truly empty

## What the pro version does

- **Scope**: selection, current page, or whole file. Never "everywhere" by
  accident.
- **Categories**: colors, radii, gradients, grain, frosted glass, re-link.
  Each has its own checkbox. What is not checked is not touched.
- **Off brand**: taking a selection off brand detaches it from the variables
  and makes every sweep ignore it. The safety valve against "everything looks
  the same": a free piece stays free.
- **Analyze**: the same sweep without writing anything, reporting how many
  elements would be touched, before you hit Apply.
- **Named kits**: stored in the file, reloadable, deletable, importable as
  JSON. One file can carry a kit per client of the Brand offer.
- **Re-link**: unbound colors close to a token get bound to it (useful after
  a re-include, or on a file built by hand).

## Install (once, 30 seconds)

1. Open Figma **desktop** (not the browser)
2. Menu Plugins > Development > **Import plugin from manifest...**
3. Pick `manifest.json` in this folder
4. The plugin shows up under Plugins > Development > **Brand Kit**

## What happens on Apply

1. The "Brand" collection variables are written: every bound element follows
   instantly
2. The soft accent derives from the accent (accent mixed with white), never
   hand-picked: two knobs for the same thing always end up disagreeing
3. Gradients in the accent family are rebuilt from the new accent (Figma
   gradients cannot bind to a variable)
4. Every NOISE effect takes the grain sliders, every BACKGROUND_BLUR takes
   the glass slider

## Export to the web

**Export tokens.json + CSS** downloads two files:

- `tokens.json`, the whole kit as data
- `brand.css`, the same tokens as CSS custom properties, gradients included
  (via color-mix, derived from --accent exactly like in Figma)

The same source of truth drives Figma and the website: the promise of the
Brand offer, demonstrated on ourselves.

## Known limits

- Gradients are detected by hue (close to the current accent): a gradient
  deliberately built in another color is never touched.
- New elements must use the variables, not re-typed hex values: rule from
  board 04 of the reference page.
- Undo (Cmd+Z) reverts an Apply in one step.
