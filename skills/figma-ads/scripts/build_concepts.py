#!/usr/bin/env python3
"""
Transforme un brief créas (format JSON de brief-creas) en concepts prêts pour Figma :
identifiants stables, textes répartis par calque, formats, lots de 3 concepts max par axe.

Usage:
    python build_concepts.py brief.json sortie_dir [--cta "En savoir plus"] [--no-split] [--feed45] [--avec-id] [--lot 3]

Entrée (seul "concepts" est obligatoire, les champs en plus sont ignorés) :
{
  "client": "Nom de la marque",
  "concepts": [
    {"n": 1, "axe": "Origine", "concept": "Le chiffre plein écran",
     "message": "Votre café du matin manque de goût ? Recevez-le moulu le jour de l’envoi.",
     "visuel": "...", "traitement": "...", "priorite": "P1",
     "sous_titre": "optionnel", "preuve": "optionnel", "cta": "optionnel", "layout": "image|texte"}
  ]
}

Sortie dans sortie_dir :
  concepts.json            tous les concepts + erreurs + alertes
  lots/lot-01.json ...     un fichier par appel 08_instantiate.js, directement utilisable par render.py --params

Règles appliquées :
- Le message validé n'est jamais réécrit. Découpage par défaut au premier "?" suivi de texte :
  la question va dans Hook, la réponse dans Sous-titre (le texte reste identique, réparti sur deux calques).
  --no-split garde le message entier dans Hook.
- Identifiant : « (Static) <Concept> », ex. « (Static) SMS ». --avec-id le préfixe du numéro de
  brief : « (Static) ORI01 SMS ». C'est ce nom, suivi du format, qui devient le nom de l'annonce ;
  le reporting, lui, s'appuie d'abord sur ad.id.
- Chaque concept sort en Carré + Story (la planche attend la paire). --feed45 ajoute le 4:5.
- Erreurs bloquantes : message vide, tiret long ou demi-cadratin, retour à la ligne dans un message, identifiant en double.
- Alertes : accroche de plus de 90 caractères, sous-titre de plus de 120.
"""

import argparse
import json
import os
import re
import sys
import unicodedata

TEXT_ONLY_HINTS = ("full text", "plein texte", "texte seul", "typographique", "100% texte", "fond uni")
DASHES = ("\u2014", "\u2013")


