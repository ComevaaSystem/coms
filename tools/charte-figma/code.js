// Charte Comevaa, plugin Figma. Version pro.
//
// Quatre idees structurantes :
// 1. PORTEE : on applique a la selection, a la page, ou au fichier. Jamais
//    "partout" par accident.
// 2. CATEGORIES : couleurs, radius, degrades, grains, verre, rebranchement.
//    Chaque case se coche separement. Ce qu'on ne coche pas n'est pas touche.
// 3. EXCLUSIONS : un element marque "hors charte" est detache des variables
//    et ignore par tous les balayages, jusqu'a reinclusion. C'est ce qui
//    empeche "tout pareil partout".
// 4. CHARTES MULTIPLES : des chartes nommees, enregistrees dans le fichier,
//    importables et exportables en JSON. L'outil sert tous les clients de
//    l'offre Marque, pas seulement Comevaa.

const COLL_NAME = "Charte";
const EXCL_KEY = "charteExclu";
const STORE_KEY = "chartesEnregistrees";

const COLOR_VARS = {
  accent: "couleur/cobalt",
  accentPale: "couleur/cobalt-pale",
  papier: "couleur/papier",
  papierCarte: "couleur/papier-carte",
  papierCreux: "couleur/papier-creux",
  filetFane: "couleur/filet-fane",
  encre: "couleur/encre",
  texteSourd: "couleur/texte-sourd",
  sombreSurface: "couleur/sombre/surface",
  sombreSurfaceHaute: "couleur/sombre/surface-haute",
  sombreBordure: "couleur/sombre/bordure",
  sombreTexte: "couleur/sombre/texte",
  sombreTexteSourd: "couleur/sombre/texte-sourd",
  sombreAccentTexte: "couleur/sombre/cobalt-texte"
};
const RADIUS_VARS = { pilule: "radius/pilule", carte: "radius/carte", feuille: "radius/feuille" };

// ---------- couleurs
const hex2rgb = (h) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(h).trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
};
const rgb2hex = (c) => {
  const b = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0");
  return "#" + b(c.r) + b(c.g) + b(c.b);
};
const mix = (a, b, t) => ({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });
const WHITE = { r: 1, g: 1, b: 1 }, BLACK = { r: 0, g: 0, b: 0 };
const lum = (c) => 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
const hue = (c) => {
  const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b), d = mx - mn;
  if (d < 0.03) return -1;
  let h;
  if (mx === c.r) h = ((c.g - c.b) / d) % 6;
  else if (mx === c.g) h = (c.b - c.r) / d + 2;
  else h = (c.r - c.g) / d + 4;
  return ((h * 60) + 360) % 360;
};
const hueDist = (a, b) => (a < 0 || b < 0) ? 999 : Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const near = (a, b, tol) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) < (tol || 0.045);

// ---------- variables
async function getVarMap() {
  const colls = await figma.variables.getLocalVariableCollectionsAsync();
  const coll = colls.find((c) => c.name === COLL_NAME);
  if (!coll) return null;
  const vars = await figma.variables.getLocalVariablesAsync();
  const byName = {};
  for (const v of vars) if (v.variableCollectionId === coll.id) byName[v.name] = v;
  return { coll, mode: coll.modes[0].modeId, byName };
}

async function readState() {
  const vm = await getVarMap();
  if (!vm) return { error: "Collection de variables \"" + COLL_NAME + "\" introuvable dans ce fichier." };
  const colors = {}, radii = {};
  for (const [key, name] of Object.entries(COLOR_VARS)) {
    const v = vm.byName[name];
    if (v) colors[key] = rgb2hex(v.valuesByMode[vm.mode]);
  }
  for (const [key, name] of Object.entries(RADIUS_VARS)) {
    const v = vm.byName[name];
    if (v) radii[key] = v.valuesByMode[vm.mode];
  }
  let chartes = {};
  try { chartes = JSON.parse(figma.root.getPluginData(STORE_KEY) || "{}"); } catch (e) {}
  return { colors, radii, chartes: Object.keys(chartes).sort() };
}

