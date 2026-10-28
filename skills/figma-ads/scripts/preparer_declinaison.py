#!/usr/bin/env python3
"""
Relit la copie d'une déclinaison AVANT tout pixel, imprime le tableau à faire valider, et écrit les
paramètres de scripts/figma/10_decliner.js.

Pourquoi avant : une faute vue sur la capture coûte un tour de fabrication, la même faute vue ici
coûte une ligne. Le tableau imprimé est ce que la personne valide ; on ne fabrique qu'après son accord,
et une correction se fait dans la copie, jamais dans Figma.

Usage:
    python preparer_declinaison.py --kit <dossier-du-kit>/gabarits.json \
        --copie travail/copie.json --page "Abonnement automne" -o travail/decline.json
    python render.py scripts/figma/10_decliner.js --kit <dossier-du-kit> --params travail/decline.json

La copie :
    {"cta": "Je choisis mon café",
     "concepts": [
       {"genre": "full", "etiquette": "...", "titre": "...", "promesse": "...", "sous": "..."},
       {"genre": "chiffres", "etiquette": "...", "chiffre": "×2", "titre": "...", "promesse": "...", "sous": "..."},
       {"genre": "sms", "etiquette": "...", "titre": "...", "bulles": ["...", "..."], "sous": "..."},
       {"genre": "quiz", "etiquette": "...", "titre": "...", "question": "...", "options": ["...", "..."], "sous": "..."},
       {"genre": "champ", "titre": "VOTRE CAFÉ, MOULU POUR VOUS", "titreGris": "VOTRE CAFÉ,",
        "saisie": "pour une cafetière italienne", "sous": "..."},
       {"genre": "pastilles", "titre": "CHAQUE MOIS, UNE ORIGINE", "titreGris": "UNE ORIGINE",
        "pastilles": ["ÉTHIOPIE", "COLOMBIE"], "sous": "..."}
     ]}
Les deux derniers genres suivent l'anatomie « pied » (references/gabarits.md) : ni étiquette ni
barre, un titre en deux tons dont `titreGris` est la partie grise (par défaut le DÉBUT du titre pour
« champ », sa FIN pour « pastilles »), le texte tapé après le préfixe fixe du champ, ou les
pastilles (deux, sauf si le kit en déclare un autre nombre par `nombrePastilles`). Le titre et les
pastilles s'écrivent en capitales, comme dans le gabarit. Le bouton prend le `cta` commun. Un kit
qui déclare `prefixeChamp` refuse une saisie qui le répète.

Un kit peut donner un titre en deux tons à d'autres genres, et retirer l'étiquette d'un genre :
    "titreGris": {"full": "fin", "sms": "debut", "champ": "debut", "pastilles": "fin"},
    "sansEtiquette": ["sms"]
et son Full Text, comme son SMS, prend alors un `titreGris`, le SMS sans étiquette. Un kit dont les
`regles` portent `"apostrophe": "’"` refuse l'apostrophe droite dans toute la copie.

Un `libelle` sur un concept remplace celui du genre (deux SMS : « SMS », « SMS Bureau ») : c'est
le nom du cadre, donc le nom de l'annonce chez la régie, donc ce que le lead portera.

Les chiffres se relisent contre `chiffres.json`, à côté de `gabarits.json` (ou `--chiffres`) :
une affirmation RETIRÉE bloque, une affirmation à confirmer et tout chiffre absent du registre
alertent. Voir `chiffres.py`. Un registre présent mais illisible bloque ; un `chiffres.json` absent
à côté du kit est une marque sans registre (chaque chiffre y est inconnu, donc en alerte) ; un
`--chiffres` qui ne mène à rien bloque.

Une limite d'élément (`pastille`, `bulle`, `option`) peut être une liste, une limite par EMPLACEMENT :
des pastilles posées à x fixes ne tiennent pas la même longueur (`"pastille": [14, 16, 22]`, la première
bute sur la deuxième). La liste suit l'ordre des calques du gabarit, qui est celui de la copie ;
elle doit couvrir chaque élément.

Code de sortie 1 s'il reste un bloquant : on ne rend pas un script sur une copie fautive.
"""

import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chiffres  # noqa: E402

CHAMPS = {
    "full": ["etiquette", "titre", "promesse", "sous"],
    "chiffres": ["etiquette", "chiffre", "titre", "promesse", "sous"],
    "sms": ["etiquette", "titre", "bulles", "sous"],
    "quiz": ["etiquette", "titre", "question", "options", "sous"],
    "champ": ["titre", "titreGris", "saisie", "sous"],
    "pastilles": ["titre", "titreGris", "pastilles", "sous"],
}
# La partie grise du titre, par défaut : son début pour « champ », sa fin pour « pastilles ».
# Le `titreGris` d'un kit complète et remplace : c'est là qu'un kit déclare un full ou un sms à deux tons.
GRIS_DEFAUT = {"champ": "debut", "pastilles": "fin"}
# Le nom d'une limite de gabarits.json pour un champ en liste : une limite vaut pour chaque élément.
LIMITE_ELEMENT = {"bulles": "bulle", "options": "option", "pastilles": "pastille"}
TUTOIEMENT = re.compile(r"\b(?:(?:tu|toi|ton|ta|tes|te)\b|t['’])", re.I)
VOUVOIEMENT = re.compile(r"\b(vous|votre|vos)\b", re.I)
# « pour découvrez », « tu peux trouvez » : l'infinitif écrit en -ez.
EZ_POUR_ER = re.compile(r"\b(pour|de|d['’]|à|sans|va|vas|peux|veux|dois|faut|aller|venir)\s+(\w+ez)\b", re.I)


