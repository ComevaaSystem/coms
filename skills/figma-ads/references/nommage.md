# Nommage

Le nom d'un calque devient le nom de l'annonce au moment où on la publie (à la main ou par script),
puis, par le paramètre d'URL `visual={{ad.name}}`, une valeur que le formulaire capte et que le CRM
garde sur le lead. C'est ce qui permet de dire, des semaines plus tard, quel visuel a produit quel
lead.

**Ce n'est PAS la seule clé de rattachement.** Le reporting s'appuie d'abord sur `ad.id`, stable
quoi qu'il arrive au nom. Le nom est donc une étiquette LISIBLE doublée d'une clé technique : il
s'écrit en français, et s'il change on perd la continuité du champ `visual`, pas l'attribution.

## Convention par défaut

```
(Static) <Concept> <Format>
```

| Partie | Règle | Exemple |
|---|---|---|
| `(Static)` | Le type de créa, entre parenthèses. `(Video)`, `(Carrousel)` sur le même modèle | `(Static)` |
| Concept | Le concept en clair, tel qu'un humain le dit | `SMS`, `Chiffre plein écran` |
| Format | Dernier mot du nom : `Carré`, `Story` ou `Feed` | `Carré` |

```
(Static) SMS Carré
(Static) SMS Story
```

**Un identifiant est facultatif** et se pose devant le concept quand le brief en fournit un :
`(Static) ORI01 SMS Carré`. Il sert à retrouver la ligne du brief, pas à porter la mesure.

`09_qa.js` apparie sur le DERNIER mot du nom, avec ou sans tiret séparateur : `(Static) SMS Carré`
et `ORI01_sms - Carré` sont tous deux reconnus. Un nom dont le dernier mot n'est pas un format sort
dans `nonReconnus` et n'est contrôlé sur rien.

**Sections** : le nom de l'axe tel qu'écrit dans le brief (Origine, Fraîcheur, Preuve…).

## Pourquoi cette forme

- **Elle se lit dans le gestionnaire de publicités** sans décoder un slug : c'est là qu'on la voit
  tous les jours.
- **Le type en tête** trie les statiques, les vidéos et les carrousels d'un coup d'œil.
- **Le format en dernier** est ce qui apparie le carré et la story, dans l'épreuve comme dans le
  gestionnaire de publicités.
- L'identifiant reste possible pour retrouver le brief, sans l'imposer.

## Quand une convention existe déjà

Si l'inspection montre une planche nommée autrement (par exemple `Origine Éthiopie - Image - Feed`, ou
`FR - EN - SMS - Story` sur une marque présente dans plusieurs pays), **garder la convention du fichier** : elle est
peut-être déjà branchée sur des annonces en ligne. Deux conditions pour que la chaîne tienne :
- le format reste le dernier segment, après ` - ` ;
- tout ce qui précède identifie le concept de façon unique, et ne change plus une fois poussé.

Dans ce cas, fournir à `08_instantiate.js` des concepts dont le champ `id` suit cette convention (on peut
éditer `concepts.json` avant de lancer), plutôt que de modifier le script.

## Paires de test

Quand le brief prévoit deux concepts qui portent le même message avec un traitement différent (pour
isoler l'effet du visuel), ils gardent deux identifiants distincts. Ne jamais les fusionner ni les
harmoniser : c'est la différence de traitement qu'on mesure.

## Mise à jour

Relancer un lot avec les mêmes identifiants met à jour les textes sans créer de doublon. Renommer un
concept déjà poussé ne casse pas le reporting par `ad.id`, mais coupe la continuité du champ
`visual` : les leads d'avant gardent l'ancienne valeur. Le signaler, sans en faire un interdit.
