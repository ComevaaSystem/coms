# Étape 5 — La présentation

**Dans l'app, à `/presentation/:client?year=…&platform=…`.** Jamais un fichier séparé ni
un Artifact : un export vieillit dès qu'une ligne bouge. Le déroulé complet vit dans
`plan_decks.story.slides` (écrit par `savePlanDeck`), typé par gabarit : corriger une
phrase ne touche pas au code.

## La mécanique

- **Canvas 16:9 fixe (1600 × 900) mis à l'échelle** par un seul `transform: scale()`.
  Tout en pixels absolus. C'est la seule façon d'être identique du portable au
  vidéoprojecteur — le `clamp()` plafonne sur grand écran et rend le texte minuscule.
- **La palette vient de la MARQUE du client**, relevée sur son site (`story.palette`),
  pas des tokens de l'app. Les tons alternent : papier, sombre, accent.
- **Les logos de plateformes viennent de `public/logos/`** — chercher ce que le dépôt
  contient avant de redessiner. Tuile blanche : une marque porte sa couleur en dur.
- Un composant unique par élément répété (note de bas de diapo, titre de colonne…) :
  douze déclarations indépendantes divergent toujours.
- **Hauteur de titre réservée à deux lignes** dans tout gabarit à colonnes, dérivée de
  la taille × interligne — les rangées restent alignées quand un titre passe à deux
  lignes.
- Chevrons français collés au mot par espace insécable fine, jamais seuls en bout de
  ligne. Interligne du corps ≥ 1,45.

## Les gabarits (types dans `plan_decks.story.slides`)

`cover` · `toc` · `divider` · `statement` · `bullets` · `cards` (colonnes à filet,
SANS numéros ni bandeaux) · `timeline` · `steps` · `flow` (boîtes reliées par flèches)
· `gantt` (frise continu/ponctuel — LE gabarit de la structure) · `funnel` (texte DANS
les étages, hauteur fixe) · `mix` (barre empilée conversion/considération/notoriété +
exemples par part) · `broad` (raisonnement + questionnaire montré pour de vrai) ·
`phases` (message par échéance) · `players` (concurrents nommés + repères sourcés) ·
`brands` (logos plateformes, fond sombre) · `shift` (aujourd'hui → ce qu'on met en
place, aligné à gauche) · `split` · `dashboard` (MAQUETTE complète de l'outil, pas
capture de l'existant) · `rituals` (la structure du point : entre / fait / sort) ·
`decisions` (pleine largeur, la dernière diapo) · `plan:structure` · `plan:budget` ·
`plan:cadence` (remplis par le plan).

## Le déroulé se CONSTRUIT, il ne se recopie pas

**Aucune diapositive ne s'écrit avant une salve de questions sur le deck lui-même.**
Le déroulé ci-dessous est celui d'UNE présentation passée (BSB) : c'est un répertoire de
ce qui a marché une fois, pas un gabarit. Le recopier pour un autre client produit un
deck générique qui sent le modèle — vu en vrai sur Simplébo (2026-08-24), refusé.

La salve, trois questions, avec défaut proposé :

1. **Quel est le récit de CE call ?** Qu'est-ce que le client craint, qu'est-ce qui doit
   le rassurer, qu'est-ce qu'il doit décider en sortant ?
2. **Qu'est-ce qui est au CENTRE ?** Ce que le client a dit attendre (chez Simplébo :
   les messages, les mots-clés, les axes — pas le budget). Ce qui est au centre prend
   les diapositives ; le reste se compresse ou disparaît.
3. **Qu'est-ce qu'on retire ?** Si le consultant a dit que le budget n'est pas le sujet,
   les diapos budget/cadence se réduisent à une ligne indicative ou sortent du deck —
   les remettre au centre contredit ce qu'il a dit.

Exemple de déroulé (BSB, à ne pas recopier) : couverture → sommaire → 01 état des lieux
(timeline des faits + constats) → 02 le raisonnement (pourquoi l'audience large, PUIS le
comment avec questionnaire, frise de structure, messages par échéance sectorielle) →
budget + répartition par étage + cadence → 03 créatif (bascule + méthode combinatoire en
flow) → canaux d'appui (concurrents nommés PUIS recommandations régie) → 04 data
(bascule d'indicateur, entonnoir, maquette dashboard) → 05 rituels → décisions du jour.

Le POURQUOI avant le COMMENT, toujours : c'est là que passe l'expertise.

## Le concret fait projeter

**Le client connaît déjà sa stratégie : ce qui lui manque, c'est de se PROJETER.** Un
deck qui reste au niveau des angles et des familles se fait dire « plus de concret »
(Simplébo, 2026-08-24). La section la plus utile est un quasi pré-brief : des exemples
de requêtes search réelles, des exemples d'annonces rédigées (accroche, texte, bouton),
l'atterrissage, et ce que testent les déclinaisons. Marqués « exemples à valider » —
les listes complètes et le QC restent dans `brief-creas`.

Deux leçons de mise en forme, même journée :

- **`shift` : `from` et `to` COURTS** (une demi-ligne), le détail part dans `body`. Le
  gabarit affiche from/to en gros : une phrase longue y devient énorme.
- **`cards` se méfie au-delà de trois items** : quatre cartes se replient en grille et
  la diapo devient illisible « dans tous les sens ». Pour des paires ou des listes
  parallèles, `split` tient mieux.

## Le contraste des tons

`soft` est rendu en TEXTE BLANC par le viewer : la couleur `palette.soft` doit être un
ton MOYEN saturé de la marque (le défaut du code : 55 % accent + 45 % blanc), jamais un
pastel. Un `soft` pâle rend la diapositive illisible — vu en vrai. Vérifier chaque ton
de la palette contre la couleur de texte que le gabarit lui applique.

## Les motifs BANNIS — déjà refusés, ne pas les réintroduire

- Cartes numérotées 01/02/03 sur trois colonnes arrondies.
- Rail d'accent vertical (`border-l-4`) sur carte — un filet horizontal fait mieux.
- Photos basse définition étirées : sans bon fichier, pas de photo du tout.
- Diapositive qui ne porte qu'une phrase — la fondre dans celle qu'elle annonce.
- Moyenne toutes campagnes confondues (un CPA global ne veut rien dire) : montrer les
  campagnes MARQUANTES, chacune avec son enseignement.
- Titres bridés en largeur ou `text-balance` : le titre prend toute la largeur.
- Phrases d'envolée (« À vous. », « la saison commande tout ») : le client a peur de ne
  pas atteindre ses objectifs, et ce qui rassure est le factuel — ce qu'on fait, dans
  quel but, avec quelle maîtrise.
- Capture de l'écran actuel quand on vend l'écran futur : maquette.

## Le ton

Vouvoiement, français, pas de tiret long. Chaque diapositive doit survivre à la
question « qu'est-ce que ça apporte ? ». Ce qui vient de sources publiques est présenté
comme tel, ce qui manque est nommé avec qui le fournira.
