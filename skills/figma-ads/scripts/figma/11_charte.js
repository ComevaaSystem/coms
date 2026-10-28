// 11_charte.js : pose les pages « Charte » et « Archive » d'un fichier « <Marque> - Statics ».
//
// La planche de références d'une marque neuve : la charte mesurée, et les visuels
// existants posés tels quels. Elle PRÉCÈDE le choix d'une direction, c'est pourquoi
// render.py la rend sans kit validé. Ce script ne mesure rien et n'invente rien :
// il pose ce que DATA lui donne, et un rôle sans valeur s'affiche « à mesurer »
// au lieu d'être rempli.
//
// Les images arrivent AVANT, par upload_assets. Une URL par fichier coûte un
// appel d'outil par image : on envoie donc des PLANCHES, un SVG qui embarque
// ses images (`onboarding_assets.py sheet`). Figma l'importe en un cadre dont
// chaque enfant est un rectangle nommé, rempli de son image. Les logos SVG
// arrivent en arbres vectoriels, par leur nodeId ; un logo PNG arrive en cadre
// rempli d'une image, que ajusterLogo() remet à ses proportions. Le script
// range tout et supprime les planches d'envoi.
//
// DATA = {
//   client, phrase, date,                     // la date du relevé, « JJ/MM/AAAA »
//   enseigne?,                                // groupe multi-enseignes : une page « Charte / <enseigne> »
//   couleurs: [{ role, hex|null, usage }],    // un rôle par ligne (rôles connus : onboarding_kit.py)
//   polices: { titre: {family, style, source}, texte: {family, style, source} },
//   echelle: [{ nom, taille, police }],
//   logos: [{ nodeId, nom, fond, w?, h? }],   // fond : hex du fond ; w, h : pixels d'un logo PNG (manifeste)
//   photos: nodeId | [{ hash, nom }],        // nodeId : une planche SVG importée (voir onboarding_assets.py sheet)
//   elements: nodeId | [{ hash, nom }],
//   regles: [string],                         // règles et interdits relevés, sourcés
//   aMesurer: [string],
//   archive: [{ groupe, lot: nodeId } | { groupe, items: [{ hash, nom, w, h }] }],
//   nettoyer: [nodeId],                       // cadres et planches posés par upload_assets
//   archiveSeule?: bool                       // ne reposer que la page Archive
// }
const DATA = __DATA__;

const INTER = { family: 'Inter', style: 'Regular' };
const INTER_B = { family: 'Inter', style: 'Bold' };
await figma.loadFontAsync(INTER);
await figma.loadFontAsync(INTER_B);
const dispo = await figma.listAvailableFontsAsync();
const existe = (f) => f && dispo.some((x) => x.fontName.family === f.family && x.fontName.style === f.style);
for (const p of Object.values(DATA.polices || {})) if (existe(p)) await figma.loadFontAsync({ family: p.family, style: p.style });

const rgb = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const clair = (h) => { const c = rgb(h); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b > 0.6; };
const GRIS = rgb('#6B6B6B');
const LIGNE = rgb('#E4E4E4');

function texte(chars, { font = INTER, size = 20, color = { r: 0.08, g: 0.08, b: 0.08 }, width = null, name = null } = {}) {
  const t = figma.createText();
  t.fontName = { family: font.family, style: font.style };
  t.fontSize = size;
  t.characters = chars;
  t.fills = [{ type: 'SOLID', color }];
  if (name) t.name = name;
  if (width) { t.textAutoResize = 'HEIGHT'; t.resize(width, t.height); }
  return t;
}
function colonne(name, gap = 24) {
  const f = figma.createAutoLayout('VERTICAL', { name, itemSpacing: gap });
  f.fills = [];
  return f;
}
function rangee(name, gap = 24, wrapW = null) {
  const f = figma.createAutoLayout('HORIZONTAL', { name, itemSpacing: gap });
  f.fills = [];
  // resize() repasse les deux axes en FIXED : la hauteur se rend à AUTO APRÈS.
  if (wrapW) { f.layoutWrap = 'WRAP'; f.counterAxisSpacing = gap; f.resize(wrapW, f.height); f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'AUTO'; }
  return f;
}
const LARGEUR = 1680;
function section(page, titre, y) {
  const s = figma.createAutoLayout('VERTICAL', { name: titre, itemSpacing: 40 });
  s.paddingTop = s.paddingBottom = 72;
  s.paddingLeft = s.paddingRight = 80;
  s.resize(LARGEUR, 100);
  s.counterAxisSizingMode = 'FIXED';
  s.primaryAxisSizingMode = 'AUTO';
  s.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  s.cornerRadius = 24;
  page.appendChild(s);
  s.x = 0;
  s.y = y;
  s.appendChild(texte(titre, { font: INTER_B, size: 44, name: 'Titre de section' }));
  return s;
}
function imageCadre(hash, w, h, nom, mode = 'FILL') {
  const r = figma.createRectangle();
  r.name = nom;
  r.resize(w, h);
  r.cornerRadius = 8;
  r.fills = [{ type: 'IMAGE', imageHash: hash, scaleMode: mode }];
  return r;
}
// Reposer une page la vide, sauf les nœuds gardés (les logos importés, qu'un second passage
// supprimerait avec leur section) : ils remontent à la racine de la page avant le ménage.
async function pageNommee(nom, index, garder = []) {
  let p = figma.root.children.find((x) => x.name === nom);
  if (p) {
    for (const n of garder) { let a = n; while (a && a.type !== 'PAGE') a = a.parent; if (a === p) p.appendChild(n); }
    for (const c of [...p.children]) if (!garder.includes(c)) c.remove();
  }
  else { p = figma.createPage(); p.name = nom; }
  figma.root.insertChild(Math.min(index, figma.root.children.length - 1), p);
  return p;
}

