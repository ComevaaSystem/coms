"""
Le registre des chiffres et affirmations d'une marque : `<dossier-du-kit>/chiffres.json`.

Pourquoi un registre et pas une ligne dans DESIGN.MD : une phrase dans un document ne refuse
rien. Un registre lu par programme refuse la copie qui porte un chiffre retiré, et relit un
fichier Figma entier pour dire où il reste.

Le format :
    {"client": "Marque",
     "hors_affirmation": ["1/1"],          # des chiffres qui ne disent rien (numérotation…)
     "affirmations": [
       {"id": "origines",
        "texte": "12 origines au catalogue",
        "variantes": ["12 origines", "douze origines"],
        "source": {"url": "https://…", "citation": "…", "date": "AAAA-MM-JJ"},
        "statut": "retire",               # valide | retire | a_confirmer
        "retire": {"date": "AAAA-MM-JJ", "raison": "…"}}]}

Un `valide` porte sa source (URL ou citation) et sa date ; un `retire` porte sa date et sa
raison. Un registre qui ne le dit pas est refusé en entier : un statut qu'on devine est un
statut qui finit par laisser passer.

Détection : texte et variantes passent par la même normalisation (insécables, séparateur de
milliers, « 30% » = « 30 % », « × » = « x »), et un chiffre ne se reconnaît pas au milieu d'un
autre (« 30 % » ne sort pas de « 130 % »). Tout nombre du texte que ni une variante ni
`hors_affirmation` ne couvre est un chiffre INCONNU : c'est la liste d'autorisation qui compte,
pas la liste des interdits, parce qu'une liste d'interdits oublie toujours le suivant.
"""

import json
import os
import re

STATUTS = ("valide", "retire", "a_confirmer")
# ASCII et fullmatch : sans eux, « $ » accepte un saut de ligne final et « \d » des chiffres
# arabes, et une date mal formée passerait pour une date.
DATE = re.compile(r"\d{4}-\d{2}-\d{2}", re.ASCII)
# Un nombre, sa décimale, sa note sur (« 9/10 »), et l'unité qui le rend lisible dans un constat.
# Collé à une lettre, ce n'est pas un chiffre qu'on affirme : « format A4 », « filtre V60 ».
NOMBRE = re.compile(
    r"(?<![a-z\d,])\d+(?:,\d+)?(?:/\d+)?(?:%|€|x(?![a-z])| ?(?:h|min|ans|mois|jours)(?![a-z])|(?![a-z\d]))"
)


class RegistreInvalide(Exception):
    pass


def normaliser(s):
    s = s.lower()
    s = re.sub(r"[\u00a0\u202f\u2009\u2007\u2028\u2029\n\r\t]", " ", s)
    s = s.replace("’", "'").replace("×", "x")
    s = re.sub(r"(?<=\d)\.(?=\d)", ",", s)          # 1.5 → 1,5
    s = re.sub(r"(?<=\d) (?=\d{3}(?!\d))", "", s)   # 30 000 → 30000
    s = re.sub(r"(?<=\d) +(?=%|€|[xh](?![a-z]))", "", s)  # 30 % → 30%, 48 h → 48h
    return re.sub(r" +", " ", s).strip()


def _motif(v):
    # Un chiffre ne commence ni ne finit au milieu d'un autre.
    avant = r"(?<![\d,])" if v[:1].isdigit() else ""
    apres = r"(?![\d])" if v[-1:].isdigit() else ""
    return re.compile(avant + re.escape(v) + apres)


def _date(d):
    return isinstance(d, str) and DATE.fullmatch(d)


def _fautes(reg):
    """
    Les fautes d'un registre, vides s'il tient. Si un autre outil relit le même fichier (un rendu
    vidéo, une publication), il doit appliquer exactement ces règles : un registre que l'un accepte
    et que l'autre refuse finit par laisser passer ce que l'autre bloquait.
    """
    if not isinstance(reg, dict) or not isinstance(reg.get("affirmations"), list):
        return ["pas de liste « affirmations »"]
    fautes, vues = [], {}
    hors = reg.get("hors_affirmation", [])
    if not isinstance(hors, list) or any(not isinstance(h, str) for h in hors):
        fautes.append("« hors_affirmation » n'est pas une liste de textes")
    for n, a in enumerate(reg["affirmations"], 1):
        if not isinstance(a, dict):
            fautes.append(f"affirmation {n} : pas un objet")
            continue
        qui = a.get("id") if isinstance(a.get("id"), str) and a.get("id") else f"affirmation {n}"
        st = a.get("statut")
        if st not in STATUTS:
            fautes.append(f"{qui} : statut « {st} » (attendu : {', '.join(STATUTS)})")
        texte = a.get("texte")
        # Python ne compte pas le BOM (U+FEFF) comme un blanc : sans ce retrait, un texte fait d'un
        # BOM passerait pour un texte canonique.
        if not isinstance(texte, str) or not texte.replace("\ufeff", "").strip():
            fautes.append(f"{qui} : pas de texte canonique")
            texte = ""
        variantes = a.get("variantes", [])
        if not isinstance(variantes, list) or any(not isinstance(v, str) for v in variantes):
            fautes.append(f"{qui} : des variantes qui ne sont pas du texte")
            variantes = []
        src = a.get("source") if isinstance(a.get("source"), dict) else {}
        if st == "valide" and not (src.get("url") or src.get("citation")):
            fautes.append(f"{qui} : valide sans source (URL ou citation)")
        if st == "valide" and not _date(src.get("date")):
            fautes.append(f"{qui} : valide sans date de relecture de la source")
        r = a.get("retire") if isinstance(a.get("retire"), dict) else {}
        if st == "retire" and (not _date(r.get("date")) or not r.get("raison")):
            fautes.append(f"{qui} : retiré sans sa date ET sa raison")
        a["_motifs"] = []
        for v in dict.fromkeys([texte] + variantes):
            nv = normaliser(v)
            if not nv:
                continue
            if nv in vues and vues[nv] != qui:
                fautes.append(f"« {v} » est à la fois dans {vues[nv]} et {qui}")
            vues[nv] = qui
            a["_motifs"].append(_motif(nv))
    return fautes


