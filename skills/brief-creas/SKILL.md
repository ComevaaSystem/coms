---
name: brief-creas
description: Transforme le contexte d'un client paid (site, brief, transcript de kick off, fiche mission) en axes de communication, messages d'ads, briefs créas statiques et scripts UGC combinatoires prêts à tourner. Produit des livrables exploitables directement par un DA et par un dirigeant face caméra, avec contrôle qualité systématique des formulations. Déclencher dès qu'il est question de préparer des créas, de trouver des angles ou des propositions de valeur, d'écrire des messages d'ads, de briefer un DA, de préparer des scripts UGC ou vidéo, de lancer les campagnes d'un nouveau client, ou après un kick off client, même si les mots "brief" ou "créa" ne sont pas prononcés.
---

# Brief créas — méthodo Quentin

Chaîne de production complète : contexte client → axes → messages → brief DA → scripts UGC → parcours de conversion. Chaque étape s'appuie sur la précédente, on ne saute pas d'étape.

---

## Étape 0 — Absorber le contexte

Avant toute production, rassembler ce qui existe : site du client, fiche mission, transcript du kick off, comptes ads existants, retours terrain du sales.

**Ce qu'il faut en extraire, dans cet ordre :**

1. **La cible réelle** et son quotidien. Pas le persona marketing, le métier concret.
2. **Ce qui convertit déjà.** Le referral, le bouche à oreille, un canal qui marche. C'est le signal le plus fort du brief : la créa doit reproduire ce mécanisme à l'échelle.
3. **Ce qui ne marche pas.** Cold call, outbound mort, un canal abandonné. Ça dit ce que la cible refuse.
4. **Les chiffres vérifiables.** Montant versé, volume, nombre de clients. Distinguer le fait (vérifiable) de l'estimation (défendable) de la projection (à ne jamais afficher).
5. **Le frein principal à la signature.** Souvent enterré dans un transcript. C'est presque toujours un angle à part entière.
6. **Les no-go du client.** Ce que la cible rejette (un ton, un format, une promesse déjà retoquée).

**Contrôle d'équation à faire systématiquement.** Budget média ÷ CPA cible = nombre maximum de conversions possibles. Si l'objectif annoncé est au-dessus, le dire tout de suite et par écrit. Ne jamais laisser un objectif inatteignable se figer.

---

## Étape 1 — Les axes

Sortir 5 à 6 axes maximum. Chaque axe est **un bénéfice distinct**, pas une variation du même.

**Nommage : un seul mot.** Revenu, Rétention, Efficacité, Différenciation, Confiance, Preuve, Objection. Un axe qui a besoin d'une phrase pour être nommé n'est pas un axe.

**Structure de chaque axe :**
- Le nom en un mot
- Une ligne de résumé du bénéfice
- 3 messages d'ads

**Deux axes ont un statut particulier :**
- **Preuve** n'est pas un bénéfice, c'est un véhicule. C'est qui porte le message (un pair, un client, un chiffre d'adoption). Presque toujours le format vidéo prioritaire quand le referral marche.
- **Objection** traite le frein principal identifié en étape 0. Souvent le meilleur script du lot, et presque toujours oublié.

**Priorisation à recommander :** 3 axes au lancement, portant des bénéfices vraiment différents pour que les learnings soient nets. Confiance et Preuve partent en retargeting ou en vague 2, pas en accroche froide.

---

## Étape 2 — Les messages

**Structure obligatoire : en deux temps.** Le problème ou l'attente de la cible d'abord, la réponse de la solution ensuite.

> "Vous croisez des chauffe-eau au quotidien ? Gagnez entre 50€ et 100€ de plus par intervention."

Un message qui n'affiche que le bénéfice sans planter le problème ne fonctionne pas. Un message qui pose le problème sans nommer la solution non plus.

**Règles :**
- La cible est nommée ou identifiable dès les premiers mots
- Un seul message par visuel, jamais deux idées
- Lisible en une seconde sur un fil mobile
- Vouvoiement, registre pro, jamais familier
- Aucun tiret long
- Uniquement des chiffres vérifiables. Une fourchette est acceptable si le bas est un fait et le haut défendable, jamais l'inverse

Avant de livrer, passer chaque message au contrôle qualité : lire `references/controle-qualite.md`. Ce fichier liste les formulations qui sautent systématiquement.

---

## Étape 3 — Le brief créas statiques

Objectif type : 15 concepts. **Ce ne sont pas 15 idées différentes**, ce sont 5 à 6 messages déclinés en variations de traitement.

**Le principe qui compte :** deux concepts qui portent le même message avec un traitement différent isolent l'effet du visuel. Quinze concepts avec quinze messages et quinze traitements ne produisent aucun learning exploitable. Prévoir au moins une paire de ce type et l'indiquer explicitement dans le brief pour que le DA ne les harmonise pas.

**Répartition indicative :** 4 concepts sur l'axe prioritaire, 3 sur les deux axes suivants, 2 sur les axes de vague 2, 1 à 2 sur les axes backlog.