// Les images d'une planche importée : chaque enfant rempli d'une image, dans l'ordre.
async function lot(v) {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  const n = await figma.getNodeByIdAsync(v);
  if (!n || !('children' in n)) return [];
  return n.children
    .filter((c) => 'fills' in c && Array.isArray(c.fills) && c.fills.some((f) => f.type === 'IMAGE'))
    .map((c) => ({ hash: c.fills.find((f) => f.type === 'IMAGE').imageHash, nom: c.name, w: c.width, h: c.height }));
}
// Un SVG exporté d'Illustrator garde son plan de travail : le logo flotte dans 1920 × 1080 de vide.
function serrer(n) {
  if (n.type !== 'FRAME' || !n.children?.length || (n.fills || []).some((f) => f.type === 'IMAGE')) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of n.children) { x0 = Math.min(x0, c.x); y0 = Math.min(y0, c.y); x1 = Math.max(x1, c.x + c.width); y1 = Math.max(y1, c.y + c.height); }
  for (const c of n.children) { c.x -= x0; c.y -= y0; }
  // resize() appliquerait les contraintes des enfants et étirerait le logo.
  n.resizeWithoutConstraints(Math.max(1, x1 - x0), Math.max(1, y1 - y0));
  n.fills = [];
  n.clipsContent = false;
}
// Un PNG envoyé par upload_assets arrive en cadre d'environ 240 × 180 rempli en FILL, quelles
// que soient ses proportions : FILL rogne un logo allongé (un 5:1 perd ses deux bouts), et serrer()
// ne s'y applique pas. Le cadre
// prend les proportions de l'IMAGE, lues dans Figma ou à défaut dans DATA (w, h du manifeste), et
// le remplissage passe en FIT, qui ne rogne jamais, même quand la taille reste illisible.
// Rend false quand l'image n'a pas pu reprendre ses proportions : l'appelant le dit.
async function ajusterLogo(n, l) {
  const img = Array.isArray(n.fills) ? n.fills.find((f) => f.type === 'IMAGE') : null;
  if (!img) {
    serrer(n);
    n.rescale(Math.min(400 / n.width, 180 / n.height));
    return true;
  }
  let t = null;
  try { t = await figma.getImageByHash(img.imageHash)?.getSizeAsync(); } catch { t = null; }
  if (!t?.width || !t?.height) t = l.w && l.h ? { width: l.w, height: l.h } : null;
  // imageTransform n'a de sens qu'en CROP : Figma le refuse sur un FIT.
  const { imageTransform, scalingFactor, rotation, ...reste } = img;
  n.fills = n.fills.map((f) => (f === img ? { ...reste, scaleMode: 'FIT' } : f));
  const [w, h] = t ? [t.width, t.height] : [n.width, n.height];
  const k = Math.min(400 / w, 180 / h);
  n.resize(w * k, h * k);
  return Boolean(t);
}

const cree = [];
const logosSansTaille = [];
const nomCharte = DATA.enseigne ? `Charte / ${DATA.enseigne}` : 'Charte';