// ---------- portee
async function scopeRoots(scope) {
  if (scope === "selection") return [...figma.currentPage.selection];
  if (scope === "page") return [...figma.currentPage.children];
  await figma.loadAllPagesAsync();
  const out = [];
  for (const p of figma.root.children) out.push(...p.children);
  return out;
}

// ---------- moteur de balayage
// mute=true : on compte sans rien ecrire (le bouton Analyser).
function makeEngine(payload, accent, oldHue, tokens, mute) {
  const st = { grads: 0, noise: 0, blur: 0, rebound: 0, radius: 0, excluded: 0 };
  const ap = payload.apply;

  const rebuildGradient = (paint) => {
    if (paint.type !== "GRADIENT_LINEAR" && paint.type !== "GRADIENT_RADIAL") return null;
    const stops = paint.gradientStops;
    if (!stops || stops.length < 2) return null;
    if (!stops.every((s) => hueDist(hue(s.color), oldHue) < 40)) return null;
    const avg = stops.reduce((a, s) => a + lum(s.color), 0) / stops.length;
    const news = stops.map((s, i) => {
      const t = i / (stops.length - 1);
      const c = avg >= 0.5
        ? mix(accent, WHITE, 0.88 - 0.18 * t)
        : (t < 0.5 ? mix(accent, WHITE, 0.18 * (1 - t * 2)) : mix(accent, BLACK, 0.30 * (t * 2 - 1)));
      return { position: s.position, color: { r: c.r, g: c.g, b: c.b, a: s.color.a } };
    });
    const clone = JSON.parse(JSON.stringify(paint));
    clone.gradientStops = news;
    return clone;
  };

  const visit = (n) => {
    if (n.getPluginData && n.getPluginData(EXCL_KEY) === "1") { st.excluded++; return; }
    if (n.type === "INSTANCE") return;

    for (const prop of ["fills", "strokes"]) {
      const arr = n[prop];
      if (!Array.isArray(arr) || !arr.length) continue;
      let changed = false;
      const out = arr.map((p) => {
        if (ap.degrades && accent) {
          const nb = rebuildGradient(p);
          if (nb) { st.grads++; changed = true; return nb; }
        }
        if (ap.rebrancher && p.type === "SOLID" && !(p.boundVariables && p.boundVariables.color)) {
          for (const tk of tokens) {
            if (near(p.color, tk.c)) {
              st.rebound++; changed = true;
              return mute ? p : figma.variables.setBoundVariableForPaint(p, "color", tk.v);
            }
          }
        }
        return p;
      });
      if (changed && !mute) n[prop] = out;
    }

    if ((ap.grains || ap.verre) && "effects" in n && Array.isArray(n.effects) && n.effects.length) {
      let changed = false;
      const out = n.effects.map((e) => {
        if (ap.grains && e.type === "NOISE") {
          st.noise++; changed = true;
          if (mute) return e;
          const c = JSON.parse(JSON.stringify(e));
          const strong = (e.color && e.color.a > 0.08);
          c.color = Object.assign({}, c.color, { a: (strong ? payload.grain.fort : payload.grain.leger) / 100 });
          c.density = payload.grain.densite;
          return c;
        }
        if (ap.verre && e.type === "BACKGROUND_BLUR") {
          st.blur++; changed = true;
          if (mute) return e;
          const c = JSON.parse(JSON.stringify(e));
          c.radius = payload.blur;
          return c;
        }
        return e;
      });
      if (changed && !mute) n.effects = out;
    }

    if ("children" in n) for (const c of n.children) visit(c);
  };
  return { visit, st };
}

