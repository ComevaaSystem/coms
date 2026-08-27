// Brand Kit, Figma plugin. Pro version.
//
// Four structural ideas:
// 1. SCOPE: apply to the selection, the current page, or the whole file.
//    Never "everywhere" by accident.
// 2. CATEGORIES: colors, radii, gradients, grain, glass, re-link. Each has
//    its own checkbox. What is not checked is not touched.
// 3. EXCLUSIONS: an element marked "off brand" is detached from variables and
//    ignored by every sweep until re-included. This is what prevents
//    "everything looks the same".
// 4. MULTIPLE BRAND KITS: named kits stored in the file, importable and
//    exportable as JSON. One tool for every client of the Brand offer.
//
// From zero: on an empty file the plugin offers to create the variable
// collection itself, with defaults or from a pasted tokens.json.

const COLL_NAME = "Brand";
const EXCL_KEY = "brandExcluded";
const STORE_KEY = "savedBrandKits";

const COLOR_VARS = {
  accent: "color/accent",
  accentSoft: "color/accent-soft",
  paper: "color/paper",
  paperCard: "color/paper-card",
  paperInset: "color/paper-inset",
  lineFaded: "color/line-faded",
  ink: "color/ink",
  textMuted: "color/text-muted",
  darkSurface: "color/dark/surface",
  darkSurfaceRaised: "color/dark/surface-raised",
  darkBorder: "color/dark/border",
  darkText: "color/dark/text",
  darkTextMuted: "color/dark/text-muted",
  darkAccentText: "color/dark/accent-text"
};
const RADIUS_VARS = { pill: "radius/pill", card: "radius/card", sheet: "radius/sheet" };

const DEFAULTS = {
  colors: {
    accent: "#2B47E8", accentSoft: "#D6DDFB",
    paper: "#F7F5F2", paperCard: "#FCFBF9", paperInset: "#F1F0EB",
    lineFaded: "#B9B5AB", ink: "#141414", textMuted: "#6B6A66",
    darkSurface: "#161615", darkSurfaceRaised: "#1D1D1C", darkBorder: "#2B2B28",
    darkText: "#F1F0EC", darkTextMuted: "#999891", darkAccentText: "#8C9EF5"
  },
  radii: { pill: 999, card: 12, sheet: 18 },
  grain: { light: 5, strong: 12, density: 0.5 },
  blur: 34
};

// ---------- color helpers
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

// From zero: create the collection and every variable it needs.
async function bootstrap(payload) {
  let vm = await getVarMap();
  const coll = vm ? vm.coll : figma.variables.createVariableCollection(COLL_NAME);
  const mode = coll.modes[0].modeId;
  const vars = await figma.variables.getLocalVariablesAsync();
  const byName = {};
  for (const v of vars) if (v.variableCollectionId === coll.id) byName[v.name] = v;
  const src = payload || DEFAULTS;
  let created = 0;
  const ensure = (name, type, value) => {
    let v = byName[name];
    if (!v) { v = figma.variables.createVariable(name, coll, type); created++; }
    v.setValueForMode(mode, value);
  };
  for (const [key, name] of Object.entries(COLOR_VARS)) {
    const c = hex2rgb((src.colors && src.colors[key]) || DEFAULTS.colors[key]);
    ensure(name, "COLOR", c);
  }
  ensure("color/white", "COLOR", WHITE);
  for (const [key, name] of Object.entries(RADIUS_VARS)) {
    const r = (src.radii && typeof src.radii[key] === "number") ? src.radii[key] : DEFAULTS.radii[key];
    ensure(name, "FLOAT", r);
  }
  return { created };
}

async function readState() {
  const vm = await getVarMap();
  let chartes = {};
  try { chartes = JSON.parse(figma.root.getPluginData(STORE_KEY) || "{}"); } catch (e) {}
  if (!vm) return { missing: true, defaults: DEFAULTS, kits: Object.keys(chartes).sort() };
  const colors = {}, radii = {};
  for (const [key, name] of Object.entries(COLOR_VARS)) {
    const v = vm.byName[name];
    if (v) colors[key] = rgb2hex(v.valuesByMode[vm.mode]);
  }
  for (const [key, name] of Object.entries(RADIUS_VARS)) {
    const v = vm.byName[name];
    if (v) radii[key] = v.valuesByMode[vm.mode];
  }
  return { colors, radii, kits: Object.keys(chartes).sort() };
}