if (!DATA.archiveSeule) {
  const gardes = (await Promise.all((DATA.logos || []).map((l) => figma.getNodeByIdAsync(l.nodeId)))).filter(Boolean);
  const page = await pageNommee(nomCharte, 0, gardes);
  page.backgrounds = [{ type: 'SOLID', color: rgb('#F2F2F2') }];
  let y = 0;
  const pousser = (s) => { y += s.height + 64; cree.push(s.id); };

  // Marque
  let s = section(page, 'Marque', y);
  s.appendChild(texte(DATA.enseigne || DATA.client, { font: existe(DATA.polices?.titre) ? DATA.polices.titre : INTER_B, size: 72, name: 'Nom' }));
  s.appendChild(texte(DATA.phrase, { size: 24, width: 1100, color: GRIS, name: 'Phrase' }));
  const logos = rangee('Logos', 32, LARGEUR - 160);
  s.appendChild(logos);
  for (const l of DATA.logos || []) {
    const n = await figma.getNodeByIdAsync(l.nodeId);
    const carte = colonne(`Logo / ${l.nom}`, 12);
    const fond = figma.createFrame();
    fond.name = 'Fond';
    fond.resize(480, 280);
    fond.cornerRadius = 12;
    fond.fills = [{ type: 'SOLID', color: rgb(l.fond || '#FFFFFF') }];
    fond.strokes = [{ type: 'SOLID', color: LIGNE }];
    carte.appendChild(fond);
    if (n) {
      fond.appendChild(n);
      if (!(await ajusterLogo(n, l))) logosSansTaille.push(l.nom);
      n.x = (480 - n.width) / 2;
      n.y = (280 - n.height) / 2;
      n.name = `Logo ${l.nom}`;
    } else {
      fond.appendChild(texte('Logo à récupérer en SVG', { color: GRIS }));
    }
    carte.appendChild(texte(l.nom, { size: 18, color: GRIS }));
    logos.appendChild(carte);
  }
  if (!(DATA.logos || []).length) logos.appendChild(texte('Logo à récupérer en SVG : il se pose en composant et ne se lie jamais aux variables.', { color: GRIS }));
  pousser(s);

  // Couleurs
  s = section(page, 'Couleurs', y);
  const nuancier = rangee('Nuancier', 24, LARGEUR - 160);
  s.appendChild(nuancier);
  for (const c of DATA.couleurs) {
    const carte = colonne(`Couleur / ${c.role}`, 8);
    const pastille = figma.createRectangle();
    pastille.name = c.role;
    pastille.resize(240, 160);
    pastille.cornerRadius = 12;
    if (c.hex) {
      pastille.fills = [{ type: 'SOLID', color: rgb(c.hex) }];
      if (clair(c.hex)) pastille.strokes = [{ type: 'SOLID', color: LIGNE }];
    } else {
      pastille.fills = [];
      pastille.strokes = [{ type: 'SOLID', color: LIGNE }];
      pastille.dashPattern = [8, 8];
    }
    carte.appendChild(pastille);
    carte.appendChild(texte(c.role, { font: INTER_B, size: 20 }));
    carte.appendChild(texte(c.hex || 'à mesurer', { size: 18, color: c.hex ? { r: 0.08, g: 0.08, b: 0.08 } : GRIS }));
    if (c.usage) carte.appendChild(texte(c.usage, { size: 15, color: GRIS, width: 240 }));
    nuancier.appendChild(carte);
  }
  pousser(s);

  // Typographie
  s = section(page, 'Typographie', y);
  for (const [cle, lib] of [['titre', 'Titre'], ['texte', 'Texte']]) {
    const p = DATA.polices?.[cle];
    const bloc = colonne(`Police / ${lib}`, 12);
    bloc.appendChild(texte(lib, { font: INTER_B, size: 20, color: GRIS }));
    if (p && existe(p)) {
      bloc.appendChild(texte(`${p.family} ${p.style}`, { font: p, size: 64 }));
      bloc.appendChild(texte('Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm 0123456789 € % ?!', { font: p, size: 28, width: 1400 }));
    } else if (p) {
      bloc.appendChild(texte(`${p.family} ${p.style}`, { font: INTER_B, size: 40 }));
      bloc.appendChild(texte('Police absente de Figma : à installer avant de fabriquer.', { color: GRIS }));
    } else {
      bloc.appendChild(texte('à mesurer', { size: 40, color: GRIS }));
    }
    if (p?.source) bloc.appendChild(texte(p.source, { size: 15, color: GRIS, width: 1400 }));
    s.appendChild(bloc);
  }
  if ((DATA.echelle || []).length) {
    const e = colonne('Échelle', 8);
    e.appendChild(texte('Échelle relevée', { font: INTER_B, size: 20, color: GRIS }));
    for (const x of DATA.echelle) e.appendChild(texte(`${x.nom}, ${x.police}, ${x.taille} px`, { size: 18 }));
    s.appendChild(e);
  }
  pousser(s);

  // Photos en stock
  s = section(page, 'Photos en stock', y);
  const grille = rangee('Photos', 16, LARGEUR - 160);
  s.appendChild(grille);
  const photos = await lot(DATA.photos);
  for (const p of photos) grille.appendChild(imageCadre(p.hash, 368, 368, p.nom));
  if (!photos.length) grille.appendChild(texte('Aucune photo fournie : à réunir (en couleur, gens qui sourient, lumière claire).', { color: GRIS }));
  pousser(s);

  // Éléments
  s = section(page, 'Éléments', y);
  const el = rangee('Éléments graphiques', 16, LARGEUR - 160);
  s.appendChild(el);
  const elements = await lot(DATA.elements);
  for (const p of elements) el.appendChild(imageCadre(p.hash, 368, 240, p.nom, 'FIT'));
  if (!elements.length) el.appendChild(texte('Aucun élément graphique relevé.', { color: GRIS }));
  if ((DATA.regles || []).length) {
    const r = colonne('Règles', 8);
    r.appendChild(texte('Règles et interdits relevés', { font: INTER_B, size: 20, color: GRIS }));
    for (const x of DATA.regles) r.appendChild(texte(`- ${x}`, { size: 18, width: 1400 }));
    s.appendChild(r);
  }
  if ((DATA.aMesurer || []).length) {
    const r = colonne('À mesurer', 8);
    r.appendChild(texte('À mesurer', { font: INTER_B, size: 20, color: GRIS }));
    for (const x of DATA.aMesurer) r.appendChild(texte(`- ${x}`, { size: 18, width: 1400 }));
    s.appendChild(r);
  }
  s.appendChild(texte(`Relevé le ${DATA.date}. Une valeur « à mesurer » est un trou, pas une valeur par défaut.`, { size: 15, color: GRIS }));
  pousser(s);
}

