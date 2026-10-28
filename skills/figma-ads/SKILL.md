---
name: figma-ads
description: Produit des visuels statiques d'ads (Meta, LinkedIn, TikTok) directement dans Figma via le MCP Figma, dans un fichier propre et exploitable par un DA. Variables et text styles issus de la charte, un composant Ad à variantes de format (Carré 1:1, Story 9:16, Feed 4:5), auto layout partout, zones sûres Meta intégrées au template, nommage qui sert de clé de tracking jusqu'au lead, puis épreuve mécanique (zone visible story, débordement, chevauchement, polices hors charte, sauts de ligne forcés) avant livraison. Prend en entrée la sortie de brief-creas (JSON ou xlsx), une liste de concepts ou un brief libre. Déclencher dès qu'il est question de créer, décliner, mettre à jour ou vérifier des statiques, des créas ou une planche dans Figma, de construire un template d'ads, de passer un brief créas dans Figma, de décliner des concepts en feed et story, ou d'écrire sur le canvas Figma pour de la pub, même si les mots "Figma", "template" ou "planche" ne sont pas prononcés.
---

# Figma ads : des statiques propres via le MCP Figma

Le principe qui tient tout le reste : **Claude ne dessine pas les ads, il instancie un composant.**
La qualité vient du template (variables, styles, auto layout, zones sûres). La vitesse vient des
propriétés de composant. La fiabilité vient de l'épreuve mécanique. Un visuel dessiné à la main
par script finit toujours avec une couleur en dur, un texte qui déborde ou un calque « Frame 12 ».

Enchaînement : `brief-creas` produit les concepts, ce skill les pose dans Figma et les éprouve, le
feu vert se demande SUR cette épreuve, puis l'utilisateur publie, avec l'outil de son choix, les
annonces dont les noms ont été montrés.

---

## Prérequis, à vérifier avant le premier appel

1. **Charger `figma-use`.** Obligatoire avant tout `use_figma`. Skill `/figma-use` s'il est installé,
   sinon la ressource MCP `skill://figma/figma-use/SKILL.md` via `get_figma_skill`. Pour construire le
   template (étape 2), charger aussi `figma-generate-library`. Passer `skillNames` sur chaque appel
   (`figma-use`, ou `resource:figma-use` si chargé par ressource).
2. **Droits.** Siège Full et droit d'édition sur le fichier. Un siège Dev ne permet que la lecture.
   En cas de doute ou d'erreur d'accès : `whoami`.
3. **Le fichier.** URL du fichier de travail de la marque (le `fileKey` est le segment après
   `/design/`). Pas de fichier : charger `figma-create-new-file`, puis `create_new_file`.
4. **La charte.** Par ordre de préférence :
   - le dossier du kit de la marque (`<dossier-du-kit>`, voir plus bas), produit par exemple par
     `brand-kit` ;
   - la charte que l'utilisateur fournit (PDF, fichier Figma de marque, DESIGN.MD) ;
   - la charte relevée sur le site public, qui reste un brouillon : le signaler.
   Sans charte, le dire et s'arrêter. Ne jamais inventer une DA. La traduction de la charte vers le
   format BRAND attendu par les scripts est décrite dans `references/template-ad.md`.
5. **Une direction validée.** `render.py` refuse de rendre un script qui fabrique (02 à 08, 10, et
   tout script à venir) sans `--kit <dossier-du-kit>` dont le `tokens.json` déclare
   `"directions": {"<nom>": {"valide": "<qui>, <date> : ce qui a été choisi"}}`. Seuls 01, 01b, 09
   et 11 (la planche de références) s'en passent. Marque sans charte : planche de références, choix
   d'une direction avec la personne, la ligne écrite dans le kit, PUIS le premier pixel. Marque dont
   la direction est sa propre charte : la même ligne, sous le nom `charte`.
   `python scripts/direction.py <dossier-du-kit>` dit où en est un kit.

Chaque exécution `use_figma` peut demander une approbation à l'utilisateur. Si un appel revient sans
approbation, ne pas relancer en boucle : dire où on en est et ce qui attend son feu vert.

### Le dossier du kit

