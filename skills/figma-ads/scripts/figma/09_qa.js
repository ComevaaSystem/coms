// 09_qa.js : épreuve mécanique de la planche, LECTURE SEULE.
// Paramètres : __SECTION_ID__ (id d'une section, ou null pour toute la page "Planche")
// Contrôles : format, paire Carré + Story, zone sûre, débordement, chevauchement, police hors charte,
// saut de ligne forcé, texte placeholder, visuel à fournir, couleur en dur, instance détachée.
// Codes et corrections : references/controle-qualite.md

const SECTION_ID = __SECTION_ID__;

const DIMS = { Feed: [1080, 1350], Story: [1080, 1920], 'Carré': [1080, 1080] };
const PLACEHOLDERS = ['Accroche principale', 'La réponse ou le bénéfice', 'Preuve : un chiffre', 'LOGO MARQUE'];
// Le format est le DERNIER mot, avec ou sans séparateur : « (Static) SMS Carré »
// comme « ORI01_sms - Carré ». Les séparateurs restants sont rognés du concept.
const NAME_RE = /^(.+?)[\s\-\u2013\u2014/·|]*\s(Feed|Story|Carré)$/;
const TOL = 0.5;

const page = figma.root.children.find(p => p.name === 'Planche');
if (!page) throw new Error('Page "Planche" absente');
await figma.setCurrentPageAsync(page);

const scope = SECTION_ID ? await figma.getNodeByIdAsync(SECTION_ID) : page;
if (!scope) throw new Error(`Section introuvable : ${SECTION_ID}`);

const floats = await figma.variables.getLocalVariablesAsync('FLOAT');
const val = (n, d) => {
  const v = floats.find(x => x.name === n);
  const first = v ? Object.values(v.valuesByMode)[0] : null;
  return typeof first === 'number' ? first : d;
};
const feed = val('safe/feed', 100);
const SAFE = {
  Feed: { t: feed, b: feed, l: feed, r: feed },
  'Carré': { t: feed, b: feed, l: feed, r: feed },
  Story: {
    t: val('safe/story-top', 270),
    b: val('safe/story-bottom', 672),
    l: val('safe/story-side', 65),
    r: val('safe/story-side', 65),
  },
};

const styles = await figma.getLocalTextStylesAsync();
const adStyles = styles.filter(s => s.name.startsWith('Ad/'));
const adStyleIds = new Set(adStyles.map(s => s.id));
const charteFamilies = new Set(adStyles.map(s => s.fontName.family));

// Candidats : nœuds de premier niveau d'une section (ou de la page), nommés « <concept> <format> ».
const holders = scope.type === 'SECTION' ? [scope] : [page, ...page.children.filter(n => n.type === 'SECTION')];
const candidates = [];
for (const h of holders) for (const n of h.children) if (n.type === 'INSTANCE' || n.type === 'FRAME') candidates.push(n);

const rect = b => ({ x: b.x, y: b.y, x2: b.x + b.width, y2: b.y + b.height });
const inside = (a, z) => a.x >= z.x - TOL && a.y >= z.y - TOL && a.x2 <= z.x2 + TOL && a.y2 <= z.y2 + TOL;
const overlap = (a, b) => Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y, b.y));

const concepts = {};
const nonReconnus = [];

