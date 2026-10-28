// 07_combine.js : combine les variantes en component set "Ad" et les dispose côte à côte.
// Paramètres : __VARIANT_IDS__ (tableau d'ids rendus par 05, propriétés déjà posées par 06)
// combineAsVariants empile tout en (0,0) : la disposition et le redimensionnement du set sont obligatoires.

const VARIANT_IDS = __VARIANT_IDS__;
const ORDER = ['Format=Carré 1:1', 'Format=Story 9:16', 'Format=Feed 4:5'];

const page = figma.root.children.find(p => p.name === 'Template ads');
if (!page) throw new Error('Page "Template ads" absente');
await figma.setCurrentPageAsync(page);

const existingSet = page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find(s => s.name === 'Ad');
if (existingSet) return { componentSetId: existingSet.id, skipped: true, variants: existingSet.children.map(c => c.name) };

const comps = await Promise.all(VARIANT_IDS.map(id => figma.getNodeByIdAsync(id)));
comps.forEach((c, i) => {
  if (!c || c.type !== 'COMPONENT') throw new Error(`Pas un composant : ${VARIANT_IDS[i]}`);
  if (c.parent && c.parent.type === 'COMPONENT_SET') throw new Error(`Déjà combiné : ${c.name}`);
});

// Les propriétés doivent être identiques partout, sinon le set expose des doublons.
const sig = c => Object.entries(c.componentPropertyDefinitions)
  .map(([k, d]) => `${k.replace(/#[^#]*$/, '')}:${d.type}`)
  .sort()
  .join('|');
const sigs = [...new Set(comps.map(sig))];
if (sigs.length > 1) throw new Error(`Propriétés différentes entre variantes : ${sigs.join(' VS ')}`);

let minX = Infinity;
let minY = Infinity;
for (const c of comps) {
  minX = Math.min(minX, c.x);
  minY = Math.min(minY, c.y);
}

const set = figma.combineAsVariants(comps, page);
set.name = 'Ad';
set.description = "Visuel statique d'ads. Formats en variante, textes et options en propriétés. Ne jamais détacher une instance : tout passe par les propriétés.";

const children = [...set.children].sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));
let x = 80;
for (const c of children) {
  c.x = x;
  c.y = 80;
  x += c.width + 160;
}
let maxX = 0;
let maxY = 0;
for (const c of set.children) {
  maxX = Math.max(maxX, c.x + c.width);
  maxY = Math.max(maxY, c.y + c.height);
}
set.resizeWithoutConstraints(maxX + 80, maxY + 80);
set.x = minX;
set.y = minY;

return {
  componentSetId: set.id,
  variants: set.children.map(c => ({ id: c.id, name: c.name })),
  props: Object.keys(set.componentPropertyDefinitions),
};