Un dossier par marque, fourni par l'utilisateur ou créé avec lui. Les scripts y lisent tout ; rien ne
se retape dans un appel.

| Fichier | Rôle | Qui l'écrit |
|---|---|---|
| `tokens.json` | Couleurs, polices, et la ligne `directions` sans laquelle rien ne se fabrique | `brand-kit`, `onboarding_kit.py`, ou à la main |
| `DESIGN.MD` | La charte en clair : rôles, typographie, logo, règles, voix | idem |
| `gabarits.json` | Les cadres sources d'une marque qui a déjà ses gabarits (chemin court) | à la main, depuis le dernier lot validé |
| `chiffres.json` | Le registre des chiffres et affirmations, avec leur source et leur statut | à la main, avant que le chiffre n'entre dans une copie |
| `logos/`, `fonts/` | Les fichiers du logo (SVG de préférence) et des polices | l'utilisateur ; `kit_assets.py` les recense |

---

## Chemin court : la marque a déjà ses gabarits

C'est le cas courant dès qu'une marque a livré une première série. On ne construit rien, on ne
cherche rien : on décline. Le but : **un seul passage de fabrication, pas trois**. Le détail (genres,
anatomies, noms de calques, format de `gabarits.json`) est dans `references/gabarits.md`.

1. **Tout vient du contexte donné, rien ne se cherche.** Le fichier Figma de travail et la page de la
   campagne, l'URL de destination, et `<dossier-du-kit>/gabarits.json` : cadres sources par genre,
   tutoiement ou vouvoiement, longueurs tenues par le gabarit, règles de placement. Pas de
   `gabarits.json` : le créer en lisant les cadres du dernier lot VALIDÉ (retouches comprises),
   jamais ceux d'avant retouche.
2. **La copie se valide avant le premier pixel.** Écrire `travail/copie.json`, puis
   ```bash
   python scripts/preparer_declinaison.py --kit <dossier-du-kit>/gabarits.json \
       --copie travail/copie.json --page "<page campagne>" -o travail/decline.json
   ```
   Il refuse un tiret long, un saut de ligne, une espace en trop, un vouvoiement chez une marque qui
   tutoie (et l'inverse), deux concepts du même nom ; il alerte sur un infinitif écrit en -ez et une
   copie plus longue que ce que le gabarit tenait. **Les chiffres se relisent contre
   `<dossier-du-kit>/chiffres.json`** (le registre, à côté de `gabarits.json`) : une affirmation
   `retire` BLOQUE, sous n'importe quelle graphie (« 30% », « 30 % », insécable) ; une affirmation
   `a_confirmer` et tout chiffre absent du registre ALERTENT. Un chiffre neuf s'ajoute au registre
   avec sa source et sa date AVANT d'entrer dans la copie, jamais l'inverse. Montrer son tableau à
   la personne et **attendre son accord**.
3. **Fabriquer en un appel** : `python scripts/render.py scripts/figma/10_decliner.js --kit
   <dossier-du-kit> --params travail/decline.json`, puis `use_figma`. Le script clone, réécrit, place
   les blocs au rythme du gabarit en CENTRANT le contenu dans la hauteur libre, puis rend ses
   `bloquants` : `DEBORDE`, `ECART_SERRE`, `HORS_ZONE_SURE`, `MOT_COUPE`, `ORPHELIN`, `CHEVAUCHE`,
   `SAUT_DE_LIGNE`, `TIRET_LONG`, `APOSTROPHE` (voir `references/controle-qualite.md`). Un cadre déjà
   présent n'est jamais écrasé sans `--ecraser` : il porte peut-être une retouche. Un bloquant se
   corrige dans `copie.json`, puis on relance ; une capture à la fin, pas entre chaque tour.
4. **Le feu vert se demande sur l'épreuve.** Le message qui demande le « go » porte les bloquants
   restants et la liste EXACTE des noms d'annonce (le nom de chaque cadre). Le go vaut pour l'état
   qui a été éprouvé : si le fichier a bougé depuis, relancer l'épreuve et remontrer avant de publier.

Quand la personne retouche un lot validé, relire ses cadres (tailles, placements) et **repointer
`gabarits.json` sur eux** : la retouche d'aujourd'hui est le gabarit de demain.

**Quand la marque retire un chiffre**, le passer `retire` dans `chiffres.json` (date, raison) puis
relire le fichier livré en entier, en lecture seule :
```bash
FIGMA_TOKEN=<jeton> python scripts/verifier_chiffres.py --kit <dossier-du-kit> --figma <fileKey> [--a-confirmer]
```
Il liste chaque cadre qui porte une affirmation retirée ou un chiffre inconnu, avec son lien ; les
pages `Charte` et d'archive ne disent que les retirées. La correction passe par la copie et une
nouvelle déclinaison, jamais par une retouche du texte dans Figma.

**Un motion ne passe pas par Figma.** Il se rend avec un outil vidéo (HyperFrames, par exemple, et
son skill) depuis UN modèle par marque, qui lit les couleurs, les polices et les logos du même dossier
du kit. Une variante (une offre, une langue, un format) est une ligne du lot, jamais une copie du
projet. La
même épreuve s'applique avant tout rendu (zone sûre story 270 à 1248, débordement, police hors
charte, chiffres relus contre `chiffres.json`), puis la même règle : la copie se valide avec la
personne avant le rendu, les vidéos se regardent avant d'être annoncées.

