// 01b_inspect_page.js : contenu d'UNE page, LECTURE SEULE.
// Paramètres : __PAGE_ID__ (chaîne, id rendu par 01_inspect.js)
// Un appel par page, tous émis en parallèle dans le même message (règle figma-use : une page par appel).
// Rend : composants et component sets, nœuds de premier niveau, noms des enfants de chaque section
// (c'est là qu'on lit la convention de nommage déjà en place sur une planche).

const PAGE_ID = __PAGE_ID__;

const page = await figma.getNodeByIdAsync(PAGE_ID);
if (!page || page.type !== 'PAGE') throw new Error(`Page introuvable : ${PAGE_ID}`);
await figma.setCurrentPageAsync(page);

const r = n => Math.round(n);
const components = page
  .findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })
  .filter(n => !(n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET'))
  .map(n => ({ id: n.id, name: n.name, type: n.type, w: r(n.width), h: r(n.height) }));

const topLevel = page.children.map(n => ({ id: n.id, name: n.name, type: n.type, w: r(n.width), h: r(n.height) }));

const sections = page.children
  .filter(n => n.type === 'SECTION')
  .map(s => ({
    id: s.id,
    name: s.name,
    childCount: s.children.length,
    childNames: s.children.slice(0, 40).map(c => `${c.name} [${c.type} ${r(c.width)}x${r(c.height)}]`),
  }));

return {
  page: page.name,
  components,
  topLevelCount: topLevel.length,
  topLevel: topLevel.slice(0, 60),
  sections,
};