def ascii_fold(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")


def slugify(s, max_len=28):
    s = re.sub(r"[^a-z0-9]+", "-", ascii_fold(s).lower()).strip("-")
    if len(s) <= max_len:
        return s
    cut = s[:max_len]
    return cut.rsplit("-", 1)[0] if "-" in cut else cut


def axe_codes(axes):
    codes = {}
    used = set()
    for axe in axes:
        base = re.sub(r"[^A-Z]", "", ascii_fold(axe).upper()) or "AXE"
        for length in (3, 4, 5):
            code = base[:length]
            if code not in used:
                break
        else:
            i = 2
            while f"{base[:3]}{i}" in used:
                i += 1
            code = f"{base[:3]}{i}"
        codes[axe] = code
        used.add(code)
    return codes


def split_message(msg):
    m = re.match(r"^(.*?\?)\s+(\S.*)$", msg, flags=re.S)
    if not m:
        return msg, ""
    return m.group(1).strip(), m.group(2).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("brief")
    ap.add_argument("out_dir")
    ap.add_argument("--cta", default="En savoir plus")
    ap.add_argument("--no-split", action="store_true")
    ap.add_argument("--feed45", action="store_true")
    ap.add_argument("--avec-id", dest="avec_id", action="store_true")
    ap.add_argument("--lot", type=int, default=3)
    args = ap.parse_args()

    with open(args.brief, encoding="utf-8") as f:
        brief = json.load(f)
    raw = brief.get("concepts") or []
    if not raw:
        sys.exit("Aucun concept dans le brief.")

    axes = []
    for c in raw:
        axe = (c.get("axe") or "Sans axe").strip()
        if axe not in axes:
            axes.append(axe)
    codes = axe_codes(axes)

    errors, warnings, concepts, seen = [], [], [], set()
    for i, c in enumerate(raw, 1):
        axe = (c.get("axe") or "Sans axe").strip()
        n = c.get("n", i)
        name = (c.get("concept") or f"concept {n}").strip()
        msg = (c.get("message") or "").strip()
        # Le nom se lit dans le gestionnaire de publicités : il reste en clair.
        # L'identifiant de brief ne s'ajoute que s'il est demandé.
        ref = f"{codes[axe]}{int(n):02d} " if args.avec_id else ""
        cid = f"(Static) {ref}{name}"
        label = f"{cid} ({name})"

        if cid in seen:
            errors.append(f"{label} : identifiant en double, renommer le concept ou corriger le numéro")
        seen.add(cid)
        if not msg:
            errors.append(f"{label} : message vide")
        for field in ("message", "sous_titre", "preuve", "cta"):
            value = c.get(field) or ""
            if any(d in value for d in DASHES):
                errors.append(f"{label} : tiret long dans {field}, à corriger dans le brief avant Figma")
            if "\n" in value:
                errors.append(f"{label} : retour à la ligne dans {field}, la largeur du calque gère le retour")

        if c.get("sous_titre") or args.no_split:
            hook, sous = msg, (c.get("sous_titre") or "").strip()
        else:
            hook, sous = split_message(msg)

        if len(hook) > 90:
            warnings.append(f"{label} : accroche de {len(hook)} caractères, risque de débordement en story")
        if len(sous) > 120:
            warnings.append(f"{label} : sous-titre de {len(sous)} caractères")

        hint_zone = " ".join(str(c.get(k) or "") for k in ("visuel", "traitement")).lower()
        layout = (c.get("layout") or "").lower()
        visuel = not (layout == "texte" or any(h in hint_zone for h in TEXT_ONLY_HINTS))

        concepts.append({
            "id": cid,
            "n": n,
            "axe": axe,
            "concept": name,
            "section": axe,
            "hook": hook,
            "sous_titre": sous,
            "preuve": (c.get("preuve") or "").strip(),
            "cta": (c.get("cta") or args.cta).strip(),
            "visuel": visuel,
            "formats": ["Carré", "Story"] + (["Feed"] if args.feed45 else []),
            "priorite": c.get("priorite", ""),
            "note": c.get("note", ""),
        })

    os.makedirs(os.path.join(args.out_dir, "lots"), exist_ok=True)
    for old in os.listdir(os.path.join(args.out_dir, "lots")):
        if old.startswith("lot-") and old.endswith(".json"):
            os.remove(os.path.join(args.out_dir, "lots", old))

    lots = []
    for axe in axes:
        group = [c for c in concepts if c["axe"] == axe]
        for k in range(0, len(group), args.lot):
            lots.append({"SECTION": axe, "CONCEPTS": group[k:k + args.lot], "SCREENSHOT": True})

    if not errors:
        for idx, lot in enumerate(lots, 1):
            with open(os.path.join(args.out_dir, "lots", f"lot-{idx:02d}.json"), "w", encoding="utf-8") as f:
                json.dump(lot, f, ensure_ascii=False, indent=2)

    summary = {
        "client": brief.get("client", ""),
        "concepts": concepts,
        "lots": [{"lot": i, "section": l["SECTION"], "ids": [c["id"] for c in l["CONCEPTS"]]} for i, l in enumerate(lots, 1)],
        "errors": errors,
        "warnings": warnings,
    }
    with open(os.path.join(args.out_dir, "concepts.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"{len(concepts)} concepts, {len(lots)} lots, {len(errors)} erreurs, {len(warnings)} alertes")
    for c in concepts:
        print(f"  {c['id']:<36} {'+'.join(c['formats']):<18} visuel={'oui' if c['visuel'] else 'non'}")
    for e in errors:
        print(f"ERREUR  {e}")
    for w in warnings:
        print(f"ALERTE  {w}")
    if errors:
        print("Aucun lot écrit : corriger les erreurs dans le brief puis relancer.")
        sys.exit(1)


if __name__ == "__main__":
    main()