def _constante_refusee(nom):
    raise ValueError(f"« {nom} » n'existe pas en JSON")


def charger(chemin):
    """
    Le registre validé, ou None s'il n'existe pas. Présent mais illisible (fichier qu'on n'ouvre
    pas, JSON cassé, forme inattendue, champ manquant) : RegistreInvalide, qui nomme le fichier et
    dit pourquoi.

    Un fichier sans la clé « affirmations » qui vaudrait registre VIDE ferait sortir un chiffre
    retiré en simple alerte « absent du registre », code 0. Un lien symbolique vers un fichier
    absent qui vaudrait « pas de registre », pareil. Seul un fichier absent vaut « rien de
    retiré » ; tout le reste se refuse, parce qu'un registre qu'on devine est un registre qui
    laisse passer.
    """
    chemin = os.path.expanduser(chemin)
    # lstat et pas exists : un lien cassé est un registre PRÉSENT, pas une absence. Et un dossier
    # du kit qui est un FICHIER ne vaut pas « pas de registre » : c'est une faute (ENOTDIR).
    try:
        os.lstat(chemin)
    except FileNotFoundError:
        return None
    except OSError as e:
        raise RegistreInvalide(f"{chemin} ne se lit pas ({e})")
    try:
        with open(chemin, encoding="utf-8") as f:
            brut = f.read()
    except FileNotFoundError:
        raise RegistreInvalide(f"{chemin} ne se lit pas (un lien vers un fichier qui n'existe pas)")
    except UnicodeDecodeError:
        raise RegistreInvalide(f"{chemin} n'est pas en UTF-8 (l'enregistrer en UTF-8)")
    except OSError as e:
        raise RegistreInvalide(f"{chemin} ne se lit pas ({e})")
    # « \ufffd » est ce que laisse une lecture tolérante d'un fichier qui n'est pas en UTF-8 : un
    # chiffre abîmé ne se reconnaîtrait plus, il se refuse.
    if "\ufffd" in brut:
        raise RegistreInvalide(f"{chemin} porte un caractère illisible (U+FFFD) : il n'est pas en UTF-8")
    try:
        # json.loads accepte NaN et Infinity, qui ne sont pas du JSON : le registre reste strict.
        reg = json.loads(brut, parse_constant=_constante_refusee)
    except (json.JSONDecodeError, ValueError) as e:
        raise RegistreInvalide(f"{chemin} n'est pas un JSON valide ({e})")
    fautes = _fautes(reg)
    if fautes:
        raise RegistreInvalide(f"{chemin} :\n  " + "\n  ".join(fautes))
    reg["_hors"] = [_motif(normaliser(h)) for h in reg.get("hors_affirmation", []) if normaliser(h)]
    reg["_chemin"] = chemin
    return reg


def relire(texte, reg):
    """
    Les constats d'un texte : [(genre, detail, affirmation|None)], genre ∈ retire, a_confirmer,
    inconnu. Sans registre, tout nombre est inconnu : on ne suppose rien de ce qu'on n'a pas lu.
    """
    t = normaliser(texte)
    couvert, constats = [], []
    for a in (reg or {}).get("affirmations", []):
        trouve = None
        for m in a["_motifs"]:
            for x in m.finditer(t):
                couvert.append(x.span())
                trouve = trouve or x.group(0)
        if trouve and a["statut"] != "valide":
            constats.append((a["statut"], trouve, a))
    for m in (reg or {}).get("_hors", []):
        couvert += [x.span() for x in m.finditer(t)]
    for x in NOMBRE.finditer(t):
        # Le chiffre seul doit être couvert, pas l'unité qu'on a prise pour l'afficher.
        debut, fin = x.start(), x.start() + len(re.match(r"[\d,/]+", x.group(0)).group(0))
        if not any(d <= debut and fin <= f for d, f in couvert):
            constats.append(("inconnu", x.group(0), None))
    return constats


def dire(genre, detail, a):
    if genre == "retire":
        r = a["retire"]
        return f"« {detail} » retiré le {r['date']} : {r['raison']}"
    if genre == "a_confirmer":
        return f"« {detail} » à confirmer ({a['texte']})"
    return f"« {detail} » absent du registre des chiffres"
