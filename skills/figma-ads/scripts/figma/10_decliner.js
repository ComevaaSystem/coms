// Décline les gabarits d'un client (cadres faits par un DA ou retouchés à la main) en concepts
// neufs sur une page campagne, puis ÉPROUVE ce qu'il vient de poser. Un appel, un rapport : ce qui
// se voyait sur capture et se corrigeait en trois tours (texte qui chevauche, sous-titre collé à la
// barre, mot coupé, orphelin, trou au milieu) est ici un constat avec son code.
//
// Paramètres (remplis par preparer_declinaison.py, jamais à la main) :
//   __PAGE__      nom de la page campagne (créée si absente)
//   __SOURCES__   { genre: ["idCarré", "idStory"] } : les cadres gabarits du client
//   __CONCEPTS__  [{ genre, libelle, gris, copie }] dans l'ordre de la page ; `gris` (« debut » ou
//                 « fin ») dit où est la partie grise d'un titre en deux tons, absent sinon
//   __CTA__       texte du bouton (celui de la barre, ou le libellé du bouton du pied)
//   __REGLES__    { ecartMin, trouMax, zoneStory: [haut, bas], ecraser, apostrophe?, insecables? }
//                 `insecables` : les expressions qui ne se coupent jamais en fin de ligne (le nom
//                 de la marque, d'un produit), reliées par une espace insécable.
//
// Les calques se trouvent par NOM, selon la convention de references/gabarits.md. Trois anatomies :
// - la BARRE : étiquette, titre, sous-titre, barre (et son bouton), puis selon le genre chiffre /
//   promesse, conversation (rangée > bulle > message) ou quiz (question + une rangée par option).
//   Un calque absent n'est pas une erreur : le Full Text n'a pas de chiffre.
// - le PIED : titre en deux tons, puis un champ (texte à préfixe fixe) ou des pastilles, avec un
//   personnage facultatif ; en bas, un aplat `pied` à côté duquel sont posés le sous-titre, le
//   bouton (libelle) et le logo. Un cadre qui a un calque « pied » suit cette anatomie.
// - le PIED CONTENANT : le même pied, mais en auto layout et qui CONTIENT bouton > libelle,
//   sous-titre et logo. Full Text : étiquette, titre en deux tons, promesse. SMS : titre en deux
//   tons, conversation à rangées nommées « rangée ». Champ et Pastilles y gardent l'anatomie du
//   pied : leurs pièces se cherchent dans le cadre, puis dans le pied.
const PAGE_NAME = __PAGE__;
const SOURCES = __SOURCES__;
const CONCEPTS = __CONCEPTS__;
const CTA = __CTA__;
const R = __REGLES__;

const echapper = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const INSECABLES = (R.insecables || []).length
  ? new RegExp((R.insecables || []).map(echapper).join('|'), 'g')
  : /(?!)/g;
const nb = s => s
  .replace(/ ([?:!;»])/g, '\u00A0$1').replace(/« /g, '«\u00A0')
  .replace(/(\d) (?=\S)/g, '$1\u00A0')
  .replace(INSECABLES, m => m.replace(/ /g, '\u00A0'));

let page = figma.root.children.find(p => p.name === PAGE_NAME);
if (!page) { page = figma.createPage(); page.name = PAGE_NAME; }
await figma.setCurrentPageAsync(page);

const child = (fr, name) => fr.children.find(n => n.name === name);
const box = b => Array.isArray(b)
  ? { top: Math.min(...b.map(n => n.y)), bottom: Math.max(...b.map(n => n.y + n.height)) }
  : { top: b.y, bottom: b.y + b.height };
const moveTo = (b, y) => { const d = y - box(b).top; (Array.isArray(b) ? b : [b]).forEach(n => { n.y += d; }); };
const setText = (t, s) => { t.characters = nb(s); };
async function loadFonts(node) {
  const fs = new Set();
  node.findAllWithCriteria({ types: ['TEXT'] }).forEach(t => t.getStyledTextSegments(['fontName']).forEach(s => fs.add(JSON.stringify(s.fontName))));
  for (const f of fs) await figma.loadFontAsync(JSON.parse(f));
}
// Ajuste le nombre d'enfants d'un bloc à la copie : on clone le dernier, on retire le surplus.
function ajuster(parent, rows, n) {
  while (rows.length < n) { const c = rows[rows.length - 1].clone(); parent.appendChild(c); rows.push(c); }
  while (rows.length > n) rows.pop().remove();
  return rows;
}

