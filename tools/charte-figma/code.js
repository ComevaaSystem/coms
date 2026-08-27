// Charte Comevaa, plugin Figma.
// Pilote la collection de variables "Charte" et tout ce que les variables
// ne savent pas porter : degrades, grains, verre depoli. Un seul geste,
// tout le fichier suit.

const COLL_NAME = "Charte";

// cle UI -> nom de variable Figma
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
const RADIUS_VARS = {
  pilule: "radius/pilule",
  carte: "radius/carte",
  feuille: "radius/feuille"
};

// ---------- couleurs
const hex2rgb = (h) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
};
const rgb2hex = (c) => {
  const b = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
  return "#" + b(c.r) + b(c.g) + b(c.b);
};
const mix = (a, b, t) => ({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });
const WHITE = { r: 1, g: 1, b: 1 }, BLACK = { r: 0, g: 0, b: 0 };
const lum = (c) => 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
const hue = (c) => {
  const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b), d = mx - mn;
  if (d < 0.03) return -1; // gris, pas de teinte
  let h;
  if (mx === c.r) h = ((c.g - c.b) / d) % 6;
  else if (mx === c.g) h = (c.b - c.r) / d + 2;
  else h = (c.r - c.g) / d + 4;
  return ((h * 60) + 360) % 360;
};
const hueDist = (a, b) => {
  if (a < 0 || b < 0) return 999;
  const d = Math.abs(a - b);
  return Math.min(d, 360 - d);
};

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
  if (!vm) return { error: "Collection de variables \"Charte\" introuvable dans ce fichier." };
  const colors = {};
  for (const [key, name] of Object.entries(COLOR_VARS)) {
    const v = vm.byName[name];
    if (v) colors[key] = rgb2hex(v.valuesByMode[vm.mode]);
  }
  const radii = {};
  for (const [key, name] of Object.entries(RADIUS_VARS)) {
    const v = vm.byName[name];
    if (v) radii[key] = v.valuesByMode[vm.mode];
  }
  return { colors, radii };
}

// ---------- balayage des degrades et des grains
// Un degrade "accent" est un degrade dont tous les arrets partagent la teinte
// de l'accent courant. On le recompose depuis le nouvel accent :
//   famille pale  (fonds clairs, capsules) : accent mele au blanc
//   famille foncee (CTA)                   : accent eclairci puis assombri
function rebuildGradient(paint, oldHue, accent) {
  if (paint.type !== "GRADIENT_LINEAR" && paint.type !== "GRADIENT_RADIAL") return null;
  const stops = paint.gradientStops;
  if (!stops || stops.length < 2) return null;
  const allAccent = stops.every((s) => hueDist(hue(s.color), oldHue) < 40);
  if (!allAccent) return null;
  const avg = stops.reduce((a, s) => a + lum(s.color), 0) / stops.length;
  const news = stops.map((s, i) => {
    const t = i / (stops.length - 1);
    let c;
    if (avg >= 0.5) c = mix(accent, WHITE, 0.88 - 0.18 * t);       // pale : 88 % -> 70 % de blanc
    else c = t < 0.5 ? mix(accent, WHITE, 0.18 * (1 - t * 2)) : mix(accent, BLACK, 0.30 * (t * 2 - 1));
    return { position: s.position, color: { r: c.r, g: c.g, b: c.b, a: s.color.a } };
  });
  const clone = JSON.parse(JSON.stringify(paint));
  clone.gradientStops = news;
  return clone;
}

function retuneEffects(node, grain, blur) {
  if (!("effects" in node) || !Array.isArray(node.effects) || !node.effects.length) return false;
  let changed = false;
  const out = node.effects.map((e) => {
    if (e.type === "NOISE") {
      const c = JSON.parse(JSON.stringify(e));
      const strong = (e.color && e.color.a > 0.08);
      c.color = Object.assign({}, c.color, { a: (strong ? grain.fort : grain.leger) / 100 });
      c.density = grain.densite;
      changed = true;
      return c;
    }
    if (e.type === "BACKGROUND_BLUR" && blur > 0) {
      const c = JSON.parse(JSON.stringify(e));
      c.radius = blur;
      changed = true;
      return c;
    }
    return e;
  });
  if (changed) node.effects = out;
  return changed;
}

