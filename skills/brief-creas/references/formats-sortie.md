# Formats de sortie

## Règle générale

Itération rapide en conversation, livrable structuré en fichier. Un fichier créé trop tôt fige des formulations qui ne sont pas encore validées.

| Livrable | Format | Quand |
|---|---|---|
| Axes et propositions de valeur | Inline | Toujours. Ça s'itère message par message avec le client |
| Messages d'ads | Inline | Idem. Fichier seulement une fois figés |
| Brief créas | xlsx 3 onglets | Une fois les messages validés |
| Scripts UGC | Markdown | Une fois les axes validés |
| Parcours de conversion | Markdown ou xlsx | Markdown si linéaire, xlsx si branchements multiples |
| Mail de récap client | Inline | Toujours |
| Récap kick off | Inline, puis mail | Toujours |

---

## Axes et messages (inline)

```
**Nom de l'axe**, une ligne de résumé du bénéfice
- "Problème ou attente ? Réponse de la solution."
- "Problème ou attente ? Réponse de la solution."
- "Problème ou attente ? Réponse de la solution."
```

Pas de tableau, pas de fioriture. Terminer par une recommandation de priorisation et les points qui restent à trancher.

---

## Brief créas (xlsx)

**Onglet 1, Brief créas.** Une ligne par concept.
N° · Axe · Concept · Message à afficher (texte exact) · Principe visuel · Traitement et ton · Format prioritaire · Assets requis · Priorité · Inspi (lien) · Note

Couleur sur la colonne priorité : P1, P2, P3.
Colonne message figée en volet, c'est celle qu'on relit le plus.

**Onglet 2, Règles et inspi.** Les règles de production numérotées, puis le tableau des sources d'inspiration avec une colonne "ce qu'on y cherche et sa limite". Toujours préciser la limite d'usage d'une source : une bibliothèque d'ads SaaS ne dicte pas le ton pour une cible artisan.

**Onglet 3, Assets à fournir.** Asset · Pour quels concepts · Statut · Bloquant oui/non. La colonne bloquant en évidence, c'est le chemin critique de la production.

Le script `scripts/build_brief_xlsx.py` génère ce fichier à partir d'un JSON.

---

## Scripts UGC (markdown)

```
# Client — Scripts UGC [qui parle]

## Principe
Qui parle et pourquoi. Rappel du montage combinatoire.

## Règles de tournage
[liste]

## Destination des CTA
Ce vers quoi le clic renvoie et les contraintes que ça impose.

---

# Thème 1 — Nom

**Mots clés à faire passer**
mot · mot · mot

### Hooks (3 à 5 sec)
### Corps (15 à 20 sec)
### CTA
### Inserts optionnels

---

# Volume à tourner
X hooks · X corps · X CTA, durée estimée de tournage

# Points à valider avant tournage
[liste numérotée]
```

Les corps sont écrits en points, jamais en texte rédigé. La personne face caméra doit parler, pas réciter.

---

## Parcours de conversion (xlsx)

Étape · Type · Question ou texte · Options · Branchement et logique · Mapping CRM et note.

Lignes de notes en fin de tableau pour le scoring, le mapping et les points à trancher. Surligner les écrans de fin et les notes dans deux couleurs distinctes.

---

## Mail de récap client (inline)

Objet, puis :
1. Ce qu'on a acté (chiffres, dates, périmètre)
2. De votre côté
3. De mon côté
4. Points en suspens
5. Le chemin critique, deux ou trois phrases sur ce qui bloque le lancement

Terminer hors du mail, en note pour le lecteur, par ce qui mérite d'être cadré à l'oral plutôt qu'écrit noir sur blanc.
