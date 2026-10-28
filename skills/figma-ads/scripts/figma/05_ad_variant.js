// 05_ad_variant.js : construit UNE variante du composant Ad (structure seule, sans propriétés).
// Paramètres :
//   __FORMAT__   "Feed 4:5" | "Story 9:16" | "Carré 1:1"
//   __LOGO_ID__  id du composant Logo (rendu par 04)
//   __CTA_ID__   id du composant CTA (rendu par 04)
// Un appel par format, en séquence. Puis 06_ad_props.js sur chaque variante, puis 07_combine.js.
//
// Anatomie (voir references/template-ad.md) :
//   Format=...  COMPONENT, auto layout vertical, taille fixe, padding = zone sûre (variables safe/*)
//   ├ Visuel    RECTANGLE absolu plein cadre (seul calque absolu), placeholder color/surface
//   ├ Header    auto layout horizontal > instance Logo
//   ├ Texte     auto layout vertical > Hook, Sous-titre
//   └ Footer    auto layout vertical > Preuve, instance CTA
// Header / Texte / Footer sont répartis en SPACE_BETWEEN dans la zone sûre.

const FORMAT = __FORMAT__;
const LOGO_ID = __LOGO_ID__;
const CTA_ID = __CTA_ID__;

const FEED_PAD = { top: 'safe/feed', bottom: 'safe/feed', left: 'safe/feed', right: 'safe/feed' };
const SPECS = {
  'Feed 4:5': { w: 1080, h: 1350, pad: FEED_PAD },
  'Carré 1:1': { w: 1080, h: 1080, pad: FEED_PAD },
  'Story 9:16': {
    w: 1080,
    h: 1920,
    pad: { top: 'safe/story-top', bottom: 'safe/story-bottom', left: 'safe/story-side', right: 'safe/story-side' },
  },
};
const spec = SPECS[FORMAT];
if (!spec) throw new Error(`Format inconnu : ${FORMAT}. Attendu : ${Object.keys(SPECS).join(', ')}`);

const page = figma.root.children.find(p => p.name === 'Template ads');
if (!page) throw new Error('Page "Template ads" absente : lancer 04_subcomponents.js');
await figma.setCurrentPageAsync(page);

// Idempotence : variante déjà construite (seule ou déjà combinée dans Ad) => on ne refait rien.
const variantName = `Format=${FORMAT}`;
const already = page.findAllWithCriteria({ types: ['COMPONENT'] }).find(c => c.name === variantName);
if (already) return { variantId: already.id, skipped: true, inSet: !!(already.parent && already.parent.type === 'COMPONENT_SET') };

const vars = await figma.variables.getLocalVariablesAsync();
const V = Object.fromEntries(vars.map(v => [v.name, v]));
const need = n => {
  if (!V[n]) throw new Error(`Variable absente : ${n}. Lancer 02_tokens.js.`);
  return V[n];
};
const num = n => {
  const vals = Object.values(need(n).valuesByMode);
  return typeof vals[0] === 'number' ? vals[0] : 0;
};
const paint = n => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', need(n));

const styles = await figma.getLocalTextStylesAsync();
const S = Object.fromEntries(styles.map(s => [s.name, s]));
for (const n of ['Ad/Hook', 'Ad/Sous-titre', 'Ad/Preuve']) {
  if (!S[n]) throw new Error(`Style absent : ${n}. Lancer 03_text_styles.js.`);
}

const [logoMain, ctaMain] = await Promise.all([figma.getNodeByIdAsync(LOGO_ID), figma.getNodeByIdAsync(CTA_ID)]);
if (!logoMain || logoMain.type !== 'COMPONENT') throw new Error(`Logo introuvable : ${LOGO_ID}`);
if (!ctaMain || ctaMain.type !== 'COMPONENT') throw new Error(`CTA introuvable : ${CTA_ID}`);

const probe = figma.createText();
const fonts = [probe.fontName, S['Ad/Hook'].fontName, S['Ad/Sous-titre'].fontName, S['Ad/Preuve'].fontName];
probe.remove();
await Promise.all([...new Map(fonts.map(f => [JSON.stringify(f), f])).values()].map(f => figma.loadFontAsync(f)));

