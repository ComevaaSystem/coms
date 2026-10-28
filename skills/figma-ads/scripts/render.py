#!/usr/bin/env python3
"""
Remplit les paramètres __NOM__ d'un script de scripts/figma/ et imprime le code prêt pour use_figma.

Chaque paramètre est remplacé par un littéral JSON (chaîne entre guillemets, tableau, objet, null,
booléen). Le script échoue si un paramètre reste non rempli : on n'envoie jamais à Figma un script
avec un __TROU__. Un paramètre fourni que le script ne déclare pas est seulement signalé sur la
sortie d'erreur (souvent une faute de frappe, à relire).

Usage:
    python render.py scripts/figma/05_ad_variant.js --kit <dossier-du-kit> --set FORMAT='"Story 9:16"' --set LOGO_ID='"12:3"' --set CTA_ID='"12:9"'
    python render.py scripts/figma/08_instantiate.js --kit <dossier-du-kit> --params lots/lot-01.json --set AD_SET_ID='"45:1"'
    python render.py scripts/figma/02_tokens.js --kit <dossier-du-kit> --set-file BRAND=brand.json

--params   fichier JSON {"NOM": valeur, ...} (par exemple un lot écrit par build_concepts.py)
--set      NOM=<littéral JSON>, prioritaire sur --params
--set-file NOM=<chemin d'un fichier JSON>, contenu injecté tel quel
--kit      le dossier du kit de la marque (<dossier-du-kit>) : exigé par tout script qui FABRIQUE

Pas de fabrication sans direction choisie : un script qui pose, construit ou décline ne se rend que
si le tokens.json du kit déclare une direction validée (voir direction.py). Seuls les scripts de
lecture, l'épreuve et la planche de références d'une marque neuve s'en passent.

    python render.py scripts/figma/10_decliner.js --kit <dossier-du-kit> --params travail/decline.json
"""

import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import direction  # noqa: E402

PLACEHOLDER = re.compile(r"__([A-Z][A-Z0-9_]*)__")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("--params")
    ap.add_argument("--set", action="append", default=[])
    ap.add_argument("--set-file", action="append", default=[])
    ap.add_argument("-o", "--output")
    ap.add_argument("--kit", help="dossier du kit de la marque, exigé par un script qui fabrique")
    args = ap.parse_args()

    # Avant de lire quoi que ce soit : un script qui fabrique ne se rend pas sans direction.
    if direction.exige_une_direction(args.script):
        try:
            nom, _ = direction.direction_validee(args.kit)
        except direction.DirectionAbsente as e:
            sys.exit(f"BLOQUANT  pas de fabrication sans direction choisie : {e}")
        print(f"// Direction « {nom} » ({args.kit})", file=sys.stderr)

    with open(args.script, encoding="utf-8") as f:
        code = f.read()

    values = {}
    if args.params:
        with open(args.params, encoding="utf-8") as f:
            values.update(json.load(f))
    for item in args.set_file:
        name, _, path = item.partition("=")
        with open(path, encoding="utf-8") as f:
            values[name] = json.load(f)
    for item in args.set:
        name, _, literal = item.partition("=")
        try:
            values[name] = json.loads(literal)
        except json.JSONDecodeError as e:
            sys.exit(f"--set {name} : littéral JSON invalide ({e}). Une chaîne s'écrit '\"texte\"'.")

    # Les commentaires d'en-tête citent les paramètres : on ne remplace que dans le code.
    lines = code.split("\n")
    wanted = set()
    for line in lines:
        if not line.lstrip().startswith("//"):
            wanted.update(PLACEHOLDER.findall(line))

    missing = sorted(wanted - set(values))
    if missing:
        sys.exit(f"Paramètres manquants : {', '.join(missing)}")
    unknown = sorted(set(values) - wanted)

    out = []
    for line in lines:
        if line.lstrip().startswith("//"):
            out.append(line)
            continue
        out.append(PLACEHOLDER.sub(lambda m: json.dumps(values[m.group(1)], ensure_ascii=False), line))
    rendered = "\n".join(out)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(rendered)
    else:
        sys.stdout.write(rendered)
    if unknown:
        print(f"\n// Paramètres ignorés (absents du script) : {', '.join(unknown)}", file=sys.stderr)


if __name__ == "__main__":
    main()