**Une ligne de brief par concept :**
N° · Axe · Nom du concept · Message exact à afficher · Principe visuel · Traitement et ton · Format prioritaire · Assets requis · Priorité P1/P2/P3 · Lien d'inspiration · Note

**Formats :** 4:5 en priorité, 1:1 en secondaire, 9:16 uniquement sur les concepts qui performent.

**Toujours joindre trois choses au brief :**
1. Les règles de production (un message par visuel, pas de look pub, liberté de ton validée)
2. Les sources d'inspiration avec leur limite d'usage
3. La checklist d'assets à fournir par le client, avec une colonne bloquant / non bloquant

Le script `scripts/build_brief_xlsx.py` génère le fichier xlsx à trois onglets à partir d'un JSON. Lire son en-tête pour le format d'entrée.

---

## Étape 4 — Les scripts UGC

**Qui parle change tout.** Un dirigeant assume son rôle de fondateur, il ne mime jamais le métier de la cible. Un client ou un partenaire porte la preuve. Ne jamais écrire un script de dirigeant qui fait semblant d'être un artisan, un recruteur ou un utilisateur.

**Montage combinatoire.** Un script = des hooks, des corps, des CTA tournés séparément. Règle absolue : aucun élément ne fait référence à un autre, sinon le montage casse.

**Volume type par thème :** 3 à 5 hooks, 3 corps, 3 CTA. Avec 4 thèmes, une quinzaine de combinaisons exploitables par thème.

**Structure d'un thème :**
- Mots clés à faire passer (ce que la personne doit dire, pas un texte à lire)
- Hooks de 3 à 5 secondes
- Corps de 15 à 20 secondes, en points, pas en texte rédigé
- CTA
- Inserts optionnels (plans d'illustration, captures produit, schémas)

**Règles de tournage à joindre systématiquement :**
- Vertical, téléphone, bras tendu ou posé. Pas de trépied ni de lumière montée
- Décor réel, le bruit de fond est un atout
- La personne ne lit pas, elle connaît les mots clés et elle parle
- Deux ou trois prises par élément
- Attaque directe sur le premier mot, pas de "bonjour à tous"
- Chaque élément tourné séparément

**Le hook doit tenir seul.** Testé hors contexte, sans le corps ni le visuel. S'il ne dit pas de quoi on parle ni pourquoi c'est un problème, il ne passe pas.

**Le CTA doit faire trois choses :** rappeler le bénéfice, donner la sensation de rejoindre quelque chose (un réseau, un programme, une sélection), et rester cohérent avec la destination réelle du clic.

---

## Étape 5 — Cohérence avec la destination

Le CTA promet quelque chose que le parcours doit tenir. Vérifier systématiquement :

- **Formulaire (Typeform, Instant Form)** : ne jamais annoncer un nombre de questions qui ne correspond pas au parcours réel. Parler de "quelques questions" ou d'une durée. Ne pas dire "laissez vos coordonnées" si les coordonnées arrivent en fin de parcours. L'écran d'accueil reprend l'angle de la créa.
- **Landing page** : le titre de la LP reprend le message de la créa, mot pour mot si possible.
- **Délai de rappel** : ne jamais chiffrer un SLA face caméra ou sur une créa qui tournera des mois, surtout si une seule personne le tient.

Si le parcours de conversion n'existe pas encore, le proposer : arborescence de qualification, branchements, écrans de fin par typologie, mapping CRM, événement de conversion optimisé.

---

## Étape 6 — Les points à valider

Terminer chaque livraison par une section listant ce qui engage le client publiquement et doit être validé avant production :

- Les chiffres et fourchettes
- Les engagements implicites (exclusivité, couverture, délai, garantie)
- Les promesses produit à vérifier contre la réalité (une fonctionnalité annoncée doit exister telle qu'elle est décrite)
- Les assets bloquants sans lesquels la production ne peut pas démarrer
- Les noms officiels de programmes, offres ou produits

Une promesse qu'un dirigeant découvre dans un script au moment du tournage est une promesse qui saute. Autant la sortir en amont.

---

## Itération avec le client

Les retours arrivent formulation par formulaire. Quand un message est corrigé, **vérifier que la correction n'est pas perdue dans les livrables suivants**. C'est l'erreur la plus fréquente : une version validée qui revient à son état antérieur deux livrables plus tard.

Quand le client renvoie un fichier consolidé, faire un contrôle de cohérence complet : reprendre chaque correction demandée dans l'historique et vérifier qu'elle est bien présente. Lister les écarts au lieu de les corriger silencieusement.

---

## Formats de sortie

Voir `references/formats-sortie.md` pour la structure exacte de chaque livrable et le choix du format (inline, markdown, xlsx).

Par défaut :
- Axes et messages : inline dans la conversation, itération rapide
- Brief créas : xlsx à trois onglets
- Scripts UGC : fichier markdown
- Parcours de conversion : xlsx ou markdown selon la complexité
- Mail de récap client : inline
