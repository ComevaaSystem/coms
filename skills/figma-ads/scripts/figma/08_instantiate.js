// 08_instantiate.js : pose un lot de concepts (3 max) sur la page "Planche", dans la section de leur axe.
// Paramètres :
//   __AD_SET_ID__   id du component set Ad (rendu par 07)
//   __SECTION__     nom de la section (l'axe), ex. "Origine"
//   __CONCEPTS__    tableau du lot, sortie de build_concepts.py
//   __SCREENSHOT__  true pour rendre une capture de la section en fin de script
// Idempotent : un concept déjà posé (même nom) est mis à jour, pas dupliqué.
// Jamais de detachInstance, jamais d'édition directe des textes : tout passe par setProperties.

const AD_SET_ID = __AD_SET_ID__;
const SECTION = __SECTION__;
const CONCEPTS = __CONCEPTS__;
const SCREENSHOT = __SCREENSHOT__;

const VARIANT_OF = { Feed: 'Feed 4:5', Story: 'Story 9:16', 'Carré': 'Carré 1:1' };
const SLOT_ORDER = ['Carré', 'Story', 'Feed'];
const GAP = 120;

const adSet = await figma.getNodeByIdAsync(AD_SET_ID);
if (!adSet || adSet.type !== 'COMPONENT_SET') throw new Error(`Component set Ad introuvable : ${AD_SET_ID}`);
const variantByFormat = {};
for (const c of adSet.children) {
  const m = /Format=([^,]+)/.exec(c.name);
  if (m) variantByFormat[m[1].trim()] = c;
}

// Polices de tous les textes du template (y compris Logo et CTA imbriqués) : setProperties touche du texte.
const fonts = [];
for (const t of adSet.findAllWithCriteria({ types: ['TEXT'] })) {
  for (const seg of t.getStyledTextSegments(['fontName'])) fonts.push(seg.fontName);
}
await Promise.all([...new Map(fonts.map(f => [JSON.stringify(f), f])).values()].map(f => figma.loadFontAsync(f)));

const createdNodeIds = [];
const mutatedNodeIds = [];
const warnings = [];
const missingProps = new Set();

let page = figma.root.children.find(p => p.name === 'Planche');
if (!page) {
  page = figma.createPage();
  page.name = 'Planche';
  createdNodeIds.push(page.id);
}
await figma.setCurrentPageAsync(page);

let section = page.children.find(n => n.type === 'SECTION' && n.name === SECTION);
if (!section) {
  const below = page.children.length ? Math.max(...page.children.map(n => n.y + n.height)) + 400 : 0;
  section = figma.createSection();
  section.name = SECTION;
  section.x = 0;
  section.y = below;
  createdNodeIds.push(section.id);
}

// Position verticale fixe par format : Carré, puis Story, puis Feed 4:5. Deux concepts ne se chevauchent jamais.
const slotY = {};
let y = GAP;
for (const f of SLOT_ORDER) {
  slotY[f] = y;
  const v = variantByFormat[VARIANT_OF[f]];
  if (v) y += v.height + GAP;
}
const colW = Math.max(...Object.values(variantByFormat).map(v => v.width));

const byName = Object.fromEntries(section.children.map(n => [n.name, n]));
let nextX = GAP;
for (const n of section.children) nextX = Math.max(nextX, n.x + n.width + GAP);

const keysOf = inst => {
  const m = {};
  for (const k of Object.keys(inst.componentProperties)) m[k.replace(/#[^#]*$/, '')] = k;
  return m;
};

for (const c of CONCEPTS) {
  // Les deux formes de nom que 09_qa.js reconnaît : « <id> Carré » et l'ancienne « <id> - Carré ».
  const existingNodes = c.formats.map(f => byName[`${c.id} ${f}`] || byName[`${c.id} - ${f}`]).filter(Boolean);
  const colX = existingNodes.length ? existingNodes[0].x : nextX;
  if (!existingNodes.length) nextX += colW + GAP;

  for (const f of c.formats) {
    // « (Static) SMS Carré » : le format est le dernier mot, c'est sur lui
    // que 09_qa.js apparie le carré et la story.
    const name = `${c.id} ${f}`;
    const variant = variantByFormat[VARIANT_OF[f]];
    if (!variant) {
      warnings.push(`${name} : pas de variante ${VARIANT_OF[f]} dans Ad`);
      continue;
    }
    let inst = byName[name];
    if (inst && inst.type !== 'INSTANCE') {
      warnings.push(`${name} n'est plus une instance (détachée ?) : laissé tel quel`);
      continue;
    }
    if (!inst) {
      inst = variant.createInstance();
      section.appendChild(inst);
      inst.name = name;
      inst.x = colX;
      inst.y = slotY[f];
      createdNodeIds.push(inst.id);
    } else {
      mutatedNodeIds.push(inst.id);
    }

    const K = keysOf(inst);
    const props = {};
    const set = (prop, val) => {
      if (K[prop] === undefined) missingProps.add(prop);
      else props[K[prop]] = val;
    };
    set('Hook', c.hook);
    if (c.sous_titre) set('Sous-titre', c.sous_titre);
    set('Afficher sous-titre', !!c.sous_titre);
    if (c.preuve) set('Preuve', c.preuve);
    set('Afficher preuve', !!c.preuve);
    set('Afficher visuel', c.visuel !== false);
    set('Afficher CTA', !!c.cta);
    inst.setProperties(props);

    if (c.cta) {
      const ctaInst = inst.findAllWithCriteria({ types: ['INSTANCE'] }).find(n => n.name === 'CTA');
      const CK = ctaInst ? keysOf(ctaInst) : {};
      if (CK.Label) ctaInst.setProperties({ [CK.Label]: c.cta });
      else warnings.push(`${name} : libellé CTA non appliqué (propriété Label absente)`);
    }
    inst.exportSettings = [{ format: 'PNG', suffix: '', constraint: { type: 'SCALE', value: 1 } }];
  }
}

let mx = 0;
let my = 0;
for (const n of section.children) {
  mx = Math.max(mx, n.x + n.width);
  my = Math.max(my, n.y + n.height);
}
section.resizeWithoutConstraints(mx + GAP, my + GAP);

if (SCREENSHOT) await section.screenshot();

return {
  pageId: page.id,
  sectionId: section.id,
  createdNodeIds,
  mutatedNodeIds,
  warnings,
  missingProps: [...missingProps],
};