// Archive
if ((DATA.archive || []).length) {
  const idx = figma.root.children.findIndex((x) => x.name.startsWith('Charte'));
  const nbChartes = figma.root.children.filter((x) => x.name.startsWith('Charte')).length;
  const page = await pageNommee('Archive', Math.max(idx, 0) + nbChartes);
  page.backgrounds = [{ type: 'SOLID', color: rgb('#F2F2F2') }];
  let y = 0;
  for (const g of DATA.archive) {
    const s = section(page, g.groupe, y);
    const grille = rangee('Visuels', 24, LARGEUR - 160);
    s.appendChild(grille);
    for (const it of g.items || (await lot(g.lot))) {
      const w = 360, h = Math.round((360 * it.h) / it.w);
      const carte = colonne(it.nom, 8);
      carte.appendChild(imageCadre(it.hash, w, h, it.nom, 'FIT'));
      carte.appendChild(texte(it.nom, { size: 14, color: GRIS, width: w }));
      grille.appendChild(carte);
    }
    y += s.height + 64;
    cree.push(s.id);
  }
} else if (Array.isArray(DATA.archive)) {
  // Une archive vide se DIT : une page absente ressemble à un oubli.
  const idx = figma.root.children.findIndex((x) => x.name.startsWith('Charte'));
  const nbChartes = figma.root.children.filter((x) => x.name.startsWith('Charte')).length;
  const page = await pageNommee('Archive', Math.max(idx, 0) + nbChartes);
  page.backgrounds = [{ type: 'SOLID', color: rgb('#F2F2F2') }];
  const s = section(page, 'Archive', 0);
  s.appendChild(texte('Aucun visuel existant n’a été fourni pour cette marque.', { size: 20, color: GRIS }));
  cree.push(s.id);
}

// Les cadres d'envoi, et la page vide d'un fichier neuf.
for (const id of DATA.nettoyer || []) { const n = await figma.getNodeByIdAsync(id); if (n && n.type === 'FRAME' && n.parent?.type === 'PAGE') n.remove(); }
const vide = figma.root.children.find((p) => p.name === 'Page 1');
if (vide && figma.root.children.length > 1) {
  await vide.loadAsync();
  await figma.setCurrentPageAsync(figma.root.children.find((p) => p !== vide));
  if (vide.children.length === 0) vide.remove();
}
return { pages: figma.root.children.map((p) => [p.id, p.name]), cree, logosSansTaille, policesAbsentes: Object.values(DATA.polices || {}).filter((p) => p && !existe(p)).map((p) => `${p.family} ${p.style}`) };
