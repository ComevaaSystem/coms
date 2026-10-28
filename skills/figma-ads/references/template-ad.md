# Template Ad : anatomie et spécifications

## Sommaire
- Pages du fichier
- Formats et zones sûres
- Variables (collection "Ads")
- Text styles
- Composants Logo et CTA
- Composant Ad : arbre des calques
- Propriétés de composant
- Format BRAND et traduction depuis la charte
- Adapter le template à une marque sans le casser

---

## Pages du fichier

| Page | Contenu | Qui y touche |
|---|---|---|
| Template ads | Composants Logo, CTA, set Ad | Le skill la crée. Le DA peut la retravailler (voir dernière section) |
| Planche | Une section par axe, une colonne par concept | Le skill pose, le DA habille les visuels |
| Toute autre page | Travail du DA | Personne, sauf demande explicite |

---

## Formats et zones sûres

| Variante | Dimensions | Marges de sécurité (haut, bas, côtés) | Zone utile |
|---|---|---|---|
| **Carré 1:1** (défaut) | 1080 × 1080 | 100, 100, 100 | 880 × 880 |
| Story 9:16 | 1080 × 1920 | 270, 672, 65 | 950 × 978 (Stories + Reels) |
| Feed 4:5 (sur demande) | 1080 × 1350 | 100, 100, 100 | 880 × 1150 |

**Le feed se livre en carré.** Le 4:5 reste dans le set pour une marque qui le réclame, mais la
paire standard est Carré + Story : c'est ce que `build_concepts.py` produit et ce que
`PAIRE_INCOMPLETE` exige.

**Un seul 9:16 sert Stories ET Reels**, et c'est le plus exigeant des deux qui commande.

| Placement | Ce que l'interface pose en bas | Contenu sûr jusqu'à |
|---|---|---|
| Stories | bouton d'action, barre « envoyer un message » : 20 % | y 1540 |
| Reels | légende, colonne j'aime/commenter/partager, bandeau audio : 35 % | y 1248 |

Depuis mars 2026, Meta sert le même 9:16 sur les quatre placements verticaux : on ne choisit pas où
il tombe. Le template dessine donc pour **270 en haut, 1248 en bas, 65 sur les côtés**, soit la zone
Reels. Un visuel réglé sur les 20 % historiques des Stories perd son bouton dès qu'il passe en Reels.

**Et les 672 px du bas ne sont pas du vide.** En Reels, l'interface les couvre. En Stories, seuls
380 le sont : les 292 px entre 1248 et 1540 restent VISIBLES. Le calque `Visuel`, absolu et plein
cadre, doit donc descendre jusqu'à 1920 : sinon la story montre un trou là où l'interface ne couvre
rien. `09_qa.js` le contrôle (`BAS_DE_STORY_VIDE`).

Feed : pas d'interface par dessus l'image, mais environ 100 px de respiration évite les recadrages et
garde le texte loin des bords.

Ces valeurs vivent dans des variables `safe/*` liées aux paddings du composant. Si Meta change sa
spec, on change la variable, pas le template.

---

## Variables (collection "Ads", mode unique "Default")

| Variable | Type | Scopes | Rôle |
|---|---|---|---|
| color/bg | COLOR | FRAME_FILL, SHAPE_FILL | Fond du visuel |
| color/surface | COLOR | FRAME_FILL, SHAPE_FILL | Placeholder du visuel, aplats secondaires |
| color/accent | COLOR | FRAME_FILL, SHAPE_FILL | Fond du CTA |
| color/text | COLOR | TEXT_FILL | Accroche, sous-titre, logo placeholder |
| color/text-muted | COLOR | TEXT_FILL | Preuve |
| color/on-accent | COLOR | TEXT_FILL | Libellé du CTA |
| space/sm, space/md, space/lg | FLOAT | GAP | 16, 32, 56 |
| radius/cta | FLOAT | CORNER_RADIUS | 16 (999 pour une pilule) |
| cta/pad-x, cta/pad-y | FLOAT | GAP | 40, 24 |
| safe/feed | FLOAT | GAP | 100 |
| safe/story-top, safe/story-bottom, safe/story-side | FLOAT | GAP | 270, 672, 65 (le bas est calé sur Reels) |

