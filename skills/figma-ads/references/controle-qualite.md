# Contrôle qualité

Deux passes : l'épreuve mécanique (`09_qa.js` pour la planche, `10_decliner.js` pour une déclinaison,
objective et rejouable) puis la relecture visuelle sur capture (ce qu'un script ne voit pas).

## Épreuve mécanique : codes, gravité, correction

| Code | Gravité | Ce que ça veut dire | Correction |
|---|---|---|---|
| FORMAT | Bloquant | Le cadre n'a pas les dimensions de son format | Instance redimensionnée ou mauvaise variante : supprimer le calque et relancer le lot |
| PAIRE_INCOMPLETE | Bloquant | Un concept n'a pas son Carré ou sa Story | Vérifier `formats` dans le lot, relancer le lot |
| SAUT_DE_LIGNE | Bloquant | Un texte contient un retour forcé | Corriger le texte dans le brief, régénérer les lots, relancer. La largeur fait le retour |
| DEBORDEMENT | Bloquant | Un texte sort du cadre | Texte trop long : raccourcir dans le brief, ou masquer Preuve / Sous-titre sur ce concept |
| HORS_ZONE_SURE | Bloquant (Story) | Un texte entre dans la bande que l'interface Reels couvre, au-delà de y 1248 | Même traitement que DEBORDEMENT. En dernier recours, une taille Ad/Hook plus petite via BRAND.type, pour tout le fichier |
| BAS_DE_STORY_VIDE | Alerte (Story) | Rien ne couvre la bande 1248 à 1920, dont 292 px restent visibles en placement Stories | Étendre le calque Visuel jusqu'au bas du cadre, ou poser un aplat de charte |
| HORS_MARGE | Alerte (feed) | Un texte entre dans la marge de 100 px | À corriger si le texte touche presque le bord, sinon toléré |
| CHEVAUCHEMENT | Bloquant | Deux textes, ou un texte et le logo, se recouvrent | Signe d'un calque sorti de l'auto layout : vérifier que l'instance n'a pas été modifiée à la main |
| POLICE_HORS_CHARTE | Bloquant | Une police absente des styles Ad/* | Réappliquer le style Ad/* du calque. Si elle vient du template, corriger le template |
| TEXTE_PLACEHOLDER | Bloquant | Un texte du template n'a pas été remplacé (ou logo placeholder visible) | Propriété non renseignée : compléter le concept et relancer, ou poser le logo de la marque |
| VISUEL_A_FOURNIR | Bloquant | Le calque Visuel est visible mais sans image | Poser l'image (travail DA), ou passer le concept en full text (`visuel: false`) |
| STYLE_DETACHE | Alerte | Bonne police, mais pas de style Ad/* | Réappliquer le style : sans lui, la charte ne se propage plus |
| COULEUR_EN_DUR | Alerte | Un texte n'est pas lié à une variable | Relier à `color/text`, `color/text-muted` ou `color/on-accent` |
| TEXTE_VIDE | Alerte | Un texte visible est vide | Masquer le calque via sa propriété Afficher, ou le remplir |
| DETACHE | Alerte | Le calque n'est plus une instance d'Ad | Recréer depuis le composant : une instance détachée ne suit plus le template |

### Les codes propres à la déclinaison (`10_decliner.js`)

| Code | Gravité | Ce que ça veut dire | Correction |
|---|---|---|---|
| DEBORDE | Bloquant | Même gouttières serrées à leur plancher, le sous-titre passe sous la barre. Gabarit à pied : le champ ou les pastilles touchent le pied ou sortent par la marge droite, le sous-titre touche le logo ou pousse le logo hors du pied, ou le libellé du bouton prend plus de lignes que le gabarit | Raccourcir la copie : le titre ou la saisie, une pastille, le sous-titre, le `cta` |
| CHEVAUCHE | Bloquant | Gabarit Pastilles : une pastille couvre le TEXTE d'une autre. Mesuré sur les rectangles tournés (axes séparateurs), jamais sur les boîtes englobantes : celles des pastilles penchées se recouvrent largement sur des cadres propres. Une pastille qui mord de quelques pixels sur une autre sans toucher son texte est la pile voulue | Raccourcir la pastille de l'emplacement fautif ; la limite par emplacement de `gabarits.json` (`"pastille": [14, 16, 13, 22]`) le disait déjà en alerte |
| ECART_SERRE | Bloquant | Gabarit à barre : le titre touche le bloc suivant (moins de `ecartMin`) | Idem : c'est la copie qui est trop longue |
| MOT_COUPE | Bloquant | Un groupe insécable (mot, ou mots liés par une espace insécable) est plus large que sa boîte : il se coupe au milieu | Changer le mot (« L'ARÔME » plutôt que « L'ASTRINGENCE » en titre de 120 px) |
| ORPHELIN | Bloquant | La dernière ligne ne porte que trois caractères ou moins | Reformuler ; un mot long seul en bas d'un titre de trois lignes, lui, est voulu |
| HORS_ZONE_SURE | Bloquant (Story) | Le haut du contenu passe au-dessus de `zoneStory[0]`, ou le bas (barre, pied) sous `zoneStory[1]` | Raccourcir la copie ; si le gabarit lui-même sort, c'est le gabarit qu'on reprend |
| SAUT_DE_LIGNE, TIRET_LONG | Bloquant | Un retour forcé ou un tiret long dans un texte posé | Corriger dans `copie.json` (`preparer_declinaison.py` les refuse déjà) |
| APOSTROPHE | Bloquant | Une apostrophe droite chez une marque qui écrit ’ (`regles.apostrophe`) | Corriger dans `copie.json` |
| TROU | Alerte | Plus de `trouMax` entre deux blocs du milieu (gabarit à pied : entre le champ ou les pastilles et le pied) | Vérifier sur la capture ; souvent une copie bien plus courte que le gabarit |
| EXISTE | Alerte | Le cadre est déjà sur la page, gardé tel quel | Relancer avec `--ecraser` seulement si aucune retouche n'est à garder |

Des pastilles posées à x fixes ne tiennent pas la même longueur : la première bute sur la deuxième
bien avant que la dernière ne touche la marge. Une seule limite, calée sur la plus large, laisse
passer au premier emplacement une pastille qui glisse sous sa voisine, sans un bloquant. D'où deux gardes : la limite
par emplacement, relue par `preparer_declinaison.py` avant tout pixel, et CHEVAUCHE, mesuré après.

Un concept est **lançable** quand il n'a aucun bloquant. Les alertes se corrigent quand même avant
livraison : elles annoncent les bloquants du prochain changement de charte.

## Principes de correction

- **Corriger à la source.** Un texte se corrige dans le brief puis se repose avec 08, jamais en éditant
  le calque : sinon la correction disparaît au prochain passage.
- **Corriger ciblé.** Un script de correction touche le concept fautif, pas le lot entier.
- **Ne pas maquiller.** Réduire la taille d'un seul concept pour le faire tenir casse l'homogénéité de
  la planche. Mieux vaut raccourcir le message, et le signaler si ça touche une formulation validée.
- Après chaque correction : relancer 09, puis une capture.

## Relecture visuelle (sur capture)

Le script ne juge pas le rendu. Sur la capture de chaque section, vérifier :

1. **Lisible en une seconde** sur un fil mobile : l'accroche se lit d'un coup d'œil, à taille réelle réduite.
2. **Un seul message par visuel** : pas deux idées qui se battent (règle `brief-creas`).
3. **Contraste** texte sur visuel : sur une photo, un aplat ou un voile issu de la charte, jamais un
   dégradé décoratif. Viser au moins 4.5:1 sur le texte courant.
4. **Hiérarchie** : l'accroche domine, la preuve reste secondaire, le CTA se voit sans crier.
5. **Pas de look IA** : pas d'émoji, pas de glassmorphism, pas de badge « nouveau » gratuit, pas de faux
   compteur. Aucune teinte de la palette par défaut de Tailwind (`#2563EB`, `#334155`, `#64748B`…)
   dans un cadre, sauf si la page `Charte` du fichier la porte : c'est elle qui dit les couleurs de la
   marque, comme ses polices. Une teinte vraiment choisie se déclare sur la page `Charte`, elle ne se
   tolère pas ailleurs.
6. **Cohérence avec la destination** : le CTA promet ce que la landing ou le formulaire tient.
7. **Paires de test** : les deux concepts d'une paire ne diffèrent que par le traitement.

Tout point de relecture qui n'est pas corrigé dans la foulée part dans la section "ce qui revient au DA"
de la livraison.