// --- L'épreuve, mesurée sur des clones jetables : le texte réel ne bouge pas.
function lignes(t) {
  const lh = t.lineHeight;
  const px = lh.unit === 'PIXELS' ? lh.value : lh.unit === 'PERCENT' ? t.fontSize * lh.value / 100 : t.fontSize * 1.2;
  return Math.max(1, Math.round(t.height / px));
}
function mesurer(t, chars, auto) {
  const c = t.clone(); page.appendChild(c);
  if (auto) c.textAutoResize = 'WIDTH_AND_HEIGHT';
  c.characters = chars;
  const r = { w: c.width, h: c.height, lignes: lignes(c) };
  c.remove();
  return r;
}
function eprouverTexte(t, qui, constats) {
  if (t.textAutoResize === 'WIDTH_AND_HEIGHT' || !t.characters.trim()) return;
  // Un groupe insécable (mots liés par des espaces insécables) plus large que la boîte se coupe AU MILIEU.
  const blocs = t.characters.split(/[ \n-]+/).filter(Boolean);
  const plusLong = blocs.reduce((a, b) => (b.length > a.length ? b : a), '');
  const w = mesurer(t, plusLong, true).w;
  if (w > t.width + 1) constats.push({ code: 'MOT_COUPE', niveau: 'bloquant', qui, detail: `« ${plusLong.replace(/\u00A0/g, ' ')} » fait ${Math.round(w)} px pour ${Math.round(t.width)}` });
  // Orphelin : retirer le dernier mot fait perdre une ligne, donc il était seul sur la sienne. Un mot
  // long seul en bas d'un titre de trois lignes est voulu (« TORRÉFACTION. ») ; ce qui ne l'est
  // jamais, c'est une ligne de trois caractères ou moins : « à », « de », un « ? » détaché.
  const mots = t.characters.split(' ');
  if (mots.length > 2 && lignes(t) > 1 && mots[mots.length - 1].length <= 3) {
    const sans = mesurer(t, mots.slice(0, -1).join(' '), false);
    if (sans.lignes < lignes(t)) constats.push({ code: 'ORPHELIN', niveau: 'bloquant', qui, detail: `« ${mots[mots.length - 1]} » seul sur sa ligne` });
  }
}

