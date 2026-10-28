#!/usr/bin/env python3
"""
Écrit <dossier-du-kit>/DESIGN.MD et tokens.json depuis le MÊME DATA que 11_charte.js.

La planche Figma et le kit disent la même charte : si on les écrit à la main l'un après l'autre,
ils divergent au premier retour. Une seule source, deux sorties.

    python onboarding_kit.py travail/data.json <dossier-du-kit> --figma <url du fichier Statics>

Le DESIGN.MD existant garde ses sections « Chaîne et mesure » et « Voix et faits sourcés »
quand DATA ne dit rien de mieux : elles viennent d'un relevé antérieur et ne se devinent pas sur
une charte. Un rôle sans valeur reste « à mesurer » ; tokens.json ne porte QUE les valeurs
mesurées : une valeur inventée y aurait l'air vraie pour tous les outils qui le lisent.

tokens.json garde ce qu'il portait déjà (la ligne `directions`, les `assets`) : ce script ne
réécrit que ce qu'il mesure. Ses clés de couleur (`fond`, `encre`, `carte`…) sont les rôles relevés
sur les visuels, pas ceux de `brand-kit` (`paper`, `ink`…) : la correspondance de chacun vers le
format BRAND des scripts Figma est dans references/template-ad.md.
"""

import argparse
import json
import os
import re

ROLES = {
    "fond": "fond",
    "encre": "encre",
    "accent": "accent",
    "accent-doux": "accentDoux",
    "punch": "punch",
    "carte": "carte",
    "texte-carte": "texteCarte",
    "texte-bouton": "texteBouton",
}


def section(md, titre):
    m = re.search(rf"^## {re.escape(titre)}\n(.*?)(?=^## |\Z)", md, flags=re.S | re.M)
    return m.group(1).strip() if m else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("data")
    ap.add_argument("kit")
    ap.add_argument("--figma", required=True)
    ap.add_argument("--niveau", default="1")
    a = ap.parse_args()

    d = json.load(open(a.data, encoding="utf-8"))
    d = d.get("DATA", d)
    os.makedirs(a.kit, exist_ok=True)
    chemin = os.path.join(a.kit, "DESIGN.MD")
    ancien = open(chemin, encoding="utf-8").read() if os.path.exists(chemin) else ""
    nom = d.get("enseigne") or d["client"]

    lignes = [f"# DESIGN.MD : {nom}", ""]
    lignes += [f"**Niveau {a.niveau}** : charte relevée le {d['date']} pour la planche de références. Planche : {a.figma}", ""]
    lignes += [
        "Ce qui est marqué « à mesurer » n'est PAS une valeur par défaut : c'est un trou, et on ne",
        "remplit un trou qu'en mesurant.",
        "",
        "## L'identité en une phrase",
        "",
        d["phrase"],
        "",
        "## Tokens",
        "",
        "| Rôle | Valeur | Usage |",
        "|---|---|---|",
    ]
    for c in d["couleurs"]:
        lignes.append(f"| {c['role']} | {c['hex'] or 'à mesurer'} | {c.get('usage') or ''} |")
    lignes += ["", "## Typographie", ""]
    for cle, lib in (("titre", "Titre"), ("texte", "Texte")):
        p = (d.get("polices") or {}).get(cle)
        lignes.append(f"- **{lib}** : {p['family'] + ' ' + p['style'] if p else 'à mesurer'}" + (f". {p['source']}" if p and p.get("source") else ""))
    if d.get("echelle"):
        lignes += ["", "Échelle relevée sur les visuels (1080 px) :", ""]
        lignes += [f"- {e['nom']} : {e['police']}, {e['taille']} px" for e in d["echelle"]]
    lignes += ["", "## Logo", ""]
    if d.get("logos"):
        lignes += [f"- {l['nom']} (sur {l.get('fond') or '#FFFFFF'})" for l in d["logos"]]
        lignes += ["", "Posés sur la page Charte du fichier Figma. Un logo se pose en composant et **ne se lie jamais aux variables**."]
    else:
        lignes.append("À récupérer en SVG. Il se pose en composant et **ne se lie jamais aux variables**.")
    if d.get("regles"):
        lignes += ["", "## Règles relevées", ""] + [f"- {r}" for r in d["regles"]]
    lignes += ["", "## À mesurer", ""] + ([f"- {r}" for r in d["aMesurer"]] if d.get("aMesurer") else ["- Rien de connu à ce jour."])
    lignes += ["", "## Voix et faits sourcés", ""]
    if d.get("voix"):
        lignes.append(d["voix"])
        lignes += ["", "**Aucun chiffre ne monte sur un visuel sans sa source, relue le jour même.**"]
    else:
        lignes.append(section(ancien, "Voix et faits sourcés") or "À établir.")
    lignes += ["", "## Où vivent les visuels", "", f"- Planche de référence : {a.figma} (pages Charte et Archive)."]
    for g in d.get("archive") or []:
        lignes.append(f"- Archive : {g['groupe']}.")
    chaine = section(ancien, "Chaîne et mesure")
    if chaine:
        lignes += ["", "## Chaîne et mesure", "", chaine]
    lignes += [
        "",
        "## Pour passer au niveau supérieur",
        "",
        "1. Combler les « à mesurer » ci-dessus.",
        "2. Choisir une direction avec la personne et l'écrire dans tokens.json (`directions`).",
        f"3. Poser les gabarits sur une page `{nom} / gabarits`, puis livrer dans le fichier Statics, une page par campagne.",
        "",
    ]
    open(chemin, "w", encoding="utf-8").write("\n".join(lignes))

    couleurs = {ROLES[c["role"]]: c["hex"] for c in d["couleurs"] if c["role"] in ROLES and c["hex"]}
    extra = {re.sub(r"\W+", "_", c["role"]): c["hex"] for c in d["couleurs"] if c["role"] not in ROLES and c["hex"]}
    polices = {k: v["family"] for k, v in (d.get("polices") or {}).items() if v}
    chemin_tokens = os.path.join(a.kit, "tokens.json")
    tokens = json.load(open(chemin_tokens, encoding="utf-8")) if os.path.exists(chemin_tokens) else {}
    tokens.update({
        "name": tokens.get("name") or os.path.basename(a.kit.rstrip("/")),
        "font": polices.get("titre"),
        "fonts": polices,
        "colors": couleurs,
        "palette": extra,
        "type": {re.sub(r"\W+", "_", e["nom"]).lower(): e["taille"] for e in d.get("echelle") or []},
        "figma": a.figma,
        "releve": d["date"],
    })
    json.dump(tokens, open(chemin_tokens, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    manquants = [r for r in ROLES if r not in {c["role"] for c in d["couleurs"] if c["hex"]}]
    print(json.dumps({"kit": a.kit, "couleurs": len(couleurs), "roles_a_mesurer": manquants}, ensure_ascii=False))


if __name__ == "__main__":
    main()
