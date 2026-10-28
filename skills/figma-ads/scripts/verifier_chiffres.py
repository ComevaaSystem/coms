#!/usr/bin/env python3
"""
Relit TOUS les textes d'un fichier Figma contre le registre des chiffres de la marque, et liste chaque
cadre qui porte une affirmation retirée ou un chiffre inconnu. Lecture seule : l'API REST ne sait
pas écrire, et c'est voulu, la correction se fait dans la copie puis se redécline.

Pourquoi le fichier entier : `preparer_declinaison.py` relit la copie d'un lot neuf, mais un chiffre
retiré par la marque vit déjà dans les lots d'avant, déclinés en plusieurs variantes, parfois en
diffusion. Quand plusieurs chiffres tombent d'un coup, ce sont souvent la majorité des cadres qui
les portent.

Usage:
    python verifier_chiffres.py --kit <dossier-du-kit> --figma <fileKey> [--page <nom>] [--a-confirmer]

Le jeton d'accès personnel Figma se lit dans la variable FIGMA_TOKEN. Un calque masqué ne se lit
pas : il ne part pas dans l'export. Code de sortie 1 s'il reste une affirmation retirée.

Les pages hors lot (`Charte`, une archive) ne disent que les affirmations RETIRÉES : leurs
nombres sont des tailles de police, des codes couleur et les visuels d'avant, mais un chiffre
retiré posé sur la Charte est celui que le prochain lot recopiera.
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chiffres  # noqa: E402
from onboarding_assets import api  # noqa: E402

CADRES = {"FRAME", "COMPONENT", "COMPONENT_SET", "INSTANCE", "GROUP", "TEXT"}


def cadres(noeud):
    """Les cadres de premier niveau d'une page ; une section se traverse, elle n'est pas un visuel."""
    for n in noeud.get("children", []):
        if n.get("visible") is False:
            continue
        if n["type"] == "SECTION":
            yield from cadres(n)
        elif n["type"] in CADRES:
            yield n


def textes(noeud):
    if noeud.get("visible") is False:
        return
    if noeud["type"] == "TEXT" and noeud.get("characters"):
        yield noeud["characters"]
    for n in noeud.get("children", []):
        yield from textes(n)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--kit", required=True, help="dossier du kit (<dossier-du-kit>) ou chemin de chiffres.json")
    ap.add_argument("--figma", required=True, help="fileKey du fichier Figma")
    ap.add_argument("--page", help="ne lire que les pages dont le nom contient ce texte")
    ap.add_argument("--a-confirmer", action="store_true", help="lister aussi les affirmations à confirmer")
    a = ap.parse_args()

    kit = os.path.expanduser(a.kit)
    chemin = kit if kit.endswith(".json") else os.path.join(kit, "chiffres.json")
    try:
        registre = chiffres.charger(chemin)
    except chiffres.RegistreInvalide as e:
        sys.exit(f"Registre des chiffres invalide, {e}")
    if registre is None:
        sys.exit(f"Pas de registre : {chemin}. Sans lui, chaque chiffre du fichier est inconnu.")

    doc = api(f"files/{a.figma}")
    montrer = {"retire", "inconnu"} | ({"a_confirmer"} if a.a_confirmer else set())
    total, par_genre = 0, {"retire": 0, "a_confirmer": 0, "inconnu": 0}
    print(f"{doc['name']} ({a.figma}), registre {chemin}\n")
    for page in doc["document"]["children"]:
        if a.page and a.page.lower() not in page["name"].lower():
            continue
        hors_lot = page["name"].lower().startswith("charte") or "archive" in page["name"].lower()
        sortie = []
        for c in cadres(page):
            total += 1
            vus = {}
            for t in textes(c):
                for genre, detail, aff in chiffres.relire(t, registre):
                    # Une affirmation se dit une fois par cadre, sous la forme lue en premier.
                    vus.setdefault((genre, aff["id"] if aff else detail), (genre, detail, aff))
            if hors_lot:
                vus = {k: v for k, v in vus.items() if v[0] == "retire"}
            for g in {g for g, _ in vus}:
                par_genre[g] += 1
            lignes = [chiffres.dire(*v) for v in sorted(vus.values(), key=lambda v: v[0]) if v[0] in montrer]
            if lignes:
                lien = f"https://www.figma.com/design/{a.figma}/?node-id={c['id'].replace(':', '-')}"
                sortie.append(f"  {c['name']}  {lien}\n" + "\n".join(f"    {s}" for s in lignes))
        if sortie:
            print(f"Page « {page['name']} »{' (hors lot, retirés seuls)' if hors_lot else ''} : {len(sortie)} cadres\n" + "\n".join(sortie) + "\n")

    print(
        f"{total} cadres lus : {par_genre['retire']} portent une affirmation retirée, "
        f"{par_genre['inconnu']} un chiffre absent du registre, {par_genre['a_confirmer']} une affirmation à confirmer"
        + ("" if a.a_confirmer else " (--a-confirmer pour les lister)")
        + "."
    )
    if par_genre["retire"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