// --- La barre : étiquette en haut, barre en bas, le contenu CENTRÉ entre les deux.
function declinerBarre(fr, genre, c, f, nom, constats) {
  const etiq = child(fr, 'étiquette'), titre = child(fr, 'titre'), sous = child(fr, 'sous-titre'), barre = child(fr, 'barre');
  setText(etiq.findOne(n => n.type === 'TEXT'), c.etiquette);
  const cta = barre.findOne(n => n.type === 'TEXT' && n.parent.name === 'bouton');
  setText(cta, CTA); cta.name = CTA;

  // Les blocs dans l'ordre vertical du GABARIT, et ses gouttières : c'est le rythme que le DA a posé.
  let corps;
  const chiffre = child(fr, 'chiffre'), promesse = child(fr, 'promesse');
  const conv = child(fr, 'conversation'), quiz = child(fr, 'quiz');
  if (genre === 'full' || genre === 'chiffres') {
    if (c.chiffre && chiffre) { setText(chiffre, c.chiffre); corps = [[chiffre, titre]]; }
    else { if (chiffre) chiffre.remove(); corps = [titre]; }
    corps.push(promesse);
  } else if (conv) {
    corps = [titre, conv];
  } else if (quiz) {
    corps = [titre, quiz];
  } else throw new Error(`Gabarit ${genre} sans bloc reconnu`);
  const blocs0 = [etiq, ...corps, sous];
  const gouttieres = blocs0.slice(1).map((b, j) => box(b).top - box(blocs0[j]).bottom);
  gouttieres.push(barre.y - box(sous).bottom);

  setText(titre, c.titre);
  if (promesse && c.promesse) setText(promesse, c.promesse);
  setText(sous, c.sous);
  if (Array.isArray(corps[0]) && chiffre) titre.y = chiffre.y + (chiffre.height - titre.height) / 2;
  if (conv) {
    const rows = ajuster(conv, conv.children.slice(), c.bulles.length);
    const larges = conv.findAll(n => n.name === 'message').map(n => n.width);
    const large = Math.max(...larges);
    c.bulles.forEach((txt, j) => {
      const t = rows[j].findOne(n => n.name === 'message');
      setText(t, txt);
      t.textAutoResize = 'WIDTH_AND_HEIGHT';
      if (t.width > large) { t.textAutoResize = 'NONE'; t.resize(large, t.height); t.textAutoResize = 'HEIGHT'; }
    });
  }
  if (quiz) {
    setText(child(quiz, 'question'), c.question);
    const opts = ajuster(quiz, quiz.children.filter(n => n.type === 'FRAME'), c.options.length);
    c.options.forEach((o, j) => { const t = opts[j].findOne(n => n.type === 'TEXT'); setText(t, o); t.name = o; });
  }

  // Placement : les gouttières du gabarit, un plancher entre le titre et ce qui suit, puis le bloc
  // CENTRÉ dans la hauteur libre plutôt que tassé sous l'étiquette.
  const blocs = [etiq, ...corps, sous];
  const g = gouttieres.slice();
  g[1] = Math.max(g[1], R.ecartMin);
  const haut = box(etiq).bottom, place = barre.y - haut;
  const besoin = blocs.slice(1).reduce((s, b) => s + box(b).bottom - box(b).top, 0);
  const somme = g.reduce((a, b) => a + b, 0);
  // Trop long : chaque gouttière rend ce qu'elle a AU-DESSUS de son plancher, au prorata. L'écart
  // titre → corps ne descend jamais sous ecartMin, les autres jamais sous 16.
  const plancher = g.map((v, j) => (j === 1 ? R.ecartMin : Math.min(v, 16)));
  let marge = 0;
  const exces = besoin + somme - place;
  if (exces > 0) {
    const cedable = g.reduce((s, v, j) => s + v - plancher[j], 0);
    const part = cedable > 0 ? Math.min(1, exces / cedable) : 0;
    for (let j = 0; j < g.length; j++) g[j] -= (g[j] - plancher[j]) * part;
  } else marge = -exces / 2;
  let y = haut + marge;
  for (let j = 1; j < blocs.length; j++) { y += g[j - 1]; moveTo(blocs[j], y); y = box(blocs[j]).bottom; }

  // --- Épreuve.
  const bas = y + g[g.length - 1];
  if (bas > barre.y + 1) constats.push({ code: 'DEBORDE', niveau: 'bloquant', qui: 'sous-titre', detail: `${Math.round(bas - barre.y)} px sous la barre` });
  for (let j = 1; j < blocs.length; j++) {
    const e = box(blocs[j]).top - box(blocs[j - 1]).bottom;
    if (j === 2 && e < R.ecartMin - 1) constats.push({ code: 'ECART_SERRE', niveau: 'bloquant', qui: `bloc ${j}`, detail: `${Math.round(e)} px (min ${R.ecartMin})` });
    if (j > 1 && e > R.trouMax) constats.push({ code: 'TROU', niveau: 'alerte', qui: `bloc ${j}`, detail: `${Math.round(e)} px au milieu du cadre` });
  }
  if (f && (box(etiq).top < R.zoneStory[0] || barre.y + barre.height > R.zoneStory[1])) constats.push({ code: 'HORS_ZONE_SURE', niveau: 'bloquant', qui: nom, detail: `zone ${R.zoneStory[0]} à ${R.zoneStory[1]}` });
  return titre;
}

