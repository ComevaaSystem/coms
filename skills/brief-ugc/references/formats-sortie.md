# Formats de sortie

## Règle générale

Itération rapide en conversation, livrable structuré en fichier. Un fichier créé trop tôt fige des formulations qui ne sont pas encore validées.

| Livrable | Format | Quand |
|---|---|---|
| Thèmes et angles | Inline | Toujours. Ça s'itère avant d'écrire les scripts |
| Hooks, corps, CTA en itération | Inline | Tant que le client corrige les formulations |
| Scripts UGC consolidés | Markdown | Une fois les formulations validées |
| Feuille de tournage et combinaisons | xlsx | Au moment d'envoyer la personne tourner |
| Récap client | Inline | Toujours |

---

## Scripts UGC (markdown)

```
# Client — Scripts UGC [qui parle]

## Principe
Qui parle et pourquoi. Ce que ce format porte, ce qu'il ne remplace pas.
Rappel du montage combinatoire.

## Règles de tournage
[liste]

## Destination des CTA
Ce vers quoi le clic renvoie et les contraintes que ça impose.

---

# Thème 1 — Nom

**Mots clés à faire passer**
mot · mot · mot

### Hooks (3 à 5 sec)
- "..."

### Corps (15 à 20 sec)
- **Le principe.** ...
- **Le bénéfice concret.** ...
- **L'effet sur l'activité.** ...

### CTA
- "..."

### Inserts optionnels
- ...

---

[thèmes suivants]

---

# Volume à tourner
X hooks · X corps · X CTA, durée estimée de tournage

# Points à valider avant tournage
[liste numérotée de ce qui engage le client publiquement]
```

Les corps sont écrits en points, jamais en texte rédigé. La personne face caméra doit parler, pas réciter.

---

## Feuille de tournage et matrice (xlsx)

Générée par `scripts/build_ugc_matrix.py`.

**Onglet Tournage.** Une ligne par élément à filmer, avec un identifiant unique.
ID · Thème · Type (Hook / Corps / CTA) · Texte ou points à faire passer · Durée cible · Prises · Fait

L'identifiant est ce qui rend la mesure possible : chaque variante montée référence les éléments qui la composent, donc on lit la performance hook par hook plutôt que vidéo par vidéo.

**Onglet Combinaisons.** Une ligne par variante montée.
Réf variante · Thème · ID hook · ID corps · ID CTA · Texte du hook · Statut

La référence de variante suit le format `THEME-H1-C2-A1`, directement exploitable comme nom de créa dans Meta ou TikTok.

**Onglet Inserts.** Les plans d'illustration disponibles par thème, avec leur statut de production.

---

## Récap client (inline)

1. Qui tourne et pourquoi ce choix
2. Ce qu'on lui demande concrètement (volume, durée, matériel)
3. Ce qui est validé, ce qui reste à trancher
4. Les points qui engagent le client publiquement
5. Ce qui bloque le tournage s'il y a lieu