Les scopes sont toujours explicites : une variable en ALL_SCOPES apparaît dans tous les sélecteurs et
pollue le fichier du DA.

---

## Text styles

| Style | Rôle charte | Taille | Interlignage | Approche |
|---|---|---|---|---|
| Ad/Hook | display | 88 | 105 % | -1 % |
| Ad/Sous-titre | body | 44 | 125 % | 0 |
| Ad/Preuve | body | 34 | 125 % | 0 |
| Ad/CTA | cta | 36 | 100 % | 0 |
| Ad/Mentions | body | 22 | 120 % | 0 |

Les tailles sont pensées pour 1080 px de large, lues sur mobile. Une accroche de 88 px tient environ
20 caractères par ligne dans la zone utile feed : au-delà de 90 caractères, elle passe sur 5 lignes et
menace la zone sûre story. D'où l'alerte de `build_concepts.py`.

---

## Composants Logo et CTA

**Logo** : composant auto layout, contenu placeholder « LOGO MARQUE ». Remplacer ce contenu par le SVG
de la marque, hauteur de référence 80 px. Toutes les instances suivent.

**CTA** : composant auto layout horizontal, fond `color/accent`, paddings `cta/pad-x` et `cta/pad-y`,
rayons `radius/cta`, libellé en style Ad/CTA couleur `color/on-accent`, propriété TEXT `Label`.

---

## Composant Ad : arbre des calques

```
Ad (COMPONENT_SET)
└ Format=Carré 1:1 | Format=Story 9:16 | Format=Feed 4:5   (COMPONENT)
  auto layout vertical, taille fixe, clip, fond color/bg
  paddings = variables safe/*, répartition SPACE_BETWEEN
  ├ Visuel       RECTANGLE, seul calque absolu, plein cadre, contraintes STRETCH, fond color/surface
  ├ Header       auto layout horizontal, largeur FILL
  │ └ Logo       instance de Logo
  ├ Texte        auto layout vertical, largeur FILL, gap space/md
  │ ├ Hook       TEXT, Ad/Hook, color/text, hauteur auto, largeur FILL
  │ └ Sous-titre TEXT, Ad/Sous-titre, color/text, hauteur auto, largeur FILL
  └ Footer       auto layout vertical, largeur FILL, gap space/sm
    ├ Preuve     TEXT, Ad/Preuve, color/text-muted, hauteur auto, largeur FILL
    └ CTA        instance de CTA
```

Pourquoi cette structure :
- Header, Texte et Footer sont les seuls enfants en flux, répartis en SPACE_BETWEEN dans la zone sûre.
  Le logo reste en haut, le CTA en bas, l'accroche au milieu, quel que soit le format.
- Le visuel est absolu parce qu'il remplit tout le cadre, marges comprises. Tout le reste est en flux :
  un texte plus long pousse, il ne chevauche jamais.
- Les textes sont en hauteur auto avec une largeur imposée par le parent : le retour à la ligne vient de
  la largeur, pas d'un `\n`.
- Si le contenu dépasse la zone sûre, il sort par le bas du padding : l'épreuve le détecte (HORS_ZONE_SURE
  ou DEBORDEMENT) au lieu de le laisser passer silencieusement.

---

## Propriétés de composant

| Propriété | Type | Relié à | Défaut |
|---|---|---|---|
| Format | VARIANT | variantes | Carré 1:1 (défaut), Story 9:16, Feed 4:5 |
| Hook | TEXT | Hook.characters | texte placeholder |
| Sous-titre | TEXT | Sous-titre.characters | texte placeholder |
| Afficher sous-titre | BOOLEAN | Sous-titre.visible | vrai |
| Preuve | TEXT | Preuve.characters | texte placeholder |
| Afficher preuve | BOOLEAN | Preuve.visible | vrai |
| Afficher visuel | BOOLEAN | Visuel.visible | vrai (faux = full text sur color/bg) |
| Logo | INSTANCE_SWAP | Logo.mainComponent | composant Logo |
| Afficher logo | BOOLEAN | Logo.visible | vrai |
| Afficher CTA | BOOLEAN | CTA.visible | vrai |