// --- Le pied : l'aplat, le sous-titre, le bouton et le logo ne bougent pas. Le titre garde son haut ;
// le champ, ou les pastilles (et le personnage), le suivent à la gouttière du gabarit.
//
// La boîte VUE d'un calque, rotation comprise : une pastille penchée de 4° déborde de son x, y, hauteur.
function vue(fr, b) {
  const [[, , ox], [, , oy]] = fr.absoluteTransform;
  const r = (Array.isArray(b) ? b : [b]).map(n => n.absoluteBoundingBox);
  return {
    top: Math.min(...r.map(v => v.y)) - oy, bottom: Math.max(...r.map(v => v.y + v.height)) - oy,
    left: Math.min(...r.map(v => v.x)) - ox, right: Math.max(...r.map(v => v.x + v.width)) - ox,
  };
}
// Réécrit un texte à deux tons : chaque morceau reprend la police, la taille et la couleur d'un
// segment du GABARIT, lus avant la réécriture. Aucune couleur en dur. `nb` garde la longueur.
function ecrireTons(t, morceaux) {
  t.characters = nb(morceaux.map(([s]) => s).join(''));
  let i = 0;
  for (const [s, seg] of morceaux) {
    if (!s.length) continue;
    t.setRangeFontName(i, i + s.length, seg.fontName);
    t.setRangeFontSize(i, i + s.length, seg.fontSize);
    t.setRangeFills(i, i + s.length, seg.fills);
    i += s.length;
  }
}
const segments = t => t.getStyledTextSegments(['fontName', 'fontSize', 'fills']);
// Le titre en deux tons : `gris` vient de gabarits.json, par preparer_declinaison.py. Chaque morceau
// prend le style du segment du gabarit à la même place, le premier ou le dernier.
function ecrireTitre(titre, c, gris) {
  const seg = segments(titre);
  if (gris !== 'debut' && gris !== 'fin') throw new Error(`Titre en deux tons sans « gris » (debut ou fin) : ${gris}`);
  if (seg.length < 2) throw new Error(`Le titre du gabarit n'a qu'un ton : ${titre.characters}`);
  const k = gris === 'debut' ? c.titreGris.length : c.titre.length - c.titreGris.length;
  ecrireTons(titre, [[c.titre.slice(0, k), seg[0]], [c.titre.slice(k), seg[seg.length - 1]]]);
}
// Les pièces du pied : à côté de lui (anatomie pied), ou DANS lui (anatomie pied contenant).
function pieces(fr) {
  const pied = child(fr, 'pied');
  const p = n => child(fr, n) || child(pied, n);
  const bouton = p('bouton');
  return { pied, bouton, sous: p('sous-titre'), logo: p('logo'), libelle: bouton.findOne(n => n.type === 'TEXT') };
}

