// 01_inspect.js : inventaire du fichier, LECTURE SEULE.
// Paramètres : aucun.
// Rend : pages, collections de variables, text styles, paint styles.
// Suite : lancer 01b_inspect_page.js pour chaque page, en parallèle (un appel par page, dans le même message).

const [collections, textStyles, paintStyles] = await Promise.all([
  figma.variables.getLocalVariableCollectionsAsync(),
  figma.getLocalTextStylesAsync(),
  figma.getLocalPaintStylesAsync(),
]);

return {
  pages: figma.root.children.map(p => ({ id: p.id, name: p.name })),
  collections: collections.map(c => ({
    id: c.id,
    name: c.name,
    modes: c.modes.map(m => m.name),
    varCount: c.variableIds.length,
  })),
  textStyles: textStyles.map(s => ({ id: s.id, name: s.name, font: s.fontName, size: s.fontSize })),
  paintStyles: paintStyles.map(s => ({ id: s.id, name: s.name })),
};
