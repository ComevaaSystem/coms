# Charte Comevaa, plugin Figma

Le panneau de controle de la charte. Un geste, tout le fichier suit : les variables
(couleurs, radius), plus tout ce que les variables Figma ne savent pas porter, les
degrades des CTA et des capsules, les grains, le verre depoli.

## Installation (une fois, 30 secondes)

1. Ouvrir Figma **desktop** (pas le navigateur)
2. Menu Plugins > Development > **Import plugin from manifest...**
3. Choisir `manifest.json` dans ce dossier
4. Le plugin apparait dans Plugins > Development > **Charte Comevaa**

## Usage

- Ouvrir le fichier "Comevaa, Directions site", lancer le plugin
- Les pickers se remplissent avec la charte actuelle (lue dans les variables)
- Changer ce qu'on veut, puis **Appliquer a tout le fichier**
- Les presets (Edito, Maison, Orbit) sont ceux du simulateur du site

Ce qui se passe a l'application :

1. Les variables de la collection "Charte" sont ecrites : les 1 400 et quelques
   elements branches suivent instantanement
2. L'accent pale est derive de l'accent (accent + 78 % de papier blanc), jamais
   choisi a la main : deux reglages pour la meme chose finissent par diverger
3. Les degrades de la famille accent sont recomposes depuis le nouvel accent
   (les degrades Figma ne se branchent pas sur une variable)
4. Tous les effets NOISE prennent les valeurs des curseurs grain, tous les
   BACKGROUND_BLUR prennent la valeur du curseur verre depoli

## Export vers le web

**Exporter tokens.json + CSS** telecharge deux fichiers :

- `tokens.json`, la charte complete en donnees
- `charte.css`, les memes tokens en custom properties CSS, degrades compris
  (via color-mix, derives de --accent comme dans Figma)

C'est le meme referentiel qui pilote Figma et le site : la promesse de l'offre
Marque, demontree sur nous-memes.

## Limites connues

- Le plugin suppose la collection de variables "Charte" (creee dans le fichier).
  S'il ne la trouve pas, il le dit et ne touche a rien.
- Les degrades sont detectes par leur teinte (proche de l'accent courant) : un
  degrade volontairement d'une autre couleur ne sera jamais touche.
- Les nouveaux elements doivent utiliser les variables, pas repiquer les hex :
  regle du board 04 du referentiel.