// --- L'épreuve commune aux cadres à pied. `groupe` est ce qui suit le titre ; `haut`, le premier
// calque du cadre. Le pied et ce qu'il porte ne bougent pas : ce qui est au-dessus s'arrête avant.
// `lignesBouton` est mesuré sur le gabarit avant d'écrire.
function eprouverPied(fr, P, groupe, qui, haut, lignesBouton, f, nom, constats) {
  const G = vue(fr, groupe), B = vue(fr, P.pied), S = vue(fr, P.sous), L = vue(fr, P.logo), Bo = vue(fr, P.bouton);
  const ecart = B.top - G.bottom;
  // Le contact seul est un défaut : un gabarit validé laisse parfois moins de ecartMin au-dessus
  // du pied, et un plancher à ecartMin refuserait le gabarit lui-même.
  if (ecart < 1) constats.push({ code: 'DEBORDE', niveau: 'bloquant', qui, detail: ecart < 0 ? `${Math.round(-ecart)} px sur le pied` : 'touche le pied' });
  else if (ecart > R.trouMax) constats.push({ code: 'TROU', niveau: 'alerte', qui, detail: `${Math.round(ecart)} px au-dessus du pied` });
  // La marge du gabarit, à gauche comme à droite : celle du titre. Un champ, une pastille ou un bouton
  // qui s'allonge ne passe pas à la ligne, il sort du cadre.
  const marge = vue(fr, haut).left;
  if (G.right > fr.width - marge + 1) constats.push({ code: 'DEBORDE', niveau: 'bloquant', qui, detail: `${Math.round(G.right - fr.width + marge)} px dans la marge droite` });
  if (Bo.right > fr.width - marge + 1) constats.push({ code: 'DEBORDE', niveau: 'bloquant', qui: 'bouton', detail: `${Math.round(Bo.right - fr.width + marge)} px dans la marge droite` });
  const sousLogo = L.top - S.bottom;
  if (sousLogo < 1) constats.push({ code: 'DEBORDE', niveau: 'bloquant', qui: 'sous-titre', detail: sousLogo < 0 ? `${Math.round(-sousLogo)} px sur le logo` : 'touche le logo' });
  // Dans un pied en auto layout, un sous-titre plus long pousse le logo vers le bas, jusque hors du pied.
  const fond = Math.max(S.bottom, L.bottom, Bo.bottom);
  if (fond > B.bottom + 1) constats.push({ code: 'DEBORDE', niveau: 'bloquant', qui: 'pied', detail: `${Math.round(fond - B.bottom)} px sous le pied` });
  if (lignes(P.libelle) > lignesBouton) constats.push({ code: 'DEBORDE', niveau: 'bloquant', qui: 'bouton', detail: `${lignes(P.libelle)} lignes dans le bouton, le gabarit en tient ${lignesBouton}` });
  if (f && (vue(fr, haut).top < R.zoneStory[0] || Math.max(fond, G.bottom) > R.zoneStory[1])) constats.push({ code: 'HORS_ZONE_SURE', niveau: 'bloquant', qui: nom, detail: `zone ${R.zoneStory[0]} à ${R.zoneStory[1]}` });
}
// Les quatre coins d'un calque, rotation comprise, dans le repère de la page.
function coins(n) {
  const [[a, c, e], [b, d, f]] = n.absoluteTransform;
  return [[0, 0], [n.width, 0], [n.width, n.height], [0, n.height]].map(([x, y]) => [a * x + c * y + e, b * x + d * y + f]);
}
// De combien deux rectangles tournés s'enfoncent l'un dans l'autre, par les axes séparateurs : la plus
// petite superposition sur les normales de leurs côtés. Négatif, c'est l'écart qui les sépare.
function enfoncement(A, B) {
  let min = Infinity;
  for (const P of [A, B]) for (let i = 0; i < P.length; i++) {
    const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % P.length];
    const l = Math.hypot(x2 - x1, y2 - y1), ax = (y1 - y2) / l, ay = (x2 - x1) / l;
    const pa = A.map(([x, y]) => x * ax + y * ay), pb = B.map(([x, y]) => x * ax + y * ay);
    min = Math.min(min, Math.min(Math.max(...pa), Math.max(...pb)) - Math.max(Math.min(...pa), Math.min(...pb)));
  }
  return min;
}
// Les pastilles penchées se posent en pile d'autocollants : sur un gabarit validé, l'une mord souvent
// de quelques pixels sur sa voisine, et c'est voulu. Les boîtes englobantes, elles, se recouvrent
// largement sur des cadres propres (la rotation les gonfle) : elles ne disent rien. Ce qui ne l'est
// jamais, c'est qu'une pastille couvre le TEXTE d'une autre. D'où la mesure sur les rectangles
// tournés, par les axes séparateurs.
function eprouverPastilles(pastilles, constats) {
  const textes = pastilles.map(b => b.findOne(n => n.type === 'TEXT'));
  for (let i = 0; i < pastilles.length; i++) for (let j = i + 1; j < pastilles.length; j++) {
    const e = Math.max(enfoncement(coins(pastilles[i]), coins(textes[j])), enfoncement(coins(pastilles[j]), coins(textes[i])));
    if (e > 1) constats.push({ code: 'CHEVAUCHE', niveau: 'bloquant', qui: `pastilles ${i + 1} et ${j + 1}`, detail: `« ${textes[i].characters} » et « ${textes[j].characters} » : ${Math.round(e)} px de pastille sur le texte` });
  }
}
// Ce qui est au-dessus du pied se CENTRE entre la marge haute du gabarit et le pied, comme le
// contenu entre l'étiquette et la barre : une copie plus courte que le gabarit laisserait sinon un
// grand vide sous elle. Il ne monte jamais, et l'écart au pied ne descend pas sous ecartMin pour se
// centrer.
function centrer(fr, contenu, pied) {
  const ecart = vue(fr, pied).top - vue(fr, contenu).bottom;
  const d = Math.max(0, Math.min(ecart / 2, ecart - R.ecartMin));
  contenu.forEach(n => { n.y += d; });
}

