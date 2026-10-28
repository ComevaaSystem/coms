// 06_ad_props.js : ajoute et relie les propriétés de composant sur UNE variante, AVANT combineAsVariants.
// Paramètres :
//   __VARIANT_ID__  id rendu par 05_ad_variant.js
//   __LOGO_ID__     id du composant Logo (valeur par défaut de l'INSTANCE_SWAP)
// Les propriétés portent exactement les mêmes noms sur les 3 variantes : Figma les fusionne à la combinaison.
// Une propriété ajoutée mais non reliée à un calque ne fait rien : chaque clé est reliée ici.

const VARIANT_ID = __VARIANT_ID__;
const LOGO_ID = __LOGO_ID__;

const page = figma.root.children.find(p => p.name === 'Template ads');
if (!page) throw new Error('Page "Template ads" absente');
await figma.setCurrentPageAsync(page);

const comp = await figma.getNodeByIdAsync(VARIANT_ID);
if (!comp || comp.type !== 'COMPONENT') throw new Error(`Variante introuvable : ${VARIANT_ID}`);
if (comp.parent && comp.parent.type === 'COMPONENT_SET') {
  throw new Error('Variante déjà combinée : les propriétés s\'ajoutent avant combineAsVariants');
}
const existingProps = Object.keys(comp.componentPropertyDefinitions).map(k => k.replace(/#[^#]*$/, ''));
if (existingProps.includes('Hook')) return { variantId: comp.id, skipped: true, props: existingProps };

const texts = comp.findAllWithCriteria({ types: ['TEXT'] });
const fonts = [];
for (const t of texts) for (const seg of t.getStyledTextSegments(['fontName'])) fonts.push(seg.fontName);
await Promise.all([...new Map(fonts.map(f => [JSON.stringify(f), f])).values()].map(f => figma.loadFontAsync(f)));

// Recherche limitée aux enfants directs de la variante et de ses groupes (pas dans Logo ni CTA).
const own = [];
for (const c of comp.children) {
  own.push(c);
  if (c.type === 'FRAME') for (const g of c.children) own.push(g);
}
const pick = name => {
  const n = own.find(x => x.name === name);
  if (!n) throw new Error(`Calque absent dans la variante : ${name}`);
  return n;
};
const hook = pick('Hook');
const sous = pick('Sous-titre');
const preuve = pick('Preuve');
const visuel = pick('Visuel');
const logo = pick('Logo');
const cta = pick('CTA');

const k = {};
k.hook = comp.addComponentProperty('Hook', 'TEXT', hook.characters);
hook.componentPropertyReferences = { characters: k.hook };

k.sous = comp.addComponentProperty('Sous-titre', 'TEXT', sous.characters);
k.showSous = comp.addComponentProperty('Afficher sous-titre', 'BOOLEAN', true);
sous.componentPropertyReferences = { characters: k.sous, visible: k.showSous };

k.preuve = comp.addComponentProperty('Preuve', 'TEXT', preuve.characters);
k.showPreuve = comp.addComponentProperty('Afficher preuve', 'BOOLEAN', true);
preuve.componentPropertyReferences = { characters: k.preuve, visible: k.showPreuve };

k.showVisuel = comp.addComponentProperty('Afficher visuel', 'BOOLEAN', true);
visuel.componentPropertyReferences = { visible: k.showVisuel };

k.logo = comp.addComponentProperty('Logo', 'INSTANCE_SWAP', LOGO_ID);
k.showLogo = comp.addComponentProperty('Afficher logo', 'BOOLEAN', true);
logo.componentPropertyReferences = { mainComponent: k.logo, visible: k.showLogo };

k.showCta = comp.addComponentProperty('Afficher CTA', 'BOOLEAN', true);
cta.componentPropertyReferences = { visible: k.showCta };

return { variantId: comp.id, keys: k, mutatedNodeIds: [comp.id, hook.id, sous.id, preuve.id, visuel.id, logo.id, cta.id] };
