#!/usr/bin/env python3
"""
La matière de la planche de références d'une marque neuve, rassemblée en local avant d'être posée
par 11_charte.js.

Il n'y a pas de copier-coller entre deux fichiers Figma, et use_figma ne charge pas une image
par son adresse (`createImageAsync` n'est pas supporté). Le seul chemin : un fichier local, POSTé
sur une URL rendue par `upload_assets`, qui rend un imageHash. Ce script fait les deux bouts.

    # 1. Exporter des cadres d'un fichier source (API REST, jeton dans la variable FIGMA_TOKEN)
    python onboarding_assets.py export --file <fileKey> --ids 1:2,2:38 --out travail/archive

    # 2. Télécharger des images par adresse (annonces en diffusion, photos d'une charte en ligne)
    python onboarding_assets.py fetch --list images.json --out travail/meta
    #    images.json = [{"nom": "...", "url": "..."}]

    # 3. Emballer un manifeste en UNE planche SVG (images embarquées, une par rectangle nommé)
    python onboarding_assets.py sheet --manifest travail/archive/manifest.json --largeur 540 -o travail/s-archive.svg
    #    Une URL d'upload_assets par fichier coûte un appel d'outil par image ; une planche,
    #    un seul. Figma l'importe en un cadre dont chaque enfant porte son image et son nom.

    # 4. Envoyer : une URL d'upload_assets par fichier, dans l'ordre
    python onboarding_assets.py upload --pairs pairs.json -o travail/uploads.json
    #    pairs.json = [{"url": "<submitUrl>", "file": "travail/s-archive.svg"}]

Chaque étape écrit un manifeste (nom, fichier, largeur, hauteur ; puis hash, nodeId, et w, h d'une
image matricielle) : c'est lui qu'on recopie dans DATA, jamais une valeur retapée. Un logo PNG porte
ses w, h dans DATA.logos.

Les tailles d'image se lisent avec Pillow s'il est installé, sinon avec `sips` (macOS) ; le
redimensionnement de `sheet` suit le même ordre.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

UA = {"User-Agent": "Mozilla/5.0"}


def token():
    t = os.environ.get("FIGMA_TOKEN")
    if t:
        return t
    sys.exit("FIGMA_TOKEN introuvable : poser un jeton d'accès personnel Figma dans cette variable")


def api(path):
    req = urllib.request.Request("https://api.figma.com/v1/" + path, headers={"X-Figma-Token": token()})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def slug(s):
    s = re.sub(r"[^\w.-]+", "-", s, flags=re.UNICODE).strip("-")
    return s[:80] or "visuel"


try:
    from PIL import Image
except ImportError:
    Image = None


def taille(path):
    if Image is not None:
        try:
            with Image.open(path) as im:
                return im.size
        except OSError:
            return (None, None)
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", path], capture_output=True, text=True).stdout
    w = re.search(r"pixelWidth: (\d+)", out)
    h = re.search(r"pixelHeight: (\d+)", out)
    return (int(w.group(1)), int(h.group(1))) if w and h else (None, None)


def get(url, dest, essais=3):
    import time

    for k in range(essais):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
                f.write(r.read())
            return
        except OSError:
            if k == essais - 1:
                raise
            time.sleep(2 * (k + 1))


def export(args):
    os.makedirs(args.out, exist_ok=True)
    ids = [i for i in args.ids.split(",") if i]
    manifest = []
    for k in range(0, len(ids), 50):
        lot = ids[k : k + 50]
        q = urllib.parse.quote(",".join(lot))
        nodes = api(f"files/{args.file}/nodes?ids={q}&depth=1")["nodes"]
        urls = api(f"images/{args.file}?ids={q}&format=png&scale={args.scale}")["images"]
        for i in lot:
            doc = (nodes.get(i) or {}).get("document") or {}
            url = urls.get(i)
            if not url:
                print(f"sans rendu : {i}", file=sys.stderr)
                continue
            nom = doc.get("name", i)
            dest = os.path.join(args.out, f"{slug(nom)}-{i.replace(':', '_')}.png")
            manifest.append({"nom": nom, "id": i, "url": url, "file": dest})
    with ThreadPoolExecutor(8) as ex:
        list(ex.map(lambda m: get(m.pop("url"), m["file"]), manifest))
    for m in manifest:
        m["w"], m["h"] = taille(m["file"])
    json.dump(manifest, open(os.path.join(args.out, "manifest.json"), "w"), ensure_ascii=False, indent=1)
    print(json.dumps({"n": len(manifest), "manifest": os.path.join(args.out, "manifest.json")}, ensure_ascii=False))


def fetch(args):
    os.makedirs(args.out, exist_ok=True)
    items = json.load(open(args.list, encoding="utf-8"))
    manifest = []
    for n, it in enumerate(items, 1):
        ext = ".png" if ".png" in it["url"].split("?")[0].lower() else ".jpg"
        manifest.append({"nom": it["nom"], "url": it["url"], "file": os.path.join(args.out, f"{n:02d}-{slug(it['nom'])}{ext}")})

    def un(m):
        try:
            get(m["url"], m["file"])
        except Exception as e:
            m["erreur"] = str(e)

    with ThreadPoolExecutor(8) as ex:
        list(ex.map(un, manifest))
    for m in manifest:
        if "erreur" not in m:
            m["w"], m["h"] = taille(m["file"])
        m.pop("url")
    json.dump(manifest, open(os.path.join(args.out, "manifest.json"), "w"), ensure_ascii=False, indent=1)
    print(json.dumps({"n": len(manifest), "erreurs": [m["nom"] for m in manifest if "erreur" in m]}, ensure_ascii=False))


def reduire(src, dest, cote, fmt):
    """Une copie de `src` dont le plus grand côté fait `cote` pixels."""
    if Image is not None:
        with Image.open(src) as im:
            im = im.convert("RGBA" if fmt == "png" else "RGB")
            im.thumbnail((cote, cote))
            im.save(dest, "PNG" if fmt == "png" else "JPEG", quality=90)
        return
    subprocess.run(["sips", "-Z", str(cote), "-s", "format", fmt, src, "--out", dest], capture_output=True)


def sheet(args):
    import base64
    import html

    manifest = [m for m in json.load(open(args.manifest, encoding="utf-8")) if m.get("w") and "erreur" not in m]
    if args.min:
        manifest = [m for m in manifest if max(m["w"], m["h"]) >= args.min]
    parts, x, H = [], 0, 0
    for m in manifest:
        tw = args.largeur
        th = round(m["h"] * tw / m["w"])
        fmt = "png" if m["file"].lower().endswith(".png") else "jpeg"
        tmp = m["file"] + (".sheet.png" if fmt == "png" else ".sheet.jpg")
        reduire(m["file"], tmp, max(tw, th), fmt)
        b = base64.b64encode(open(tmp, "rb").read()).decode()
        parts.append(f'<image id="{html.escape(m["nom"], quote=True)}" x="{x}" y="0" width="{tw}" height="{th}" href="data:image/{fmt};base64,{b}"/>')
        x += tw + 20
        H = max(H, th)
    open(args.o, "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{x}" height="{H}" viewBox="0 0 {x} {H}">' + "".join(parts) + "</svg>")
    print(json.dumps({"images": len(parts), "octets": os.path.getsize(args.o), "fichier": args.o}))


def upload(args):
    pairs = json.load(open(args.pairs, encoding="utf-8"))

    def un(p):
        f = p["file"]
        ctype = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "svg": "image/svg+xml", "webp": "image/webp"}[f.rsplit(".", 1)[1].lower()]
        out = subprocess.run(["curl", "-s", "-F", f"file=@{f};type={ctype}", p["url"]], capture_output=True, text=True).stdout
        try:
            r = json.loads(out)
        except json.JSONDecodeError:
            r = {"erreur": out[:200]}
        res = {"file": f, "hash": r.get("imageHash"), "nodeId": r.get("placedOnNodeId") or (r.get("nodeIds") or [None])[0], "brut": r if not r.get("success") else None}
        # Un PNG arrive dans Figma en cadre d'environ 240 × 180, quelles que soient ses proportions :
        # w et h se recopient dans DATA.logos, 11_charte.js s'en sert si Figma ne rend pas la taille.
        if ctype != "image/svg+xml":
            res["w"], res["h"] = taille(f)
        return res

    with ThreadPoolExecutor(8) as ex:
        res = list(ex.map(un, pairs))
    json.dump(res, open(args.o, "w"), ensure_ascii=False, indent=1)
    print(json.dumps({"n": len(res), "echecs": [r for r in res if r["brut"]]}, ensure_ascii=False)[:2000])


def main():
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    e = sp.add_parser("export")
    e.add_argument("--file", required=True)
    e.add_argument("--ids", required=True)
    e.add_argument("--scale", default="0.5")
    e.add_argument("--out", required=True)
    f = sp.add_parser("fetch")
    f.add_argument("--list", required=True)
    f.add_argument("--out", required=True)
    s = sp.add_parser("sheet")
    s.add_argument("--manifest", required=True)
    s.add_argument("--largeur", type=int, default=540)
    s.add_argument("--min", type=int, default=0, help="écarte les images plus petites (vignettes de 160 px)")
    s.add_argument("-o", required=True)
    u = sp.add_parser("upload")
    u.add_argument("--pairs", required=True)
    u.add_argument("-o", required=True)
    a = ap.parse_args()
    {"export": export, "fetch": fetch, "sheet": sheet, "upload": upload}[a.cmd](a)


if __name__ == "__main__":
    main()