// --- Le pied : le champ, ou les pastilles (et le personnage), suivent le titre à la gouttière du
// gabarit, puis le tout se centre au-dessus du pied.
function declinerPied(fr, genre, c, gris, f, nom, constats) {
  const titre = child(fr, 'titre'), P = pieces(fr);
  const saisie = child(fr, 'saisie'), personnage = child(fr, 'personnage');
  const pastilles = fr.children.filter(n => n.name === 'pastille');
  if (genre !== 'champ' && genre !== 'pastilles') throw new Error(`Gabarit ${genre} à pied, genre inconnu`);
  if (genre === 'champ' && !saisie) throw new Error(`Gabarit ${genre} sans calque « saisie »`);
  if (genre === 'pastilles' && pastilles.length !== c.pastilles.length) throw new Error(`Gabarit ${genre} : ${c.pastilles.length} pastilles attendues, ${pastilles.length} trouvées`);
  const groupe = genre === 'champ' ? [saisie] : [personnage, ...pastilles].filter(Boolean);

  // Mesuré sur le gabarit, avant d'écrire : la gouttière titre → groupe, et ce que le bouton tient.
  const gouttiere = vue(fr, groupe).top - vue(fr, titre).bottom;
  const lignesBouton = lignes(P.libelle);

  ecrireTitre(titre, c, gris);
  setText(P.sous, c.sous);
  setText(P.libelle, CTA);
  if (genre === 'champ') {
    // Le préfixe fixe est le premier segment du gabarit ; le curseur final, s'il y en a un, le suit.
    const t = saisie.findOne(n => n.type === 'TEXT');
    const segS = segments(t);
    ecrireTons(t, [[segS[0].characters, segS[0]], [c.saisie + (t.characters.endsWith('|') ? '|' : ''), segS[segS.length - 1]]]);
  } else {
    c.pastilles.forEach((b, j) => setText(pastilles[j].findOne(n => n.type === 'TEXT'), b));
  }
  const d = vue(fr, titre).bottom + gouttiere - vue(fr, groupe).top;
  groupe.forEach(n => { n.y += d; });
  centrer(fr, [titre, ...groupe], P.pied);

  eprouverPied(fr, P, groupe, genre === 'champ' ? 'saisie' : 'pastilles', titre, lignesBouton, f, nom, constats);
  if (genre === 'pastilles') eprouverPastilles(pastilles, constats);
  return titre;
}