let maxX = 0;
for (const c of page.children) maxX = Math.max(maxX, c.x + c.width);

// Cadre = composant de la variante. resize() AVANT les modes de dimensionnement.
const comp = figma.createComponent();
comp.name = variantName;
comp.layoutMode = 'VERTICAL';
comp.resize(spec.w, spec.h);
comp.primaryAxisSizingMode = 'FIXED';
comp.counterAxisSizingMode = 'FIXED';
comp.primaryAxisAlignItems = 'SPACE_BETWEEN';
comp.counterAxisAlignItems = 'MIN';
comp.clipsContent = true;
comp.fills = [paint('color/bg')];
comp.setBoundVariable('paddingTop', need(spec.pad.top));
comp.setBoundVariable('paddingBottom', need(spec.pad.bottom));
comp.setBoundVariable('paddingLeft', need(spec.pad.left));
comp.setBoundVariable('paddingRight', need(spec.pad.right));
comp.x = maxX + 200;
comp.y = 400;
const contentW = spec.w - num(spec.pad.left) - num(spec.pad.right);

// Visuel : seul calque absolu, sous tout le reste (premier enfant = plus bas).
const visuel = figma.createRectangle();
visuel.name = 'Visuel';
comp.appendChild(visuel);
visuel.layoutPositioning = 'ABSOLUTE';
visuel.x = 0;
visuel.y = 0;
visuel.resize(spec.w, spec.h);
visuel.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
visuel.fills = [paint('color/surface')];

function group(name, dir, gapVar) {
  const g = figma.createAutoLayout(dir, { name });
  g.fills = [];
  comp.appendChild(g);
  g.layoutSizingHorizontal = 'FILL';
  g.layoutSizingVertical = 'HUG';
  g.counterAxisAlignItems = dir === 'HORIZONTAL' ? 'CENTER' : 'MIN';
  if (gapVar) g.setBoundVariable('itemSpacing', need(gapVar));
  return g;
}

const warnings = [];
async function text(parent, name, styleName, colorVar, chars) {
  const t = figma.createText();
  t.name = name;
  parent.appendChild(t);
  await t.setTextStyleIdAsync(S[styleName].id);
  t.textAutoResize = 'HEIGHT';
  t.layoutSizingHorizontal = 'FILL';
  t.characters = chars;
  t.fills = [paint(colorVar)];
  if (t.width < 10) {
    // Filet de sécurité documenté dans figma-use : largeur fixe explicite si FILL n'a pas pris.
    t.layoutSizingHorizontal = 'FIXED';
    t.resize(contentW, t.height);
    warnings.push(`${name} : FILL non appliqué, largeur fixée à ${contentW}px`);
  }
  return t;
}

const header = group('Header', 'HORIZONTAL', null);
const logo = logoMain.createInstance();
logo.name = 'Logo';
header.appendChild(logo);

const texte = group('Texte', 'VERTICAL', 'space/md');
const hook = await text(texte, 'Hook', 'Ad/Hook', 'color/text', 'Accroche principale, une seule idée, lisible en une seconde');
const sous = await text(texte, 'Sous-titre', 'Ad/Sous-titre', 'color/text', 'La réponse ou le bénéfice, en une phrase');

const footer = group('Footer', 'VERTICAL', 'space/sm');
const preuve = await text(footer, 'Preuve', 'Ad/Preuve', 'color/text-muted', 'Preuve : un chiffre vérifiable ou une source');
const cta = ctaMain.createInstance();
cta.name = 'CTA';
footer.appendChild(cta);

return {
  variantId: comp.id,
  nodeIds: {
    visuel: visuel.id,
    header: header.id,
    logo: logo.id,
    texte: texte.id,
    hook: hook.id,
    sousTitre: sous.id,
    footer: footer.id,
    preuve: preuve.id,
    cta: cta.id,
  },
  createdNodeIds: [comp.id, visuel.id, header.id, logo.id, texte.id, hook.id, sous.id, footer.id, preuve.id, cta.id],
  widths: { hook: Math.round(hook.width), sousTitre: Math.round(sous.width), preuve: Math.round(preuve.width), attendu: contentW },
  warnings,
};