async function run(payload, mute) {
  const vm = await getVarMap();
  if (!vm) return { error: "Collection \"" + COLL_NAME + "\" introuvable." };
  const ap = payload.apply;

  const oldAccentVar = vm.byName[COLOR_VARS.accent];
  const oldAccent = oldAccentVar ? oldAccentVar.valuesByMode[vm.mode] : null;
  const oldHue = oldAccent ? hue(oldAccent) : -1;
  const accent = hex2rgb(payload.colors.accent) || oldAccent;

  // Les variables sont globales par nature : elles ne s'ecrivent qu'en
  // application reelle, et seulement si la case est cochee.
  let varsWritten = 0;
  if (!mute && ap.couleurs) {
    for (const [key, name] of Object.entries(COLOR_VARS)) {
      const v = vm.byName[name];
      const c = payload.colors[key] && hex2rgb(payload.colors[key]);
      if (v && c) { v.setValueForMode(vm.mode, c); varsWritten++; }
    }
    const paleVar = vm.byName[COLOR_VARS.accentPale];
    if (paleVar && accent) paleVar.setValueForMode(vm.mode, mix(accent, WHITE, 0.78));
  }
  if (!mute && ap.radius) {
    for (const [key, name] of Object.entries(RADIUS_VARS)) {
      const v = vm.byName[name];
      if (v && typeof payload.radii[key] === "number") { v.setValueForMode(vm.mode, payload.radii[key]); varsWritten++; }
    }
  }

  // jeu de tokens pour le rebranchement : la valeur CIBLE de chaque couleur
  const tokens = [];
  for (const [key, name] of Object.entries(COLOR_VARS)) {
    const v = vm.byName[name];
    const c = payload.colors[key] && hex2rgb(payload.colors[key]);
    if (v && c) tokens.push({ v, c });
    else if (v) tokens.push({ v, c: v.valuesByMode[vm.mode] });
  }

  const roots = await scopeRoots(payload.scope);
  const eng = makeEngine(payload, accent, oldHue, tokens, mute);
  for (const n of roots) eng.visit(n);
  eng.st.vars = varsWritten;
  eng.st.roots = roots.length;
  return eng.st;
}