// --- Le pied contenant : la promesse, ou la conversation, suit le titre à la gouttière du gabarit,
// puis étiquette, titre et corps se centrent au-dessus du pied. Le pied ne bouge pas.
function declinerPiedContenant(fr, genre, c, gris, f, nom, constats) {
  const etiq = child(fr, 'étiquette'), titre = child(fr, 'titre'), P = pieces(fr);
  const corps = genre === 'full' ? child(fr, 'promesse') : child(fr, 'conversation');
  if (!corps) throw new Error(`Gabarit ${genre} à pied contenant sans calque « ${genre === 'full' ? 'promesse' : 'conversation'} »`);
  if (etiq && !c.etiquette) throw new Error(`Gabarit ${genre} : le cadre porte une étiquette, la copie n'en a pas`);
  if (!etiq && c.etiquette) throw new Error(`Gabarit ${genre} : la copie a une étiquette, le cadre n'en porte pas`);

  const gouttiere = vue(fr, corps).top - vue(fr, titre).bottom;
  const lignesBouton = lignes(P.libelle);

  if (etiq) setText(etiq.findOne(n => n.type === 'TEXT'), c.etiquette);
  ecrireTitre(titre, c, gris);
  setText(P.sous, c.sous);
  setText(P.libelle, CTA);
  if (genre === 'full') setText(corps, c.promesse);
  else {
    // Une bulle par rangée, et les deux rangées ne se ressemblent pas (l'une peut porter le personnage) :
    // on ne clone pas, la copie a exactement autant de bulles que le gabarit.
    const rows = corps.children.filter(n => n.name === 'rangée');
    if (rows.length !== c.bulles.length) throw new Error(`Gabarit ${genre} : ${rows.length} bulles, la copie en a ${c.bulles.length}`);
    c.bulles.forEach((txt, j) => {
      const t = rows[j].findOne(n => n.name === 'message');
      // Une bulle courte se resserre sur son texte ; une longue garde la largeur du gabarit et passe à la ligne.
      const large = t.width;
      setText(t, txt);
      t.textAutoResize = 'WIDTH_AND_HEIGHT';
      if (t.width > large) { t.textAutoResize = 'NONE'; t.resize(large, t.height); t.textAutoResize = 'HEIGHT'; }
    });
  }
  corps.y += vue(fr, titre).bottom + gouttiere - vue(fr, corps).top;
  centrer(fr, [etiq, titre, corps].filter(Boolean), P.pied);

  eprouverPied(fr, P, corps, genre === 'full' ? 'promesse' : 'conversation', etiq || titre, lignesBouton, f, nom, constats);
  return titre;
}
const created = [], rapport = [];
for (let i = 0; i < CONCEPTS.length; i++) {
  const { genre, libelle, gris, copie: c } = CONCEPTS[i];
  for (let f = 0; f < 2; f++) {
    const nom = `(Static) ${libelle} ${f ? 'Story' : 'Carré'}`;
    const constats = [];
    const existant = page.children.find(n => n.name === nom);
    // Un cadre déjà sur la page a peut-être été retouché à la main : on ne l'écrase que sur demande.
    if (existant && !R.ecraser) { rapport.push({ nom, id: existant.id, constats: [{ code: 'EXISTE', niveau: 'alerte', qui: nom, detail: 'gardé tel quel (ecraser: false)' }] }); continue; }
    if (existant) existant.remove();

    const src = await figma.getNodeByIdAsync(SOURCES[genre][f]);
    if (!src) throw new Error(`Gabarit ${genre} ${f ? 'story' : 'carré'} introuvable : ${SOURCES[genre][f]}`);
    const fr = src.clone();
    page.appendChild(fr);
    fr.x = i * 1200; fr.y = f ? 1300 : 0;
    fr.name = nom;
    await loadFonts(fr);

    const titre = !child(fr, 'pied') ? declinerBarre(fr, genre, c, f, nom, constats)
      : genre === 'full' || genre === 'sms' ? declinerPiedContenant(fr, genre, c, gris, f, nom, constats)
      : declinerPied(fr, genre, c, gris, f, nom, constats);
    for (const t of fr.findAllWithCriteria({ types: ['TEXT'] })) {
      if (/\n/.test(t.characters)) constats.push({ code: 'SAUT_DE_LIGNE', niveau: 'bloquant', qui: t.name });
      if (/[\u2014\u2013]/.test(t.characters)) constats.push({ code: 'TIRET_LONG', niveau: 'bloquant', qui: t.name });
      // Le gabarit écrit « l’arôme » : une apostrophe droite à côté se voit dès la première ligne.
      if (R.apostrophe && /'/.test(t.characters)) constats.push({ code: 'APOSTROPHE', niveau: 'bloquant', qui: t.name, detail: `apostrophe droite, la charte écrit ${R.apostrophe}` });
      eprouverTexte(t, t.name, constats);
    }
    rapport.push({ nom, id: fr.id, lignesTitre: lignes(titre), constats });
    created.push(fr.id);
  }
}
const bloquants = rapport.flatMap(r => r.constats.filter(c => c.niveau === 'bloquant').map(c => `${r.nom} / ${c.code} / ${c.qui}${c.detail ? ' / ' + c.detail : ''}`));
return { page: page.id, created, bloquants, rapport };