for (const node of candidates) {
  const m = NAME_RE.exec(node.name);
  if (!m) {
    nonReconnus.push(node.name);
    continue;
  }
  const [, brut, fmt] = m;
  const id = brut.replace(/[\s\-\u2013\u2014/·|]+$/, '');
  const c = (concepts[id] = concepts[id] || { id, formats: [], bloquants: [], alertes: [] });
  c.formats.push(fmt);
  const block = (code, detail) => c.bloquants.push(`${code} (${fmt}) : ${detail}`);
  const warn = (code, detail) => c.alertes.push(`${code} (${fmt}) : ${detail}`);

  const [W, H] = DIMS[fmt];
  if (Math.round(node.width) !== W || Math.round(node.height) !== H) {
    block('FORMAT', `${Math.round(node.width)}x${Math.round(node.height)} au lieu de ${W}x${H}`);
  }
  if (node.type !== 'INSTANCE') warn('DETACHE', "n'est plus une instance du composant Ad");

  const frame = rect(node.absoluteBoundingBox);
  const s = SAFE[fmt];
  const zone = { x: frame.x + s.l, y: frame.y + s.t, x2: frame.x2 - s.r, y2: frame.y2 - s.b };
  const shown = n => {
    for (let p = n; p && p !== node; p = p.parent) if (p.visible === false) return false;
    return true;
  };

  const boxes = [];
  for (const t of node.findAllWithCriteria({ types: ['TEXT'] })) {
    if (!shown(t) || !t.absoluteBoundingBox) continue;
    const r = rect(t.absoluteBoundingBox);
    const chars = t.characters;
    if (/[\n\u2028\u2029]/.test(chars)) block('SAUT_DE_LIGNE', `"${t.name}" contient un retour forcé`);
    if (!chars.trim()) warn('TEXTE_VIDE', `"${t.name}" est vide`);
    if (PLACEHOLDERS.some(p => chars.includes(p))) block('TEXTE_PLACEHOLDER', `"${t.name}" : texte du template non remplacé`);
    if (!inside(r, frame)) block('DEBORDEMENT', `"${t.name}" sort du cadre`);
    else if (!inside(r, zone)) {
      if (fmt === 'Story') block('HORS_ZONE_SURE', `"${t.name}" sort de la zone visible story`);
      else warn('HORS_MARGE', `"${t.name}" entre dans la marge de sécurité feed`);
    }
    const families = [...new Set(t.getStyledTextSegments(['fontName']).map(g => g.fontName.family))];
    const offCharte = families.filter(f => !charteFamilies.has(f));
    if (offCharte.length) block('POLICE_HORS_CHARTE', `"${t.name}" utilise ${offCharte.join(', ')}`);
    else if (t.textStyleId === figma.mixed || !adStyleIds.has(t.textStyleId)) warn('STYLE_DETACHE', `"${t.name}" n'utilise pas un style Ad/*`);
    const bound = t.boundVariables && t.boundVariables.fills && t.boundVariables.fills.length;
    if (!bound) warn('COULEUR_EN_DUR', `"${t.name}" n'est pas lié à une variable de couleur`);
    boxes.push({ name: t.name, r });
  }

  const logo = node.findAllWithCriteria({ types: ['INSTANCE'] }).find(n => n.name === 'Logo');
  if (logo && shown(logo) && logo.absoluteBoundingBox) {
    const lr = rect(logo.absoluteBoundingBox);
    for (const b of boxes) {
      const inLogo = b.r.x >= lr.x - TOL && b.r.x2 <= lr.x2 + TOL && b.r.y >= lr.y - TOL && b.r.y2 <= lr.y2 + TOL;
      if (!inLogo && overlap(b.r, lr) > 4) block('CHEVAUCHEMENT', `"${b.name}" chevauche le logo`);
    }
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (overlap(boxes[i].r, boxes[j].r) > 4) block('CHEVAUCHEMENT', `"${boxes[i].name}" et "${boxes[j].name}"`);
    }
  }

  const visuel = node.findOne(n => n.name === 'Visuel');
  if (visuel && shown(visuel) && 'fills' in visuel && Array.isArray(visuel.fills)) {
    if (!visuel.fills.some(p => p.type === 'IMAGE' || p.type === 'VIDEO')) block('VISUEL_A_FOURNIR', 'placeholder encore en place');
  }
  // En Reels l'interface couvre les 672 px du bas ; en Stories, 380 seulement.
  // Les 292 px du milieu restent visibles : un visuel qui s'arrête à la zone
  // sûre y laisse un trou que personne ne voit avant la mise en ligne.
  if (fmt === 'Story') {
    const couvre = visuel && shown(visuel) && visuel.absoluteBoundingBox
      && rect(visuel.absoluteBoundingBox).y2 >= frame.y2 - 4;
    if (!couvre) warn('BAS_DE_STORY_VIDE', 'rien ne couvre la bande 1248 → 1920, visible sur 292 px en Stories');
  }
}

const result = [];
for (const c of Object.values(concepts)) {
  for (const need of ['Carré', 'Story']) {
    if (!c.formats.includes(need)) c.bloquants.push(`PAIRE_INCOMPLETE : ${need} manquant`);
  }
  result.push({ ...c, lancable: c.bloquants.length === 0 });
}

return {
  perimetre: scope.name,
  total: result.length,
  lancables: result.filter(c => c.lancable).length,
  concepts: result,
  nonReconnus,
};