Le libellé du CTA se règle sur l'instance CTA imbriquée (propriété `Label`), ce que fait 08.

Ces noms sont le contrat entre le template et `08_instantiate.js`. Un DA peut tout restyler, tant que
ces noms restent.

---

## Format BRAND et traduction depuis la charte

```json
{
  "colors": {
    "bg": "#F4F1EA",
    "surface": "#CFC8B8",
    "text": "#16213E",
    "text-muted": "#4A5068",
    "accent": "#E4572E",
    "on-accent": "#FFFFFF"
  },
  "fonts": {
    "display": { "family": "Inter", "style": "Bold" },
    "body": { "family": "Inter", "style": "Regular" },
    "cta": { "family": "Inter", "style": "Semi Bold" }
  },
  "type": { "Ad/Hook": 80 },
  "floats": { "radius/cta": 999 }
}
```

`colors` et `fonts` sont obligatoires, `type` et `floats` optionnels (surcharges ponctuelles).

La charte arrive sous la forme que l'utilisateur a : un `DESIGN.MD` ou un `tokens.json` du dossier du
kit, un PDF de charte, un fichier Figma de marque. La traduction se fait par rôle, pas par
ressemblance de nom :

| Rôle BRAND | Ce qu'on cherche dans la charte |
|---|---|
| bg | Le fond dominant des communications |
| surface | Une teinte neutre voisine du fond, pour les aplats |
| text | La couleur de texte principale sur ce fond |
| text-muted | Une version adoucie du texte, lisible (contraste AA sur bg) |
| accent | La couleur d'action ou de marque la plus forte |
| on-accent | La couleur de texte lisible sur accent |
| display | La police de titre |
| body | La police de texte courant |
| cta | La police des boutons, souvent la body en graisse plus forte |

Depuis un `tokens.json` produit par `brand-kit` : `paper` vers bg, `paperInset` vers surface, `ink`
vers text, `textMuted` vers text-muted, `accent` vers accent. on-accent n'y figure pas : prendre, parmi
les couleurs du kit, celle qui tient un contraste AA sur accent (souvent `paper` ou `ink`).

Depuis un `tokens.json` écrit par `onboarding_kit.py` (rôles relevés sur les visuels existants) :
`fond` vers bg, `carte` vers surface, `encre` vers text, `accent` vers accent, `texteBouton` vers
on-accent. text-muted n'y figure pas : le mesurer sur les visuels, ou dire qu'il manque.

Montrer la table de correspondance à l'utilisateur avant 02 quand la charte ne nomme pas clairement ces
rôles. Si un rôle n'a pas d'équivalent (pas de text-muted, par exemple), le dire plutôt que d'inventer
une couleur hors charte. Respecter les interdits de la charte : ils priment sur le template.

Les noms de style de police ne se devinent pas ("Semi Bold" et non "SemiBold"). 03 vérifie leur
existence et rend la liste des styles disponibles si l'un manque.

---

## Adapter le template à une marque sans le casser

Autorisé, et même souhaitable : changer les valeurs des variables et des styles (relancer 02 et 03),
retravailler la composition d'une variante (alignements, taille du logo, aplat derrière le texte pour le
contraste, position du bloc texte), ajouter des calques décoratifs issus de la charte.

À ne pas faire : renommer ou supprimer une propriété, détacher les instances Logo et CTA dans le
composant, remplacer l'auto layout par des positions absolues, mettre une couleur ou une police en dur.
Chacun de ces gestes casse soit l'instanciation (08), soit l'épreuve (09).