async function applyAll(payload) {
  const vm = await getVarMap();
  if (!vm) return { error: "Collection \"Charte\" introuvable." };

  const oldAccentVar = vm.byName[COLOR_VARS.accent];
  const oldAccent = oldAccentVar ? oldAccentVar.valuesByMode[vm.mode] : null;
  const oldHue = oldAccent ? hue(oldAccent) : -1;
  const accent = hex2rgb(payload.colors.accent) || oldAccent;

  // 1. les variables : la propagation instantanee
  for (const [key, name] of Object.entries(COLOR_VARS)) {
    const v = vm.byName[name];
    const c = payload.colors[key] && hex2rgb(payload.colors[key]);
    if (v && c) v.setValueForMode(vm.mode, c);
  }
  // le pale se derive de l'accent, il ne se choisit pas a la main
  const paleVar = vm.byName[COLOR_VARS.accentPale];
  if (paleVar && accent) paleVar.setValueForMode(vm.mode, mix(accent, WHITE, 0.78));
  for (const [key, name] of Object.entries(RADIUS_VARS)) {
    const v = vm.byName[name];
    if (v && typeof payload.radii[key] === "number") v.setValueForMode(vm.mode, payload.radii[key]);
  }

  // 2. ce que les variables ne portent pas : degrades, grains, blur
  await figma.loadAllPagesAsync();
  let grads = 0, fx = 0;
  const visit = (n) => {
    if (n.type === "INSTANCE") return; // les maitres portent tout
    for (const prop of ["fills", "strokes"]) {
      const arr = n[prop];
      if (Array.isArray(arr) && arr.length) {
        let changed = false;
        const out = arr.map((p) => {
          const nb = accent ? rebuildGradient(p, oldHue, accent) : null;
          if (nb) { changed = true; grads++; return nb; }
          return p;
        });
        if (changed) n[prop] = out;
      }
    }
    if (retuneEffects(n, payload.grain, payload.blur)) fx++;
    if ("children" in n) for (const c of n.children) visit(c);
  };
  for (const page of figma.root.children) for (const n of page.children) visit(n);

  return { grads, fx };
}

// ---------- exports
function buildTokensJson(state) {
  return JSON.stringify({
    nom: "charte-comevaa",
    couleurs: state.colors,
    radius: state.radii,
    grain: state.grain,
    blur: state.blur
  }, null, 2);
}
function buildCss(state) {
  const c = state.colors, r = state.radii;
  const lines = [
    ":root {",
    "  --accent: " + c.accent + ";",
    "  --accent-pale: " + rgb2hex(mix(hex2rgb(c.accent), WHITE, 0.78)) + ";",
    "  --papier: " + c.papier + ";",
    "  --papier-carte: " + c.papierCarte + ";",
    "  --papier-creux: " + c.papierCreux + ";",
    "  --filet: " + c.filetFane + ";",
    "  --encre: " + c.encre + ";",
    "  --texte-sourd: " + c.texteSourd + ";",
    "  --radius-pilule: " + r.pilule + "px;",
    "  --radius-carte: " + r.carte + "px;",
    "  --radius-feuille: " + r.feuille + "px;",
    "  --grad-cta: linear-gradient(90deg, color-mix(in srgb, var(--accent) 82%, white), color-mix(in srgb, var(--accent) 70%, black));",
    "  --grad-capsule: linear-gradient(90deg, color-mix(in srgb, var(--accent) 12%, white), color-mix(in srgb, var(--accent) 30%, white));",
    "}",
    "",
    "/* grain : un SVG feTurbulence en overlay, opacite " + (state.grain.fort / 100) + " sur les capsules, " + (state.grain.leger / 100) + " sur le papier */",
    "/* verre depoli : backdrop-filter: blur(" + state.blur + "px); background: color-mix(in srgb, var(--papier) 90%, transparent); */"
  ];
  return lines.join("\n");
}

// ---------- boucle de messages
figma.showUI(__html__, { width: 336, height: 700, themeColors: true });

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === "init") {
      figma.ui.postMessage({ type: "state", state: await readState() });
    } else if (msg.type === "apply") {
      const res = await applyAll(msg.payload);
      if (res.error) figma.notify(res.error, { error: true });
      else figma.notify("Charte appliquee : variables, " + res.grads + " degrades, " + res.fx + " effets");
      figma.ui.postMessage({ type: "applied", res });
    } else if (msg.type === "export") {
      figma.ui.postMessage({
        type: "files",
        json: buildTokensJson(msg.payload),
        css: buildCss(msg.payload)
      });
    }
  } catch (e) {
    figma.notify("Erreur : " + e.message, { error: true });
    figma.ui.postMessage({ type: "applied", res: { error: e.message } });
  }
};
