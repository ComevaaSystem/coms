# Gabarits : décliner les cadres d'une marque

Le chemin court du skill. Une marque qui a déjà livré une première série n'a pas besoin du template
`Ad` : ses cadres validés (faits par un DA, ou retouchés à la main) deviennent des gabarits, et
`10_decliner.js` les clone pour chaque concept neuf, réécrit les textes et éprouve le résultat.

## Sommaire
- Ce qu'est un gabarit
- Les genres et leurs anatomies
- Les noms de calques
- `gabarits.json`
- `copie.json`
- Quand la personne retouche

---

## Ce qu'est un gabarit

Un **genre** (Full Text, Chiffres, SMS, Quiz…) a deux cadres sources dans le fichier de travail : un
Carré 1080 × 1080 et une Story 1080 × 1920. Chaque concept de la copie choisit son genre ; le script
clone les deux cadres, les nomme `(Static) <libellé> Carré` et `(Static) <libellé> Story` (voir
`nommage.md`), puis remplace les textes en gardant le rythme que le DA a posé.

Les sources se prennent dans le dernier lot **validé**, retouches comprises, jamais dans une version
d'avant retouche : la retouche d'aujourd'hui est le gabarit de demain.

---

## Les genres et leurs anatomies

Le script reconnaît trois anatomies, au seul nom des calques.

