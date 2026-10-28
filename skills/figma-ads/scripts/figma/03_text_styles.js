// 03_text_styles.js : crée ou met à jour les 5 text styles Ad/* à partir de la charte.
// Paramètres : __BRAND__ (objet JSON, format décrit dans references/template-ad.md)
// Les noms de style de police ne se devinent pas ("Semi Bold" et non "SemiBold") : ce script vérifie
// d'abord que chaque police existe dans le fichier et, sinon, rend la liste des styles disponibles
// SANS rien écrire.

const BRAND = __BRAND__;
const F = BRAND.fonts || {};
const T = BRAND.type || {};

const ROLES = ['display', 'body', 'cta'];
const available = await figma.listAvailableFontsAsync();
const has = f => f && available.some(a => a.fontName.family === f.family && a.fontName.style === f.style);
const missing = ROLES.filter(k => !has(F[k]));
if (missing.length) {
  const families = [...new Set(ROLES.map(k => F[k] && F[k].family).filter(Boolean))];
  return {
    error: 'POLICE_INDISPONIBLE',
    missing: missing.map(k => ({ role: k, font: F[k] || null })),
    stylesDisponibles: Object.fromEntries(
      families.map(fam => [fam, available.filter(a => a.fontName.family === fam).map(a => a.fontName.style)])
    ),
  };
}

const pct = v => ({ value: v, unit: 'PERCENT' });
// [nom, rôle, taille px, interlignage %, approche %]. BRAND.type peut surcharger la taille par nom.
const DEFS = [
  ['Ad/Hook', 'display', 88, 105, -1],
  ['Ad/Sous-titre', 'body', 44, 125, 0],
  ['Ad/Preuve', 'body', 34, 125, 0],
  ['Ad/CTA', 'cta', 36, 100, 0],
  ['Ad/Mentions', 'body', 22, 120, 0],
];

const existing = await figma.getLocalTextStylesAsync();
const byName = Object.fromEntries(existing.map(s => [s.name, s]));

// Charger les nouvelles polices ET celles des styles déjà présents (on les modifie).
const toLoad = ROLES.map(k => F[k]);
for (const [name] of DEFS) if (byName[name]) toLoad.push(byName[name].fontName);
const uniq = [...new Map(toLoad.map(f => [JSON.stringify(f), f])).values()];
await Promise.all(uniq.map(f => figma.loadFontAsync(f)));

const created = [];
const updated = [];
const ids = {};
for (const [name, role, size, lh, ls] of DEFS) {
  let s = byName[name];
  if (!s) {
    s = figma.createTextStyle();
    s.name = name;
    created.push(name);
  } else {
    updated.push(name);
  }
  s.fontName = { family: F[role].family, style: F[role].style };
  s.fontSize = typeof T[name] === 'number' ? T[name] : size;
  s.lineHeight = pct(lh);
  s.letterSpacing = pct(ls);
  ids[name] = s.id;
}

return { created, updated, ids };