---

## Planche de références : une marque neuve

Une marque sans kit ne reçoit AUCUNE annonce au premier passage. Elle reçoit un fichier
« <Marque> - Statics » avec une page `Charte` (Marque, Couleurs, Typographie, Photos en stock,
Éléments ; `Charte / <enseigne>` par enseigne d'un groupe) et une page `Archive` où ses visuels
existants sont posés tels quels. C'est sur cette planche que la direction se choisit.

1. **Relever** : le fichier Figma de la marque en lecture seule (couleurs pondérées par surface,
   couleurs de texte, polices et tailles), la charte en ligne lue en brut (`curl`, jamais un résumé
   produit par un outil de lecture web, qui invente), les annonces en diffusion. Les rôles se jugent
   sur le rendu des visuels.
2. **Rassembler** : `scripts/onboarding_assets.py`, avec `export` (rendus REST des cadres d'un
   fichier source, jeton dans `FIGMA_TOKEN`), `fetch` (images par adresse), `sheet` (UNE planche SVG
   qui embarque un groupe d'images), `upload` (POST sur les URL d'`upload_assets`).
   `createImageAsync` n'existe pas dans `use_figma`, et une URL d'envoi par image coûte un appel
   d'outil par image : la planche SVG s'importe en un cadre dont chaque enfant est un rectangle
   nommé, rempli de son image.
3. **Poser** : `scripts/figma/11_charte.js` (DATA décrit en tête), rendu par `render.py`. Un rôle
   sans valeur s'affiche « à mesurer ».
4. **Écrire le kit** : `scripts/onboarding_kit.py` tire DESIGN.MD et tokens.json du MÊME DATA, pour
   que la planche et le kit ne divergent pas au premier retour.
5. **Rendre le kit utilisable hors Figma** (motion, vidéo, présentation) : les logos exportés du
   fichier dans `logos/`, les fichiers de police dans `fonts/`, puis `scripts/kit_assets.py
   <dossier-du-kit>` recense le tout dans `tokens.assets`, et choisit dans `tokens.typo` le fichier
   du titre et du texte sur le nom de style que le fichier déclare. La famille se lit dans la table
   `name` du fichier, pas dans son nom ; un fichier DEMO va dans `assets.essai`, jamais dans un rendu
   publié. Une police Google s'obtient sur github.com/google/fonts ; une police commerciale vient de
   la marque, qui en détient la licence.

**La retouche à la main est la référence** : dans Marque, seuls les logos officiels en VECTORIEL
(horizontal, vertical), pas de PNG ; et quand la charte offre ses packs (éléments, pictos,
illustrations, fonds, en SVG dans des zip), ils entrent en vectoriel, un cadre par pack posé à droite
des sections (`Éléments`, `Pictos`, `Illustrations`, `Fond`), au lieu de quelques vignettes raster.

Trois pièges connus : `fontName` refuse toute clé autre que `family` et `style` ; `resize()` repasse
un auto layout en FIXED, donc la hauteur AUTO se pose APRÈS ; un SVG d'Illustrator garde son plan de
travail de 1920 × 1080, le logo se resserre sur ses enfants.

---

## Étape 1 : inspecter, sans rien écrire

Lancer `scripts/figma/01_inspect.js`, puis `01b_inspect_page.js` sur chaque page, **tous les appels
01b dans le même message** (une page par appel, règle `figma-use`).

| Constat | Décision |
|---|---|
| Des cadres validés existent, faits ou retouchés par un DA | Chemin court : les déclarer dans `gabarits.json` et décliner |
| Un template d'ads fait par un DA existe | Le réutiliser. Lire ses propriétés (métadonnées de composant, voir `component-patterns.md` de `figma-use`), adapter les noms de propriétés dans 08. Ne rien reconstruire |
| Le composant `Ad` de ce skill existe (page « Template ads ») | Récupérer l'id du set et passer à l'étape 3 |
| Rien d'exploitable | Construire le template, étape 2 |
| Une planche existe déjà | Relever sa convention de nommage (noms des enfants de section) et la garder, voir `references/nommage.md` |

Ne jamais modifier une page que le skill n'a pas créée (« Template ads » et « Planche ») sans demande
explicite. Le travail du DA ne se touche pas.

---

## Étape 2 : construire le template (une fois par fichier)

Lire `references/template-ad.md` avant de commencer. Un appel par ligne, dans l'ordre, et on ne
passe pas à la suivante tant que le retour n'est pas propre. Chaque script se rend avec
`--kit <dossier-du-kit>` (prérequis 5).

| # | Script | Paramètres | Vérifier dans le retour |
|---|---|---|---|
| 1 | `02_tokens.js` | BRAND | Pas d'`error`. 16 variables créées ou mises à jour |
| 2 | `03_text_styles.js` | BRAND | Pas d'`error`. Si `POLICE_INDISPONIBLE` : montrer `stylesDisponibles`, corriger BRAND, relancer |
| 3 | `04_subcomponents.js` | aucun | Garder `logoId` et `ctaId` |
| 4 | `05_ad_variant.js` × 3 | FORMAT, LOGO_ID, CTA_ID | `widths` égales à `attendu`, `warnings` vide. En séquence, pas en parallèle |
| 5 | `06_ad_props.js` × 3 | VARIANT_ID, LOGO_ID | 9 clés par variante |
| 6 | `07_combine.js` | VARIANT_IDS | Garder `componentSetId`. 3 variantes, 10 propriétés (dont Format) |
| 7 | `get_screenshot` du set | | Textes non rognés, rien dans les marges, grille de variantes lisible |

Ensuite, le logo. Si le SVG de la marque est disponible, remplacer le contenu du composant `Logo` par
`figma.createNodeFromSvg(svg)` (jamais un logo reconstruit en formes) : toutes les ads suivent. Sinon
le laisser en placeholder et l'inscrire comme asset bloquant.

**Un fichier par marque.** Le plan Pro limite à 4 modes par collection : on n'empile pas les marques
en modes. Pour une nouvelle marque, l'utilisateur duplique un fichier déjà équipé, puis on relance 02
et 03 avec la nouvelle charte. Tout le reste suit, puisque tout est lié aux variables et aux styles.

---

## Étape 3 : préparer les concepts

```bash
python scripts/build_concepts.py brief.json travail/
```

L'entrée est le JSON de `brief-creas` (celui de `build_brief_xlsx.py`). Si on n'a que le xlsx, le
relire avec openpyxl et reconstruire ce JSON. Si on n'a qu'une liste libre, l'écrire dans ce format.

Le script produit `travail/concepts.json` et un fichier par lot dans `travail/lots/`. Il :
- nomme chaque concept comme son annonce, par exemple `(Static) Chiffre plein écran`
  (`--avec-id` y ajoute le numéro du brief : `(Static) ORI01 Chiffre plein écran`) ;
- répartit le message sans le réécrire : la question dans Hook, la réponse dans Sous-titre
  (`--no-split` pour tout garder dans Hook) ;
- sort chaque concept en **Carré + Story** : la planche attend la paire, et avec le template la story
  ne coûte plus rien. `--feed45` ajoute le 4:5 pour une marque qui le réclame ;
- groupe par axe, 3 concepts maximum par lot ;
- **refuse** un message vide, un tiret long, un retour à la ligne ou un identifiant en double, et
  alerte au-delà de 90 caractères d'accroche.

Une erreur se corrige dans le brief, jamais en retouchant le texte dans Figma : une correction validée
qui n'existe que dans Figma disparaît au prochain passage (règle de `brief-creas`). Afficher le
tableau des concepts à l'utilisateur avant de poser quoi que ce soit.

---

## Étape 4 : poser la planche

```bash
python scripts/render.py scripts/figma/08_instantiate.js --kit <dossier-du-kit> --params travail/lots/lot-01.json --set AD_SET_ID='"<id>"'
```

Un appel `use_figma` par lot, **en séquence** (les positions dépendent des lots précédents). Chaque
axe devient une section de la page « Planche ». Chaque concept devient une colonne : Carré en haut,
Story dessous, nommés `<concept> Carré` et `<concept> Story`, avec export PNG 1x déjà réglé.

Regarder la capture rendue en fin de script avant de passer au lot suivant. Un problème se corrige
ciblé (le concept fautif), pas en reposant tout le lot.

Le script est idempotent : relancé sur un lot, il met à jour les textes des concepts existants au
lieu de les dupliquer. C'est la bonne façon d'intégrer un retour.

---

## Étape 5 : épreuve mécanique

Lancer `09_qa.js` sur chaque section (paramètre `SECTION_ID`, ou `null` pour toute la planche).
Lire `references/controle-qualite.md` pour la correction de chaque code.

Boucle : corriger, relancer 09, capture. Un concept est lançable quand il n'a plus aucun bloquant.
Puis la relecture visuelle sur capture (même fichier), qui juge ce que 09 ne voit pas : lisibilité en
une seconde, contraste, hiérarchie, look IA, et toute teinte de la palette par défaut de Tailwind que
la page `Charte` du fichier ne porte pas.

**Ne jamais publier de sa propre initiative**, même en pause. C'est l'utilisateur qui décide, sur
l'épreuve et la liste des noms d'annonce qu'elle donne.

**Une annonce déjà en ligne dont seul le lien ou le texte change** ne repasse pas par la planche : on
modifie l'annonce elle-même, sa créa refaite à l'identique, d'abord vérifiée puis posée sur le « go ».
Un nouveau visuel, lui, repasse par la planche.

---

## Étape 6 : livrer

Réponse inline, dans cet ordre :
1. Lien du fichier, page « Planche » (ou la page de la campagne, au chemin court)
2. Un tableau en quatre colonnes : concept, axe, formats, statut (lançable, à corriger, visuel à fournir)
3. Les bloquants restants, un par ligne
4. La liste exacte des noms d'annonce, telle qu'elle partira
5. Ce qui revient au DA : poser les visuels dans les calques « Visuel », remplacer le logo
   placeholder, ajuster ce que la capture montre de faible (contraste texte sur image, hiérarchie)
6. Les points à valider côté marque, repris du brief (chiffres, promesses)

---

## Règles non négociables, et pourquoi

- **Zéro valeur en dur.** Chaque couleur est liée à une variable `color/*`, chaque texte utilise un
  style `Ad/*`. La charte change en un point, et « police hors charte » ne peut pas arriver.
- **Auto layout partout, un seul calque absolu (Visuel).** Un texte qui s'allonge pousse ses voisins
  au lieu de les chevaucher.
- **Pas de retour à la ligne forcé.** Les textes sont en hauteur auto avec une largeur contrainte :
  c'est la largeur qui fait le retour. Un `\n` casse dès que la police ou la taille change.
- **Instances jamais détachées, textes jamais édités à la main.** Tout passe par les propriétés, ou
  par la copie au chemin court. Une instance détachée ne suit plus le template et sort du contrôle.
- **Chaque calque est nommé.** Pas de « Frame 12 » ni de « Rectangle 4 ».
- **Petits appels, ids retournés, validation après chaque étape.** C'est la règle première de
  `figma-use`, les scripts la respectent : ne pas les fusionner en un gros script.
- **Pas de look IA.** Pas de dégradé décoratif, pas d'émoji, pas de glassmorphism, pas de faux
  compteur, pas de palette Tailwind par défaut. Le style vient de la charte. Si `anti-slop-ui` est
  disponible, son contrat de génération s'applique aussi aux choix visuels faits dans Figma.
- **Aucun tiret long** dans un texte posé sur un visuel.
- **Aucun chiffre sans sa ligne dans le registre**, avec sa source et sa date.

---

## Les scripts

Les scripts de `scripts/figma/` s'exécutent **dans Figma** via `use_figma`, pas en local. Leurs
paramètres s'écrivent `__NOM__` et se remplissent avec `scripts/render.py`, qui refuse de rendre un
script incomplet. Ne jamais envoyer un script qui contient encore un `__NOM__` hors commentaire.

| Script | Rôle | Paramètres |
|---|---|---|
| `01_inspect.js` | Inventaire du fichier (lecture seule) | aucun |
| `01b_inspect_page.js` | Contenu d'une page (lecture seule, appels en parallèle) | PAGE_ID |
| `02_tokens.js` | Collection « Ads », variables scopées | BRAND |
| `03_text_styles.js` | Styles Ad/Hook, Sous-titre, Preuve, CTA, Mentions | BRAND |
| `04_subcomponents.js` | Page « Template ads », composants Logo et CTA | aucun |
| `05_ad_variant.js` | Structure d'une variante de format | FORMAT, LOGO_ID, CTA_ID |
| `06_ad_props.js` | Propriétés de composant d'une variante | VARIANT_ID, LOGO_ID |
| `07_combine.js` | Component set « Ad » | VARIANT_IDS |
| `08_instantiate.js` | Pose d'un lot de concepts sur la planche | AD_SET_ID, SECTION, CONCEPTS, SCREENSHOT |
| `09_qa.js` | Épreuve mécanique (lecture seule) | SECTION_ID |
| `10_decliner.js` | Déclinaison des gabarits d'une marque, épreuve comprise | PAGE, SOURCES, CONCEPTS, CTA, REGLES |
| `11_charte.js` | Pages Charte et Archive d'une planche de références | DATA |

En local (Python 3, sans paquet à installer ; `onboarding_assets.py` appelle `curl`, et Pillow ou
`sips` pour les images) :

| Script | Rôle |
|---|---|
| `direction.py` | La direction validée d'un kit, que `render.py` exige avant de fabriquer |
| `render.py` | Remplissage des paramètres d'un script Figma |
| `build_concepts.py` | Brief vers concepts et lots |
| `preparer_declinaison.py` | Copie relue, puis paramètres de 10 |
| `chiffres.py` | Le registre des chiffres et sa détection (module) |
| `verifier_chiffres.py` | Un fichier Figma entier relu contre le registre (`FIGMA_TOKEN`) |
| `onboarding_assets.py` | Matière de la planche de références : export, téléchargement, planche SVG, envoi |
| `onboarding_kit.py` | DESIGN.MD et tokens.json tirés du DATA de 11 |
| `kit_assets.py` | Logos et polices du kit recensés dans `tokens.json` |

Sur erreur `use_figma`, suivre `safeToRetryWithoutCanvasRead` : `true`, corriger et relancer ;
`false`, relire le canvas avant toute nouvelle écriture.

---

## Références

- `references/template-ad.md` : anatomie du composant, dimensions, zones sûres, variables, styles,
  propriétés, format BRAND et traduction depuis la charte. À lire avant l'étape 2.
- `references/gabarits.md` : le chemin court, genres, anatomies, noms de calques, `gabarits.json` et
  `copie.json`.
- `references/nommage.md` : convention de noms, lien avec le tracking, conventions existantes.
- `references/controle-qualite.md` : chaque code de l'épreuve, sa gravité et sa correction, plus la
  relecture visuelle que le script ne fait pas.