| Anatomie | Reconnue par | Genres | Ce qui bouge, ce qui reste |
|---|---|---|---|
| **Barre** | pas de calque `pied` | `full`, `chiffres`, `sms`, `quiz` | Étiquette en haut et barre en bas restent ; le contenu entre les deux se pose aux gouttières du gabarit, puis se CENTRE dans la hauteur libre |
| **Pied** | un calque `pied` (un aplat en bas du cadre) à côté duquel sont posés le bouton, le sous-titre et le logo | `champ`, `pastilles` | Le pied, le sous-titre, le bouton et le logo restent ; le titre en deux tons garde son haut, le champ ou les pastilles le suivent à la gouttière du gabarit, puis le tout se centre au-dessus du pied |
| **Pied contenant** | un calque `pied` en auto layout qui CONTIENT bouton, sous-titre et logo | `full`, `sms` (et `champ`, `pastilles` sur l'anatomie pied) | Le pied reste ; étiquette, titre en deux tons et promesse (ou conversation) se centrent au-dessus de lui |

Ce que chaque genre attend dans la copie :

| Genre | Champs |
|---|---|
| `full` | étiquette, titre, promesse, sous |
| `chiffres` | étiquette, chiffre, titre, promesse, sous |
| `sms` | étiquette, titre, bulles (liste), sous |
| `quiz` | étiquette, titre, question, options (liste), sous |
| `champ` | titre, titreGris, saisie (ce qui suit le préfixe fixe du champ), sous |
| `pastilles` | titre, titreGris, pastilles (liste), sous |

Le libellé du bouton est le `cta` commun, pour tous les genres.

---

## Les noms de calques

C'est le contrat entre le DA et le script. Un calque absent n'est pas une erreur quand le genre n'en a
pas besoin (le Full Text n'a pas de chiffre) ; un calque mal nommé, si.

**Barre**

| Calque | Type | Contenu |
|---|---|---|
| `étiquette` | cadre | un texte, l'étiquette |
| `titre` | texte | |
| `chiffre` | texte | genre `chiffres` ; le titre se centre sur sa hauteur |
| `promesse` | texte | genres `full` et `chiffres` |
| `conversation` | cadre | une rangée par bulle ; chaque rangée porte un texte nommé `message`. Le script clone la dernière rangée ou retire le surplus |
| `quiz` | cadre | un texte `question`, puis une rangée (cadre) par option, qui porte un texte |
| `sous-titre` | texte | |
| `barre` | cadre | un cadre `bouton` qui porte le texte du bouton |

**Pied et pied contenant**

| Calque | Type | Contenu |
|---|---|---|
| `titre` | texte | au moins deux segments de style (deux tons) : le premier et le dernier donnent leur police, leur taille et leur couleur à chaque morceau |
| `saisie` | cadre | genre `champ` : un texte dont le premier segment est le préfixe fixe (« Je cherche », « Livré à »…), le dernier la saisie (un curseur final `|` est gardé) |
| `pastille` | cadre, une par pastille | un texte ; autant de calques que `nombrePastilles` |
| `personnage` | cadre ou image, facultatif | genre `pastilles` : il suit les pastilles quand elles bougent |
| `étiquette`, `promesse` | | pied contenant, comme en barre |
| `conversation` | cadre | pied contenant : exactement autant de rangées nommées `rangée` que de bulles (les rangées ne se ressemblent pas, le script ne clone pas) |
| `pied` | cadre | l'aplat du bas du visuel |
| `bouton` | cadre | un texte, le libellé ; à côté du pied ou dedans |
| `sous-titre`, `logo` | | à côté du pied ou dedans |

---

## `gabarits.json`

Il vit dans le dossier du kit, à côté de `tokens.json` et `chiffres.json`. Exemple fictif, pour une
marque de café en abonnement :

```json
{
  "client": "Marque",
  "fichier": "<fileKey du fichier de travail>",
  "adresse": "vous",
  "sources": {
    "chiffres": ["<id du Carré>", "<id de la Story>"],
    "quiz": ["<id du Carré>", "<id de la Story>"],
    "pastilles": ["<id du Carré>", "<id de la Story>"]
  },
  "libelles": { "chiffres": "Chiffre", "quiz": "Quiz", "pastilles": "Origines" },
  "titreGris": { "pastilles": "debut" },
  "nombrePastilles": 4,
  "limites": {
    "etiquette": 26,
    "chiffres": { "chiffre": 6, "titre": 36, "promesse": 52, "sous": 105 },
    "quiz": { "titre": 34, "question": 60, "option": 24, "sous": 95 },
    "pastilles": { "titre": 48, "pastille": [14, 16, 13, 22], "sous": 80 }
  },
  "regles": {
    "ecartMin": 32,
    "trouMax": 180,
    "zoneStory": [270, 1248],
    "apostrophe": "’",
    "insecables": ["Maison Grain"]
  }
}
```

| Clé | Ce qu'elle dit |
|---|---|
| `adresse` | `tu` ou `vous` : la copie qui fait l'inverse est refusée |
| `sources` | par genre, l'id du Carré puis celui de la Story |
| `libelles` | le nom de chaque genre dans le nom du cadre, donc dans le nom de l'annonce |
| `titreGris` | par genre, où est la partie grise du titre : `debut` ou `fin`. Défaut : `champ` au début, `pastilles` à la fin |
| `sansEtiquette` | les genres dont le gabarit n'a pas d'étiquette (par exemple `["sms"]` en pied contenant) |
| `nombrePastilles` | combien de pastilles porte le gabarit Pastilles (défaut : 2) |
| `prefixeChamp` | le préfixe fixe du champ, si le gabarit en a un : une saisie qui le répète est refusée |
| `limites` | les longueurs que le gabarit tenait, en caractères. Une liste vaut une limite par emplacement (des pastilles posées à x fixes ne tiennent pas la même longueur) |
| `regles.ecartMin` | l'écart minimal entre le titre et ce qui suit, et au-dessus du pied quand le contenu se centre |
| `regles.trouMax` | au-delà, un écart au milieu du cadre est signalé (`TROU`) |
| `regles.zoneStory` | la zone visible de la story, en y : 270 en haut, 1248 en bas (zone Reels, voir `template-ad.md`) |
| `regles.apostrophe` | `’` si la marque écrit l'apostrophe typographique : la droite est refusée |
| `regles.insecables` | les expressions qui ne se coupent jamais en fin de ligne (nom de la marque, d'un produit) |

Où est le gris, quel genre n'a pas d'étiquette, combien de pastilles, quelle apostrophe : le kit le
déclare, le script ne le devine pas.

---

## `copie.json`

```json
{
  "cta": "Je choisis mon café",
  "concepts": [
    { "genre": "chiffres", "etiquette": "Torréfié cette semaine", "chiffre": "×2",
      "titre": "Deux fois plus d’arômes", "promesse": "Un café moulu le jour de l’envoi, jamais avant",
      "sous": "Livraison offerte dès le premier sachet." },
    { "genre": "pastilles", "titre": "CHAQUE MOIS, UNE ORIGINE", "titreGris": "CHAQUE MOIS,",
      "pastilles": ["ÉTHIOPIE", "COLOMBIE", "PÉROU", "GUATEMALA"],
      "sous": "Livraison offerte dès le premier sachet." },
    { "genre": "quiz", "libelle": "Quiz Matin", "etiquette": "Votre profil", "titre": "Quel café pour votre matin ?",
      "question": "Vous le buvez comment ?", "options": ["Noir", "Avec du lait"],
      "sous": "Livraison offerte dès le premier sachet." }
  ]
}
```

Un titre en deux tons s'écrit en capitales, comme dans le gabarit, et sa partie grise commence ou
finit sur une espace : elle ne coupe jamais un mot. Un `libelle` sur un concept remplace celui du genre :
deux quiz dans le même lot se distinguent ainsi, dans l'annonce comme sur le lead. Le format complet
de chaque genre est en tête de `scripts/preparer_declinaison.py`.

---

## Quand la personne retouche

Quand la personne retouche un lot validé (tailles, placements, une gouttière), relire ses cadres et
**repointer `sources` sur eux**, puis mettre `limites` à jour si les longueurs tenues ont changé. Un
cadre déjà présent sur la page n'est jamais écrasé sans `--ecraser` : il porte peut-être cette
retouche.
