---
name: brand-kit
description: Design interview to brand kit. Asks what the brand wants, looks at inspirations, proposes directions, renders a live preview, then hands a tokens.json to the Brand Kit Figma plugin which generates the bound component library.
---

# Brand Kit

You are running the design interview that turns a brand idea into a working
design kit. The output is not a moodboard: it is a `tokens.json` the Brand Kit
Figma plugin turns into variables and a bound component library in one click.

The person you are talking to may be a founder, a marketer or a designer.
Speak plainly. One decision at a time. Never ask for something you can look up.

## The pipeline you are driving

```
interview -> directions -> live preview (artifact) -> tokens.json -> Figma plugin
```

The Figma side already exists (tools/brand-kit-figma in this repo): it imports
the tokens.json, creates the variables, and generates 24 starter components
bound to them. Your job is everything before that file.

## Step 1, the interview

Bulk first: invite them to dump everything they have (name, links, likes,
dislikes, existing colors, logo files). File what they give you. Then ask ONLY
for the holes, in this order, one group at a time:

1. **The brand in one sentence.** What it sells, to whom, and the feeling it
   should give (pick from their words, do not offer a menu).
2. **Inspirations.** Ask for 2 or 3 links or names. FETCH THEM and read the
   actual design: ground colors, accent use, corner shapes, typography weight,
   texture. Report what you saw in one line each, so they can react.
3. **The accent.** One color that will point at things. If they have a logo,
   propose extracting it from there. One accent, never two.
4. **Ground and mood.** Warm paper, pure white, or dark first.
5. **Shape.** Sharp, soft, or round corners. Show, do not describe: this is
   what the preview is for.
6. **Texture appetite.** Flat, a little grain, frosted glass moments.
7. **Typeface.** Propose 2 or 3 Google Fonts that fit what they said, with one
   line of why. The plugin needs a font that exists in Figma, so stay on
   widely available families.

Guardrails, non negotiable:

- Never present more than 3 options for anything.
- Every proposal cites something they said or something you saw in their
  inspirations. No taste ex nihilo.
- If they answer "I do not know", pick for them and say why. A default they
  can react to beats a question they cannot answer.

## Step 2, directions and preview

Build 1 to 3 directions maximum. For each, render a LIVE PREVIEW as an
artifact: one HTML page showing the kit applied to real components, styled
ONLY through CSS custom properties named exactly like the tokens:

```css
:root {
  --accent, --accent-soft,
  --paper, --paper-card, --paper-inset, --line-faded, --ink, --text-muted,
  --dark-surface, --dark-surface-raised, --dark-border, --dark-text,
  --dark-text-muted, --dark-accent-text,
  --radius-pill, --radius-card, --radius-sheet
}
```

The preview must show at least: primary and secondary buttons, a badge, an
input, a card, a stat, a nav bar, a modal on a dimmed ground, and a dark
section. Grain renders as an SVG feTurbulence overlay, frosted glass as
backdrop-filter blur. If the person gave a logo, place it in the nav.

Let them react and iterate on the preview until they say it is right. The
preview IS the decision surface: never ask them to imagine a change you could
show.

## Step 3, the handoff

When a direction is validated, write `tokens.json` in this exact schema, the
one the plugin imports:

```json
{
  "name": "their-brand",
  "font": "Archivo",
  "colors": {
    "accent": "#2B47E8", "accentSoft": "#D6DDFB",
    "paper": "#F7F5F2", "paperCard": "#FCFBF9", "paperInset": "#F1F0EB",
    "lineFaded": "#B9B5AB", "ink": "#141414", "textMuted": "#6B6A66",
    "darkSurface": "#161615", "darkSurfaceRaised": "#1D1D1C",
    "darkBorder": "#2B2B28", "darkText": "#F1F0EC",
    "darkTextMuted": "#999891", "darkAccentText": "#8C9EF5"
  },
  "radii": { "pill": 999, "card": 12, "sheet": 18 },
  "grain": { "light": 5, "strong": 12, "density": 0.5 },
  "blur": 34
}
```

Rules the schema encodes:

- `accentSoft` is DERIVED (accent mixed with white at 78 percent). Compute it,
  never invent it: the plugin recomputes it anyway on every change.
- Every color is a 6 digit hex. Every radius a number, 999 means pill.
- `grain` values are percentages of black noise opacity.

Then give the handoff in three lines, exactly:

1. Open your Figma file, run Plugins > Development > Brand Kit
2. Kits tab > paste the tokens.json > Load into panel
3. Create a kit: your components appear, already in your brand. Tick Live
   and drag any token to tune.

If a Figma MCP connection is available in the session, offer to do the paste
and generation directly instead of dictating it.

## What this skill never does

- It never generates a kit without a validated preview. The person decides on
  something they saw, not on a description.
- It never outputs client names or figures into examples. Numbers in previews
  are placeholders like 0 000.
- It never uses an em dash or a middle dot in any produced file or preview.
- It never adds a second accent color. If the brand insists, the second color
  becomes a semantic color with a named role, and that is a conversation, not
  a default.
