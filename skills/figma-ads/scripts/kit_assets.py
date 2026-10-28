#!/usr/bin/env python3
"""
Recense les fichiers d'un kit (`logos/`, `fonts/`) dans son tokens.json, clé `assets`.

Un kit sert aussi hors de Figma : motion (HyperFrames par exemple), vidéo, présentation. Ces outils
veulent des FICHIERS, pas un fichier Figma : le logo en SVG ou PNG, la police en TTF/OTF. `assets` dit où
ils sont, relativement au kit, et quelle famille chaque police porte ; rien n'est deviné, on
liste ce qui est sur le disque.

Un fichier DEMO (« Fontspring-DEMO-… », « … DEMO.otf ») est une version d'essai à usage personnel,
souvent amputée de glyphes : il se range dans `assets.essai` et jamais dans `assets.fonts`, pour
qu'aucun rendu publié ne le prenne pour la police sous licence que détient la marque.

`typo` dit QUEL fichier rend le titre et le texte : la famille vient de `tokens.fonts`, la graisse
de la ligne « **Titre** : <famille> <graisse>. » du DESIGN.MD (écrite par onboarding_kit.py), et
le fichier se choisit sur ce qu'il DÉCLARE (OS/2 : graisse, italique ; fvar : plage d'une police
variable). Un motion charge ce fichier-là et rien d'autre ; `file: null` dit qu'il manque.

    python kit_assets.py <dossier-du-kit> [<autre-dossier-du-kit> ...]
"""
import json, os, re, struct, sys

STYLES = {"regular", "bold", "italic", "light", "medium", "black", "thin", "semibold", "extrabold", "extralight",
          "ultra", "book", "heavy", "demibold", "demi", "variable", "variableitalic", "bolditalic", "lightitalic",
          "mediumitalic", "semibolditalic", "extralightitalic", "boldoblique", "demiboldoblique", "extraboldoblique",
          "heavyoblique", "lightoblique", "mediumoblique", "regularoblique", "thinoblique", "thinitalic",
          "blackitalic", "extrablack", "extbdita", "extblkita", "extltita", "semltita", "semilight", "dots", "demo",
          "font", "reg", "wght", "opsz"}


GRAISSES = {"thin": 100, "hairline": 100, "extralight": 200, "ultralight": 200, "light": 300, "book": 400,
            "regular": 400, "normal": 400, "roman": 400, "medium": 500, "semibold": 600, "demibold": 600,
            "demi": 600, "bold": 700, "extrabold": 800, "ultrabold": 800, "black": 900, "heavy": 900,
            "extrablack": 950, "ultra": 950, "ultrablack": 950}


def tables(b):
    n = struct.unpack(">H", b[4:6])[0]
    return {struct.unpack(">4s", b[12 + 16 * i:16 + 16 * i])[0]: struct.unpack(">II", b[20 + 16 * i:28 + 16 * i])[0] for i in range(n)}


def noms(b):
    """La table `name` : {ID: texte}, Windows/Unicode d'abord, Mac Roman sinon."""
    t = tables(b)
    if b"name" not in t:
        return {}
    off = t[b"name"]
    _, nb, stock = struct.unpack(">HHH", b[off:off + 6])
    out = {}
    for j in range(nb):
        pf, _, _, nid, lg, o = struct.unpack(">HHHHHH", b[off + 6 + 12 * j:off + 18 + 12 * j])
        brut = b[off + stock + o:off + stock + o + lg]
        if pf in (0, 3):
            out.setdefault(nid, brut.decode("utf-16-be", "replace"))
        elif pf == 1 and nid not in out:
            out[nid] = brut.decode("mac_roman", "replace")
    return out


def lire(chemin):
    with open(chemin, "rb") as fh:
        b = fh.read()
    return b if b[:4] in (b"\x00\x01\x00\x00", b"OTTO", b"true") else None


def cle_de_style(style):
    """« Extra Bold Italic » → ("extrabold", True). Une graisse inconnue garde son nom."""
    c = re.sub(r"[^a-z]", "", style.lower())
    italique = "italic" in c or "ita" == c[-3:] or "oblique" in c
    c = re.sub(r"(italic|oblique|ita)$", "", c) or "regular"
    abr = {"extbd": "extrabold", "extblk": "extrablack", "extlt": "extralight", "semlt": "semilight", "semilight": "light"}
    return abr.get(c, c), italique


def declare(chemin):
    """Ce que le fichier déclare : (clé de style, italique, plage wght si variable). La graisse
    OS/2 ne vaut rien ici : bien des polices de marque déclarent la même valeur (500, ou 400 partout)
    pour le Regular et le Bold. Le NOM de style (ID 17, sinon 2) est ce que Figma affiche, donc ce
    que le DESIGN.MD cite."""
    b = lire(chemin)
    if not b:
        return None
    n = noms(b)
    style = n.get(17) or n.get(2) or "Regular"
    famille_legacy, famille = n.get(1, ""), n.get(16) or n.get(1, "")
    if famille_legacy.lower().startswith(famille.lower()) and famille_legacy[len(famille):].strip() and style.lower() in ("regular", "italic", "bold", "bold italic"):
        # Nommage hérité hors RIBBI : « Marque Ultra » / « Regular » sans ID 17.
        style = famille_legacy[len(famille):].strip() + ("" if style.lower() == "regular" else " " + style)
    cle, italique = cle_de_style(style)
    plage = None
    t = tables(b)
    if b"fvar" in t:
        o = t[b"fvar"]
        debut, nb, taille = struct.unpack(">HxxHH", b[o + 4:o + 12])
        for i in range(nb):
            a = o + debut + i * taille
            tag, mini, _, maxi = struct.unpack(">4siii", b[a:a + 16])
            if tag == b"wght":
                plage = [round(mini / 65536), round(maxi / 65536)]
    return cle, italique, plage


