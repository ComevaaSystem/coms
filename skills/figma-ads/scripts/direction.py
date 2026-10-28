#!/usr/bin/env python3
"""
Pas de fabrication sans direction choisie.

Une marque sans charte, dont le premier lot est fabriqué avant qu'une direction soit prise, sort
avec le look par défaut de l'outil : palette Tailwind, composition centrée et empilée, le visuel
« fait par une IA ». Une règle « entretien de goût d'abord » qui vit dans une note se perd ; elle
vit ici, dans le script par lequel TOUTE fabrication passe (`render.py`).

Une direction est validée quand le `tokens.json` du kit en déclare une :

    "directions": {
      "<nom>": {"valide": "<qui>, <date> : ce qui a été choisi, et sur quoi", ...}
    }

Une marque dont la direction EST sa propre charte la déclare de la même façon, sous le nom
`charte`. On déclare ce qui est permis : un kit sans cette ligne, quel que soit le reste de ce
qu'il porte, ne fabrique pas.

Usage en ligne de commande (lecture seule) :
    python direction.py <dossier-du-kit>
"""

import json
import os
import sys

# Ce qui ne fabrique rien : les lectures, l'épreuve, et la planche de références d'une marque neuve,
# qui PRÉCÈDE le choix d'une direction. Tout autre script (y compris un script de demain) en exige
# une.
SANS_DIRECTION = {"01_inspect.js", "01b_inspect_page.js", "09_qa.js", "11_charte.js"}

QUOI_FAIRE = (
    "Pour une marque sans charte : poser la planche de références (11_charte.js), "
    "choisir une direction avec la personne, puis l'écrire dans le tokens.json du kit : "
    '"directions": {"<nom>": {"valide": "<qui>, <date> : ce qui a été choisi"}}. '
    "Pour une marque dont la charte fait foi, la même ligne sous le nom « charte »."
)


class DirectionAbsente(Exception):
    """La fabrication ne commence pas : le message dit pourquoi et quoi faire."""


def exige_une_direction(script):
    return os.path.basename(script) not in SANS_DIRECTION


def direction_validee(kit):
    """Le nom et la validation de la première direction validée du kit, ou `DirectionAbsente`."""
    if not kit:
        raise DirectionAbsente(f"aucun kit donné (--kit <dossier-du-kit>). {QUOI_FAIRE}")
    dossier = os.path.expanduser(kit)
    # On accepte le chemin du tokens.json ou de gabarits.json : c'est leur dossier qui est le kit.
    if os.path.isfile(dossier):
        dossier = os.path.dirname(dossier)
    chemin = os.path.join(dossier, "tokens.json")
    if not os.path.isdir(dossier):
        raise DirectionAbsente(f"le kit {dossier} n'existe pas. {QUOI_FAIRE}")
    if not os.path.exists(chemin):
        raise DirectionAbsente(f"{chemin} n'existe pas : la marque n'a pas encore de kit. {QUOI_FAIRE}")
    try:
        with open(chemin, encoding="utf-8") as f:
            tokens = json.load(f)
    except (OSError, UnicodeDecodeError, json.JSONDecodeError) as e:
        # Un fichier illisible n'est pas une marque sans direction : c'est une faute à corriger.
        raise DirectionAbsente(f"{chemin} est illisible ({e}).")
    directions = tokens.get("directions") if isinstance(tokens, dict) else None
    if not isinstance(directions, dict) or not directions:
        raise DirectionAbsente(f"{chemin} ne déclare aucune direction. {QUOI_FAIRE}")
    for nom, d in directions.items():
        valide = d.get("valide") if isinstance(d, dict) else None
        if isinstance(valide, str) and valide.strip():
            return nom, valide.strip()
    raise DirectionAbsente(
        f"{chemin} déclare {', '.join(directions)} mais aucune n'est validée (champ « valide » vide ou absent). "
        f"{QUOI_FAIRE}"
    )


def main():
    if len(sys.argv) != 2:
        sys.exit("Usage : python direction.py <dossier-du-kit>")
    try:
        nom, valide = direction_validee(sys.argv[1])
    except DirectionAbsente as e:
        sys.exit(f"BLOQUANT  pas de fabrication sans direction choisie : {e}")
    print(f"Direction « {nom} » : {valide}")


if __name__ == "__main__":
    main()
