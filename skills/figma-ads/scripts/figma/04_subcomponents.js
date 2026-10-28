// 04_subcomponents.js : crée (ou retrouve) la page "Template ads" et les composants Logo et CTA.
// Paramètres : aucun. Prérequis : 02_tokens.js et 03_text_styles.js.
// Idempotent : si Logo ou CTA existent déjà sur la page, ils sont réutilisés tels quels.

let page = figma.root.children.find(p => p.name === 'Template ads');
const createdNodeIds = [];
if (!page) {
  page = figma.createPage();
  page.name = 'Template ads';
  createdNodeIds.push(page.id);
}
await figma.setCurrentPageAsync(page);

const vars = await figma.variables.getLocalVariablesAsync();
const V = Object.fromEntries(vars.map(v => [v.name, v]));
const need = n => {
  if (!V[n]) throw new Error(`Variable absente : ${n}. Lancer 02_tokens.js.`);
  return V[n];
};
const paint = n => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', need(n));

const styles = await figma.getLocalTextStylesAsync();
const S = Object.fromEntries(styles.map(s => [s.name, s]));
for (const n of ['Ad/CTA', 'Ad/Sous-titre']) {
  if (!S[n]) throw new Error(`Style absent : ${n}. Lancer 03_text_styles.js.`);
}

// Police par défaut des nouveaux textes + polices des styles utilisés.
const probe = figma.createText();
const fonts = [probe.fontName, S['Ad/CTA'].fontName, S['Ad/Sous-titre'].fontName];
probe.remove();
await Promise.all([...new Map(fonts.map(f => [JSON.stringify(f), f])).values()].map(f => figma.loadFontAsync(f)));

let maxX = 0;
for (const c of page.children) maxX = Math.max(maxX, c.x + c.width);

const standalone = page
  .findAllWithCriteria({ types: ['COMPONENT'] })
  .filter(c => !(c.parent && c.parent.type === 'COMPONENT_SET'));
let logo = standalone.find(c => c.name === 'Logo');
let cta = standalone.find(c => c.name === 'CTA');

if (!logo) {
  logo = figma.createComponent();
  logo.name = 'Logo';
  logo.layoutMode = 'HORIZONTAL';
  logo.primaryAxisSizingMode = 'AUTO';
  logo.counterAxisSizingMode = 'AUTO';
  logo.counterAxisAlignItems = 'CENTER';
  logo.fills = [];
  const t = figma.createText();
  t.name = 'Logo placeholder';
  logo.appendChild(t);
  await t.setTextStyleIdAsync(S['Ad/Sous-titre'].id);
  t.characters = 'LOGO MARQUE';
  t.fills = [paint('color/text')];
  logo.description = 'Logo de la marque. Remplacer le contenu par le SVG du logo (hauteur de référence 80 px) : toutes les ads suivent.';
  logo.x = maxX + 200;
  logo.y = 0;
  createdNodeIds.push(logo.id, t.id);
}

if (!cta) {
  cta = figma.createComponent();
  cta.name = 'CTA';
  cta.layoutMode = 'HORIZONTAL';
  cta.primaryAxisSizingMode = 'AUTO';
  cta.counterAxisSizingMode = 'AUTO';
  cta.primaryAxisAlignItems = 'CENTER';
  cta.counterAxisAlignItems = 'CENTER';
  cta.fills = [paint('color/accent')];
  for (const p of ['paddingLeft', 'paddingRight']) cta.setBoundVariable(p, need('cta/pad-x'));
  for (const p of ['paddingTop', 'paddingBottom']) cta.setBoundVariable(p, need('cta/pad-y'));
  for (const r of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) {
    cta.setBoundVariable(r, need('radius/cta'));
  }
  const label = figma.createText();
  label.name = 'Label';
  cta.appendChild(label);
  await label.setTextStyleIdAsync(S['Ad/CTA'].id);
  label.characters = 'En savoir plus';
  label.fills = [paint('color/on-accent')];
  const k = cta.addComponentProperty('Label', 'TEXT', 'En savoir plus');
  label.componentPropertyReferences = { characters: k };
  cta.description = "Bouton d'action dans le visuel. Le libellé passe par la propriété Label, jamais en éditant le texte.";
  cta.x = maxX + 200;
  cta.y = logo.y + logo.height + 80;
  createdNodeIds.push(cta.id, label.id);
}

return { pageId: page.id, logoId: logo.id, ctaId: cta.id, createdNodeIds };