// ---------- scope
async function scopeRoots(scope) {
  if (scope === "selection") return [...figma.currentPage.selection];
  if (scope === "page") return [...figma.currentPage.children];
  await figma.loadAllPagesAsync();
  const out = [];
  for (const p of figma.root.children) out.push(...p.children);
  return out;
}

// ---------- sweep engine
// dry=true: count only, write nothing (the Analyze button).
function makeEngine(payload, accent, oldHue, tokens, dry) {
  const st = { grads: 0, noise: 0, blur: 0, relinked: 0, excluded: 0 };
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
        if (ap.gradients && accent) {
          const nb = rebuildGradient(p);
          if (nb) { st.grads++; changed = true; return nb; }
        }
        if (ap.relink && p.type === "SOLID" && !(p.boundVariables && p.boundVariables.color)) {
          for (const tk of tokens) {
            if (near(p.color, tk.c)) {
              st.relinked++; changed = true;
              return dry ? p : figma.variables.setBoundVariableForPaint(p, "color", tk.v);
            }
          }
        }
        return p;
      });
      if (changed && !dry) n[prop] = out;
    }

    if ((ap.grain || ap.glass) && "effects" in n && Array.isArray(n.effects) && n.effects.length) {
      let changed = false;
      const out = n.effects.map((e) => {
        if (ap.grain && e.type === "NOISE") {
          st.noise++; changed = true;
          if (dry) return e;
          const c = JSON.parse(JSON.stringify(e));
          const strong = (e.color && e.color.a > 0.08);
          c.color = Object.assign({}, c.color, { a: (strong ? payload.grain.strong : payload.grain.light) / 100 });
          c.density = payload.grain.density;
          return c;
        }
        if (ap.glass && e.type === "BACKGROUND_BLUR") {
          st.blur++; changed = true;
          if (dry) return e;
          const c = JSON.parse(JSON.stringify(e));
          c.radius = payload.blur;
          return c;
        }
        return e;
      });
      if (changed && !dry) n.effects = out;
    }

    if ("children" in n) for (const c of n.children) visit(c);
  };
  return { visit, st };
}

async function run(payload, dry) {
  const vm = await getVarMap();
  if (!vm) return { error: "No \"" + COLL_NAME + "\" variable collection in this file. Use Initialize first." };
  const ap = payload.apply;

  const oldAccentVar = vm.byName[COLOR_VARS.accent];
  const oldAccent = oldAccentVar ? oldAccentVar.valuesByMode[vm.mode] : null;
  const oldHue = oldAccent ? hue(oldAccent) : -1;
  const accent = hex2rgb(payload.colors.accent) || oldAccent;

  // Variables are global by nature: written only on a real apply, and only
  // when the box is checked.
  let varsWritten = 0;
  if (!dry && ap.colors) {
    for (const [key, name] of Object.entries(COLOR_VARS)) {
      const v = vm.byName[name];
      const c = payload.colors[key] && hex2rgb(payload.colors[key]);
      if (v && c) { v.setValueForMode(vm.mode, c); varsWritten++; }
    }
    // accent-soft derives from the accent, it is never hand-picked:
    // two knobs for the same thing always end up disagreeing
    const softVar = vm.byName[COLOR_VARS.accentSoft];
    if (softVar && accent) softVar.setValueForMode(vm.mode, mix(accent, WHITE, 0.78));
  }
  if (!dry && ap.radii) {
    for (const [key, name] of Object.entries(RADIUS_VARS)) {
      const v = vm.byName[name];
      if (v && typeof payload.radii[key] === "number") { v.setValueForMode(vm.mode, payload.radii[key]); varsWritten++; }
    }
  }

  // token set for re-linking: the TARGET value of each color
  const tokens = [];
  for (const [key, name] of Object.entries(COLOR_VARS)) {
    const v = vm.byName[name];
    const c = payload.colors[key] && hex2rgb(payload.colors[key]);
    if (v) tokens.push({ v, c: c || v.valuesByMode[vm.mode] });
  }

  const roots = await scopeRoots(payload.scope);
  const eng = makeEngine(payload, accent, oldHue, tokens, dry);
  for (const n of roots) eng.visit(n);
  eng.st.vars = varsWritten;
  eng.st.roots = roots.length;
  return eng.st;
}