// ---------- exclusions
function markSelection(flag) {
  const sel = figma.currentPage.selection;
  if (!sel.length) return { error: "Rien n'est selectionne." };
  let count = 0;
  const walk = (n) => {
    n.setPluginData(EXCL_KEY, flag ? "1" : "");
    count++;
    // On ne marque que la racine : le balayage saute tout le sous-arbre.
  };
  for (const n of sel) walk(n);
  if (flag) {
    // detacher des variables : un element hors charte ne suit plus rien
    const detach = (n) => {
      for (const prop of ["fills", "strokes"]) {
        const arr = n[prop];
        if (Array.isArray(arr) && arr.length) {
          const out = arr.map((p) => {
            const c = JSON.parse(JSON.stringify(p));
            delete c.boundVariables;
            return c;
          });
          try { n[prop] = out; } catch (e) {}
        }
      }
      try {
        for (const corner of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"])
          if (n.boundVariables && n.boundVariables[corner]) n.setBoundVariable(corner, null);
      } catch (e) {}
      if ("children" in n) for (const c of n.children) detach(c);
    };
    for (const n of sel) detach(n);
  }
  return { count };
}

// ---------- chartes nommees
function loadStore() {
  try { return JSON.parse(figma.root.getPluginData(STORE_KEY) || "{}"); } catch (e) { return {}; }
}
function saveStore(s) { figma.root.setPluginData(STORE_KEY, JSON.stringify(s)); }

// ---------- exports
function buildTokensJson(p) {
  return JSON.stringify({ nom: p.nom || "charte", couleurs: p.colors, radius: p.radii, grain: p.grain, blur: p.blur }, null, 2);
}
function buildCss(p) {
  const c = p.colors, r = p.radii, a = hex2rgb(c.accent);
  return [
    ":root {",
    "  --accent: " + c.accent + ";",
    "  --accent-pale: " + (a ? rgb2hex(mix(a, WHITE, 0.78)) : c.accent) + ";",
    "  --papier: " + c.papier + ";",
    "  --papier-carte: " + c.papierCarte + ";",
    "  --papier-creux: " + c.papierCreux + ";",
    "  --filet: " + c.filetFane + ";",
    "  --encre: " + c.encre + ";",
    "  --texte-sourd: " + c.texteSourd + ";",
    "  --sombre-surface: " + c.sombreSurface + ";",
    "  --sombre-bordure: " + c.sombreBordure + ";",
    "  --sombre-texte: " + c.sombreTexte + ";",
    "  --radius-pilule: " + r.pilule + "px;",
    "  --radius-carte: " + r.carte + "px;",
    "  --radius-feuille: " + r.feuille + "px;",
    "  --grad-cta: linear-gradient(90deg, color-mix(in srgb, var(--accent) 82%, white), color-mix(in srgb, var(--accent) 70%, black));",
    "  --grad-capsule: linear-gradient(90deg, color-mix(in srgb, var(--accent) 12%, white), color-mix(in srgb, var(--accent) 30%, white));",
    "}",
    "",
    "/* grain : SVG feTurbulence en overlay, opacite " + (p.grain.fort / 100) + " capsules, " + (p.grain.leger / 100) + " papier */",
    "/* verre depoli : backdrop-filter: blur(" + p.blur + "px); background: color-mix(in srgb, var(--papier) 90%, transparent); */"
  ].join("\n");
}

// ---------- boucle de messages
figma.showUI(__html__, { width: 360, height: 760, themeColors: true });

const pushSelection = () => {
  const sel = figma.currentPage.selection;
  let excluded = 0;
  for (const n of sel) if (n.getPluginData(EXCL_KEY) === "1") excluded++;
  figma.ui.postMessage({ type: "selection", count: sel.length, excluded });
};
figma.on("selectionchange", pushSelection);

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === "init") {
      figma.ui.postMessage({ type: "state", state: await readState() });
      pushSelection();
    } else if (msg.type === "analyze") {
      const st = await run(msg.payload, true);
      figma.ui.postMessage({ type: "analysis", st });
    } else if (msg.type === "apply") {
      const st = await run(msg.payload, false);
      if (st.error) figma.notify(st.error, { error: true });
      else figma.notify("Applique : " + (st.vars || 0) + " variables, " + st.grads + " degrades, " + st.noise + " grains, " + st.blur + " verres, " + st.rebound + " rebranches");
      figma.ui.postMessage({ type: "applied", st });
    } else if (msg.type === "exclude" || msg.type === "include") {
      const r = markSelection(msg.type === "exclude");
      if (r.error) figma.notify(r.error, { error: true });
      else figma.notify(msg.type === "exclude"
        ? r.count + " element(s) sortis de la charte (detaches des variables)"
        : r.count + " element(s) reinclus, cochez Rebrancher puis Appliquer");
      pushSelection();
    } else if (msg.type === "charte-save") {
      const store = loadStore();
      store[msg.nom] = msg.payload;
      saveStore(store);
      figma.notify("Charte \"" + msg.nom + "\" enregistree");
      figma.ui.postMessage({ type: "state", state: await readState() });
    } else if (msg.type === "charte-load") {
      const store = loadStore();
      const p = store[msg.nom];
      if (p) figma.ui.postMessage({ type: "charte", nom: msg.nom, payload: p });
    } else if (msg.type === "charte-delete") {
      const store = loadStore();
      delete store[msg.nom];
      saveStore(store);
      figma.ui.postMessage({ type: "state", state: await readState() });
    } else if (msg.type === "export") {
      figma.ui.postMessage({ type: "files", json: buildTokensJson(msg.payload), css: buildCss(msg.payload) });
    }
  } catch (e) {
    figma.notify("Erreur : " + e.message, { error: true });
    figma.ui.postMessage({ type: "applied", st: { error: e.message } });
  }
};