def textes(concept):
    for k, v in concept.items():
        if k in ("genre", "libelle"):
            continue
        for i, s in enumerate(v if isinstance(v, list) else [v]):
            yield (f"{k}[{i}]" if isinstance(v, list) else k), s


def relire_deux_tons(g, c, devant, nombre_pastilles, prefixe, qui):
    """Ce qu'un gabarit à titre en deux tons exige de la copie, et que la longueur ne dit pas."""
    faute = []
    titre, gris = c["titre"], c["titreGris"]
    k = len(gris) if devant else len(titre) - len(gris)
    tient = titre.startswith(gris) if devant else titre.endswith(gris)
    if not tient or len(gris) >= len(titre):
        faute.append(f"{qui} : « {gris} » n'est pas {'le début' if devant else 'la fin'} du titre, "
                     "ou le titre entier (le gabarit veut deux tons)")
    elif titre[k if devant else k - 1] != " ":
        faute.append(f"{qui} : la partie grise coupe un mot (« {titre[max(0, k - 8):k + 8]} »)")
    textes_en_capitales = [("titre", titre)]
    if g == "champ":
        if not isinstance(c["saisie"], str):
            faute.append(f"{qui} : la saisie est un texte, pas une liste")
        elif prefixe and c["saisie"].lower().startswith(prefixe.lower()):
            faute.append(f"{qui} : la saisie commence APRÈS « {prefixe} », que le gabarit écrit déjà")
    elif g == "pastilles":
        if not isinstance(c["pastilles"], list) or len(c["pastilles"]) != nombre_pastilles:
            faute.append(f"{qui} : le gabarit porte exactement {nombre_pastilles} pastilles")
        else:
            textes_en_capitales += [(f"pastilles[{i}]", b) for i, b in enumerate(c["pastilles"])]
    for champ, s in textes_en_capitales:
        if isinstance(s, str) and s != s.upper():
            faute.append(f"{qui} / {champ} : en capitales dans le gabarit (« {s} »)")
    return faute


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--kit", required=True)
    ap.add_argument("--copie", required=True)
    ap.add_argument("--page", required=True)
    ap.add_argument("--ecraser", action="store_true", help="remplacer les cadres déjà sur la page (retouches perdues)")
    ap.add_argument("--chiffres", help="registre des chiffres (défaut : chiffres.json à côté du kit)")
    ap.add_argument("-o", "--output", required=True)
    a = ap.parse_args()

    kit = json.load(open(os.path.expanduser(a.kit), encoding="utf-8"))
    copie = json.load(open(a.copie, encoding="utf-8"))
    lim = kit.get("limites", {})
    bloquants, alertes = [], []
    chemin_registre = a.chiffres or os.path.join(os.path.dirname(os.path.expanduser(a.kit)), "chiffres.json")
    try:
        registre = chiffres.charger(chemin_registre)
    except chiffres.RegistreInvalide as e:
        sys.exit(f"BLOQUANT  registre des chiffres invalide, {e}")
    if registre is None and a.chiffres:
        # Un chemin donné à la main dit qu'un registre est ATTENDU : son absence est une faute de
        # frappe, pas une marque sans registre, et la laisser en alerte ferait passer un retiré.
        sys.exit(f"BLOQUANT  registre des chiffres introuvable : {chemin_registre} (passé par --chiffres)")
    if registre is None:
        alertes.append(f"pas de registre des chiffres ({chemin_registre}) : chaque chiffre de la copie est inconnu")

    gris_kit = {**GRIS_DEFAUT, **kit.get("titreGris", {})}
    sans_etiquette = set(kit.get("sansEtiquette", []))
    apostrophe = kit["regles"].get("apostrophe")
    concepts, libelles = [], set()
    for n, c in enumerate(copie["concepts"], 1):
        g = c.get("genre")
        if g not in CHAMPS or g not in kit["sources"]:
            bloquants.append(f"concept {n} : genre « {g} » sans gabarit dans ce kit ({', '.join(kit['sources'])})")
            continue
        gris = gris_kit.get(g)
        if gris not in (None, "debut", "fin"):
            sys.exit(f"BLOQUANT  gabarits.json : titreGris.{g} vaut « {gris} », « debut » ou « fin » attendu")
        champs = [k for k in CHAMPS[g] if not (k == "etiquette" and g in sans_etiquette)]
        if gris and "titreGris" not in champs:
            champs.insert(champs.index("titre") + 1, "titreGris")
        manque = [k for k in champs if not c.get(k)]
        if g in sans_etiquette and c.get("etiquette"):
            bloquants.append(f"concept {n} ({g}) : une étiquette, que le gabarit de ce kit n'a pas")
        if not gris and c.get("titreGris"):
            bloquants.append(f"concept {n} ({g}) : un titreGris, mais le titre de ce gabarit n'a qu'un ton")
        if manque:
            bloquants.append(f"concept {n} ({g}) : manque {', '.join(manque)}")
        elif gris:
            bloquants += relire_deux_tons(g, c, gris == "debut", kit.get("nombrePastilles", 2),
                                          kit.get("prefixeChamp"), f"concept {n} ({g})")
        libelle = c.get("libelle") or kit["libelles"][g]
        if libelle in libelles:
            bloquants.append(f"deux concepts s'appellent « {libelle} » : l'annonce et le lead ne les distingueraient pas")
        libelles.add(libelle)

        for champ, s in [("cta", copie["cta"])] + list(textes(c)):
            qui = f"{libelle} / {champ}"
            if "\n" in s:
                bloquants.append(f"{qui} : retour à la ligne forcé, c'est la largeur qui coupe")
            if re.search("[\u2014\u2013]", s):
                bloquants.append(f"{qui} : tiret long")
            if apostrophe and "'" in s:
                bloquants.append(f"{qui} : apostrophe droite, la charte écrit {apostrophe}")
            if "  " in s or s != s.strip():
                bloquants.append(f"{qui} : espace en trop")
            if kit.get("adresse") == "tu" and VOUVOIEMENT.search(s):
                bloquants.append(f"{qui} : vouvoiement chez une marque qui tutoie")
            if kit.get("adresse") == "vous" and TUTOIEMENT.search(s):
                bloquants.append(f"{qui} : tutoiement chez une marque qui vouvoie")
            # La partie grise est un morceau du titre, déjà relu : ses chiffres sortiraient deux fois.
            for genre, detail, aff in ([] if champ == "titreGris" else chiffres.relire(s, registre)):
                (bloquants if genre == "retire" else alertes).append(f"{qui} : {chiffres.dire(genre, detail, aff)}")
            m = EZ_POUR_ER.search(s)
            if m:
                alertes.append(f"{qui} : « {m.group(0)} », un infinitif en -er ?")
            base = champ.split("[")[0]
            plafond = lim.get("etiquette") if base == "etiquette" else lim.get(g, {}).get(
                LIMITE_ELEMENT.get(base, base))
            ou = ""
            if isinstance(plafond, list):
                i = int(champ[len(base) + 1:-1])
                if i >= len(plafond):
                    bloquants.append(f"{qui} : gabarits.json ne donne que {len(plafond)} limites "
                                     f"pour « {LIMITE_ELEMENT.get(base, base)} », pas celle de l'emplacement {i + 1}")
                    continue
                plafond, ou = plafond[i], f" à l'emplacement {i + 1}"
            if plafond and len(s) > plafond:
                alertes.append(f"{qui} : {len(s)} caractères pour {plafond}{ou} (le gabarit le tenait à cette longueur)")
        concepts.append({"genre": g, "libelle": libelle, "gris": gris,
                         "copie": {k: v for k, v in c.items() if k not in ("genre", "libelle")}})

    # Le tableau à valider : un concept par ligne, dans l'ordre de lecture du cadre.
    print(f"| Concept | Étiquette | Titre | Corps | Sous-titre |\n|---|---|---|---|---|")
    for c in concepts:
        x = c["copie"]
        corps = (
            f"{x.get('chiffre', '')} {x.get('promesse', '')}".strip() if c["genre"] in ("full", "chiffres")
            else " / ".join(x.get("bulles", [])) if c["genre"] == "sms"
            else f"{kit.get('prefixeChamp') or '…'} {x.get('saisie')}" if c["genre"] == "champ"
            else " / ".join(x.get("pastilles", [])) if c["genre"] == "pastilles"
            else f"{x.get('question')} → {' / '.join(x.get('options', []))}"
        )
        titre = f"{x.get('titre')} (en gris : {x.get('titreGris')})" if c["gris"] else x.get("titre")
        print(f"| {c['libelle']} | {x.get('etiquette') or ''} | {titre} | {corps} | {x.get('sous')} |")
    print(f"\nBouton : {copie['cta']}")
    print("À relire à l'œil, le script ne les voit pas : une affirmation qui finit en « ? », un pronom sans antécédent.")
    for s in alertes:
        print(f"ALERTE    {s}")
    for s in bloquants:
        print(f"BLOQUANT  {s}")
    if bloquants:
        sys.exit(1)

    regles = dict(kit["regles"], ecraser=a.ecraser)
    params = {"PAGE": a.page, "SOURCES": kit["sources"], "CONCEPTS": concepts, "CTA": copie["cta"], "REGLES": regles}
    os.makedirs(os.path.dirname(os.path.abspath(a.output)), exist_ok=True)
    json.dump(params, open(a.output, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\n{len(concepts)} concepts prêts → {a.output} (fichier Figma {kit['fichier']})")


if __name__ == "__main__":
    main()
