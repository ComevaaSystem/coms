// 02_tokens.js : crée ou met à jour la collection de variables "Ads" à partir de la charte.
// Paramètres : __BRAND__ (objet JSON, format décrit dans references/template-ad.md)
// Idempotent : relancer avec une nouvelle charte met à jour les valeurs, ne duplique rien.
// Toutes les variables ont des scopes explicites (jamais ALL_SCOPES).

const BRAND = __BRAND__;

const COLOR_SCOPES = {
  bg: ['FRAME_FILL', 'SHAPE_FILL'],
  surface: ['FRAME_FILL', 'SHAPE_FILL'],
  accent: ['FRAME_FILL', 'SHAPE_FILL'],
  text: ['TEXT_FILL'],
  'text-muted': ['TEXT_FILL'],
  'on-accent': ['TEXT_FILL'],
};

// [nom, valeur par défaut, scopes]. BRAND.floats peut surcharger n'importe quelle valeur.
const FLOATS = [
  ['space/sm', 16, ['GAP']],
  ['space/md', 32, ['GAP']],
  ['space/lg', 56, ['GAP']],
  ['radius/cta', 16, ['CORNER_RADIUS']],
  ['cta/pad-x', 40, ['GAP']],
  ['cta/pad-y', 24, ['GAP']],
  ['safe/feed', 100, ['GAP']],
  ['safe/story-top', 270, ['GAP']],
  ['safe/story-bottom', 672, ['GAP']],
  ['safe/story-side', 65, ['GAP']],
];

// Validation AVANT toute écriture : un script qui plante à mi-chemin laisse un fichier à moitié fait.
const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const missing = Object.keys(COLOR_SCOPES).filter(k => !BRAND.colors || !HEX.test(String(BRAND.colors[k] || '')));
if (missing.length) {
  return { error: 'CHARTE_INCOMPLETE', detail: `Couleurs absentes ou invalides : ${missing.join(', ')}` };
}

const toRGBA = h => {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map(c => c + c).join('');
  return { r: parseInt(s.slice(0, 2), 16) / 255, g: parseInt(s.slice(2, 4), 16) / 255, b: parseInt(s.slice(4, 6), 16) / 255, a: 1 };
};

const collections = await figma.variables.getLocalVariableCollectionsAsync();
let coll = collections.find(c => c.name === 'Ads');
if (!coll) {
  coll = figma.variables.createVariableCollection('Ads');
  coll.renameMode(coll.modes[0].modeId, 'Default');
}
const modeId = coll.modes[0].modeId;

const existing = await Promise.all(coll.variableIds.map(id => figma.variables.getVariableByIdAsync(id)));
const byName = Object.fromEntries(existing.filter(Boolean).map(v => [v.name, v]));
const created = [];
const updated = [];

function upsert(name, type, value, scopes) {
  let v = byName[name];
  if (v && v.resolvedType !== type) throw new Error(`La variable ${name} existe déjà en ${v.resolvedType}`);
  if (!v) {
    v = figma.variables.createVariable(name, coll, type);
    created.push(name);
  } else {
    updated.push(name);
  }
  v.scopes = scopes;
  v.setValueForMode(modeId, value);
  return v;
}

for (const [key, scopes] of Object.entries(COLOR_SCOPES)) {
  upsert(`color/${key}`, 'COLOR', toRGBA(BRAND.colors[key]), scopes);
}
for (const [name, def, scopes] of FLOATS) {
  const custom = BRAND.floats && typeof BRAND.floats[name] === 'number' ? BRAND.floats[name] : null;
  upsert(name, 'FLOAT', custom !== null ? custom : def, scopes);
}

return { collectionId: coll.id, modeId, created, updated };
