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

// ---------- live mode: one variable written the instant a control moves
async function liveSet(key, value) {
  const vm = await getVarMap();
  if (!vm) return;
  if (COLOR_VARS[key]) {
    const c = hex2rgb(value);
    const v = vm.byName[COLOR_VARS[key]];
    if (v && c) {
      v.setValueForMode(vm.mode, c);
      if (key === "accent") {
        const soft = vm.byName[COLOR_VARS.accentSoft];
        if (soft) soft.setValueForMode(vm.mode, mix(c, WHITE, 0.78));
      }
    }
  } else if (RADIUS_VARS[key]) {
    const v = vm.byName[RADIUS_VARS[key]];
    if (v && typeof value === "number") v.setValueForMode(vm.mode, value);
  }
}

// ---------- starter components (the wizard's Create step)
// Everything is BOUND to the variables, so moving a token later moves every
// generated component instantly. Gradients and grain follow on Apply.
// The library is organized in families; choices.groups says which ones to build.
async function generateStarter(choices) {
  const vm = await getVarMap();
  if (!vm) return { error: "Initialize the brand kit first." };
  const V = (name) => vm.byName[name];
  const val = (name) => V(name) ? V(name).valuesByMode[vm.mode] : { r: 0, g: 0, b: 0 };
  const boundSolid = (name) => figma.variables.setBoundVariableForPaint(
    { type: "SOLID", color: val(name) }, "color", V(name));
  const bindRadius = (node, name) => {
    try {
      node.cornerRadius = val(name);
      for (const c of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"])
        node.setBoundVariable(c, V(name));
    } catch (e) {}
  };
  const grain = choices.grain || { light: 5, strong: 12, density: 0.5 };
  const GRAIN_S = { type: "NOISE", noiseSize: 1, noiseType: "MONOTONE", color: { r: 0, g: 0, b: 0, a: (grain.light || 5) / 100 }, density: grain.density || 0.5, visible: true };
  const GRAIN_B = { type: "NOISE", noiseSize: 1, noiseType: "MONOTONE", color: { r: 0, g: 0, b: 0, a: (grain.strong || 12) / 100 }, density: grain.density || 0.5, visible: true };
  const accent = val(COLOR_VARS.accent);
  const CTA_GRAD = { type: "GRADIENT_LINEAR", gradientTransform: [[1, 0, 0], [0, 1, 0]],
    gradientStops: [
      { position: 0, color: Object.assign({}, mix(accent, WHITE, 0.18), { a: 1 }) },
      { position: 1, color: Object.assign({}, mix(accent, BLACK, 0.30), { a: 1 }) }
    ] };

  const family = choices.font || "Archivo";
  const load = async (style) => { await figma.loadFontAsync({ family, style }); return style; };
  let reg = "Regular", med = "Medium", semi = "SemiBold", light = "Light";
  try { await load("Regular"); } catch (e) { return { error: "Font \"" + family + "\" is not available in Figma." }; }
  try { await load("Medium"); } catch (e) { med = "Regular"; }
  try { await load("SemiBold"); } catch (e) { semi = med; }
  try { await load("Light"); } catch (e) { light = reg; }

  const text = (p, chars, style, size, colorVar, raw) => {
    const t = figma.createText();
    t.fontName = { family, style };
    t.characters = chars;
    t.fontSize = size;
    t.fills = raw ? [{ type: "SOLID", color: raw }] : [boundSolid(colorVar)];
    p.appendChild(t);
    return t;
  };
  const frame = (p, o) => {
    const f = figma.createFrame();
    f.layoutMode = o.mode || "VERTICAL";
    f.itemSpacing = o.gap == null ? 10 : o.gap;
    f.fills = o.fillVar ? [boundSolid(o.fillVar)] : (o.fills || []);
    if (o.strokeVar) { f.strokes = [boundSolid(o.strokeVar)]; f.strokeWeight = o.sw || 1; }
    p.appendChild(f);
    if (p.layoutMode && p.layoutMode !== "NONE") {
      f.layoutSizingHorizontal = o.w || "HUG";
      f.layoutSizingVertical = o.h || "HUG";
    }
    if (o.pad) { f.paddingTop = f.paddingBottom = o.pad[0]; f.paddingLeft = f.paddingRight = o.pad[1]; }
    if (o.align) f.primaryAxisAlignItems = o.align;
    if (o.calign) f.counterAxisAlignItems = o.calign;
    return f;
  };
  const comp = (name, o) => {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = (o && o.mode) || "VERTICAL";
    // A fresh component is 100x100; without AUTO sizing every pill becomes an arch.
    c.primaryAxisSizingMode = "AUTO";
    c.counterAxisSizingMode = "AUTO";
    c.itemSpacing = (o && o.gap != null) ? o.gap : 10;
    if (o && o.fillVar) c.fills = [boundSolid(o.fillVar)]; else if (o && o.fills) c.fills = o.fills; else c.fills = [];
    if (o && o.strokeVar) { c.strokes = [boundSolid(o.strokeVar)]; c.strokeWeight = o.sw || 1; }
    if (o && o.pad) { c.paddingTop = c.paddingBottom = o.pad[0]; c.paddingLeft = c.paddingRight = o.pad[1]; }
    if (o && o.align) c.primaryAxisAlignItems = o.align;
    if (o && o.calign) c.counterAxisAlignItems = o.calign;
    return c;
  };
  const fixW = (c, w) => { c.resize(w, Math.max(c.height, 10)); c.primaryAxisSizingMode = "AUTO"; c.counterAxisSizingMode = "FIXED"; };
  const variants = (comps, setName, page) => {
    const set = figma.combineAsVariants(comps, page);
    set.name = setName;
    set.layoutMode = "HORIZONTAL"; set.itemSpacing = 24;
    set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 24;
    return set;
  };
  const dot = (p, size, colorVar) => {
    const d = figma.createEllipse();
    d.resize(size, size);
    d.fills = [boundSolid(colorVar)];
    p.appendChild(d);
    return d;
  };

  // dedicated page
  let page = figma.root.children.find((p) => p.name === "Brand Kit");
  if (!page) { page = figma.createPage(); page.name = "Brand Kit"; }
  await figma.setCurrentPageAsync(page);

  const made = [];
  const nodes = [];
  let Y = 0;
  const section = (label) => {
    const t = figma.createText();
    t.fontName = { family, style: semi };
    t.characters = label;
    t.fontSize = 20;
    t.fills = [boundSolid(COLOR_VARS.ink)];
    page.appendChild(t);
    t.x = 0; t.y = Y;
    Y += 44;
  };
  let rowX = 0, rowMax = 0;
  const place = (node) => {
    page.appendChild(node);
    node.x = rowX; node.y = Y;
    rowX += node.width + 60;
    rowMax = Math.max(rowMax, node.height);
    made.push(node.name);
    nodes.push(node);
  };
  const endSection = () => { Y += rowMax + 90; rowX = 0; rowMax = 0; };

  const G = choices.groups || {};

  // ============ BASICS ============
  if (G.basics) {
    section("Basics");
    // Button: kind x 3
    const mkBtn = (kind) => {
      const c = comp("kind=" + kind, { mode: "HORIZONTAL", calign: "CENTER", pad: [10, 20] });
      if (kind === "primary") { c.fills = [CTA_GRAD]; c.effects = [GRAIN_B]; }
      else if (kind === "secondary") { c.strokes = [boundSolid(COLOR_VARS.lineFaded)]; c.strokeWeight = 1; }
      bindRadius(c, RADIUS_VARS.pill);
      text(c, "Button", med, 13, kind === "primary" ? null : (kind === "ghost" ? COLOR_VARS.accent : COLOR_VARS.ink), kind === "primary" ? WHITE : null);
      return c;
    };
    place(variants([mkBtn("primary"), mkBtn("secondary"), mkBtn("ghost")], "Button", page));
    // Badge: tone x 2
    const mkBadge = (tone) => {
      const c = comp("tone=" + tone, { mode: "HORIZONTAL", gap: 6, calign: "CENTER", pad: [4, 12] });
      if (tone === "accent") c.fills = [boundSolid(COLOR_VARS.accentSoft)];
      else { c.strokes = [boundSolid(COLOR_VARS.lineFaded)]; c.strokeWeight = 1; }
      bindRadius(c, RADIUS_VARS.pill);
      text(c, "Badge", med, 12, tone === "accent" ? COLOR_VARS.accent : COLOR_VARS.textMuted);
      return c;
    };
    place(variants([mkBadge("accent"), mkBadge("neutral")], "Badge", page));
    // Input
    const input = comp("Input", { gap: 6 });
    fixW(input, 280);
    text(input, "Label", med, 12, COLOR_VARS.ink);
    const ibox = frame(input, { w: "FILL", fillVar: COLOR_VARS.paperCard, strokeVar: COLOR_VARS.lineFaded, pad: [10, 12] });
    bindRadius(ibox, RADIUS_VARS.card);
    text(ibox, "Placeholder", reg, 13, COLOR_VARS.textMuted);
    place(input);
    // Select
    const sel = comp("Select", { gap: 6 });
    fixW(sel, 280);
    text(sel, "Label", med, 12, COLOR_VARS.ink);
    const sbox = frame(sel, { mode: "HORIZONTAL", w: "FILL", fillVar: COLOR_VARS.paperCard, strokeVar: COLOR_VARS.lineFaded, pad: [10, 12], align: "SPACE_BETWEEN", calign: "CENTER" });
    bindRadius(sbox, RADIUS_VARS.card);
    text(sbox, "Choose", reg, 13, COLOR_VARS.ink);
    text(sbox, "v", med, 11, COLOR_VARS.textMuted);
    place(sel);
    // Textarea
    const ta = comp("Textarea", { gap: 6 });
    fixW(ta, 280);
    text(ta, "Label", med, 12, COLOR_VARS.ink);
    const tbox = frame(ta, { w: "FILL", fillVar: COLOR_VARS.paperCard, strokeVar: COLOR_VARS.lineFaded, pad: [10, 12] });
    tbox.resize(tbox.width, 84); tbox.layoutSizingVertical = "FIXED";
    bindRadius(tbox, RADIUS_VARS.card);
    text(tbox, "Longer text", reg, 13, COLOR_VARS.textMuted);
    place(ta);
    // Checkbox: state x 2
    const mkCheck = (on) => {
      const c = comp("state=" + (on ? "checked" : "unchecked"), { mode: "HORIZONTAL", gap: 10, calign: "CENTER" });
      const box = frame(c, { align: "CENTER", calign: "CENTER" });
      box.resize(16, 16); box.primaryAxisSizingMode = "FIXED"; box.counterAxisSizingMode = "FIXED";
      box.cornerRadius = 4;
      if (on) { box.fills = [boundSolid(COLOR_VARS.accent)]; text(box, "x", med, 10, null, WHITE); }
      else { box.strokes = [boundSolid(COLOR_VARS.lineFaded)]; box.strokeWeight = 1.5; }
      text(c, "Checkbox", reg, 13, COLOR_VARS.ink);
      return c;
    };
    place(variants([mkCheck(true), mkCheck(false)], "Checkbox", page));
    // Toggle: state x 2
    const mkToggle = (on) => {
      const c = comp("state=" + (on ? "on" : "off"), { mode: "HORIZONTAL", calign: "CENTER", pad: [2, 2] });
      c.resize(36, 20); c.primaryAxisSizingMode = "FIXED"; c.counterAxisSizingMode = "FIXED";
      c.cornerRadius = 999;
      if (on) { c.fills = [boundSolid(COLOR_VARS.accent)]; c.primaryAxisAlignItems = "MAX"; }
      else { c.fills = [boundSolid(COLOR_VARS.paperInset)]; c.strokes = [boundSolid(COLOR_VARS.lineFaded)]; c.strokeWeight = 1; }
      const knob = figma.createEllipse();
      knob.resize(16, 16);
      knob.fills = [{ type: "SOLID", color: WHITE }];
      c.appendChild(knob);
      return c;
    };
    place(variants([mkToggle(true), mkToggle(false)], "Toggle", page));
    endSection();
  }

  // ============ CARDS ============
  if (G.cards) {
    section("Cards");
    const card = comp("Card", { gap: 10, pad: [22, 22], fillVar: COLOR_VARS.paperCard, strokeVar: COLOR_VARS.lineFaded });
    fixW(card, 300);
    const chip = frame(card, { mode: "HORIZONTAL", pad: [3, 10], strokeVar: COLOR_VARS.lineFaded });
    bindRadius(chip, RADIUS_VARS.pill);
    text(chip, "chip", reg, 11, COLOR_VARS.textMuted);
    text(card, "Card title", med, 15, COLOR_VARS.ink);
    text(card, "Supporting line, muted, one sentence long.", reg, 13, COLOR_VARS.textMuted);
    bindRadius(card, RADIUS_VARS.card);
    place(card);
    // Stat
    const stat = comp("Stat", { gap: 6, pad: [22, 22], fillVar: COLOR_VARS.paperCard, strokeVar: COLOR_VARS.lineFaded });
    fixW(stat, 240);
    bindRadius(stat, RADIUS_VARS.card);
    text(stat, "0 000", light, 40, COLOR_VARS.ink);
    text(stat, "what it counts", reg, 13, COLOR_VARS.textMuted);
    text(stat, "vs last period", reg, 12, COLOR_VARS.accent);
    place(stat);
    // Pricing
    const pr = comp("Pricing", { gap: 12, pad: [26, 26], fillVar: COLOR_VARS.paperCard, strokeVar: COLOR_VARS.lineFaded });
    fixW(pr, 300);
    bindRadius(pr, RADIUS_VARS.sheet);
    text(pr, "Plan name", med, 13, COLOR_VARS.textMuted);
    text(pr, "0 000 / mo", light, 32, COLOR_VARS.ink);
    for (const li of ["First thing included", "Second thing included", "Third thing included"]) {
      const row = frame(pr, { mode: "HORIZONTAL", gap: 8, calign: "CENTER" });
      dot(row, 5, COLOR_VARS.accent);
      text(row, li, reg, 13, COLOR_VARS.ink);
    }
    const pcta = frame(pr, { mode: "HORIZONTAL", w: "FILL", align: "CENTER", pad: [10, 0] });
    pcta.fills = [CTA_GRAD]; pcta.effects = [GRAIN_B];
    bindRadius(pcta, RADIUS_VARS.pill);
    text(pcta, "Choose", med, 13, null, WHITE);
    place(pr);
    // Quote
    const qt = comp("Quote", { gap: 10, pad: [22, 22], fillVar: COLOR_VARS.paperInset });
    fixW(qt, 320);
    bindRadius(qt, RADIUS_VARS.card);
    text(qt, "\"A sentence someone actually said, kept short.\"", reg, 14, COLOR_VARS.ink);
    const qrow = frame(qt, { mode: "HORIZONTAL", gap: 8, calign: "CENTER" });
    dot(qrow, 5, COLOR_VARS.accent);
    text(qrow, "Name, role", reg, 12, COLOR_VARS.textMuted);
    place(qt);
    endSection();
  }

  // ============ NAVIGATION ============
  if (G.navigation) {
    section("Navigation");
    const nav = comp("Nav", { mode: "HORIZONTAL", align: "SPACE_BETWEEN", calign: "CENTER", pad: [12, 0] });
    nav.resize(960, 40); nav.primaryAxisSizingMode = "FIXED"; nav.counterAxisSizingMode = "AUTO";
    const brand = frame(nav, { mode: "HORIZONTAL", gap: 8, calign: "CENTER" });
    const bd = figma.createRectangle();
    bd.resize(18, 18); bd.fills = [boundSolid(COLOR_VARS.accent)];
    brand.appendChild(bd);
    bindRadius(bd, RADIUS_VARS.card);
    text(brand, "yourbrand", semi, 14, COLOR_VARS.ink);
    const links = frame(nav, { mode: "HORIZONTAL", gap: 24, calign: "CENTER" });
    for (const l of ["Product", "Pricing", "About"]) text(links, l, reg, 13, COLOR_VARS.ink);
    const ncta = frame(links, { mode: "HORIZONTAL", pad: [8, 16], calign: "CENTER" });
    ncta.fills = [CTA_GRAD]; ncta.effects = [GRAIN_B];
    bindRadius(ncta, RADIUS_VARS.pill);
    text(ncta, "Get started", med, 13, null, WHITE);
    place(nav);
    // Tabs
    const tabs = comp("Tabs", { mode: "HORIZONTAL", gap: 4, pad: [3, 3], fillVar: COLOR_VARS.paperInset });
    bindRadius(tabs, RADIUS_VARS.pill);
    ["First", "Second", "Third"].forEach((l, i) => {
      const t = frame(tabs, { mode: "HORIZONTAL", pad: [6, 16], calign: "CENTER" });
      if (i === 0) t.fills = [boundSolid(COLOR_VARS.paperCard)];
      bindRadius(t, RADIUS_VARS.pill);
      text(t, l, i === 0 ? semi : reg, 12, i === 0 ? COLOR_VARS.ink : COLOR_VARS.textMuted);
    });
    place(tabs);
    // Breadcrumb
    const bc = comp("Breadcrumb", { mode: "HORIZONTAL", gap: 8, calign: "CENTER" });
    ["Home", "/", "Section", "/", "Page"].forEach((l, i) => {
      text(bc, l, reg, 12, (l === "/") ? COLOR_VARS.lineFaded : (i === 4 ? COLOR_VARS.ink : COLOR_VARS.textMuted));
    });
    place(bc);
    // Pagination
    const pg = comp("Pagination", { mode: "HORIZONTAL", gap: 8, calign: "CENTER" });
    dot(pg, 8, COLOR_VARS.accent);
    dot(pg, 8, COLOR_VARS.lineFaded);
    dot(pg, 8, COLOR_VARS.lineFaded);
    place(pg);
    // Footer
    const ft = comp("Footer", { mode: "HORIZONTAL", align: "SPACE_BETWEEN", pad: [32, 40], fillVar: COLOR_VARS.darkSurface });
    ft.resize(960, 100); ft.primaryAxisSizingMode = "FIXED"; ft.counterAxisSizingMode = "AUTO";
    bindRadius(ft, RADIUS_VARS.sheet);
    const fl = frame(ft, { gap: 10 });
    const fd = figma.createRectangle();
    fd.resize(18, 18); fd.fills = [boundSolid(COLOR_VARS.accent)];
    fl.appendChild(fd);
    bindRadius(fd, RADIUS_VARS.card);
    text(fl, "One line about the brand.", reg, 12, COLOR_VARS.darkTextMuted);
    const fc = frame(ft, { mode: "HORIZONTAL", gap: 48 });
    for (const colName of ["Product", "Resources", "Contact"]) {
      const col = frame(fc, { gap: 8 });
      text(col, colName, med, 12, COLOR_VARS.darkText);
      text(col, "Link one", reg, 12, COLOR_VARS.darkTextMuted);
      text(col, "Link two", reg, 12, COLOR_VARS.darkTextMuted);
    }
    place(ft);
    endSection();
  }

  // ============ OVERLAYS ============
  if (G.overlays) {
    section("Overlays");
    const modal = comp("Modal", { gap: 12, pad: [26, 26] });
    fixW(modal, 380);
    modal.fills = [figma.variables.setBoundVariableForPaint({ type: "SOLID", color: val(COLOR_VARS.paper), opacity: 0.92 }, "color", V(COLOR_VARS.paper))];
    modal.strokes = [{ type: "SOLID", color: WHITE }]; modal.strokeWeight = 1;
    modal.effects = [{ type: "BACKGROUND_BLUR", radius: choices.blur || 34, visible: true }, GRAIN_S,
      { type: "DROP_SHADOW", color: { r: 0.05, g: 0.05, b: 0.05, a: 0.25 }, offset: { x: 0, y: 20 }, radius: 50, spread: -12, visible: true, blendMode: "NORMAL" }];
    bindRadius(modal, RADIUS_VARS.sheet);
    text(modal, "Modal title", semi, 18, COLOR_VARS.ink);
    text(modal, "One sentence that explains the choice.", reg, 13, COLOR_VARS.textMuted);
    const mrow = frame(modal, { mode: "HORIZONTAL", w: "FILL", align: "SPACE_BETWEEN", calign: "CENTER", pad: [6, 0] });
    text(mrow, "Cancel", reg, 13, COLOR_VARS.textMuted);
    const mcta = frame(mrow, { mode: "HORIZONTAL", pad: [9, 18], calign: "CENTER" });
    mcta.fills = [CTA_GRAD]; mcta.effects = [GRAIN_B];
    bindRadius(mcta, RADIUS_VARS.pill);
    text(mcta, "Confirm", med, 13, null, WHITE);
    place(modal);
    // Tooltip
    const tip = comp("Tooltip", { mode: "HORIZONTAL", pad: [6, 10], fillVar: COLOR_VARS.darkSurface });
    bindRadius(tip, RADIUS_VARS.card);
    text(tip, "A short helpful hint", reg, 11, COLOR_VARS.darkText);
    place(tip);
    // Alert
    const al = comp("Alert", { mode: "HORIZONTAL", gap: 10, pad: [12, 16], calign: "CENTER", fillVar: COLOR_VARS.paperInset, strokeVar: COLOR_VARS.lineFaded });
    fixW(al, 380);
    al.layoutMode = "HORIZONTAL";
    bindRadius(al, RADIUS_VARS.card);
    dot(al, 7, COLOR_VARS.accent);
    text(al, "Something worth knowing, said once.", reg, 13, COLOR_VARS.ink);
    place(al);
    endSection();
  }

  // ============ DATA ============
  if (G.data) {
    section("Data");
    const table = comp("Table", { gap: 0, fillVar: COLOR_VARS.paperCard, strokeVar: COLOR_VARS.lineFaded });
    fixW(table, 640);
    bindRadius(table, RADIUS_VARS.card);
    table.clipsContent = true;
    const trow = (cells, head) => {
      const r = frame(table, { mode: "HORIZONTAL", w: "FILL", pad: [10, 16], calign: "CENTER" });
      if (head) r.fills = [boundSolid(COLOR_VARS.paperInset)];
      cells.forEach((cell, i) => {
        const cellF = frame(r, { mode: "HORIZONTAL" });
        cellF.layoutSizingHorizontal = "FILL";
        text(cellF, cell, head ? med : reg, 12, head ? COLOR_VARS.ink : (i === 0 ? COLOR_VARS.ink : COLOR_VARS.textMuted));
      });
      if (!head) {
        const hl = figma.createRectangle();
        hl.resize(10, 1);
        hl.fills = [boundSolid(COLOR_VARS.lineFaded)];
        table.insertChild(table.children.length - 1, hl);
        hl.layoutSizingHorizontal = "FILL";
      }
    };
    trow(["Name", "Value", "Change"], true);
    trow(["First row", "0 000", "+0 %"], false);
    trow(["Second row", "0 000", "+0 %"], false);
    trow(["Third row", "0 000", "+0 %"], false);
    place(table);
    endSection();
  }

  // ============ DIAGRAM ============
  if (G.diagram) {
    section("Diagram");
    // Station disc
    const st = comp("Station", { mode: "HORIZONTAL", align: "CENTER", calign: "CENTER" });
    st.resize(56, 56); st.primaryAxisSizingMode = "FIXED"; st.counterAxisSizingMode = "FIXED";
    st.cornerRadius = 999;
    st.fills = [boundSolid(COLOR_VARS.paperInset)];
    st.effects = [GRAIN_S];
    text(st, "01", light, 15, COLOR_VARS.textMuted);
    place(st);
    // Stepper: 3 discs on a rail, terminal dot
    const sp = comp("Stepper", { mode: "HORIZONTAL", gap: 0, calign: "CENTER" });
    const seg = () => {
      const l = figma.createRectangle();
      l.resize(90, 1);
      l.fills = [boundSolid(COLOR_VARS.lineFaded)];
      sp.appendChild(l);
    };
    const discN = (n, on) => {
      const d = frame(sp, { mode: "HORIZONTAL", align: "CENTER", calign: "CENTER" });
      d.resize(44, 44); d.primaryAxisSizingMode = "FIXED"; d.counterAxisSizingMode = "FIXED";
      d.cornerRadius = 999;
      d.fills = [boundSolid(on ? COLOR_VARS.accentSoft : COLOR_VARS.paperInset)];
      d.effects = [GRAIN_S];
      text(d, n, light, 13, on ? COLOR_VARS.accent : COLOR_VARS.textMuted);
    };
    discN("01", true); seg(); discN("02", false); seg(); discN("03", false); seg();
    dot(sp, 7, COLOR_VARS.accent);
    place(sp);
    // Legend
    const lg = comp("Legend", { mode: "HORIZONTAL", gap: 8, calign: "CENTER", pad: [6, 12], fillVar: COLOR_VARS.paperCard });
    bindRadius(lg, RADIUS_VARS.pill);
    dot(lg, 6, COLOR_VARS.accent);
    text(lg, "the signal", reg, 12, COLOR_VARS.accent);
    place(lg);
    endSection();
  }

  // Take the user by the hand: jump straight to what was just created.
  if (nodes.length) {
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }
  return { made };
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
      const state = await readState();
      state.last = await figma.clientStorage.getAsync("lastKit");
      figma.ui.postMessage({ type: "state", state });
      pushSelection();
    } else if (msg.type === "bootstrap") {
      const r = await bootstrap(msg.payload);
      figma.notify("Brand kit initialized: " + r.created + " variable(s) created");
      figma.ui.postMessage({ type: "state", state: await readState() });
    } else if (msg.type === "live") {
      await liveSet(msg.key, msg.value);
    } else if (msg.type === "wizard-generate") {
      await figma.clientStorage.setAsync("lastKit", msg.payload);
      await bootstrap(msg.payload);
      const r = await generateStarter(msg.payload);
      if (r.error) figma.notify(r.error, { error: true });
      else figma.notify("Starter kit generated: " + r.made.join(", "));
      figma.ui.postMessage({ type: "state", state: await readState() });
      figma.ui.postMessage({ type: "wizard-done", made: r.made || [], error: r.error });
    } else if (msg.type === "analyze") {
      const st = await run(msg.payload, true);
      figma.ui.postMessage({ type: "analysis", st });
    } else if (msg.type === "apply") {
      await figma.clientStorage.setAsync("lastKit", msg.payload);
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