def typo_du_role(kit, role, famille_role, polices):
    """Le fichier qui rend ce rôle, choisi sur la graisse que le DESIGN.MD nomme."""
    md = os.path.join(kit, "DESIGN.MD")
    ligne = None
    if os.path.exists(md):
        m = re.search(rf"^- \*\*{role}\*\* : ([^\n]+?)\.(?: |$)", open(md, encoding="utf-8").read(), flags=re.M)
        ligne = m.group(1) if m else None
    if not ligne or not ligne.lower().startswith(famille_role.lower()):
        return None
    style = ligne[len(famille_role):].strip() or "Regular"
    cle, italique = cle_de_style(style)
    if cle not in GRAISSES:
        return {"family": famille_role, "style": style, "weight": None, "italic": italique, "file": None}
    poids = GRAISSES[cle]
    plat = lambda x: re.sub(r"[^a-z0-9]", "", x.lower())
    fichiers = next((v for k, v in polices.items() if plat(k) == plat(famille_role)), [])
    meilleur = None
    for f in fichiers:
        d = declare(os.path.join(kit, f))
        if not d:
            continue
        c, it, plage = d
        couvre = plage and plage[0] <= poids <= plage[1]
        ecart = (it != italique) * 1000 + (0 if c == cle or couvre else 1 + abs(GRAISSES.get(c, 400) - poids))
        if meilleur is None or ecart < meilleur[0]:
            meilleur = (ecart, f, c, plage)
    if meilleur is None or meilleur[0] >= 1000:
        return {"family": famille_role, "style": style, "weight": poids, "italic": italique, "file": None}
    return {"family": famille_role, "style": style, "weight": poids, "italic": italique, "file": meilleur[1],
            "range": meilleur[3], "fileStyle": meilleur[2], "exact": meilleur[0] == 0}


def famille_declaree(chemin):
    """La famille que le fichier DÉCLARE dans sa table `name` : `Marque_reg.otf` peut porter la
    famille « Marque Grotesque », et seul le fichier le sait. La famille typographique (ID 16) d'abord, puis la famille
    héritée (ID 1), qui porte la graisse pour les styles hors RIBBI. None pour un WOFF ou un fichier
    illisible : l'appelant retombe sur le nom du fichier."""
    b = lire(chemin) if os.path.exists(chemin) else None
    if not b:
        return None
    n = noms(b)
    return n.get(16) or n.get(1)


def famille(nom, connues):
    """La famille d'un fichier : celle de tokens.fonts qui en est le préfixe, sinon les mots avant le style."""
    base = re.sub(r"\.(ttf|otf|woff2?)$", "", nom, flags=re.I)
    base = re.sub(r"^Fontspring-DEMO-", "", base, flags=re.I)
    plat = re.sub(r"[^a-z0-9]", "", base.lower())
    for f in sorted(connues, key=len, reverse=True):
        if plat.startswith(re.sub(r"[^a-z0-9]", "", f.lower())):
            return f
    mots = []
    for m in re.split(r"[-_ \[\],]+", base):
        if not m or m.lower() in STYLES or re.fullmatch(r"[0-9a-f]{8,}", m.lower()):
            break
        mots.append(m)
    return " ".join(mots) or base


for kit in sys.argv[1:]:
    t = os.path.join(kit, "tokens.json")
    tokens = json.load(open(t, encoding="utf-8"))
    logos = sorted(f for f in os.listdir(os.path.join(kit, "logos"))) if os.path.isdir(os.path.join(kit, "logos")) else []
    polices, essai = {}, []
    if os.path.isdir(os.path.join(kit, "fonts")):
        for f in sorted(os.listdir(os.path.join(kit, "fonts"))):
            if not re.search(r"\.(ttf|otf|woff2?)$", f, re.I):
                continue
            if re.search(r"demo", f, re.I):
                essai.append(f"fonts/{f}")
            else:
                polices.setdefault(famille_declaree(os.path.join(kit, "fonts", f)) or famille(f, [v for v in (tokens.get("fonts") or {}).values() if v]), []).append(f"fonts/{f}")
    tokens["assets"] = {"logos": {os.path.splitext(f)[0]: f"logos/{f}" for f in logos}, "fonts": polices, **({"essai": essai} if essai else {})}
    typo = {}
    for role, cle in (("Titre", "titre"), ("Texte", "texte")):
        fam = (tokens.get("fonts") or {}).get(cle)
        r = typo_du_role(kit, role, fam, polices) if fam else None
        if r:
            typo[cle] = r
    if typo:
        tokens["typo"] = typo
    else:
        tokens.pop("typo", None)
    manque = [v for v in (tokens.get("fonts") or {}).values() if v and not any(v.lower().replace(" ", "") in k.lower().replace(" ", "") or k.lower().replace(" ", "") in v.lower().replace(" ", "") for k in polices)]
    json.dump(tokens, open(t, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(json.dumps({"kit": os.path.basename(kit.rstrip("/")), "logos": len(logos), "polices": list(polices), "police_sans_fichier": manque, "essai": len(essai), "typo": {k: (v["file"] and f"{os.path.basename(v['file'])} {v['weight']}{'' if v['exact'] else ' APPROCHÉ'}") for k, v in typo.items()}}, ensure_ascii=False))