// ---------- exclusions
function markSelection(flag) {
  const sel = figma.currentPage.selection;
  if (!sel.length) return { error: "Nothing is selected." };
  for (const n of sel) n.setPluginData(EXCL_KEY, flag ? "1" : "");
  if (flag) {
    // detach from variables: an off-brand element follows nothing anymore
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
  return { count: sel.length };
}

// ---------- named kits
function loadStore() {
  try { return JSON.parse(figma.root.getPluginData(STORE_KEY) || "{}"); } catch (e) { return {}; }
}
function saveStore(s) { figma.root.setPluginData(STORE_KEY, JSON.stringify(s)); }

// ---------- exports
function buildTokensJson(p) {
  return JSON.stringify({ name: p.name || "brand-kit", colors: p.colors, radii: p.radii, grain: p.grain, blur: p.blur }, null, 2);
}
function buildCss(p) {
  const c = p.colors, r = p.radii, a = hex2rgb(c.accent);
  return [
    ":root {",
    "  --accent: " + c.accent + ";",
    "  --accent-soft: " + (a ? rgb2hex(mix(a, WHITE, 0.78)) : c.accent) + ";",
    "  --paper: " + c.paper + ";",
    "  --paper-card: " + c.paperCard + ";",
    "  --paper-inset: " + c.paperInset + ";",
    "  --line-faded: " + c.lineFaded + ";",
    "  --ink: " + c.ink + ";",
    "  --text-muted: " + c.textMuted + ";",
    "  --dark-surface: " + c.darkSurface + ";",
    "  --dark-border: " + c.darkBorder + ";",
    "  --dark-text: " + c.darkText + ";",
    "  --radius-pill: " + r.pill + "px;",
    "  --radius-card: " + r.card + "px;",
    "  --radius-sheet: " + r.sheet + "px;",
    "  --grad-cta: linear-gradient(90deg, color-mix(in srgb, var(--accent) 82%, white), color-mix(in srgb, var(--accent) 70%, black));",
    "  --grad-capsule: linear-gradient(90deg, color-mix(in srgb, var(--accent) 12%, white), color-mix(in srgb, var(--accent) 30%, white));",
    "}",
    "",
    "/* grain: SVG feTurbulence overlay, opacity " + (p.grain.strong / 100) + " on capsules, " + (p.grain.light / 100) + " on paper */",
    "/* frosted glass: backdrop-filter: blur(" + p.blur + "px); background: color-mix(in srgb, var(--paper) 90%, transparent); */"
  ].join("\n");
}

// ---------- message loop
figma.showUI(__html__, { width: 360, height: 780, themeColors: true });

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
    } else if (msg.type === "bootstrap") {
      const r = await bootstrap(msg.payload);
      figma.notify("Brand kit initialized: " + r.created + " variable(s) created");
      figma.ui.postMessage({ type: "state", state: await readState() });
    } else if (msg.type === "analyze") {
      const st = await run(msg.payload, true);
      figma.ui.postMessage({ type: "analysis", st });
    } else if (msg.type === "apply") {
      const st = await run(msg.payload, false);
      if (st.error) figma.notify(st.error, { error: true });
      else figma.notify("Applied: " + (st.vars || 0) + " variables, " + st.grads + " gradients, " + st.noise + " grain, " + st.blur + " glass, " + st.relinked + " re-linked");
      figma.ui.postMessage({ type: "applied", st });
    } else if (msg.type === "exclude" || msg.type === "include") {
      const r = markSelection(msg.type === "exclude");
      if (r.error) figma.notify(r.error, { error: true });
      else figma.notify(msg.type === "exclude"
        ? r.count + " element(s) taken off brand (detached from variables)"
        : r.count + " element(s) re-included, check Re-link then Apply");
      pushSelection();
    } else if (msg.type === "kit-save") {
      const store = loadStore();
      store[msg.name] = msg.payload;
      saveStore(store);
      figma.notify("Kit \"" + msg.name + "\" saved");
      figma.ui.postMessage({ type: "state", state: await readState() });
    } else if (msg.type === "kit-load") {
      const store = loadStore();
      const p = store[msg.name];
      if (p) figma.ui.postMessage({ type: "kit", name: msg.name, payload: p });
    } else if (msg.type === "kit-delete") {
      const store = loadStore();
      delete store[msg.name];
      saveStore(store);
      figma.ui.postMessage({ type: "state", state: await readState() });
    } else if (msg.type === "export") {
      figma.ui.postMessage({ type: "files", json: buildTokensJson(msg.payload), css: buildCss(msg.payload) });
    }
  } catch (e) {
    figma.notify("Error: " + e.message, { error: true });
    figma.ui.postMessage({ type: "applied", st: { error: e.message } });
  }
};
